import React, { useState } from "react";
import { InputField } from "../InputField";
import SimpleTile from "../SimpleTile";

const BorrowSection = ({
  symbol,
  availableToBorrow,
  isApproved,
  approveDWETH,
  borrowAsset,
}) => {
  const [input, setInput] = useState(0);

  return (
    <div className="borrow">
      <h4>Borrow</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Available To Borrow"
          value={availableToBorrow.toFixed(2) + " " + symbol}
        />
        {/* <SimpleTile name="Health Factor" value={healthFactor.toFixed(2)} /> */}
      </div>

      <InputField
        input={input}
        setInput={setInput}
        symbol={symbol}
      />

      <div className="buttons">
        {symbol === "ETH" ? (
          isApproved ? (
            <></>
          ) : (
            <button onClick={approveDWETH}>
              Approve
            </button>
          )
        ) : (
          <button
            onClick={() => {
              setInput("");
              borrowAsset(input);
            }}
          >
            Borrow
          </button>
        )}
      </div>
    </div>
  );
};

export default BorrowSection;
