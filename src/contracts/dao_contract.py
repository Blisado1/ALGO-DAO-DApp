from pyteal import *
from helpers import *


class Dao_Contract:

    class Global_Variables:  # 6 global ints # 0 global bytes
        quorum = Bytes("QUORUM")  # uint64
        total_shares = Bytes("SHARES")  # uint64
        total_contributions = Bytes("CONTRIBUTIONS")  # uint64
        locked_funds = Bytes("LOCKED")  # uint64
        vote_time = Bytes("TIME")  # uint64
        no_of_investors = Bytes("INVESTORS")  # uint64

    class Local_Variables:  # 2 local ints # 0 local bytes
        id = Bytes("USERID")  # uint 64
        shares = Bytes("USHARES")  # uint 64

    class AppMethods:
        contribute = Bytes("contribute")
        transfer = Bytes("transfer")
        redeem = Bytes("redeem")
        lock_in_proposal = Bytes("lock")
        fund_proposal = Bytes("fund")

    def create_dao(self):
        # params
        # quorum: Min percentage of votes required for a proposal to be executed on the DAO,
        # vote_time:  How long the investors have to vote
        return Seq(
            [
                Assert(
                    And(
                        # check note attached is valid
                        Txn.note() == Bytes("algodao:uv02"),
                        # check the number of arguments passed is 2, quorum, vote_time
                        Txn.application_args.length() == Int(2),
                        # check that the quorum is greater than 0 but less than 100
                        And(
                            Btoi(Txn.application_args[0]) > Int(0),
                            Btoi(Txn.application_args[0]) < Int(100)
                        ),
                        # check that the vote time is greater than 0
                        Btoi(Txn.application_args[1]) > Int(0),
                    )
                ),
                # store variables
                App.globalPut(
                    self.Global_Variables.quorum,
                    Btoi(Txn.application_args[0]),
                ),
                App.globalPut(
                    self.Global_Variables.vote_time, Btoi(
                        Txn.application_args[1])
                ),
                App.globalPut(self.Global_Variables.total_shares, Int(0)),
                App.globalPut(
                    self.Global_Variables.total_contributions, Int(0)),
                App.globalPut(self.Global_Variables.locked_funds, Int(0)),
                App.globalPut(self.Global_Variables.no_of_investors, Int(0)),
                Approve(),
            ]
        )

    def join(self):
        no_of_investors = ScratchVar(TealType.uint64)

        return Seq(
            [
                Assert(
                    # check that the number of transactions within the group transaction is 2.
                    # because of the payment
                    Global.group_size() == Int(3),

                    # check that this transaction is ahead of the payment transaction
                    Txn.group_index() == Int(0),

                    # checks for the 2nd transaction
                    Gtxn[1].type_enum() == TxnType.ApplicationCall,
                    Gtxn[1].application_id() == Global.current_application_id(),
                    Gtxn[1].application_args[0] == Bytes("contribute"),
                    Gtxn[1].on_completion() == OnComplete.NoOp,
                    Gtxn[1].sender() == Gtxn[0].sender(),

                    # checks that last txn is a payemnt txn
                    Gtxn[2].type_enum() == TxnType.Payment,
                    Gtxn[2].receiver() == Global.current_application_address(),
                    Gtxn[2].close_remainder_to() == Global.zero_address(),
                    Gtxn[2].amount() >= Int(1000000),
                    Gtxn[2].sender() == Gtxn[0].sender(),

                ),

                # get no of investors
                no_of_investors.store(App.globalGet(
                    self.Global_Variables.no_of_investors)),

                # update the number of investors
                App.globalPut(
                    self.Global_Variables.no_of_investors,
                    (no_of_investors.load() + Int(1))
                ),

                # set investor id
                App.localPut(
                    Txn.accounts[0],
                    self.Local_Variables.id,
                    (no_of_investors.load() + Int(1))
                ),

                # initialize investor shares as 0
                App.localPut(
                    Txn.accounts[0], self.Local_Variables.shares, Int(0)),

                Approve(),
            ]
        )

    def contribute(self):
        # arguments, arg 0 is buy tag, second arg is the amount
        user_shares = ScratchVar(TealType.uint64)
        total_shares = ScratchVar(TealType.uint64)
        total_contributions = ScratchVar(TealType.uint64)

        return Seq(
            [
                # get user shares
                user_shares.store(App.localGet(
                    Txn.accounts[0], self.Local_Variables.shares)),

                # update user shares with amount deposited.
                App.localPut(
                    Txn.accounts[0],
                    self.Local_Variables.shares,
                    user_shares.load() + Btoi(
                        Txn.application_args[1])
                ),

                # get total contributions and total shares
                total_contributions.store(
                    App.globalGet(self.Global_Variables.total_contributions)
                ),

                total_shares.store(
                    App.globalGet(self.Global_Variables.total_shares)
                ),

                # update global state
                App.globalPut(
                    self.Global_Variables.total_shares,
                    (total_shares.load() + Btoi(Txn.application_args[1]))
                ),

                App.globalPut(
                    self.Global_Variables.total_contributions,
                    (total_contributions.load() + \
                     Btoi(Txn.application_args[1]))
                ),
            ]
        )

    def contribute_from_optin(self):
        return Seq(
            [
                Assert(
                    And(
                        # check that this is the second transaction is ahead of the payment transaction
                        Txn.group_index() == Int(1),

                        # check that first transaction is the opt in txn
                        Gtxn[0].type_enum() == TxnType.ApplicationCall,
                        Gtxn[0].on_completion() == OnComplete.OptIn,

                        # check the number of arguments passed is 2
                        Txn.application_args.length() == Int(2),

                        # check that contribution is greater than 1 algo
                        Btoi(Txn.application_args[1]) >= Int(
                            1000000),

                        # checks for the 3rd transaction
                        Gtxn[2].type_enum() == TxnType.Payment,
                        Gtxn[2].receiver(
                        ) == Global.current_application_address(),
                        Gtxn[2].amount() == Btoi(
                            Gtxn[1].application_args[1]),
                    ),
                ),
                # contribute
                self.contribute(),
                Approve()
            ]
        )

    def contribute_only(self):
        return Seq(
            [
                Assert(
                    And(
                        # check that user has opted in
                        App.optedIn(
                            Txn.accounts[0], Txn.applications[0]),

                        # check that this transaction is ahead of the payment transaction
                        Txn.group_index() == Int(0),

                        # check the number of arguments passed is 2
                        Txn.application_args.length() == Int(2),

                        # check that contribution is greater than 1 algo
                        Btoi(Txn.application_args[1]) >= Int(1000000),

                        # checks for the payment transaction
                        Gtxn[1].type_enum() == TxnType.Payment,
                        Gtxn[1].receiver(
                        ) == Global.current_application_address(),
                        Gtxn[1].close_remainder_to(
                        ) == Global.zero_address(),
                        Gtxn[1].amount() == Btoi(
                            Txn.application_args[1]),
                        Gtxn[1].sender() == Gtxn[0].sender(),

                    ),
                ),
                # contribute
                self.contribute(),
                Approve()
            ]
        )

    def handleContributions(self):
        return Seq(
            [
                # check that the number of transactions within the group transaction is either 3 or 2 then run checks
                Cond(
                    [Global.group_size() == Int(3), self.contribute_from_optin()],
                    [Global.group_size() == Int(2), self.contribute_only()]
                ),
                Approve()
            ]
        )

    def redeem_shares(self):
        user_shares = App.localGet(
            Txn.accounts[0], self.Local_Variables.shares)

        updated_user_shares = user_shares - Btoi(Txn.application_args[1])

        total_contributions = App.globalGet(
            self.Global_Variables.total_contributions)

        available_funds = (total_contributions -
                           App.globalGet(self.Global_Variables.locked_funds))

        updated_total_contributions = (
            total_contributions - Btoi(Txn.application_args[1]))

        updated_total_shares = App.globalGet(
            self.Global_Variables.total_shares) - Btoi(Txn.application_args[1])

        return Seq(
            [
                Assert(
                    And(
                        # check that user has opted in
                        App.optedIn(Txn.accounts[0], Txn.applications[0]),

                        # check the number of arguments passed is 2
                        Txn.application_args.length() == Int(2),

                        # check that amount to redeem is less than or equal to the user's balance
                        Btoi(Txn.application_args[1]) <= user_shares,

                        # check that the amount is less than the available funds in the contract
                        Btoi(Txn.application_args[1]) <= available_funds,

                        # check that the amount is greater than zero
                        Btoi(Txn.application_args[1]) > Int(0),

                        # for transaction pooling
                        Txn.fee() >= Global.min_txn_fee() * Int(2),
                    )
                ),

                send_funds(Txn.accounts[0], Btoi(Txn.application_args[1])),

                # update user state
                App.localPut(
                    Txn.accounts[0],
                    self.Local_Variables.shares,
                    updated_user_shares
                ),

                # update global state
                App.globalPut(
                    self.Global_Variables.total_shares,
                    updated_total_shares
                ),

                App.globalPut(
                    self.Global_Variables.total_contributions,
                    updated_total_contributions
                ),

                Approve(),
            ]
        )

    def transfer_shares(self):
        user_from_shares = App.localGet(
            Txn.accounts[0], self.Local_Variables.shares)

        updated_user_from_shares = (
            user_from_shares - Btoi(Txn.application_args[1]))

        user_to_shares = App.localGet(
            Txn.accounts[1], self.Local_Variables.shares)

        updated_user_to_shares = (
            user_to_shares + Btoi(Txn.application_args[1]))

        return Seq(
            [
                Assert(
                    And(
                        # check accounts array is not empty
                        Txn.accounts.length() == Int(1),

                        # check that user has opted in
                        App.optedIn(Txn.accounts[0], Txn.applications[0]),

                        # check that user_to has also opted in
                        App.optedIn(Txn.accounts[1], Txn.applications[0]),

                        # check the number of arguments passed is 2
                        Txn.application_args.length() == Int(2),

                        # check that amount to redeem is less than or equal to the user's balance
                        Btoi(Txn.application_args[1]) <= user_from_shares,

                        # check that the amount is greater than zero
                        Btoi(Txn.application_args[1]) > Int(0),
                    )
                ),

                # update user from state
                App.localPut(
                    Txn.accounts[0],
                    self.Local_Variables.shares,
                    updated_user_from_shares
                ),

                # update user to state
                App.localPut(
                    Txn.accounts[1],
                    self.Local_Variables.shares,
                    updated_user_to_shares
                ),

                Approve(),
            ]
        )

    def lock_in_proposal_funds(self):

        proposal_amount = ScratchVar(TealType.uint64)

        locked_funds = App.globalGet(self.Global_Variables.locked_funds)

        total_contributions = App.globalGet(
            self.Global_Variables.total_contributions)

        available_funds = total_contributions - locked_funds

        updated_locked_funds = locked_funds + proposal_amount.load()

        return Seq(
            [
                Assert(
                    And(
                        # check that user has opted in
                        App.optedIn(Txn.accounts[0], Txn.applications[0]),

                        # check that the number of transactions within the group transaction is 2.
                        Global.group_size() == Int(2),

                        # check that this transaction is second transaction in group
                        Txn.group_index() == Int(1),

                        # checks for 1st transaction
                        Gtxn[0].type_enum() == TxnType.ApplicationCall,
                        Gtxn[0].application_args[0] == Bytes("lock"),

                        # check the number of arguments passed is 1
                        Txn.application_args.length() == Int(1),

                        # check that the proposal applications ID array is passed
                        Txn.applications.length() == Int(1),
                    ),
                ),

                proposal_amount.store(
                    readAppState(Txn.applications[1], Bytes("AMOUNT"))
                ),

                # check again if proposal amount is valid, and also if proposal amount is less than available funds in the dao
                Assert(
                    And(
                        proposal_amount.load() > Int(0),
                        proposal_amount.load() <= available_funds,
                    )
                ),

                # add proposal amount to the locked funds
                App.globalPut(self.Global_Variables.locked_funds,
                              updated_locked_funds),

                Approve()
            ]
        )

    def fund_proposal(self):
        # params, amount, proposalSuccessful, proposalEnded
        proposal_amount = ScratchVar(TealType.uint64)
        proposal_successful = ScratchVar(TealType.uint64)
        proposal_ended = ScratchVar(TealType.uint64)
        proposal_executed = ScratchVar(TealType.uint64)
        app_id = ScratchVar(TealType.uint64)
        lock_status = ScratchVar(TealType.uint64)
        proposal_recipient = ScratchVar(TealType.bytes)

        locked_funds = App.globalGet(self.Global_Variables.locked_funds)
        total_contributions = App.globalGet(
            self.Global_Variables.total_contributions)
        updated_total_contributions = total_contributions - proposal_amount.load()
        updated_locked_funds = locked_funds - proposal_amount.load()
        return Seq(
            [
                # First checks
                Assert(
                    And(
                        # check that the number of transactions within the group transaction is 3.
                        Global.group_size() == Int(3),

                        # check that this transacation is the second transaction
                        Txn.group_index() == Int(1),

                        # check that the proposal recipient is passed in
                        Txn.accounts.length() == Int(1),
                        Txn.applications.length() == Int(1),


                        # checks for the first transaction in group
                        Gtxn[0].type_enum() == TxnType.ApplicationCall,
                        Gtxn[0].application_id() == Txn.applications[1],
                        Gtxn[0].on_completion() == OnComplete.NoOp,
                        Gtxn[0].application_args.length() == Int(1),
                        Gtxn[0].application_args[0] == Bytes("execute"),

                        # checks for the third transaction in group
                        Gtxn[2].type_enum() == TxnType.ApplicationCall,
                        Gtxn[2].application_id() == Txn.applications[1],
                        Gtxn[2].on_completion() == OnComplete.NoOp,
                        Gtxn[2].application_args.length() == Int(1),
                        Gtxn[2].application_args[0] == Bytes("end"),
                    )
                ),

                app_id.store(readAppState(
                    Txn.applications[1], Bytes("DAO"))),

                proposal_amount.store(
                    readAppState(Txn.applications[1], Bytes("AMOUNT"))
                ),

                proposal_successful.store(
                    readAppState(Txn.applications[1],  Bytes("SUCCESS"))
                ),

                proposal_executed.store(
                    readAppState(Txn.applications[1],  Bytes("EXECUTED"))
                ),

                proposal_ended.store(
                    readAppState(Txn.applications[1],  Bytes("ENDED"))
                ),

                lock_status.store(
                    readAppState(Txn.applications[1], Bytes("ISLOCKED"))
                ),

                proposal_recipient.store(
                    getProposalRecipient(Txn.applications[1])
                ),

                # Second checks To validate the request
                Assert(
                    And(
                        # check if the app id in proposal is equal to current app id
                        app_id.load() == Global.current_application_id(),
                        # check if proposal has been executed
                        proposal_executed.load() == Int(1),
                        # check if proposal has not ended,
                        proposal_ended.load() == Int(0),
                        # check if amount is valid
                        proposal_amount.load() > Int(0),
                        # check if amount is less than amount in locked funds
                        proposal_amount.load() <= locked_funds,
                        # check if recipient passed in via the accounts array is equal to the proposal recipient
                        proposal_recipient.load() == Txn.accounts[1],
                        # check if proposal amount was locked
                        lock_status.load() == Int(1)
                    )
                ),

                If(proposal_successful.load() == Int(1))
                .Then(
                    Seq(
                        # for transaction pooling
                        Assert(Txn.fee() >= Global.min_txn_fee() * Int(2)),
                        # send proposal amount
                        send_funds(
                            Txn.accounts[1], (proposal_amount.load())),

                        # update available funds
                        App.globalPut(
                            self.Global_Variables.total_contributions, updated_total_contributions),
                    )
                ),

                # release locked funds
                App.globalPut(self.Global_Variables.locked_funds,
                              updated_locked_funds),

                Approve()
            ]
        )

    def close_dao(self):
        return Return(Txn.sender() == Global.creator_address())

    # The approval program is responsible for processing all application calls to the contract.
    def approval_program(self):
        return Cond(
            [Txn.application_id() == Int(0), self.create_dao()],
            [Txn.on_completion() == OnComplete.DeleteApplication, self.close_dao()],
            [Txn.on_completion() == OnComplete.OptIn, self.join()],
            [Txn.application_args[0] == self.AppMethods.contribute,
                self.handleContributions()],
            [Txn.application_args[0] == self.AppMethods.transfer,
                self.transfer_shares()],
            [Txn.application_args[0] == self.AppMethods.redeem, self.redeem_shares()],
            [Txn.application_args[0] ==
                self.AppMethods.lock_in_proposal, self.lock_in_proposal_funds()],
            [Txn.application_args[0] ==
                self.AppMethods.fund_proposal, self.fund_proposal()],

        )

    # The clear program is used to handle accounts using the clear call to remove the smart contract from their balance record
    def clear_program(self):
        return Return(Int(1))
