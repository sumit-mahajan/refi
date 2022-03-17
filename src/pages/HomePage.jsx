import React, { useEffect, useState } from "react";
import "../styles/home.scss";
import ListTile from "../components/ListTile";

import { useNavigate } from "react-router-dom";
import { useAssetProvider } from "../utils/assets_provider/assets_provider";

function HomePage() {
  const navigate = useNavigate();

  const { state: assets } = useAssetProvider();

  console.log("Rendered Home page");

  // const getAllAssets = async () => {
  //   if (protocolDataProvider === null) return;

  //   //Get All Assets
  //   const assets = await protocolDataProvider.getAllReservesTokens();

  //   //Get Asset Info for each Asset
  //   const promises = assets.map(async (asset) => {
  //     const assetInfo = await protocolDataProvider.getReserveData(
  //       asset.tokenAddress
  //     );

  //     const {
  //       liquidityRate,
  //       variableBorrowRate,
  //       totalVariableDebt,
  //       availableLiquidity,
  //       utilizationRate,
  //     } = assetInfo;

  //     console.log(utilizationRate);

  //     const data = {
  //       symbol: asset.symbol,
  //       tokenAddress: asset.tokenAddress,
  //       depositAPY: calculateAPY(liquidityRate),
  //       availableLiquidity: toEther(availableLiquidity),
  //       borrowAPY: calculateAPY(variableBorrowRate),
  //       totalBorrowed: toEther(totalVariableDebt),
  //       utilizationRatio: toEther(utilizationRate),
  //     };

  //     return data;
  //   });

  //   const data = await Promise.all(promises);

  //   setAssets(data);
  // };

  return (
    <div>
      <section className="stats mt-7 mb-4"></section>

      <hr />
      <section className="assets ">
        <div className="asset-labels pt-1 pb-1 ">
          <p className="spread">Assets</p>
          <p>Market Size</p>
          <p>Deposit APY</p>
          <p>Borrow APY</p>
          <p>Total Borrowed</p>
        </div>

        {assets.map((asset, index) => (
          <div
            key={index}
            onClick={() =>
              navigate(`/assets/${asset.symbol}`, {
                state: { asset },
              })
            }
            style={{ cursor: "pointer" }}
          >
            <ListTile
              symbol={asset.symbol}
              image={"/images/crypto_logos/" + asset.symbol.toLowerCase() + ".svg"}
              marketSize={asset.availableLiquidity + asset.totalBorrowed}
              depositAPY={asset.depositAPY}
              borrowAPY={asset.borrowAPY}
              totalBorrowed={asset.totalBorrowed}
            />
            <hr />
          </div>
        ))}
      </section>
    </div>
  );
}

export default HomePage;
