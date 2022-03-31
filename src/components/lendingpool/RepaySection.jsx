import React, { useState } from "react";
import { toFixed } from "../../utils/helpers";
import Box from "../Box";
import { InputField } from "../InputField";
import SimpleTile from "../SimpleTile";

const RepaySection = ({
  symbol,
  currentBorrowed,
  isApproved,
  approveToken,
  repayAsset,
  error,
}) => {
  const [input, setInput] = useState();

  const decimalsToShow = symbol === "ETH" ? 5 : 2;

  return (
    <div className="borrow">
      <h4>Repay</h4>
      <hr className="mb-5" />

      <div className="mb-5">
        <SimpleTile
          name="Currently Borrowed"
          value={toFixed(currentBorrowed, decimalsToShow) + " " + symbol}
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
      {isApproved ? (
        <button
          onClick={() => {
            setInput("");
            repayAsset(input, isApproved);
          }}
        >
          Repay
        </button>
      ) : (
        <button onClick={() => repayAsset(input, isApproved)}>
          Approve & Repay
        </button>
      )}
      {isApproved && (
        <>
          <Box height={20} />
          <p className="or">OR</p>
          <Box height={10} />

          <div
            className="ul-btn"
            onClick={() => {
              repayAsset(currentBorrowed + 0.00001);
            }}
          >
            Repay All
          </div>
        </>
      )}
    </div>
  );
};

export default RepaySection;
