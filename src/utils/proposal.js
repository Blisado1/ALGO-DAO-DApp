import algosdk from "algosdk";
import * as algo from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import ApprovalProgram from "!!raw-loader!../contracts/proposal_approval.teal";
import ClearProgram from "!!raw-loader!../contracts/proposal_clear.teal";
import {
  getAddress,
  base64ToUTF8String,
  utf8ToBase64String,
} from "./conversions";

export class Proposal {
  constructor(
    appId,
    appAddress,
    creatorAddress,
    name,
    recipient,
    amount,
    ends,
    votes,
    isLocked,
    executed,
    success,
    ended,
    userVoteStatus
  ) {
    this.appId = appId;
    this.appAddress = appAddress;
    this.creatorAddress = creatorAddress;
    this.name = name;
    this.recipient = recipient;
    this.amount = amount;
    this.ends = ends;
    this.votes = votes;
    this.isLocked = isLocked;
    this.executed = executed;
    this.success = success;
    this.ended = ended;
    this.userVoteStatus = userVoteStatus;
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
export const createProposalAction = async (
  senderAddress,
  proposal,
  daoData
) => {
  console.log("Creating Proposal...");
  console.log(proposal);

  let params = await algo.algodClient.getTransactionParams().do();

  // Compile Programs
  const compiledApprovalProgram = await compileProgram(ApprovalProgram);
  const compiledClearProgram = await compileProgram(ClearProgram);
  // Build note to identify transaction later and required app args as Uint8Array

  if (!algosdk.isValidAddress(proposal.recipient)) {
    throw new Error("Invalid Address");
  }
  let name = new TextEncoder().encode(proposal.name);
  let amount = algosdk.encodeUint64(proposal.amount);
  let note = new TextEncoder().encode(algo.proposalNote);
  let appArgs = [name, amount];
  let accounts = [proposal.recipient];
  let foreignApps = [daoData.appId];

  let txn = algosdk.makeApplicationCreateTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: compiledApprovalProgram,
    clearProgram: compiledClearProgram,
    numLocalInts: algo.numLocalIntsProposal,
    numLocalByteSlices: algo.numLocalBytesProposal,
    numGlobalInts: algo.numGlobalIntsProposal,
    numGlobalByteSlices: algo.numGlobalBytesProposal,
    note: note,
    appArgs: appArgs,
    accounts: accounts,
    foreignApps: foreignApps,
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
export const lockInProposalAction = async (
  senderAddress,
  proposal,
  daoData
) => {
  console.log("Locking in proposal...");

  let params = await algo.algodClient.getTransactionParams().do();
  let lockArg = new TextEncoder().encode("lock");
  let appArgs = [lockArg];
  let foreignApps1 = [daoData.appId];
  // Create ApplicationCallTxn To Proposal Contract
  let appCallTxn1 = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: proposal.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
    foreignApps: foreignApps1,
  });

  let foreignApps2 = [proposal.appId];

  // Create ApplicationCallTxn To DAO contract
  let appCallTxn2 = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: daoData.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
    foreignApps: foreignApps2,
  });

  let txnArray = [appCallTxn1, appCallTxn2];

  // Create group transaction out of previously build transactions
  let groupID = algosdk.computeGroupID(txnArray);
  for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

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

// VOTE: opt_in_call
export const voteAction = async (senderAddress, proposal, daoData) => {
  console.log("Sending your votes in......");

  let params = await algo.algodClient.getTransactionParams().do();
  let foreignApps = [daoData.appId];

  // Create ApplicationOptIn Transaction
  let txn = algosdk.makeApplicationOptInTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: proposal.appId,
    foreignApps: foreignApps,
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
  // display results
  let transactionResponse = await algo.algodClient
    .pendingTransactionInformation(txId)
    .do();
  console.log("Opted-in to app-id:", transactionResponse["txn"]["txn"]["apid"]);
};

