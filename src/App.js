import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { myAlgoConnect } from "./utils/constants";
import { Notification } from "./components/utils/Notifications";
import Dao from "./components/dao/Dao";
import Cover from "./components/utils/Cover";
import coverImg from "./assets/img/DAO.jpg";
import "./App.css";

const App = function AppWrapper() {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const connectWallet = async () => {
    myAlgoConnect
      .connect()
      .then((accounts) => {
        const _account = accounts[0];
        setAddress(_account.address);
        setName(_account.name);
      })
      .catch((error) => {
        console.log("Could not connect to MyAlgo wallet");
        console.error(error);
      });
  };

  const disconnect = () => {
    setAddress("");
    setName("");
  };
  return (
    <>
      <Notification />
      {address && name ? (
        <Container fluid="md">
          <main>
            <Dao address={address} name={name} disconnect={disconnect} />
          </main>
        </Container>
      ) : (
        <Cover name="DAO DApp" login={connectWallet} coverImg={coverImg} />
      )}
    </>
  );
};

export default App;
