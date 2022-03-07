// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";

import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AaveOracle
/// @author Aave
/// @notice Proxy smart contract to get the price of an asset from a price source, with Chainlink Aggregator
///         smart contracts as primary option
/// - If the returned price by a Chainlink aggregator is <= 0, the call is forwarded to a fallbackOracle
/// - Owned by the Aave governance system, allowed to add sources for assets, replace them
///   and change the fallbackOracle
contract AaveOracle is IPriceOracle, Ownable {
    using SafeERC20 for IERC20;

    event BaseCurrencySet(
        address indexed baseCurrency,
        uint256 baseCurrencyUnit
    );
    event AssetSourceUpdated(address indexed asset, address indexed source);

    mapping(address => AggregatorV3Interface) private assetsSources;
    address public immutable BASE_CURRENCY;
    uint256 public immutable BASE_CURRENCY_UNIT;

    /// @notice Constructor
    /// @param assets The addresses of the assets
    /// @param sources The address of the source of each asset
    /// @param baseCurrency the base currency used for the price quotes. If USD is used, base currency is 0x0
    /// @param baseCurrencyUnit the unit of the base currency
    constructor(
        address[] memory assets,
        address[] memory sources,
        address baseCurrency,
        uint256 baseCurrencyUnit
    ) public {
        _setAssetsSources(assets, sources);
        BASE_CURRENCY = baseCurrency;
        BASE_CURRENCY_UNIT = baseCurrencyUnit;
        emit BaseCurrencySet(baseCurrency, baseCurrencyUnit);
    }

    /// @notice External function called by the Aave governance to set or replace sources of assets
    /// @param assets The addresses of the assets
    /// @param sources The address of the source of each asset
    function setAssetSources(
        address[] calldata assets,
        address[] calldata sources
    ) external onlyOwner {
        _setAssetsSources(assets, sources);
    }

    /// @notice Internal function to set the sources for each asset
    /// @param assets The addresses of the assets
    /// @param sources The address of the source of each asset
    function _setAssetsSources(
        address[] memory assets,
        address[] memory sources
    ) internal {
        require(assets.length == sources.length, "INCONSISTENT_PARAMS_LENGTH");
        for (uint256 i = 0; i < assets.length; i++) {
            assetsSources[assets[i]] = AggregatorV3Interface(sources[i]);
            emit AssetSourceUpdated(assets[i], sources[i]);
        }
    }

    /// @notice Gets an asset price by address
    /// @param asset The asset address
    function getAssetPrice(address asset)
        public
        view
        override
        returns (uint256)
    {
        AggregatorV3Interface source = assetsSources[asset];

        if (asset == BASE_CURRENCY) {
            return BASE_CURRENCY_UNIT;
        } else {
            (, int256 price, , , ) = AggregatorV3Interface(source)
                .latestRoundData();

            return uint256(price);
        }
    }

    /// @notice Gets a list of prices from a list of assets addresses
    /// @param assets The list of assets addresses
    function getAssetsPrices(address[] calldata assets)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory prices = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            prices[i] = getAssetPrice(assets[i]);
        }
        return prices;
    }

    /// @notice Gets the address of the source for an asset address
    /// @param asset The address of the asset
    /// @return address The address of the source
    function getSourceOfAsset(address asset) external view returns (address) {
        return address(assetsSources[asset]);
    }
}
