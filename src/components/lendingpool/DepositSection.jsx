import React, { useState } from "react";
import SimpleTile from "../SimpleTile";
import { InputField } from "../InputField";
import Slider from "../slider/Slider";

const DepositSection = ({
  symbol,
  walletBalance,
  isApproved,
  approveToken,
  depositAsset,
}) => {
  const [input, setInput] = useState(0);

  return (
    <div className="deposit">
      <h4>Deposit</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Wallet Balance"
          value={walletBalance.toFixed(2) + " " + symbol}
        />
      </div>

      <InputField
        input={input}
        setInput={setInput}
        symbol={symbol}
      />

      <Slider />

      <div className="buttons">
        {isApproved ? (
          <button
            onClick={() => {
              depositAsset(input);
              setInput("");
            }}
          >
            Deposit
          </button>
        ) : (
          <button onClick={approveToken}>
            Approve
          </button>
        )}

      </div>
    </div>
  );
};

export default DepositSection;
