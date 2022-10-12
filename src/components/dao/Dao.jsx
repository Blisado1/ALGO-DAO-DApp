import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { indexerClient } from "../../utils/constants";
import { Container } from "@mui/system";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import Loader from "../utils/Loader";
import Header from "./Header";
import Contribute from "./Contribute";
import Redeem from "./Redeem";
import Transfer from "./Transfer";
import Proposal from "./CreateProposal";
import Proposals from "./Proposals";
import {
  getDaoDataAction,
  createDaoAction,
  contributeToDaoAction,
  redeemSharesAction,
  transferSharesAction,
} from "../../utils/dao";

import {
  getProposalsAction,
  createProposalAction,
  lockInProposalAction,
  voteAction,
  executeProposalAction,
} from "../../utils/proposal";

const Dao = ({ address, name, disconnect }) => {
  const [balance, setBalance] = useState(0);
  const [daoData, setDaoData] = useState({});
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const getDaoData = useCallback(async () => {
    setLoading(true);
    getDaoDataAction(address)
      .then((dao) => {
        toast.loading("Getting Dao Data");
        if (dao) {
          setDaoData(dao);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [address]);

  const getProposals = useCallback(async () => {
    setLoading(true);
    toast.loading("Getting Proposals");
    getProposalsAction(address)
      .then((proposals) => {
        if (proposals) {
          setProposals(proposals);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
        toast.dismiss();
      });
  }, [address]);

  async function update() {
    getDaoData();
    getProposals();
    fetchBalance();
  }

  const fetchBalance = useCallback(async () => {
    indexerClient
      .lookupAccountByID(address)
      .do()
      .then((response) => {
        const _balance = response.account.amount;
        setBalance(_balance);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [address]);

  const createDao = async (data) => {
    setLoading(true);
    toast.loading("Creating Dao Contract");
    createDaoAction(address, data)
      .then(() => {
        toast.dismiss();
        toast.success("DAO created successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        console.log(error);
        toast.dismiss();
        toast.error("Failed to create DAO.");
        setLoading(false);
      });
  };

  const contributeToDAO = async (amount) => {
    setLoading(true);
    toast.loading("Sending contributions to Dao");
    contributeToDaoAction(address, daoData, amount)
      .then(() => {
        toast.dismiss();
        toast.success("Contribution added successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        toast.dismiss();
        toast.error("Failed to contribution.");
        console.log(error);
      });
  };

  const redeemShares = async (amount) => {
    setLoading(true);
    toast.loading("Redeeming shares from Dao");
    redeemSharesAction(address, daoData, amount)
      .then(() => {
        toast.dismiss();
        toast.success("Shares redeemed successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.success("Failed to redeem shares.");
      });
  };

  const transferShares = async (data) => {
    setLoading(true);
    toast.loading("Transfering shares");
    transferSharesAction(address, daoData, data)
      .then(() => {
        toast.dismiss();
        toast.success("Shares transferred successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.error("Failed to transfer shares.");
      });
  };

  const createProposal = async (data) => {
    setLoading(true);
    toast.loading("Creating new proposal");
    createProposalAction(address, data, daoData)
      .then(() => {
        toast.dismiss();
        toast.success("Proposal added successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.error("Failed to add proposal.");
      });
  };

  const lockInProposal = async (proposal) => {
    setLoading(true);
    toast.loading("Locking-in proposal");
    lockInProposalAction(address, proposal, daoData)
      .then(() => {
        toast.dismiss();
        toast.success("Proposal locked-in  Dao .");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.error("Failed to lock-in proposal.");
      });
  };

  const voteProposal = async (proposal) => {
    setLoading(true);
    toast.loading("Sending your vote");
    voteAction(address, proposal, daoData)
      .then(() => {
        toast.dismiss();
        toast.success("Vote successful.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.error("Vote failed.");
      });
  };

  const executeProposal = async (proposal) => {
    setLoading(true);
    toast.loading("Executing proposal");
    executeProposalAction(address, proposal, daoData)
      .then(() => {
        toast.dismiss();
        toast.success("Proposal executed successfully.");
        setTimeout(() => {
          update();
        }, 3000);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast.dismiss();
        toast.error("Failed to execute proposal.");
      });
  };

  const theme = createTheme({
    palette: {
      primary: {
        light: "#fcbd7a",
        main: "#f1a14b",
        dark: "#fdb261d8",
        contrastText: "#fff",
      },
    },
  });
  useEffect(() => {
    fetchBalance();
    getDaoData();
    getProposals();
  }, [fetchBalance, getDaoData, getProposals]);

  if (loading) return <Loader />;

  return (
    <ThemeProvider theme={theme}>
      <div className="app">
        <Header
          address={address}
          name={name}
          balance={balance}
          daoData={daoData}
          createDao={createDao}
          disconnect={disconnect}
        />
        <Container>
          <Contribute contributeToDAO={contributeToDAO} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Redeem redeemShares={redeemShares} />
          </Box>
          <Transfer transferShares={transferShares} />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Proposal createProposal={createProposal} />
          </Box>
          <Proposals
            address={address}
            proposals={proposals}
            lockInProposal={lockInProposal}
            voteProposal={voteProposal}
            executeProposal={executeProposal}
            dao={daoData}
          />
        </Container>
      </div>
    </ThemeProvider>
  );
};
Dao.propTypes = {
  address: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  disconnect: PropTypes.func.isRequired,
};
export default Dao;
