import React from "react";
import "./list-tile.scss";

function ListTile({
  symbol,
  marketSize,
  depositAPY,
  borrowAPY,
  totalBorrowed,
}) {
  return (
    <div className="tile-container pt-2 pb-2 ">
      <div className="spread">
        <img
          className="mr-2"
          src="https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png"
          alt="Crypto Icon"
        />
        <h4>{symbol}</h4>
      </div>
      <p>$ {marketSize.toFixed(4)}</p>
      <p>{depositAPY.toFixed(2)}%</p>
      <p>{borrowAPY.toFixed(2)}%</p>
      <p>$ {totalBorrowed.toFixed(2)}</p>
    </div>
  );
}

export default ListTile;
