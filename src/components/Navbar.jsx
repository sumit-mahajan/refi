import React from "react";
import "./navbar.scss";

import { useNavigate } from "react-router";
import {
  supportedNetworks,
  useConnection,
} from "../utils/connection_provider/connection_provider";

function Navbar() {
  const { chainId, accounts, connectWallet } = useConnection();

  const navigate = useNavigate();

  return (
    <nav className="navbar mt-4">
      <h3 className="logo">REFI</h3>
      <div className="nav-options">
        <h6 className="info-box">Ethereum Mainnet</h6>

        <h6 className="info-box" onClick={connectWallet}>
          {accounts}
          0xFF...45D6
        </h6>
        {/* <button>connect</button> */}
      </div>
    </nav>
  );
}

export default Navbar;
