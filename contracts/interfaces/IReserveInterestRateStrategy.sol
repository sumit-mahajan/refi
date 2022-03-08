// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
 * @title IReserveInterestRateStrategyInterface interface
 * @dev Interface for the calculation of the interest rates
 * @author Aave
 */
interface IReserveInterestRateStrategy {
    function getBaseVariableBorrowRate() external view returns (uint256);

    function getMaxVariableBorrowRate() external view returns (uint256);

    function calculateInterestRates(
        address reserve,
        address aToken,
        uint256 liquidityAdded,
        uint256 liquidityTaken,
        uint256 totalVariableDebt
    ) external view returns (uint256 liquidityRate, uint256 variableBorrowRate);
}
