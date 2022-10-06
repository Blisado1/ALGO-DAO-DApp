import Button from "@mui/material/Button";
import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { stringToMicroAlgos } from "../../utils/conversions";

const Transfer = ({ transferShares }) => {
  const [amountTo, setAmount] = React.useState("");
  const [sendTo, setSendTo] = React.useState("");

  const startTxn = async () => {
    if (amountTo === "" && sendTo === "") return;
    let amount = stringToMicroAlgos(amountTo);
    await transferShares({ amount, sendTo });
  };

  return (
    <div id="transfer" className="option">
      <p className="title">
        Transfer Shares. _03
        <Tooltip
          title="Transfer shares to other accounts making them members of Dao"
          arrow
        >
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Amount of Shares"}
        type="number"
        value={amountTo}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        name={"Receiver's Address"}
        type="text"
        value={sendTo}
        onChange={(e) => setSendTo(e.target.value)}
      />
      <Button onClick={() => startTxn()} variant="contained">
        Transfer
      </Button>
    </div>
  );
};

Transfer.propTypes = {
  transferShares: PropTypes.func.isRequired,
};

export default Transfer;
