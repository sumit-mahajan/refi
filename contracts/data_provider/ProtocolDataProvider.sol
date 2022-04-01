// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {IERC20Detailed} from "../interfaces/base/IERC20Detailed.sol";
import {IAddressesProvider} from "../interfaces/IAddressesProvider.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {IVariableDebtToken} from "../interfaces/IVariableDebtToken.sol";
import {IAToken} from "../interfaces/IAToken.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {UserConfiguration} from "../libraries/configuration/UserConfiguration.sol";
import {DataTypes} from "../libraries/utils/DataTypes.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ProtocolDataProvider {
    using WadRayMath for uint256;
    using SafeMath for uint256;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using UserConfiguration for DataTypes.UserConfigurationMap;

    address constant MKR = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2;
    address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    struct TokenData {
        string symbol;
        address tokenAddress;
    }

    struct UserReserveData {
        address underlyingAsset;
        string symbol;
        uint256 scaledATokenBalance;
        uint256 currentATokenBalance;
        uint256 scaledVariableDebt;
        uint256 currentVariableDebt;
    }

    IAddressesProvider public immutable ADDRESSES_PROVIDER;

    constructor(IAddressesProvider addressesProvider) {
        ADDRESSES_PROVIDER = addressesProvider;
    }

    function getAllReservesTokens() external view returns (TokenData[] memory) {
        ILendingPool pool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
        address[] memory reserves = pool.getReservesList();
        TokenData[] memory reservesTokens = new TokenData[](reserves.length);
        for (uint256 i = 0; i < reserves.length; i++) {
            reservesTokens[i] = TokenData({
                symbol: IERC20Detailed(reserves[i]).symbol(),
                tokenAddress: reserves[i]
            });
        }
        return reservesTokens;
    }

    function getAllATokens() external view returns (TokenData[] memory) {
        ILendingPool pool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
        address[] memory reserves = pool.getReservesList();
        TokenData[] memory aTokens = new TokenData[](reserves.length);
        for (uint256 i = 0; i < reserves.length; i++) {
            DataTypes.ReserveData memory reserveData = pool.getReserveData(
                reserves[i]
            );
            aTokens[i] = TokenData({
                symbol: IERC20Detailed(reserveData.aTokenAddress).symbol(),
                tokenAddress: reserveData.aTokenAddress
            });
        }
        return aTokens;
    }

    function getReserveConfigurationData(address asset)
        external
        view
        returns (
            uint256 decimals,
            uint256 ltv,
            uint256 liquidationThreshold,
            uint256 liquidationBonus
        )
    {
        DataTypes.ReserveConfigurationMap memory configuration = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getConfiguration(asset);

        (ltv, liquidationThreshold, liquidationBonus, decimals) = configuration
            .getParamsMemory();
    }

    function getUserReserveLtvAndLt(address user, address asset)
        external
        view
        returns (uint256 ltv, uint256 liquidationThreshold)
    {
        DataTypes.ReserveConfigurationMap memory configuration = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getConfiguration(asset);

        (ltv, liquidationThreshold, , ) = configuration.getParamsMemory();

        (ltv, liquidationThreshold) = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getUserLtvAndLt(user, ltv, liquidationThreshold);
    }

    function getReserveData(address asset)
        external
        view
        returns (
            uint256 availableLiquidity,
            uint256 totalVariableDebt,
            uint256 liquidityRate,
            uint256 variableBorrowRate,
            uint256 liquidityIndex,
            uint256 variableBorrowIndex,
            uint256 utilizationRate,
            uint40 lastUpdateTimestamp
        )
    {
        DataTypes.ReserveData memory reserve = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getReserveData(asset);

        uint256 _totalVariableDebt = IERC20Detailed(
            reserve.variableDebtTokenAddress
        ).totalSupply();
        uint256 _availableLiquidity = IERC20Detailed(asset).balanceOf(
            reserve.aTokenAddress
        );

        utilizationRate = _totalVariableDebt == 0
            ? 0
            : _totalVariableDebt.rayDiv(
                _availableLiquidity.add(_totalVariableDebt)
            );

        return (
            _availableLiquidity,
            _totalVariableDebt,
            reserve.currentLiquidityRate,
            reserve.currentVariableBorrowRate,
            reserve.liquidityIndex,
            reserve.variableBorrowIndex,
            utilizationRate,
            reserve.lastUpdateTimestamp
        );
    }

    function getUserReserveData(address asset, address user)
        external
        view
        returns (
            uint256 currentATokenBalance,
            uint256 currentVariableDebt,
            uint256 scaledVariableDebt,
            uint256 liquidityRate,
            uint256 healthFactor,
            uint256 availableToBorrow,
            bool usageAsCollateralEnabled,
            bool isBorrowed
        )
    {
        DataTypes.ReserveData memory reserve = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getReserveData(asset);

        DataTypes.UserConfigurationMap memory userConfig = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getUserConfiguration(user);

        currentATokenBalance = IERC20Detailed(reserve.aTokenAddress).balanceOf(
            user
        );
        currentVariableDebt = IERC20Detailed(reserve.variableDebtTokenAddress)
            .balanceOf(user);
        scaledVariableDebt = IVariableDebtToken(
            reserve.variableDebtTokenAddress
        ).scaledBalanceOf(user);
        liquidityRate = reserve.currentLiquidityRate;

        // health Factor and availbletoborrow calculation
        // First I need to create reservesData object
        uint256 availableBorrowsETH;
        (, , availableBorrowsETH, , , healthFactor) = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getUserAccountData(user);

        availableToBorrow = availableBorrowsETH
            .mul(10**reserve.configuration.getDecimalsMemory())
            .div(
                IPriceOracle(ADDRESSES_PROVIDER.getPriceOracle()).getAssetPrice(
                    asset
                )
            );

        usageAsCollateralEnabled = userConfig.isUsingAsCollateral(reserve.id);
        isBorrowed = userConfig.isBorrowing(reserve.id);
    }

    function getUserReservesData(address user)
        external
        view
        returns (UserReserveData[] memory)
    {
        ILendingPool pool = ILendingPool(ADDRESSES_PROVIDER.getLendingPool());
        address[] memory reserves = pool.getReservesList();
        DataTypes.UserConfigurationMap memory userConfig = pool
            .getUserConfiguration(user);

        UserReserveData[] memory userReservesData = new UserReserveData[](
            user != address(0) ? reserves.length : 0
        );

        for (uint256 i = 0; i < reserves.length; i++) {
            DataTypes.ReserveData memory reserve = pool.getReserveData(
                reserves[i]
            );

            // user reserve data
            userReservesData[i].underlyingAsset = reserves[i];
            userReservesData[i].symbol = IERC20Detailed(reserves[i]).symbol();
            userReservesData[i].scaledATokenBalance = IAToken(
                reserve.aTokenAddress
            ).scaledBalanceOf(user);
            userReservesData[i].currentATokenBalance = IERC20Detailed(
                reserve.aTokenAddress
            ).balanceOf(user);

            if (userConfig.isBorrowing(i)) {
                userReservesData[i].scaledVariableDebt = IVariableDebtToken(
                    reserve.variableDebtTokenAddress
                ).scaledBalanceOf(user);
                userReservesData[i].currentVariableDebt = IERC20Detailed(
                    reserve.variableDebtTokenAddress
                ).balanceOf(user);
            }
        }

        return (userReservesData);
    }

    function getReserveTokensAddresses(address asset)
        external
        view
        returns (address aTokenAddress, address variableDebtTokenAddress)
    {
        DataTypes.ReserveData memory reserve = ILendingPool(
            ADDRESSES_PROVIDER.getLendingPool()
        ).getReserveData(asset);

        return (reserve.aTokenAddress, reserve.variableDebtTokenAddress);
    }
}
