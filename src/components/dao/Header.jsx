import React, { useState } from "react";
import PropTypes from "prop-types";
import { Typography, Box, Grid, Button } from "@mui/material";
import { Drawer } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { microAlgosToString } from "../../utils/conversions";
import CreateDao from "./CreateDao";
import { daoAppId } from "../../utils/constants";

const Header = ({ address, name, balance, daoData, createDao, disconnect }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box className="hero">
        <Box className="hero_dao">
          <Box className="logo">
            <Typography variant="string">
              Dao <span style={{ opacity: "0.5" }}>DApp.</span>
            </Typography>
          </Box>
          {daoAppId ? <></> : <CreateDao createDao={createDao} />}

          <Typography align="center" variant="string" className="dao_showcase">
            DAO DApp
          </Typography>

          <Box className="options">
            <Box>
              <Typography color={"#aec1c5"} fontSize="1.2rem">
                {" "}
                <span style={{ color: "#fcbd7a" }}>#</span> Account:{" "}
                <a
                  href={`https://testnet.algoexplorer.io/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {name}
                </a>
              </Typography>
              <Grid container spacing={0} width="25rem" marginY={"0.5rem"}>
                <Grid item>
                  <Button href="#contribute" xs={6} className="options-nav">
                    Contribute
                  </Button>
                  <Button href="#redeem" xs={6} className="options-nav">
                    redeem shares
                  </Button>
                </Grid>
                <Grid item>
                  <Button href="#transfer" xs={6} className="options-nav">
                    transfer shares
                  </Button>
                  <Button
                    href="#create-proposal"
                    xs={6}
                    className="options-nav"
                  >
                    Create proposal
                  </Button>
                </Grid>
              </Grid>

              <Typography color={"#aec1c5"} fontSize="1rem">
                <span style={{ color: "#fcbd7a" }}>#</span> Wallet Balance:{" "}
                {microAlgosToString(balance)} ALGO
              </Typography>
              <Typography color={"#aec1c5"} fontSize="1rem">
                <span style={{ color: "#fcbd7a" }}>#</span> Shares:{" "}
                {daoData
                  ? daoData.userShares
                    ? microAlgosToString(daoData.userShares)
                    : 0
                  : 0}{" "}
                Share(s)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <div
        className={`menu ${open && "active"}`}
        onClick={() => {
          open === false ? setOpen(true) : setOpen(false);
        }}
      >
        <Typography variant="button" color={"#fcbd7a"} mr="0.5rem">
          menu
        </Typography>
        <div>
          <div className="one">
            <div className="menu-dots"></div>
            <div className="menu-dots"></div>
          </div>
          <div className="two">
            <div className="menu-dots"></div>
            <div className="menu-dots"></div>
          </div>
        </div>
      </div>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ display: "flex", flexDirection: "column", padding: "3rem" }}>
          <Button href="#contribute">Contribute</Button>
          <Button href="#redeem">redeem shares</Button>
          <Button href="#transfer">transfer shares</Button>
          <Button href="#create-proposal">create proposal</Button>
          <Button href="#proposals">Proposals</Button>
          <Button
            onClick={() => {
              disconnect();
            }}
            startIcon={<Logout />}
            variant={"contained"}
          >
            disconnect
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

Header.propTypes = {
  address: PropTypes.string.isRequired,
  balance: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  daoData: PropTypes.instanceOf(Object).isRequired,
  createDao: PropTypes.func.isRequired,
  disconnect: PropTypes.func.isRequired,
};

export default Header;
