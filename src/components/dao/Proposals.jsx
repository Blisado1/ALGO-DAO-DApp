import React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import {
  convertTime,
  microAlgosToString,
  truncateAddress,
} from "../../utils/conversions";

const Proposals = ({
  address,
  proposals,
  lockInProposal,
  voteProposal,
  executeProposal,
  dao,
}) => {
  const proposalLockedIn = (proposal) => proposal.isLocked === 1;

  const proposalEnded = (proposal) => proposal.ended === 1;

  const proposalSuccessfull = (proposal) => proposal.success === 1;

  const userOptedIn = () => dao.userShares > 0 && dao.userId !== 0;

  function isFinished(proposal) {
    const now = new Date().getTime();
    const proposalEnd = new Date(parseInt(proposal.ends) * 1000);
    return proposalEnd > now > 0 ? false : true;
  }

  function hasVoted(proposal) {
    return proposal.userVoteStatus === 1;
  }

  const startLockInTxn = async (proposal) => {
    await lockInProposal(proposal);
  };

  const startVoteTxn = async (proposal) => {
    await voteProposal(proposal);
  };

  const startExecTxn = async (proposal) => {
    await executeProposal(proposal);
  };

  return (
    <>
      <div id="proposals" className="option">
        <p className="title">Proposals. _05</p>
      </div>
      <TableContainer
        component={Paper}
        sx={{
          background: "#02315a",
          marginBottom: "5rem",
        }}
      >
        <Table sx={{ minWidth: 650 }} size="small" aria-label="proposals">
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                ID
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Name
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Amount
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Recipient
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Votes
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Vote
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Ends on
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "#aec1c5", fontSize: "1rem" }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          {/* ****************Table Body*************** */}
          <TableBody>
            {proposals ? (
              proposals.map((proposal) => (
                <TableRow
                  key={proposal.appId}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell
                    align="center"
                    component="th"
                    scope="row"
                    sx={{ color: "#aec1c5" }}
                  >
                    {" "}
                    <a
                      href={`https://testnet.algoexplorer.io/application/${proposal.appId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {proposal.appId}
                    </a>
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.name}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {microAlgosToString(proposal.amount)} ALGO
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    <a
                      href={`https://testnet.algoexplorer.io/address/${proposal.recipient}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {truncateAddress(proposal.recipient)}
                    </a>
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.votes ? microAlgosToString(proposal.votes) : "0"}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {" "}
                    {proposalLockedIn(proposal) ? (
                      isFinished(proposal) ? (
                        "Vote finished"
                      ) : userOptedIn ? (
                        hasVoted(proposal) ? (
                          "You already voted"
                        ) : (
                          <Button
                            onClick={(e) => startVoteTxn(proposal)}
                            variant="contained"
                          >
                            Vote
                          </Button>
                        )
                      ) : (
                        "Voting In Progress"
                      )
                    ) : proposal.creatorAddress === address ? (
                      <Button
                        onClick={(e) => startLockInTxn(proposal)}
                        variant="contained"
                      >
                        Lock-in
                      </Button>
                    ) : (
                      "Voting has not started"
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#aec1c5" }}>
                    {proposal.ends ? convertTime(proposal.ends) : "---"}
                  </TableCell>
                  <TableCell sx={{ color: "#aec1c5" }} align="center">
                    {proposalEnded(proposal) ? (
                      proposalSuccessfull(proposal) ? (
                        "Successful"
                      ) : (
                        "Not Successful"
                      )
                    ) : proposal.creatorAddress === address ? (
                      <Button
                        onClick={(e) => startExecTxn(proposal)}
                        variant="contained"
                        disabled={
                          !proposalLockedIn(proposal) || !isFinished(proposal)
                        }
                      >
                        Execute
                      </Button>
                    ) : (
                      "Not yet decided"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <></>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

Proposals.propTypes = {
  address: PropTypes.string.isRequired,
  proposals: PropTypes.instanceOf(Array).isRequired,
  lockInProposal: PropTypes.func.isRequired,
  voteProposal: PropTypes.func.isRequired,
  executeProposal: PropTypes.func.isRequired,
  dao: PropTypes.instanceOf(Object).isRequired,
};

export default Proposals;
