import React, { useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json';

const defaultChainID = 80001;

const supportedNetworks = {
    // npx hardhat node
    // npx hardhat run scripts/deploy.js --network localhost
    // Copy console address to greeterAddress
    31337: {
        name: 'Hardhat',
        rpcURL: 'http://localhost:8545',
        greeterAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
    // npx hardhat run scripts/deploy.js --network mumbai
    // Returned address is wrong. https://github.com/nomiclabs/hardhat/issues/2162. 
    // Copy address from polygonscan to greeterAddress
    80001: {
        name: 'Mumbai',
        rpcURL: 'https://rpc-mumbai.maticvigil.com',
        greeterAddress: '0x8B1913B4cD6cb731e53F25031786A42dCB195F4b',
    }
}

const ConnectionContext = React.createContext();

export function useConnection() {
    return useContext(ConnectionContext);
}

export function ConnectionProvider(props) {
    const [connectionState, setConnectionState] = useState({
        ethers: ethers,
        networkName: supportedNetworks[defaultChainID].name,
        accounts: [],
        greeterContract: null,
        error: null,
    });

    const initiate = async () => {
        try {
            const provider = new ethers.providers.JsonRpcProvider(supportedNetworks[defaultChainID].rpcURL);
            const greeterContract = new ethers.Contract(
                supportedNetworks[defaultChainID].greeterAddress,
                Greeter.abi,
                provider
            );

            setConnectionState({ ...connectionState, greeterContract });
        } catch (err) {
            setConnectionState({ ...connectionState, error: "useConnection : Initiate Error -> " + err.toString() });
            console.log(connectionState.error);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            setConnectionState({ ...connectionState, error: 'Browser Wallet Not Found' });
            return;
        }

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const signer = provider.getSigner();

            const { chainId } = await provider.getNetwork()
            if (!supportedNetworks[chainId]) {
                throw "Use Correct Network";
            }
            const networkName = supportedNetworks[chainId].name;

            const greeterContract = new ethers.Contract(
                supportedNetworks[chainId].greeterAddress,
                Greeter.abi,
                signer
            );;

            setConnectionState({ ...connectionState, accounts, networkName, greeterContract });
        } catch (e) {
            setConnectionState({ ...connectionState, error: "useConnection : connectWallet failed -> " + e.toString() });
            console.log(connectionState.error);
        }
    }

    useEffect(() => {
        initiate();

        if (window.ethereum) {
            // Detect metamask account change
            window.ethereum.on('accountsChanged', async function (accounts) {
                connectWallet();
            })

            // Detect metamask network change
            window.ethereum.on('chainChanged', function (networkId) {
                connectWallet();
            });
        }
    }, []);

    return (
        <>
            <ConnectionContext.Provider value={{ connectionState, setConnectionState, connectWallet }}>
                {props.children}
            </ConnectionContext.Provider>
        </>
    );
}