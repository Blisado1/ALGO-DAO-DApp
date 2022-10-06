from pyteal import *


@ Subroutine(TealType.none)
def send_funds(account: Expr, amount: Expr):
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: account,
                TxnField.amount: amount,
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
    )


@Subroutine(TealType.uint64)
def readAppState(app: Expr, key: Expr):
    get_app_value = App.globalGetEx(app, key)

    app_value = ScratchVar(TealType.uint64)

    return Seq(
        get_app_value,
        If(get_app_value.hasValue(), app_value.store(
            get_app_value.value()), app_value.store(Int(0))
           ),
        Return(app_value.load())
    )


@Subroutine(TealType.bytes)
def getProposalRecipient(proposal: Expr):
    get_recipient = App.globalGetEx(proposal, Bytes("RECIPIENT"))
    recipient = ScratchVar(TealType.bytes)
    return Seq(
        get_recipient,
        If(get_recipient.hasValue(), recipient.store(
            get_recipient.value()), recipient.store(Bytes("0"))),

        Return(recipient.load())
    )


@ Subroutine(TealType.uint64)
def getUserShares(account: Expr, dao: Expr):
    get_shares = App.localGetEx(account, dao, Bytes("USHARES"))
    shares = ScratchVar(TealType.uint64)
    return Seq(
        get_shares,
        If(get_shares.hasValue(), shares.store(
            get_shares.value()), shares.store(Int(0))),

        Return(shares.load())
    )
