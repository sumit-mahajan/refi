import React from "react";

export const InputField = ({ input, setInput, symbol }) => {
  return (
    <div className="mb-3">
      <div className="input-field">
        <input
          className="mb-1"
          type="number"
          placeholder="Amount"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <h6 className="mb-2">
          {symbol}
        </h6>
      </div>

    </div>
  );
};
