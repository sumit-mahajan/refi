import Box from "../components/Box";
import "../styles/dashboard.scss";

import React, { useState, useEffect } from "react";
import { Buffer } from 'buffer';

import { useConnection } from "../utils/connection_provider/connection_provider";
import { getImageFromSymbol, MAX_UINT, toEther, toWei } from "../utils/helpers";
import { createAndUploadImages } from "../utils/createAndUploadImages";

import Loading from "../components/loading/Loading";

const UserClass = [
    "Diamond",
    "Gold",
    "Silver",
    "Bronze"
]

const Dashboard = () => {

    const { refiCollectionContract, lendingPoolContract, accounts } = useConnection();

    const [loadingStatus, setLoadingStatus] = useState({
        isLoading: false,
        message: ""
    });

    const [reputation, setReputation] = useState({
        score: 0,
        class: '',
        cardImage: "",
        tokenId: 0
    });

    const mintCards = async () => {
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

    const fetchDetails = async () => {
        // Get class and score from lending Pool
        const userClass = await lendingPoolContract.getUserClass(accounts[0]);

        console.log("UserClass", userClass)
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
        if (tokenId.toNumber() !== 0) {
            let tokenURI = await refiCollectionContract.tokenURI(tokenId);
            // console.log("Token URI", tokenURI)
            tokenURI = tokenURI.split(',')[1]

            const metadata = await Buffer.from(tokenURI, 'base64').toString('ascii');
            rep.cardImage = JSON.parse(metadata).image;
            rep.tokenId = tokenId.toNumber()
        }

        setReputation(rep);
        console.log(reputation)
    }

    useEffect(() => {
        fetchDetails()
    }, [accounts])


    if (loadingStatus.isLoading) {
        return <Loading message={loadingStatus.message} />;
    }
    return (
        <>
            <Box height={80} />

            <section className="credit-flex">
                {
                    (reputation.cardImage === "") ?
                        <button style={{ width: "40rem" }} onClick={mintCards}>Mint Your Card</button> :
                        <img src={reputation.cardImage} alt="Credit card" />
                }
                <Box width={60} />
                <div>
                    <h3>Your Credit Score</h3>
                    <h1>{reputation.score.toFixed(0)}</h1>
                    <p>You are {reputation.class} user. You belong to the most elite users on the protocol</p>
                </div>
                <div className="opensea-btn">
                    <a href={`https://testnets.opensea.io/assets/${refiCollectionContract.address}/${reputation.tokenId}`}>View on OpenSea</a>
                </div>
            </section>
            <Box height={40} />
            <hr />

            <Box height={40} />

            <section className="data-flex">
                <div>
                    <h4>Total Supply</h4>
                    <h2>$ 98.32</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Health Factor</h4>
                    <h2>2.268</h2>
                </div>
                <div className="vr"></div>
                <div>
                    <h4>Total Borrowed</h4>
                    <h2>$ 68.52</h2>
                </div>
            </section>

            <Box height={60} />

            <section className="dnb">
                <div className="dnb-col">
                    <h4>Supplied Assets</h4>
                    <Box height={10} />
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/DAI.svg"
                            alt="Crypto Icon"
                        />
                        <p>4.35 DAI</p>
                        <strong><p>$ 4.35 </p></strong>
                    </div>
                    <hr />
                </div>
                <Box width={100} />
                <div className="dnb-col">
                    <h4>Borrowed Assets</h4>
                    <Box height={10} />
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/LINK.svg"
                            alt="Crypto Icon"
                        />
                        <p>3.5 LINK</p>
                        <strong><p>$ 54.35 </p></strong>
                    </div>
                    <hr />
                    <div className="dnb-asset-tile">
                        <img
                            className="mr-2"
                            src="/images/LINK.svg"
                            alt="Crypto Icon"
                        />
                        <p>3.5 LINK</p>
                        <strong><p>$ 54.35 </p></strong>
                    </div>
                    <hr />
                </div>
            </section>

            <Box height={40} />
        </>
    );
}

export default Dashboard;