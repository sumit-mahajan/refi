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

    struct ClassData {
        // 0 -> Platinum; 1 -> Gold; 2 -> Silver; 3 -> Bronze
        uint256 class;
        // The time it takes for a borrower to pass bottom-up through current class with OPTIMAL_CREDIT_UTILIZATION and no liquidations
        uint256 idealTimeSpan;
        // score range for current class
        uint256 scoreRange;
        // The amount of score that is reduced in case of a liquidation
        uint256 dropFactor;
        // The percent by which ltv and liquidation threshold is adjusted for the users of this class
        uint256 adjustLtvBy;
    }

    enum UserClass {
        Platinum,
        Gold,
        Silver,
        Bronze
    }
}
