import React from "react";

export const InputField = ({ input, setInput, max, leftText, rightText }) => {
  return (
    <div className="mb-5">
      <div className="input-field">
        <input
          className="mb-1"
          type="number"
          placeholder="Amount"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <h6 className="mb-2" onClick={max}>
          Max
        </h6>
      </div>
      <div className="spaced-between">
        <p>{leftText}</p>
        <p>{rightText}</p>
      </div>
    </div>
  );
};
