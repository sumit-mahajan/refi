// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

library DataTypes {
    // refer to the whitepaper, section 1.1 basic concepts for a formal description of these properties.
    struct ReserveData {
        //stores the reserve configuration
        ReserveConfigurationMap configuration;
        //the liquidity index. Expressed in ray
        uint128 liquidityIndex;
        //variable borrow index. Expressed in ray
        uint128 variableBorrowIndex;
        //the current supply rate. Expressed in ray
        uint128 currentLiquidityRate;
        //the current variable borrow rate. Expressed in ray
        uint128 currentVariableBorrowRate;
        uint40 lastUpdateTimestamp;
        //tokens addresses
        address aTokenAddress;
        address variableDebtTokenAddress;
        //address of the interest rate strategy
        address interestRateStrategyAddress;
        //the id of the reserve. Represents the position in the list of the active reserves
        uint8 id;
    }

    struct ReserveConfigurationMap {
        //bit 0-15: LTV
        //bit 16-31: Liq. threshold
        //bit 32-47: Liq. bonus
        //bit 48-55: Decimals
        uint256 data;
    }

    struct UserConfigurationMap {
        uint256 data;
    }

    struct UserReputation {
        // Historical score till last calculation
        uint256 lastScore;
        // Percentage of borrowed amount w.r.t. collateral at the start of ongoing loan
        uint256 lastPercentageBorrowed;
        // Latest timestamp at which historical score was updated
        uint256 lastUpdateTimestamp;
    }

    enum UserClass {
        Diamond,
        Gold,
        Silver,
        Bronze
    }
}
