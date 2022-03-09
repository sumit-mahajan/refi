// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MockAggregatorV3 is AggregatorV3Interface, Ownable {
    uint256 private priceInETH = 2;

    // Change price for testing liquidation
    function setPrice(uint256 _price) external {
        priceInETH = _price;
    }

    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function description() external pure override returns (string memory) {
        return "Sample Description";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            int256(priceInETH),
            block.timestamp,
            block.timestamp,
            uint80(priceInETH)
        );
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            0,
            int256(priceInETH),
            block.timestamp,
            block.timestamp,
            uint80(priceInETH)
        );
    }
}
