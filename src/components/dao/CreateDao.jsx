import * as React from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import PropTypes from "prop-types";
import { Input } from "./Form";
import { Container, Tooltip } from "@mui/material";
import { Info } from "@mui/icons-material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "#022646",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const CreateDao = ({ createDao }) => {
  const [quorum, setQuorum] = React.useState("");
  const [voteTimeLimit, setVoteTime] = React.useState("");

  const startTxn = async () => {
    if (quorum === "" && voteTimeLimit === "") return;
    let voteTime = Number(voteTimeLimit) * 60 * 60;
    await createDao({ quorum, voteTime });
  };

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen}>
        <i className="bi bi-file-earmark-code-fill dao_icon"></i>
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container sx={style}>
          <p className="title">
            Create Dao. 00
            <Tooltip title="Kickstart your campaign" arrow>
              <Info color="primary" sx={{ cursor: "pointer" }} />
            </Tooltip>
          </p>
          <Input
            name={"Quorum %"}
            type="number"
            value={quorum}
            onChange={(e) => setQuorum(e.target.value)}
            className={{}}
          />
          <Input
            name={"Vote time in Hours"}
            type="number"
            value={voteTimeLimit}
            onChange={(e) => setVoteTime(e.target.value)}
          />
          <Button onClick={() => startTxn()} variant="contained">
            Create Dao
          </Button>
        </Container>
      </Modal>
    </div>
  );
};

CreateDao.propTypes = {
  createDao: PropTypes.func.isRequired,
};

export default CreateDao;
