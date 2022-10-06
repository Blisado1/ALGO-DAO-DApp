import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { indexerClient } from "../../utils/constants";
import { Container } from "@mui/system";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { NotificationSuccess, NotificationError } from "../utils/Notifications";
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
      });
  }, [address]);

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
    createDaoAction(address, data)
      .then(() => {
        toast(<NotificationSuccess text=" DAO created successfully." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text=" Failed to create DAO." />);
        setLoading(false);
      });
  };

  const contributeToDAO = async (amount) => {
    setLoading(true);
    contributeToDaoAction(address, daoData, amount)
      .then(() => {
        toast(<NotificationSuccess text=" Contribution added successfully." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to contribution." />);
      });
  };

  const redeemShares = async (amount) => {
    setLoading(true);
    redeemSharesAction(address, daoData, amount)
      .then(() => {
        toast(<NotificationSuccess text=" Shares redeemed successfully." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to redeem shares." />);
      });
  };

  const transferShares = async (data) => {
    setLoading(true);
    transferSharesAction(address, daoData, data)
      .then(() => {
        toast(<NotificationSuccess text=" Shares transferred successfully." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to transfer shares." />);
      });
  };

  const createProposal = async (data) => {
    setLoading(true);
    createProposalAction(address, data, daoData)
      .then(() => {
        toast(<NotificationSuccess text=" Proposal added successfully." />);
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to add proposal." />);
      });
  };

  const lockInProposal = async (proposal) => {
    setLoading(true);
    lockInProposalAction(address, proposal, daoData)
      .then(() => {
        toast(<NotificationSuccess text=" Proposal locked-in  Dao ." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to lock-in proposal." />);
      });
  };

  const voteProposal = async (proposal) => {
    setLoading(true);
    voteAction(address, proposal, daoData)
      .then(() => {
        toast(<NotificationSuccess text=" Vote successful." />);
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Vote failed." />);
      });
  };

  const executeProposal = async (proposal) => {
    setLoading(true);
    executeProposalAction(address, proposal, daoData)
      .then(() => {
        toast(<NotificationSuccess text=" Proposal executed successfully." />);
        getDaoData();
        getProposals();
        fetchBalance();
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
        toast(<NotificationError text=" Failed to execute proposal." />);
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
