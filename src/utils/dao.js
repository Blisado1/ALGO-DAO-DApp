import algosdk from "algosdk";
import * as algo from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import ApprovalProgram from "!!raw-loader!../contracts/dao_approval.teal";
import ClearProgram from "!!raw-loader!../contracts/dao_clear.teal";
import { utf8ToBase64String } from "./conversions";

export class DAO {
  constructor(
    appId,
    appAddress,
    creatorAddress,
    quorum,
    totalShares,
    voteTime,
    userId,
    userShares
  ) {
    this.appId = appId;
    this.appAddress = appAddress;
    this.creatorAddress = creatorAddress;
    this.quorum = quorum;
    this.totalShares = totalShares;
    this.voteTime = voteTime;
    this.userId = userId;
    this.userShares = userShares;
  }
}

// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
  let encoder = new TextEncoder();
  let programBytes = encoder.encode(programSource);
  let compileResponse = await algo.algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
};

// CREATE DAO: ApplicationCreateTxn
export const createDaoAction = async (senderAddress, dao) => {
  console.log("Creating DAO...");
  console.log(dao);
  let params = await algo.algodClient.getTransactionParams().do();

  // Compile Programs
  const compiledApprovalProgram = await compileProgram(ApprovalProgram);
  const compiledClearProgram = await compileProgram(ClearProgram);

  // Build note to identify transaction later and required app args as Uint8Array
  let quorum = algosdk.encodeUint64(Number(dao.quorum));
  let voteTime = algosdk.encodeUint64(Number(dao.voteTime));
  let note = new TextEncoder().encode(algo.daoNote);
  let appArgs = [quorum, voteTime];

  let txn = algosdk.makeApplicationCreateTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: compiledApprovalProgram,
    clearProgram: compiledClearProgram,
    numLocalInts: algo.numLocalIntsDao,
    numLocalByteSlices: algo.numLocalBytesDao,
    numGlobalInts: algo.numGlobalIntsDao,
    numGlobalByteSlices: algo.numGlobalBytesDao,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get created application id and notify about completion
  let transactionResponse = await algo.algodClient
    .pendingTransactionInformation(txId)
    .do();

  let appId = transactionResponse["application-index"];
  console.log("Created new app-id: ", appId);
  return appId;
};

// Contribute To Dao
export const contributeToDaoAction = async (senderAddress, dao, amount) => {
  console.log("Sending Funds to DAO...");

  let params = await algo.algodClient.getTransactionParams().do();

  // Create ApplicationOptIn Transaction
  let optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: dao.appId,
  });

  let contributeArg = new TextEncoder().encode("contribute");
  let amountArg = algosdk.encodeUint64(amount);
  let appArgs = [contributeArg, amountArg];

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: dao.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // Create PaymentTxn
  let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress,
    to: dao.appAddress,
    amount: amount,
    suggestedParams: params,
  });

  let txnArray;
  if (dao.userId === 0) {
    // call the optIn txn then the rest
    txnArray = [optInTxn, appCallTxn, paymentTxn];

    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray);
    for (let i = 0; i < 3; i++) txnArray[i].group = groupID;
  } else {
    txnArray = [appCallTxn, paymentTxn];
    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray);
    for (let i = 0; i < 2; i++) txnArray[i].group = groupID;
  }

  // Sign & submit the group transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(
    txnArray.map((txn) => txn.toByte())
  );

  console.log("Signed group transaction");

  let tx = await algo.algodClient
    .sendRawTransaction(signedTxn.map((txn) => txn.blob))
    .do();

  // Wait for group transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    tx.txId,
    4
  );

  // Notify about completion
  console.log(
    "Group transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

// REDEEM SHARES: no_op_call
export const redeemSharesAction = async (senderAddress, dao, amount) => {
  console.log("Redeeming Shares...");

  let params = await algo.algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE * 2;
  params.flatFee = true;

  // Build required app args as Uint8Array
  let amountArg = algosdk.encodeUint64(amount);
  let redeemArg = new TextEncoder().encode("redeem");
  let appArgs = [redeemArg, amountArg];

  // Create ApplicationCallTxn
  let txn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: dao.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

// TRANSFER SHARES: no_op_call
export const transferSharesAction = async (senderAddress, dao, data) => {
  console.log("Transferring Shares...");
  console.log(data);
  let params = await algo.algodClient.getTransactionParams().do();
  if (!algosdk.isValidAddress(data.sendTo)) {
    throw new Error("Invalid Address");
  }
  // Build required app args as Uint8Array
  let amountArg = algosdk.encodeUint64(data.amount);
  let transferArg = new TextEncoder().encode("transfer");
  let appArgs = [transferArg, amountArg];
  let accounts = [data.sendTo];

  // Create ApplicationCallTxn
  let txn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: dao.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
    accounts: accounts,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

// DELETE DAO:
export const deleteDaoAction = async (senderAddress, index) => {
  console.log("Deleting application");

  let params = await algo.algodClient.getTransactionParams().do();

  // Create ApplicationDeleteTxn
  let txn = algosdk.makeApplicationDeleteTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: index,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await algo.myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algo.algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(
    algo.algodClient,
    txId,
    4
  );

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get application id of deleted application and notify about completion
  let transactionResponse = await algo.algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Deleted app-id: ", appId);
};

// GET DAO INFO: Using Indexer
export const getDaoDataAction = async (senderAddress) => {
  console.log("Getting Dao Data...");

  let dao;
  // Step 2: Get dao application by application id
  let dao_ = await getApplication(algo.daoAppId, senderAddress);

  if (dao_) {
    dao = dao_;
  }
  console.log("Dao data Fetched...");
  return dao;
};

const getApplication = async (appId, senderAddress) => {
  try {
    // 1. Get application by appId
    let response = await algo.indexerClient
      .lookupApplications(appId)
      .includeAll(true)
      .do();
    if (response.application.deleted) {
      return null;
    }
    let globalState = response.application.params["global-state"];

    // 2. Parse fields of response and return proposal
    let appAddress = algosdk.getApplicationAddress(appId);
    let creatorAddress = response.application.params.creator;
    let quorum = 0;
    let totalShares = 0;
    let voteTime = 0;
    let userId = 0;
    let userShares = 0;

    const getField = (fieldName, globalState) => {
      return globalState.find((state) => {
        return state.key === utf8ToBase64String(fieldName);
      });
    };

    if (getField("QUORUM", globalState) !== undefined) {
      quorum = getField("QUORUM", globalState).value.uint;
    }
    if (getField("SHARES", globalState) !== undefined) {
      totalShares = getField("SHARES", globalState).value.uint;
    }
    if (getField("TIME", globalState) !== undefined) {
      voteTime = getField("TIME", globalState).value.uint;
    }

    let userInfo = await algo.indexerClient
      .lookupAccountAppLocalStates(senderAddress)
      .do();

    let appLocalState = userInfo["apps-local-states"];
    for (let i = 0; i < appLocalState.length; i++) {
      if (appId === appLocalState[i]["id"]) {
        let localState = appLocalState[i]["key-value"];
        if (getField("USERID", localState) !== undefined) {
          userId = getField("USERID", localState).value.uint;
        }
        if (getField("USHARES", localState) !== undefined) {
          userShares = getField("USHARES", localState).value.uint;
        }
      }
    }

    return new DAO(
      appId,
      appAddress,
      creatorAddress,
      quorum,
      totalShares,
      voteTime,
      userId,
      userShares
    );
  } catch (err) {
    return null;
  }
};
