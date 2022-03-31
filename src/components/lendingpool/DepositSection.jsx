import React, { useState } from "react";
import SimpleTile from "../SimpleTile";
import { InputField } from "../InputField";
import Box from "../Box";
import { toFixed } from "../../utils/helpers";

const DepositSection = ({
  symbol,
  walletBalance,
  isApproved,
  approveToken,
  depositAsset,
  error,
}) => {
  const [input, setInput] = useState();

  const decimalsToShow = symbol === "ETH" ? 5 : 2;

  return (
    <div className="deposit">
      <h4>Deposit</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Wallet Balance"
          value={toFixed(walletBalance, decimalsToShow) + " " + symbol}
        />
      </div>

      <InputField input={input} setInput={setInput} symbol={symbol} />

      {error ? (
        <div className="error-field">
          <p>{error}</p>
        </div>
      ) : (
        <Box height={30} />
      )}

      <div className="buttons">
        {isApproved ? (
          <button
            onClick={() => {
              depositAsset(input, isApproved);
              setInput("");
            }}
          >
            Deposit
          </button>
        ) : (
          <button onClick={() => depositAsset(input, isApproved)}>
            Approve & Deposit
          </button>
        )}
      </div>
    </div>
  );
};

export default DepositSection;
