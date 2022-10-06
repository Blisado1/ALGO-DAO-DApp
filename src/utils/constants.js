import algosdk from "algosdk";
import MyAlgoConnect from "@randlabs/myalgo-connect";

const config = {
  algodToken: "",
  algodServer: "https://node.testnet.algoexplorerapi.io",
  algodPort: "",
  indexerToken: "",
  indexerServer: "https://algoindexer.testnet.algoexplorerapi.io",
  indexerPort: "",
};

export const algodClient = new algosdk.Algodv2(
  config.algodToken,
  config.algodServer,
  config.algodPort
);

export const indexerClient = new algosdk.Indexer(
  config.indexerToken,
  config.indexerServer,
  config.indexerPort
);

export const myAlgoConnect = new MyAlgoConnect();

export const minRound = 21540981;

// https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
export const daoNote = "algodao:uv01";
export const proposalNote = "algodaoproposal:uv02";

//DAO
// Maximum local storage allocation, immutable
export const numLocalIntsDao = 2;
// Local variables stored as Int: id, shares
export const numLocalBytesDao = 0;

// Maximum global storage allocation, immutable
export const numGlobalIntsDao = 6;
// Global variables stored as Int:
export const numGlobalBytesDao = 0;

// PROPOSAL
// Maximum local storage allocation, immutable
export const numLocalIntsProposal = 1;
// Local variables stored as Int: vote_status
export const numLocalBytesProposal = 0;

// Maximum global storage allocation, immutable
export const numGlobalIntsProposal = 10;
// Global variables stored as Int: amount, ends, votes, is_locked, executed, success, ended, daoAppId
export const numGlobalBytesProposal = 2;
// Global variables stored as Bytes: name, recipient

export const ALGORAND_DECIMALS = 6;

// App Id of Dao
export const daoAppId = 114731548;
