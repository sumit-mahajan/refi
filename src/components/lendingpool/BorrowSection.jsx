import React, { useState } from "react";
import { toFixed } from "../../utils/helpers";
import Box from "../Box";
import { InputField } from "../InputField";
import SimpleTile from "../SimpleTile";

const BorrowSection = ({
  symbol,
  availableToBorrow,
  isApproved,
  approveDWETH,
  borrowAsset,
  error,
}) => {
  const [input, setInput] = useState();

  const decimalsToShow = symbol === "ETH" ? 5 : 2;
  return (
    <div className="borrow">
      <h4>Borrow</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Available To Borrow"
          value={toFixed(availableToBorrow, decimalsToShow) + " " + symbol}
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
        {symbol === "ETH" ? (
          isApproved ? (
            <button
              onClick={() => {
                setInput("");
                borrowAsset(input, isApproved);
              }}
            >
              Borrow
            </button>
          ) : (
            <button onClick={() => borrowAsset(input, isApproved)}>
              Approve & Borrow
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
