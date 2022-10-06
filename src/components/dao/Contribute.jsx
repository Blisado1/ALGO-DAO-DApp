import Button from "@mui/material/Button";
import React from "react";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";
import { stringToMicroAlgos } from "../../utils/conversions";

const Contribute = ({ contributeToDAO }) => {
  const [inputValue, setInputValue] = React.useState("");

  const startTxn = async () => {
    if (inputValue === "") return;
    let amount = stringToMicroAlgos(inputValue);
    await contributeToDAO(amount);
  };

  return (
    <div id="contribute" className="option">
      <p className="title">
        Contribute. _01
        <Tooltip title="Deposit token to join Dao and receive shares" arrow>
          <Info color="primary" sx={{ cursor: "pointer" }} />
        </Tooltip>
      </p>
      <Input
        name={"Amount In ALGO"}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button onClick={() => startTxn()} variant="contained">
        Contribute
      </Button>
    </div>
  );
};

Contribute.propTypes = {
  contributeToDAO: PropTypes.func.isRequired,
};
export default Contribute;
