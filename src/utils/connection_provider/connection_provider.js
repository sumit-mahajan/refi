import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

import AddressesProvider from "../../artifacts/contracts/AddressesProvider.sol/AddressesProvider.json";

import { supportedNetworks, defaultChainId } from "./network_config";
import { fetchContracts, fetchSignerContracts } from "./fetch_contracts";

const ConnectionContext = React.createContext();

export function ConnectionProvider(props) {
  const [state, setState] = useState({
    ethers: ethers,
    chainId: defaultChainId,
    accounts: [],
    error: "",
  });

  const initiate = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        supportedNetworks[defaultChainId].rpcURL
      );

      const contracts = await fetchContracts(provider, defaultChainId);

      setState({ ...state, ...contracts });
      // connectWallet();
    } catch (err) {
      setState({
        ...state,
        error: "useConnection : Initiate Error -> " + err.toString(),
      });

      console.log(state.error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw "Browser Wallet Not Found";
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = provider.getSigner();

      const { chainId } = await provider.getNetwork();

      if (!supportedNetworks[chainId]) {
        throw "Use Correct Network";
      }

      // const addressProvider = new ethers.Contract(
      //   supportedNetworks[chainId].address,
      //   AddressesProvider.abi,
      //   signer
      // );

      const contracts = await fetchSignerContracts(chainId, signer);

      setState({
        ...state,
        accounts,
        chainId,
        // addressProvider,
        ...contracts,
      });
    } catch (e) {
      if (e.code === 4001) {
        // User rejected request
        e = "Denied Browser Wallet Access";
      }
      setState({ ...state, error: e.toString() });
      console.log("useConnection : connectWallet failed -> " + state.error);
    }
  };

  useEffect(() => {
    initiate();

    if (window.ethereum) {
      // Detect metamask account change
      window.ethereum.on("accountsChanged", async function (accounts) {
        connectWallet();
      });

      // Detect metamask network change
      window.ethereum.on("chainChanged", function (networkId) {
        connectWallet();
      });
    }
  }, []);

  return (
    <>
      <ConnectionContext.Provider
        value={{
          ...state,
          connectWallet,
        }}
      >
        {props.children}
      </ConnectionContext.Provider>
    </>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}

export { ConnectionContext };
