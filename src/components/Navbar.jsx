import React from "react";
import "./navbar.scss";

import { useNavigate } from "react-router";
import { useConnection } from "../utils/connection_provider/connection_provider";
import { supportedNetworks } from "../utils/connection_provider/network_config";

function Navbar() {
  const { chainId, accounts, connectWallet } = useConnection();

  const navigate = useNavigate();

  const isConnected = accounts.length > 0;

  return (
    <nav className="navbar mt-4">
      <a href="/#"><h3 className="logo">REFI</h3></a>
      <div className="nav-options">
        <h6 className="info-box">{supportedNetworks[chainId].name}</h6>

        <h6
          className="info-box"
          onClick={connectWallet}
          style={{
            cursor: isConnected ? "inherit" : "pointer",
          }}
        >
          {isConnected ?
            accounts[0].substring(0, 5) +
            "..." +
            accounts[0].substring(
              accounts[0].length - 3,
              accounts[0].length
            )
            : "Connect"}
        </h6>
      </div>
    </nav>
  );
}

export default Navbar;
