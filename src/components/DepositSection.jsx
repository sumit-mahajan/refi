import React, { useState } from "react";
import SimpleTile from "./SimpleTile";
import { InputField } from "./InputField";

const DepositSection = ({
  depositERC20,
  symbol,
  currentDeposited,
  walletBalance,
  approveToken,
  withdrawAsset,
  isApproved,
}) => {
  const [input, setInput] = useState(0);
  const max = () => setInput(walletBalance ?? 0);

  return (
    <div className="deposit">
      <h4>Deposit Asset</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Currently Deposited"
          value={currentDeposited.toFixed(2) + " " + symbol}
        />
      </div>

      <InputField
        input={input}
        setInput={setInput}
        leftText={
          "Available to Withdraw - " +
          currentDeposited.toFixed(2) +
          " " +
          symbol
        }
        rightText={
          "Wallet Balance - " + walletBalance.toFixed(2) + " " + symbol
        }
        max={max}
      />

      <div className="buttons">
        {isApproved ? (
          <></>
        ) : (
          <button className="outlined-button" onClick={approveToken}>
            Approve
          </button>
        )}

        <button
          onClick={() => {
            withdrawAsset(input);
            setInput("");
          }}
          className="outlined-button"
        >
          Withdraw
        </button>
        <button
          onClick={() => {
            depositERC20(input);
            setInput("");
          }}
        >
          Deposit
        </button>
      </div>
    </div>
  );
};

export default DepositSection;
