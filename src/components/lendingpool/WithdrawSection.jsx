import React, { useState } from "react";
import SimpleTile from "../SimpleTile";
import { InputField } from "../InputField";

const WithdrawSection = ({
    symbol,
    currentDeposited,
    withdrawAsset,
}) => {
    const [input, setInput] = useState(0);

    return (
        <div className="deposit">
            <h4>Withdraw</h4>
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
                symbol={symbol}
            />

            <div className="buttons">
                <button
                    onClick={() => {
                        withdrawAsset(input);
                        setInput("");
                    }}
                >
                    Withdraw
                </button>
            </div>
        </div>
    );
};

export default WithdrawSection;
