import React from "react";
import { ethers } from "ethers";
import { useConnection } from "../utils/connection_provider/connection_provider";
import { toEther } from "../utils/helpers";

const PayWithRefi = ({ address, provider }) => {
  const { refiCollectionContract, accounts } = useConnection();

  const [tokenURI, setTokenURI] = React.useState("");

  const fetchData = async () => {
    const tokenId = await refiCollectionContract.getTokenId(accounts[0]);

    if (toEther(tokenId) === 0) return;

    let tokenURI = await refiCollectionContract.tokenURI(tokenId);
    // console.log("Token URI", tokenURI)
    tokenURI = tokenURI.split(",")[1];

    const metadata = Buffer.from(tokenURI, "base64").toString("ascii");

    setTokenURI(JSON.parse(metadata).image);
  };

  React.useEffect(() => {
    if (refiCollectionContract === undefined) return;
    // fetchData();
  }, [refiCollectionContract, accounts]);

  return (
    <div>
      {tokenURI === "" ? (
        <div>Loading</div>
      ) : (
        <img src={tokenURI} alt="Credit card" />
      )}
    </div>
  );
};

export default PayWithRefi;