// EXECUTE PROPOSAL: no_op_call
export const executeProposalAction = async (
  senderAddress,
  proposal,
  daoData
) => {
  console.log("Executing proposal...");

  let params = await algo.algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE * 3;
  params.flatFee = true;

  let executeArg = new TextEncoder().encode("execute");
  let appArgs1 = [executeArg];
  let foreignApps1 = [daoData.appId];

  // Create ApplicationCallTxn To Proposal Contract
  let appCallTxn1 = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: proposal.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs1,
    foreignApps: foreignApps1,
  });

  let fundArg = new TextEncoder().encode("fund");
  let appArgs2 = [fundArg];
  let foreignApps2 = [proposal.appId];
  let accounts = [proposal.recipient];

  // Create ApplicationCallTxn To DAO contract
  let appCallTxn2 = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: daoData.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs2,
    accounts: accounts,
    foreignApps: foreignApps2,
  });

  let endArg = new TextEncoder().encode("end");
  let appArgs3 = [endArg];

  // Create ApplicationCallTxn To Proposal contract
  let appCallTxn3 = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: proposal.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs3,
  });

  let txnArray = [appCallTxn1, appCallTxn2, appCallTxn3];

  // Create group transaction out of previously build transactions
  let groupID = algosdk.computeGroupID(txnArray);
  for (let i = 0; i < 3; i++) txnArray[i].group = groupID;

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

// DELETE DAO:
export const deleteProposalAction = async (senderAddress, index) => {
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

// GET PROPOSAL: Using Indexer
export const getProposalsAction = async (senderAddress) => {
  console.log("Fetching Proposals...");
  let note = new TextEncoder().encode(algo.proposalNote);
  let encodedNote = Buffer.from(note).toString("base64");

  // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
  let transactionInfo = await algo.indexerClient
    .searchForTransactions()
    .notePrefix(encodedNote)
    .txType("appl")
    .minRound(algo.minRound)
    .do();

  let proposals = [];
  for (const transaction of transactionInfo.transactions) {
    let appId = transaction["created-application-index"];
    if (appId) {
      // Step 2: Get each application by application id
      let proposal = await getApplication(appId, senderAddress);
      if (proposal) {
        proposals.push(proposal);
      }
    }
  }
  console.log("Proposals Fetched...");
  return proposals;
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
    let name = "";
    let recipient = "";
    let amount = 0;
    let ends = 0;
    let votes = 0;
    let isLocked = 0;
    let executed = 0;
    let success = 0;
    let ended = 0;
    let userVoteStatus = 0;

    const getField = (fieldName, globalState) => {
      return globalState.find((state) => {
        return state.key === utf8ToBase64String(fieldName);
      });
    };

    if (getField("NAME", globalState) !== undefined) {
      let field = getField("NAME", globalState).value.bytes;
      name = base64ToUTF8String(field);
    }

    if (getField("RECIPIENT", globalState) !== undefined) {
      let field = getField("RECIPIENT", globalState).value.bytes;
      recipient = getAddress(field);
    }

    if (getField("AMOUNT", globalState) !== undefined) {
      amount = getField("AMOUNT", globalState).value.uint;
    }

    if (getField("ENDS", globalState) !== undefined) {
      ends = getField("ENDS", globalState).value.uint;
    }

    if (getField("VOTES", globalState) !== undefined) {
      votes = getField("VOTES", globalState).value.uint;
    }

    if (getField("ISLOCKED", globalState) !== undefined) {
      isLocked = getField("ISLOCKED", globalState).value.uint;
    }

    if (getField("EXECUTED", globalState) !== undefined) {
      executed = getField("EXECUTED", globalState).value.uint;
    }

    if (getField("SUCCESS", globalState) !== undefined) {
      success = getField("SUCCESS", globalState).value.uint;
    }
    if (getField("ENDED", globalState) !== undefined) {
      ended = getField("ENDED", globalState).value.uint;
    }

    let userInfo = await algo.indexerClient
      .lookupAccountAppLocalStates(senderAddress)
      .do();

    let appLocalState = userInfo["apps-local-states"];
    for (let i = 0; i < appLocalState.length; i++) {
      if (appId === appLocalState[i]["id"]) {
        let localState = appLocalState[i]["key-value"];
        if (getField("VOTESTATUS", localState) !== undefined) {
          userVoteStatus = getField("VOTESTATUS", localState).value.uint;
        }
      }
    }

    return new Proposal(
      appId,
      appAddress,
      creatorAddress,
      name,
      recipient,
      amount,
      ends,
      votes,
      isLocked,
      executed,
      success,
      ended,
      userVoteStatus
    );
  } catch (err) {
    return null;
  }
};
