import Button from "@mui/material/Button";
import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { stringToMicroAlgos } from "../../utils/conversions";

const Redeem = ({ redeemShares }) => {
  const [inputValue, setInputValue] = React.useState("");

  const startTxn = async () => {
    if (inputValue === "") return;
    let amount = stringToMicroAlgos(inputValue);
    await redeemShares(amount);
  };

  return (
    <div id="redeem" className="option">
      <p className="title">
        Redeem Shares. _02
        <Tooltip title="Convert shares back to token" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Amount of Shares"}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button onClick={() => startTxn()} variant="contained">
        Redeem
      </Button>
    </div>
  );
};

Redeem.propTypes = {
  redeemShares: PropTypes.func.isRequired,
};

export default Redeem;
