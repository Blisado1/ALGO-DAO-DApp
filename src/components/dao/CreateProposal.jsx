import Button from "@mui/material/Button";
import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { stringToMicroAlgos } from "../../utils/conversions";

const Proposal = ({ createProposal }) => {
  const [amountTo, setAmount] = React.useState("");
  const [name, setName] = React.useState("");
  const [recipient, setRecipient] = React.useState("");

  const startTxn = async () => {
    if (amountTo === "" && name === "" && recipient === "") return;
    let amount = stringToMicroAlgos(amountTo);
    await createProposal({ amount, name, recipient });
  };

  return (
    <div id="create-proposal" className="option">
      <p className="title">
        Create Proposal. _04
        <Tooltip title="Kickstart your new proposal" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Name"}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        name={"Amount In ALGO"}
        type="number"
        value={amountTo}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        name={"Recipient"}
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <Button onClick={() => startTxn()} variant="contained">
        Create Proposal
      </Button>
    </div>
  );
};

Proposal.propTypes = {
  createProposal: PropTypes.func.isRequired,
};

export default Proposal;
