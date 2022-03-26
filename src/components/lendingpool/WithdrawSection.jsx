import React, { useState } from "react";
import SimpleTile from "../SimpleTile";
import { InputField } from "../InputField";
import Box from "../Box";
import { MAX_UINT } from "../../utils/helpers";

const WithdrawSection = ({
    symbol,
    currentDeposited,
    withdrawAsset,
    withdrawAll,
    error
}) => {
    const [input, setInput] = useState();

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

            {error ? <div className="error-field"><p>{error}</p></div> : <Box height={30} />}

            <button
                onClick={() => {
                    withdrawAsset(input);
                    setInput("");
                }}
            >
                Withdraw
            </button>

            <Box height={20} />
            <p className="or">OR</p>
            <Box height={10} />

            <div className="ul-btn ul-btn-w" onClick={() => { withdrawAll(); }}>Withdraw All</div>

        </div>
    );
};

export default WithdrawSection;
