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
  isApproved,
  approveDWETH,
}) => {
  const [input, setInput] = useState(0);
  const max = () => setInput(walletBalance ?? 0);

  return (
    <div className="borrow">
      <h4>Borrow Asset</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Currently Borrowed"
          value={currentBorrowed.toFixed(2) + " " + symbol}
        />
        {/* <SimpleTile name="Health Factor" value={healthFactor.toFixed(2)} /> */}
      </div>

      <InputField
        input={input}
        setInput={setInput}
        leftText={"Wallet Balance - " + walletBalance.toFixed(2) + " " + symbol}
        rightText={
          "Available to Borrow - " + availableToBorrow.toFixed(4) + " " + symbol
        }
        max={max}
      />

      <div className="buttons">
        {symbol === "ETH" ? (
          isApproved ? (
            <></>
          ) : (
            <button className="outlined-button" onClick={approveDWETH}>
              Approve
            </button>
          )
        ) : (
          <></>
        )}
        <button
          className="outlined-button"
          onClick={() => {
            setInput("");
            repayDebt(input);
          }}
        >
          Repay
        </button>
        <button
          onClick={() => {
            setInput("");
            borrowAsset(input);
          }}
        >
          Borrow
        </button>
      </div>
    </div>
  );
};

export default BorrowSection;
