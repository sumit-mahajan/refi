import React, { useState } from "react";
import { InputField } from "./InputField";
import SimpleTile from "./SimpleTile";

const BorrowSection = ({
  symbol,
  currentBorrowed,
  availableToBorrow,
  healthFactor,
  walletBalance,
  borrowAsset,
  repayDebt,
}) => {
  const [input, setInput] = useState(0);
  const max = () => setInput(walletBalance ?? 0);

  return (
    <div className="borrow">
      <h4>Borrowed Asset</h4>
      <hr className="mb-5" />

      <div className="mb-4">
        <SimpleTile
          name="Currently Borrowed"
          value={currentBorrowed.toFixed(2) + " " + symbol}
        />
        <SimpleTile name="Health Factor" value={healthFactor.toFixed(2)} />
      </div>

      <InputField
        input={input}
        setInput={setInput}
        leftText={"Wallet Balance - " + walletBalance.toFixed(2) + " " + symbol}
        rightText={
          "Available to Borrow - " + availableToBorrow.toFixed(2) + " " + symbol
        }
        max={max}
      />

      <div className="buttons">
        <button className="outlined-button" onClick={() => repayDebt(input)}>
          Repay
        </button>
        <button onClick={() => borrowAsset(input)}>Borrow</button>
      </div>
    </div>
  );
};

export default BorrowSection;
