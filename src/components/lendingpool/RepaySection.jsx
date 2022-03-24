import React, { useState } from "react";
import { InputField } from "../InputField";
import SimpleTile from "../SimpleTile";

const RepaySection = ({
    symbol,
    currentBorrowed,
    repayAsset
}) => {
    const [input, setInput] = useState(0);

    return (
        <div className="borrow">
            <h4>Repay</h4>
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
                symbol={symbol}
            />

            <div className="buttons">
                <button
                    onClick={() => {
                        setInput("");
                        repayAsset(input);
                    }}
                >
                    Repay
                </button>

            </div>
        </div>
    );
};

export default RepaySection;
