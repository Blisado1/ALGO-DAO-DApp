from pyteal import *
from helpers import *


class Proposal_Contract:
    class Global_Variables:  # 2 global bytes # 8 global ints
        name = Bytes("NAME")  # bytes
        recipient = Bytes("RECIPIENT")  # bytes
        amount = Bytes("AMOUNT")  # uint 64
        ends = Bytes("ENDS")  # uint64
        votes = Bytes("VOTES")  # uint64
        is_locked = Bytes("ISLOCKED")  # uint64 (bool) 1 true, 0 false
        executed = Bytes("EXECUTED")  # uint64 (bool) 1 true, 0 false
        success = Bytes("SUCCESS")  # uint64 (bool) 1 true, 0 false
        ended = Bytes("ENDED")  # uint64 (bool) 1 true, 0 false
        dao_app_id = Bytes("DAO")  # uint 64

    class Local_Variables:  # locak ints # 0 local bytes
        vote_status = Bytes("VOTESTATUS")  # uint 64 (bool) 1 true, 0 false

    class AppMethods:
        lock_proposal = Bytes("lock")
        execute_proposal = Bytes("execute")
        end_proposal = Bytes("end")

    def create_proposal(self):
        locked_funds = ScratchVar(TealType.uint64)
        available_funds = ScratchVar(TealType.uint64)
        free_funds = available_funds.load() - locked_funds.load()
        return Seq(
            [
                Assert(
                    And(
                        # check note attached is valid
                        Txn.note() == Bytes("algodaoproposal:uv02"),
                        # check that the app id of the algodao is passed
                        Txn.applications.length() == Int(1),
                        # check that user has opted in to dao contract
                        App.optedIn(Txn.accounts[0], Txn.applications[1]),
                        # check that pass app Id is equal to the algodao id
                        Txn.applications[1] == Int(114731548),
                        # check the number of arguments passed is 2, name, amount
                        Txn.application_args.length() == Int(2),
                        # recipient is passed in via the accounts array,
                        Txn.accounts.length() == Int(1),
                        # check that the amount is greater than 1 algo
                        Btoi(Txn.application_args[1]) >= Int(1000000),
                    )
                ),
                locked_funds.store(readAppState(Txn.applications[1], Bytes("LOCKED"))),
                available_funds.store(
                    readAppState(Txn.applications[1], Bytes("AVAILABLE"))
                ),
                # check that the amount is lower than the free funds in the dao
                Assert(
                    And(
                        locked_funds.load() >= Int(0),
                        available_funds.load() > Int(0),
                        Btoi(Txn.application_args[1]) <= free_funds,
                    )
                ),
                # store ID of algo dapp
                App.globalPut(self.Global_Variables.dao_app_id, Txn.applications[1]),
                # store variables
                App.globalPut(
                    self.Global_Variables.name,
                    Txn.application_args[0],
                ),
                App.globalPut(self.Global_Variables.recipient, Txn.accounts[1]),
                App.globalPut(
                    self.Global_Variables.amount, Btoi(Txn.application_args[1])
                ),
                App.globalPut(self.Global_Variables.ends, Int(0)),
                App.globalPut(self.Global_Variables.votes, Int(0)),
                App.globalPut(self.Global_Variables.is_locked, Int(0)),
                App.globalPut(self.Global_Variables.executed, Int(0)),
                App.globalPut(self.Global_Variables.success, Int(0)),
                App.globalPut(self.Global_Variables.ended, Int(0)),
                Approve(),
            ]
        )

    def lock_in_proposal(self):
        dao_app_id = App.globalGet(self.Global_Variables.dao_app_id)
        vote_time = ScratchVar(TealType.uint64)
        return Seq(
            Assert(
                And(
                    # check that the number of transactions within the group transaction is 2.
                    Global.group_size() == Int(2),
                    # check that this transacation is the first transaction
                    Txn.group_index() == Int(0),
                    # check that the app id of the algodao is passed
                    Txn.applications.length() == Int(1),
                    # check that's it equal to the dao_app_id
                    Txn.applications[1] == dao_app_id,
                    # check that user has opted in to dao contract
                    App.optedIn(Txn.accounts[0], Txn.applications[1]),
                    # check that user created the proposal
                    Gtxn[0].sender() == Global.creator_address(),
                    # check lock status
                    App.globalGet(self.Global_Variables.is_locked) == Int(0),
                    # checks for the second application call transaction
                    Gtxn[1].type_enum() == TxnType.ApplicationCall,
                    Gtxn[1].application_id() == dao_app_id,
                    Gtxn[1].on_completion() == OnComplete.NoOp,
                    Gtxn[1].applications.length() == Int(1),
                    Gtxn[1].applications[1] == Global.current_application_id(),
                    Gtxn[1].application_args.length() == Int(1),
                    Gtxn[1].application_args[0] == Bytes("lock"),
                    Gtxn[1].sender() == Gtxn[0].sender(),
                )
            ),
            # get vote time from dao dapp
            vote_time.store(readAppState(Txn.applications[1], Bytes("TIME"))),
            # check if vote time is valid
            Assert(vote_time.load() > Int(0)),
            # update global state
            App.globalPut(self.Global_Variables.is_locked, Int(1)),
            App.globalPut(
                self.Global_Variables.ends, Global.latest_timestamp() + vote_time.load()
            ),
            Approve(),
        )

    def vote(self):
        votes = ScratchVar(TealType.uint64)
        vote_status = App.localGet(Txn.accounts[0], self.Local_Variables.vote_status)
        user_shares = ScratchVar(TealType.uint64)
        return Seq(
            [
                Assert(
                    And(
                        # check that the applications array is not empty
                        Txn.applications.length() == Int(1),
                        # check that the appId is the same
                        Txn.applications[1]
                        == App.globalGet(self.Global_Variables.dao_app_id),
                        # check that user has opted in to dao contract
                        App.optedIn(Txn.accounts[0], Txn.applications[1]),
                        # check that user has not voted
                        vote_status == Int(0),
                        # check that proposal amount is locked
                        App.globalGet(self.Global_Variables.is_locked) == Int(1),
                        # check if vote period has not ended
                        Global.latest_timestamp()
                        <= App.globalGet(self.Global_Variables.ends),
                    )
                ),
                # get user shares from dao global state
                user_shares.store(getUserShares(Txn.accounts[0], Txn.applications[1])),
                # check that user has shares
                Assert(user_shares.load() > Int(0)),
                votes.store(App.globalGet(self.Global_Variables.votes)),
                App.globalPut(
                    self.Global_Variables.votes, (votes.load() + user_shares.load())
                ),
                # marked used vote_status as voted
                App.localPut(Txn.accounts[0], self.Local_Variables.vote_status, Int(1)),
                Approve(),
            ]
        )

    def execute_proposal(self):
        dao_app_id = App.globalGet(self.Global_Variables.dao_app_id)
        total_shares = ScratchVar(TealType.uint64)
        quorum = ScratchVar(TealType.uint64)
        votes = App.globalGet(self.Global_Variables.votes)
        calc_vote_percentage = votes / total_shares.load() * Int(100)
        return Seq(
            Assert(
                And(
                    # check that user has opted in to proposal contract
                    App.optedIn(Txn.accounts[0], Txn.applications[0]),
                    # check that the number of transactions within the group transaction is 2.
                    Global.group_size() == Int(3),
                    # check that this transacation is the first transaction
                    Txn.group_index() == Int(0),
                    # check that the applications array is not empty
                    Txn.applications.length() == Int(1),
                    # check that the appId is the same
                    Txn.applications[1] == dao_app_id,
                    # check that user has opted in to dao contract
                    App.optedIn(Txn.accounts[0], Txn.applications[1]),
                    # check transaction arguments
                    Txn.application_args.length() == Int(1),
                    # check lock status
                    App.globalGet(self.Global_Variables.is_locked) == Int(1),
                    # check if vote period has ended
                    Global.latest_timestamp()
                    >= App.globalGet(self.Global_Variables.ends),
                    App.globalGet(self.Global_Variables.ended) == Int(0),
                    App.globalGet(self.Global_Variables.executed) == Int(0),
                    # checks for the second transaction which is a transaction
                    # to send funds to proposal recipient if proposal is successful
                    Gtxn[1].type_enum() == TxnType.ApplicationCall,
                    Gtxn[1].application_id() == dao_app_id,
                    Gtxn[1].on_completion() == OnComplete.NoOp,
                    Gtxn[1].application_args.length() == Int(1),
                    Gtxn[1].application_args[0] == Bytes("fund"),
                    Gtxn[1].applications.length() == Int(1),
                    Gtxn[1].applications[1] == Global.current_application_id(),
                    Gtxn[1].accounts.length() == Int(1),
                    Gtxn[1].accounts[1]
                    == App.globalGet(self.Global_Variables.recipient),
                    Gtxn[1].sender() == Gtxn[0].sender(),
                    # checks for the third transaction
                    Gtxn[2].type_enum() == TxnType.ApplicationCall,
                    Gtxn[2].application_id() == Global.current_application_id(),
                    Gtxn[2].on_completion() == OnComplete.NoOp,
                    Gtxn[2].application_args.length() == Int(1),
                    Gtxn[2].application_args[0] == Bytes("end"),
                    Gtxn[2].sender() == Gtxn[0].sender(),
                )
            ),
            # get total_shares and quorum from dao dapp global state
            total_shares.store(readAppState(Txn.applications[1], Bytes("SHARES"))),
            quorum.store(readAppState(Txn.applications[1], Bytes("QUORUM"))),
            # check if they're valid
            Assert(And(total_shares.load() > Int(0), quorum.load() > Int(0))),
            # calculate them
            If(calc_vote_percentage >= quorum.load()).Then(
                Seq(
                    App.globalPut(self.Global_Variables.success, Int(1)),
                )
            ),
            App.globalPut(self.Global_Variables.executed, Int(1)),
            Approve(),
        )

    def end_proposal(self):
        dao_app_id = App.globalGet(self.Global_Variables.dao_app_id)
        return Seq(
            Assert(
                And(
                    # check that the number of transactions within the group transaction is 3.
                    Global.group_size() == Int(3),
                    # check that this transacation is the third transaction
                    Txn.group_index() == Int(2),
                    # checks for the first transaction in group
                    Gtxn[0].type_enum() == TxnType.ApplicationCall,
                    Gtxn[0].application_id() == Global.current_application_id(),
                    Gtxn[0].on_completion() == OnComplete.NoOp,
                    Gtxn[0].application_args.length() == Int(1),
                    Gtxn[0].application_args[0] == Bytes("execute"),
                    # checks for the second transaction in group
                    Gtxn[1].type_enum() == TxnType.ApplicationCall,
                    Gtxn[1].application_id() == dao_app_id,
                    Gtxn[1].on_completion() == OnComplete.NoOp,
                    Gtxn[1].application_args.length() == Int(1),
                    Gtxn[1].application_args[0] == Bytes("fund"),
                    # check lock status
                    App.globalGet(self.Global_Variables.is_locked) == Int(1),
                    # check if vote period has ended
                    Global.latest_timestamp()
                    >= App.globalGet(self.Global_Variables.ends),
                    App.globalGet(self.Global_Variables.ended) == Int(0),
                    App.globalGet(self.Global_Variables.executed) == Int(1),
                )
            ),
            App.globalPut(self.Global_Variables.ended, Int(1)),
            Approve(),
        )

    def delete_proposal(self):
        return Return(
            And(
                Txn.sender() == Global.creator_address(),
                App.globalGet(self.Global_Variables.ended) == Int(1),
            )
        )

    # The approval program is responsible for processing all application calls to the contract.
    def approval_program(self):
        return Cond(
            [Txn.application_id() == Int(0), self.create_proposal()],
            [Txn.on_completion() == OnComplete.OptIn, self.vote()],
            [
                Txn.on_completion() == OnComplete.DeleteApplication,
                self.delete_proposal(),
            ],
            [
                Txn.application_args[0] == self.AppMethods.lock_proposal,
                self.lock_in_proposal(),
            ],
            [
                Txn.application_args[0] == self.AppMethods.execute_proposal,
                self.execute_proposal(),
            ],
            [
                Txn.application_args[0] == self.AppMethods.end_proposal,
                self.end_proposal(),
            ],
        )

    # The clear program is used to handle accounts using the clear call to remove the smart contract from their balance record
    def clear_program(self):
        return Return(Int(1))
