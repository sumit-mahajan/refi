import Box from "../components/Box";
import "../styles/dashboard.scss";

import React, {useState, useEffect} from "react";
import { Buffer } from 'buffer';

import { useConnection } from "../utils/connection_provider/connection_provider";
import { supportedNetworks } from "../utils/connection_provider/network_config";
import { ethers } from "ethers";
import { getImageFromSymbol, toEther } from "../utils/helpers";
import { createAndUploadImages } from "../utils/createAndUploadImages";

import Loading from "../components/loading/Loading";

const UserClass = [
    "Diamond",
    "Gold",
    "Silver",
    "Bronze"
]

const Dashboard = () => {

    const { protocolDataProvider, refiCollectionContract, walletBalanceProvider, lendingPoolContract, chainId, accounts} = useConnection();

    const [loadingStatus, setLoadingStatus] = useState({
        isLoading: false,
        message: ""
    });

    // For credit-flex section
    const [reputation, setReputation] = useState({
        score: 0,
        class: '',
        cardImage: "",
        tokenId: 0
    });
    
    // For data-flex section
    const [userAccountData, setUserAccountData] = useState({
        totalSupply: 0,
        healthFactor: 0,
        creditUtilization: 0,
        totalBorrowed: 0
    })

    // For dnb-section
    const [userReserves, setUserReserves] = useState({
        borrowedAssets: [],
        suppliedAssets: []
    })

    const mintCards = async() => {
        try {
            const address = accounts[0];

            // Show some message like "Generating Your Card..."
            setLoadingStatus({
                isLoading: true,
                message: "Generating your card"
            })
            const imageCIDs = await createAndUploadImages(address);
            // Stop showing the message
            setLoadingStatus({
                isLoading: false,
                message: ""
            })

            // const imageCIDs = {
            //     bronze: 'bafybeigk2qyu46v2luh53scgbdcvodjjarl5ajv3oj2dmmcobsay5aorby',
            //     silver: 'bafybeiawkjuctml4szyenyi7igmux7x232onowvvagwbwtrjczlljrwhsa',
            //     gold: 'bafybeiabfixl6v5dwnzitjowz2fsq42iuixbwl6dyskknoc23lj262ini4',
            //     diamond: 'bafkreid43mzna4mzfmokdc56jvy4qcjonzvri2e67rzg4ck4dkzspaqrli'
            // }
            // console.log(imageCIDs);
            
            setLoadingStatus({
                isLoading: true,
                message: "Minting your card"
            })
            const mintTx = await refiCollectionContract.mint(
                "Refi Card",
                "This is your card is your key to unlimited possiblities",
                imageCIDs.bronze,
                imageCIDs.silver,
                imageCIDs.gold,
                imageCIDs.diamond
            )
            await mintTx.wait()
            
            fetchDetails()
            setLoadingStatus({
                isLoading: false,
                message: ""
            })
        } catch (error) {
            console.log(error)
        }
    }

    const fetchDetails = async() => {
        // Get class and score from lending Pool
        const userClass = await lendingPoolContract.getUserClass(accounts[0]);

        // console.log("UserCalss", userClass)
        // console.log(UserClass[userClass[0]], toEther(userClass[1]));

        let rep = {
            score: toEther(userClass[1]),
            class: UserClass[userClass[0]],
            cardImage: '',
            tokenId: 0
        }

        // Get Metadata from refiCollection
        const tokenId = await refiCollectionContract.getTokenId(accounts[0]);

        // console.log("TokenId", tokenId.toNumber())
        if(tokenId.toNumber() !== 0) {
            let tokenURI = await refiCollectionContract.tokenURI(tokenId);
            // console.log("Token URI", tokenURI)
            tokenURI = tokenURI.split(',')[1]
            
            const metadata = await Buffer.from(tokenURI, 'base64').toString('ascii');
            rep.cardImage = JSON.parse(metadata).image;
            rep.tokenId = tokenId.toNumber()
        }

        setReputation(rep);
        // console.log(reputation)
    }

    const fetchUserAccountData = async() => {
        try {
            const userData = await lendingPoolContract.getUserAccountData(accounts[0]);

            let {
                totalCollateralETH,
                totalDebtETH,
                availableBorrowsETH,
                currentLiquidationThreshold,
                ltv,
                healthFactor
            } = userData;
            
            const byte32 = ethers.utils.formatBytes32String("ETH");

            const value = await walletBalanceProvider.getPriceInUsd(byte32);

            // Dividing by 1e8 as price returned has 8 decimals
            const priceInUsd = value / 1e8;

            totalCollateralETH = toEther(totalCollateralETH);
            totalDebtETH = toEther(totalDebtETH);
            availableBorrowsETH = toEther(availableBorrowsETH);
            healthFactor = toEther(healthFactor);

            setUserAccountData({
                totalSupply: priceInUsd * totalCollateralETH,
                healthFactor: totalDebtETH === 0 ? 0 : healthFactor,
                creditUtilization: (totalDebtETH / (totalDebtETH + availableBorrowsETH)) * 100,
                totalBorrowed: priceInUsd * totalDebtETH
            })
            
            
        } catch (error) {
            console.log(error)
        }
    }

    const fetchUserAssests = async() => {
        try {
            const reserves = await protocolDataProvider.getUserReservesData(accounts[0]);

            const data = {
                borrowedAssets: [],
                suppliedAssets: []
            }

            for (const reserve of reserves) {
                // First get the price in USD
                const isWETH = reserve.symbol === "WETH";
                const byte32 = ethers.utils.formatBytes32String(
                    isWETH ? "ETH" : reserve.symbol
                );
                const value = await walletBalanceProvider.getPriceInUsd(byte32);
                const priceInUsd = value / 1e8;
    
                if(toEther(reserve.currentVariableDebt) !== 0) {
                    // Means borrowed from this reserve
                    data.borrowedAssets.push({
                        symbol: isWETH ? "ETH" : reserve.symbol,
                        current: toEther(reserve.currentVariableDebt),
                        scaled: toEther(reserve.scaledVariableDebt),
                        currentInUsd: priceInUsd * toEther(reserve.currentVariableDebt),
                        scaledInUsd: priceInUsd * toEther(reserve.scaledVariableDebt)
                    })
                }
    
                if(toEther(reserve.currentATokenBalance) !== 0) {
                    // Means deposited in this reserve
                    data.suppliedAssets.push({
                        symbol: isWETH ? "ETH" : reserve.symbol,
                        current: toEther(reserve.currentATokenBalance),
                        scaled: toEther(reserve.scaledATokenBalance),
                        currentInUsd: priceInUsd * toEther(reserve.currentATokenBalance),
                        scaledInUsd: priceInUsd * toEther(reserve.scaledATokenBalance)
                    })
                }   
            }
            
            // console.log("Data", data);
            setUserReserves({
                borrowedAssets: data.borrowedAssets,
                suppliedAssets: data.suppliedAssets
            })
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(()=> {
        fetchDetails()
        fetchUserAccountData()
        fetchUserAssests()
    }, [accounts, fetchDetails, fetchUserAccountData, fetchUserAssests])


    const renderAsset = (asset, index) => {
        return (<>
            <div className="dnb-asset-tile">
                <img
                    className="mr-2"
                    src={getImageFromSymbol(asset.symbol)}
                    alt="Crypto Icon"
                />
                <p>{`${(asset.scaled).toFixed(2)} ${asset.symbol}`}</p>
                <strong><p>$ {(asset.scaledInUsd).toFixed(2)}</p></strong>
            </div>
            <hr />
        </>)
    }

    if(loadingStatus.isLoading) {
        return <Loading message={loadingStatus.message} />;
    }
    return (
        <>
            <Box height={80} />

            <section className="credit-flex">
                {
                    (reputation.cardImage === "") ?
                    <button style={{width: "40rem"}} onClick={mintCards}>Mint Your Card</button> : 
                    <img src={reputation.cardImage} alt="Credit card" />
                }
                <Box width={60} />
                <div>
                    <h3>Your Credit Score</h3>
                    <h1>{reputation.score.toFixed(0)}</h1>
                    <p>You are {reputation.class} user. You belong to the most elite users on the protocol</p>
                </div>
                {
                    (supportedNetworks[chainId].name === "Rinkeby" && reputation.tokenId > 0) &&     
                    <div className="opensea-btn">
                        <a href={`https://testnets.opensea.io/assets/${refiCollectionContract.address}/${reputation.tokenId}`}>View on OpenSea</a>
                    </div>
                }
            </section>
            <Box height={40} />
            <hr />

            <Box height={40} />

            <section className="data-flex">
                <div>
                    <h4>Total Supply</h4>
                    <h2>$ {(userAccountData.totalSupply).toFixed(2)}</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Health Factor</h4>
                    <h2>{userAccountData.healthFactor === 0 ? <>&#8734;</> : (userAccountData.healthFactor).toFixed(3)}</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Credit Utilization</h4>
                    <h2>{Math.round(userAccountData.creditUtilization)}%</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Total Borrowed</h4>
                    <h2>$ {(userAccountData.totalBorrowed).toFixed(2)}</h2>
                </div>
            </section>

            <Box height={60} />

            <section className="dnb">
                <div className="dnb-col">
                    <h4>Supplied Assets</h4>
                    <Box height={10} />
                    <hr />
                    {
                        userReserves.suppliedAssets.length > 0 ? 
                        userReserves.suppliedAssets.map(renderAsset) :
                        <p>No supplied assets</p>
                    }
                </div>
                <Box width={100} />
                <div className="dnb-col">
                    <h4>Borrowed Assets</h4>
                    <Box height={10} />
                    <hr />
                    {
                        userReserves.borrowedAssets.length > 0 ? 
                        userReserves.borrowedAssets.map(renderAsset) :
                        <p>No borrowed assets</p>
                    }
                </div>
            </section>

            <Box height={40} />
        </>
    );
}

export default Dashboard;