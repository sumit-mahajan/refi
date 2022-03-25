import React, { useState } from "react";
import Box from "../Box";
import { InputField } from "../InputField";
import SimpleTile from "../SimpleTile";

const RepaySection = ({
    symbol,
    currentBorrowed,
    repayAsset,
    error
}) => {
    const [input, setInput] = useState();

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

            {error ? <div className="error-field"><p>{error}</p></div> : <Box height={30} />}

            <button
                onClick={() => {
                    setInput("");
                    repayAsset(input);
                }}
            >
                Repay
            </button>

            <Box height={20} />
            <p className="or">OR</p>
            <Box height={10} />

            <div className="ul-btn" onClick={() => { repayAsset(currentBorrowed + 1); }}>Repay All</div>

        </div>
    );
};

export default RepaySection;
