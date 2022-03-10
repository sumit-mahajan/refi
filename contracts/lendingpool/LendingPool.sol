// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;
// pragma experimental ABIEncoderV2;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {IAddressesProvider} from "../interfaces/IAddressesProvider.sol";
import {IAToken} from "../interfaces/IAToken.sol";
import {IVariableDebtToken} from "../interfaces/IVariableDebtToken.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";

import {Errors} from "../libraries/utils/Errors.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";
import {ReserveLogic} from "../libraries/logic/ReserveLogic.sol";
import {GenericLogic} from "../libraries/logic/GenericLogic.sol";
import {ValidationLogic} from "../libraries/logic/ValidationLogic.sol";
import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {UserConfiguration} from "../libraries/configuration/UserConfiguration.sol";
import {DataTypes} from "../libraries/utils/DataTypes.sol";

import {LendingPoolStorage} from "./LendingPoolStorage.sol";

/**
 * @title LendingPool contract
 * @dev Main point of interaction with an Aave protocol's market
 * - Users can:
 *   # Deposit
 *   # Withdraw
 *   # Borrow
 *   # Repay
 *   # Swap their loans between variable and stable rate
 *   # Enable/disable their deposits as collateral rebalance stable rate borrow positions
 *   # Liquidate positions
 *   # Execute Flash Loans
 * - To be covered by a proxy contract, owned by the LendingPoolAddressesProvider of the specific market
 * - All admin functions are callable by the LendingPoolConfigurator contract defined also in the
 *   LendingPoolAddressesProvider
 * @author Aave
 **/
contract LendingPool is ILendingPool, LendingPoolStorage {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using SafeERC20 for IERC20;
    using ReserveLogic for DataTypes.ReserveData;
    using UserConfiguration for DataTypes.UserConfigurationMap;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

    uint256 internal constant LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000;

    /**
     * @dev Function is invoked by the proxy contract when the LendingPool contract is added to the
     * LendingPoolAddressesProvider of the market.
     * - Caching the address of the LendingPoolAddressesProvider in order to reduce gas consumption
     *   on subsequent operations
     * @param provider The address of the LendingPoolAddressesProvider
     **/
    // function initialize(IAddressesProvider provider) public {
    //   _addressesProvider = provider;
    //   _maxNumberOfReserves = 128;
    // }
    constructor(IAddressesProvider provider) {
        _addressesProvider = provider;
        _maxNumberOfReserves = 128;
    }

    /**
     * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
     * - E.g. User deposits 100 USDC and gets in return 100 aUSDC
     * @param asset The address of the underlying asset to deposit
     * @param amount The amount to be deposited
     * @param onBehalfOf The address that will receive the aTokens, same as msg.sender if the user
     *   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
     *   is a different wallet
     **/
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf
    ) external override {
        DataTypes.ReserveData storage reserve = _reserves[asset];

        ValidationLogic.validateDeposit(asset, amount, _reserves);

        address aToken = reserve.aTokenAddress;

        reserve.updateState();
        reserve.updateInterestRates(asset, aToken, amount, 0);

        IERC20(asset).safeTransferFrom(msg.sender, aToken, amount);

        bool isFirstDeposit = IAToken(aToken).mint(
            onBehalfOf,
            amount,
            reserve.liquidityIndex
        );

        if (isFirstDeposit) {
            _usersConfig[onBehalfOf].setUsingAsCollateral(reserve.id, true);
            emit ReserveUsedAsCollateralEnabled(asset, onBehalfOf);
        }

        emit Deposit(asset, msg.sender, onBehalfOf, amount);
    }

    /**
     * @dev Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
     * E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     *   - Send the value type(uint256).max in order to withdraw the whole aToken balance
     * @param to Address that will receive the underlying, same as msg.sender if the user
     *   wants to receive it on his own wallet, or a different address if the beneficiary is a
     *   different wallet
     * @return The final amount withdrawn
     **/
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        DataTypes.ReserveData storage reserve = _reserves[asset];

        address aToken = reserve.aTokenAddress;

        uint256 userBalance = IAToken(aToken).balanceOf(msg.sender);

        uint256 amountToWithdraw = amount;

        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }

        ValidationLogic.validateWithdraw(
            asset,
            amountToWithdraw,
            userBalance,
            _reserves,
            _usersConfig[msg.sender],
            _reservesList,
            _reservesCount,
            _addressesProvider.getPriceOracle()
        );

        reserve.updateState();

        reserve.updateInterestRates(asset, aToken, 0, amountToWithdraw);

        if (amountToWithdraw == userBalance) {
            _usersConfig[msg.sender].setUsingAsCollateral(reserve.id, false);
            emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
        }

        IAToken(aToken).burn(
            msg.sender,
            to,
            amountToWithdraw,
            reserve.liquidityIndex
        );

        emit Withdraw(asset, msg.sender, to, amountToWithdraw);

        return amountToWithdraw;
    }

    /**
     * @dev Allows users to borrow a specific `amount` of the reserve underlying asset, provided that the borrower
     * already deposited enough collateral, or he was given enough allowance by a credit delegator on the
     * corresponding debt token (StableDebtToken or VariableDebtToken)
     * - E.g. User borrows 100 USDC passing as `onBehalfOf` his own address, receiving the 100 USDC in his wallet
     *   and 100 stable/variable debt tokens, depending on the `interestRateMode`
     * @param asset The address of the underlying asset to borrow
     * @param amount The amount to be borrowed
     * @param onBehalfOf Address of the user who will receive the debt. Should be the address of the borrower itself
     * calling the function if he wants to borrow against his own collateral, or the address of the credit delegator
     * if he has been given credit delegation allowance
     **/
    function borrow(
        address asset,
        uint256 amount,
        address onBehalfOf
    ) external override {
        require(
            _reserves[asset].aTokenAddress != address(0),
            Errors.VL_INVALID_ASSET
        );
        DataTypes.ReserveData storage reserve = _reserves[asset];
        DataTypes.UserConfigurationMap storage userConfig = _usersConfig[
            onBehalfOf
        ];

        address aTokenAddress = reserve.aTokenAddress;
        address user = msg.sender;

        address oracle = _addressesProvider.getPriceOracle();

        uint256 amountInETH = IPriceOracle(oracle)
            .getAssetPrice(asset)
            .mul(amount)
            .div(10**reserve.configuration.getDecimals());

        ValidationLogic.validateBorrow(
            onBehalfOf,
            amount,
            amountInETH,
            _reserves,
            userConfig,
            _reservesList,
            _reservesCount,
            oracle
        );

        reserve.updateState();

        bool isFirstBorrowing = false;

        isFirstBorrowing = IVariableDebtToken(reserve.variableDebtTokenAddress)
            .mint(user, onBehalfOf, amount, reserve.variableBorrowIndex);

        if (isFirstBorrowing) {
            userConfig.setBorrowing(reserve.id, true);
        }

        reserve.updateInterestRates(asset, aTokenAddress, 0, amount);

        IAToken(aTokenAddress).transferUnderlyingTo(user, amount);

        emit Borrow(
            asset,
            user,
            onBehalfOf,
            amount,
            reserve.currentVariableBorrowRate
        );
    }

    /**
     * @notice Repays a borrowed `amount` on a specific reserve, burning the equivalent debt tokens owned
     * - E.g. User repays 100 USDC, burning 100 variable/stable debt tokens of the `onBehalfOf` address
     * @param asset The address of the borrowed underlying asset previously borrowed
     * @param amount The amount to repay
     * - Send the value type(uint256).max in order to repay the whole debt for `asset` on the specific `debtMode`
     * @param onBehalfOf Address of the user who will get his debt reduced/removed. Should be the address of the
     * user calling the function if he wants to reduce/remove his own debt, or the address of any other
     * other borrower whose debt should be removed
     * @return The final amount repaid
     **/
    function repay(
        address asset,
        uint256 amount,
        address onBehalfOf
    ) external override returns (uint256) {
        DataTypes.ReserveData storage reserve = _reserves[asset];

        uint256 variableDebt = IERC20(reserve.variableDebtTokenAddress)
            .balanceOf(onBehalfOf);

        ValidationLogic.validateRepay(amount, onBehalfOf, variableDebt);

        uint256 paybackAmount = variableDebt;

        if (amount < paybackAmount) {
            paybackAmount = amount;
        }

        reserve.updateState();

        IVariableDebtToken(reserve.variableDebtTokenAddress).burn(
            onBehalfOf,
            paybackAmount,
            reserve.variableBorrowIndex
        );

        address aToken = reserve.aTokenAddress;
        reserve.updateInterestRates(asset, aToken, paybackAmount, 0);

        if (variableDebt.sub(paybackAmount) == 0) {
            _usersConfig[onBehalfOf].setBorrowing(reserve.id, false);
        }

        IERC20(asset).safeTransferFrom(msg.sender, aToken, paybackAmount);

        IAToken(aToken).handleRepayment(msg.sender, paybackAmount);

        emit Repay(asset, onBehalfOf, msg.sender, paybackAmount);

        return paybackAmount;
    }

    /**
     * @dev Allows depositors to enable/disable a specific deposited asset as collateral
     * @param asset The address of the underlying asset deposited
     * @param useAsCollateral `true` if the user wants to use the deposit as collateral, `false` otherwise
     **/
    function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)
        external
        override
    {
        DataTypes.ReserveData storage reserve = _reserves[asset];

        ValidationLogic.validateSetUseReserveAsCollateral(
            reserve,
            asset,
            useAsCollateral,
            _reserves,
            _usersConfig[msg.sender],
            _reservesList,
            _reservesCount,
            _addressesProvider.getPriceOracle()
        );

        _usersConfig[msg.sender].setUsingAsCollateral(
            reserve.id,
            useAsCollateral
        );

        if (useAsCollateral) {
            emit ReserveUsedAsCollateralEnabled(asset, msg.sender);
        } else {
            emit ReserveUsedAsCollateralDisabled(asset, msg.sender);
        }
    }

    struct LiquidationCallLocalVars {
        uint256 userCollateralBalance;
        uint256 userVariableDebt;
        uint256 maxLiquidatableDebt;
        uint256 actualDebtToLiquidate;
        uint256 liquidationRatio;
        uint256 maxAmountCollateralToLiquidate;
        uint256 maxCollateralToLiquidate;
        uint256 debtAmountNeeded;
        uint256 healthFactor;
        uint256 liquidatorPreviousATokenBalance;
        IAToken collateralAtoken;
        bool isCollateralEnabled;
    }

    /**
     * @dev Function to liquidate a non-healthy position collateral-wise, with Health Factor below 1
     * - The caller (liquidator) covers `debtToCover` amount of debt of the user getting liquidated, and receives
     *   a proportionally amount of the `collateralAsset` plus a bonus to cover market risk
     * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
     * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
     * @param user The address of the borrower getting liquidated
     * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
     * @param receiveAToken `true` if the liquidators wants to receive the collateral aTokens, `false` if he wants
     * to receive the underlying collateral asset directly
     **/
    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover,
        bool receiveAToken
    ) external override {
        DataTypes.ReserveData storage collateralReserve = _reserves[
            collateralAsset
        ];
        DataTypes.ReserveData storage debtReserve = _reserves[debtAsset];
        DataTypes.UserConfigurationMap storage userConfig = _usersConfig[user];

        LiquidationCallLocalVars memory vars;

        (, , , , vars.healthFactor) = GenericLogic.calculateUserAccountData(
            user,
            _reserves,
            userConfig,
            _reservesList,
            _reservesCount,
            _addressesProvider.getPriceOracle()
        );

        vars.userVariableDebt = IERC20(debtReserve.variableDebtTokenAddress)
            .balanceOf(user);

        ValidationLogic.validateLiquidationCall(
            collateralReserve,
            userConfig,
            vars.healthFactor,
            vars.userVariableDebt
        );

        vars.collateralAtoken = IAToken(collateralReserve.aTokenAddress);

        vars.userCollateralBalance = vars.collateralAtoken.balanceOf(user);

        vars.maxLiquidatableDebt = vars.userVariableDebt.percentMul(
            LIQUIDATION_CLOSE_FACTOR_PERCENT
        );

        vars.actualDebtToLiquidate = debtToCover > vars.maxLiquidatableDebt
            ? vars.maxLiquidatableDebt
            : debtToCover;

        (
            vars.maxCollateralToLiquidate,
            vars.debtAmountNeeded
        ) = _calculateAvailableCollateralToLiquidate(
            collateralReserve,
            debtReserve,
            collateralAsset,
            debtAsset,
            vars.actualDebtToLiquidate,
            vars.userCollateralBalance
        );

        // If debtAmountNeeded < actualDebtToLiquidate, there isn't enough
        // collateral to cover the actual amount that is being liquidated, hence we liquidate
        // a smaller amount

        if (vars.debtAmountNeeded < vars.actualDebtToLiquidate) {
            vars.actualDebtToLiquidate = vars.debtAmountNeeded;
        }

        // If the liquidator reclaims the underlying asset, we make sure there is enough available liquidity in the
        // collateral reserve
        if (!receiveAToken) {
            uint256 currentAvailableCollateral = IERC20(collateralAsset)
                .balanceOf(address(vars.collateralAtoken));
            require(
                currentAvailableCollateral >= vars.maxCollateralToLiquidate,
                Errors.LP_NOT_ENOUGH_LIQUIDITY_TO_LIQUIDATE
            );
        }

        debtReserve.updateState();

        if (vars.userVariableDebt >= vars.actualDebtToLiquidate) {
            IVariableDebtToken(debtReserve.variableDebtTokenAddress).burn(
                user,
                vars.actualDebtToLiquidate,
                debtReserve.variableBorrowIndex
            );
        } else {
            // If the user doesn't have variable debt, no need to try to burn variable debt tokens
            if (vars.userVariableDebt > 0) {
                IVariableDebtToken(debtReserve.variableDebtTokenAddress).burn(
                    user,
                    vars.userVariableDebt,
                    debtReserve.variableBorrowIndex
                );
            }
        }

        debtReserve.updateInterestRates(
            debtAsset,
            debtReserve.aTokenAddress,
            vars.actualDebtToLiquidate,
            0
        );

        if (receiveAToken) {
            vars.liquidatorPreviousATokenBalance = IERC20(vars.collateralAtoken)
                .balanceOf(msg.sender);
            vars.collateralAtoken.transferOnLiquidation(
                user,
                msg.sender,
                vars.maxCollateralToLiquidate
            );

            if (vars.liquidatorPreviousATokenBalance == 0) {
                DataTypes.UserConfigurationMap
                    storage liquidatorConfig = _usersConfig[msg.sender];
                liquidatorConfig.setUsingAsCollateral(
                    collateralReserve.id,
                    true
                );
                emit ReserveUsedAsCollateralEnabled(
                    collateralAsset,
                    msg.sender
                );
            }
        } else {
            collateralReserve.updateState();
            collateralReserve.updateInterestRates(
                collateralAsset,
                address(vars.collateralAtoken),
                0,
                vars.maxCollateralToLiquidate
            );

            // Burn the equivalent amount of aToken, sending the underlying to the liquidator
            vars.collateralAtoken.burn(
                user,
                msg.sender,
                vars.maxCollateralToLiquidate,
                collateralReserve.liquidityIndex
            );
        }

        // If the collateral being liquidated is equal to the user balance,
        // we set the currency as not being used as collateral anymore
        if (vars.maxCollateralToLiquidate == vars.userCollateralBalance) {
            userConfig.setUsingAsCollateral(collateralReserve.id, false);
            emit ReserveUsedAsCollateralDisabled(collateralAsset, user);
        }

        // Transfers the debt asset being repaid to the aToken, where the liquidity is kept
        IERC20(debtAsset).safeTransferFrom(
            msg.sender,
            debtReserve.aTokenAddress,
            vars.actualDebtToLiquidate
        );

        emit LiquidationCall(
            collateralAsset,
            debtAsset,
            user,
            vars.actualDebtToLiquidate,
            vars.maxCollateralToLiquidate,
            msg.sender,
            receiveAToken
        );
    }

    struct AvailableCollateralToLiquidateLocalVars {
        uint256 userCompoundedBorrowBalance;
        uint256 liquidationBonus;
        uint256 collateralPrice;
        uint256 debtAssetPrice;
        uint256 maxAmountCollateralToLiquidate;
        uint256 debtAssetDecimals;
        uint256 collateralDecimals;
    }

    /**
     * @dev Calculates how much of a specific collateral can be liquidated, given
     * a certain amount of debt asset.
     * - This function needs to be called after all the checks to validate the liquidation have been performed,
     *   otherwise it might fail.
     * @param collateralReserve The data of the collateral reserve
     * @param debtReserve The data of the debt reserve
     * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
     * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
     * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
     * @param userCollateralBalance The collateral balance for the specific `collateralAsset` of the user being liquidated
     * @return collateralAmount: The maximum amount that is possible to liquidate given all the liquidation constraints
     *                           (user balance, close factor)
     *         debtAmountNeeded: The amount to repay with the liquidation
     **/
    function _calculateAvailableCollateralToLiquidate(
        DataTypes.ReserveData storage collateralReserve,
        DataTypes.ReserveData storage debtReserve,
        address collateralAsset,
        address debtAsset,
        uint256 debtToCover,
        uint256 userCollateralBalance
    ) internal view returns (uint256, uint256) {
        uint256 collateralAmount = 0;
        uint256 debtAmountNeeded = 0;
        IPriceOracle oracle = IPriceOracle(_addressesProvider.getPriceOracle());

        AvailableCollateralToLiquidateLocalVars memory vars;

        vars.collateralPrice = oracle.getAssetPrice(collateralAsset);
        vars.debtAssetPrice = oracle.getAssetPrice(debtAsset);

        (, , vars.liquidationBonus, vars.collateralDecimals) = collateralReserve
            .configuration
            .getParams();
        vars.debtAssetDecimals = debtReserve.configuration.getDecimals();

        // This is the maximum possible amount of the selected collateral that can be liquidated, given the
        // max amount of liquidatable debt
        vars.maxAmountCollateralToLiquidate = vars
            .debtAssetPrice
            .mul(debtToCover)
            .mul(10**vars.collateralDecimals)
            .percentMul(vars.liquidationBonus)
            .div(vars.collateralPrice.mul(10**vars.debtAssetDecimals));

        if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
            collateralAmount = userCollateralBalance;
            debtAmountNeeded = vars
                .collateralPrice
                .mul(collateralAmount)
                .mul(10**vars.debtAssetDecimals)
                .div(vars.debtAssetPrice.mul(10**vars.collateralDecimals))
                .percentDiv(vars.liquidationBonus);
        } else {
            collateralAmount = vars.maxAmountCollateralToLiquidate;
            debtAmountNeeded = debtToCover;
        }
        return (collateralAmount, debtAmountNeeded);
    }

    /**
     * @dev Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset of the reserve
     * @return The state of the reserve
     **/
    function getReserveData(address asset)
        external
        view
        override
        returns (DataTypes.ReserveData memory)
    {
        return _reserves[asset];
    }

    /**
     * @dev Returns the user account data across all the reserves
     * @param user The address of the user
     * @return totalCollateralETH the total collateral in ETH of the user
     * @return totalDebtETH the total debt in ETH of the user
     * @return availableBorrowsETH the borrowing power left of the user
     * @return currentLiquidationThreshold the liquidation threshold of the user
     * @return ltv the loan to value of the user
     * @return healthFactor the current health factor of the user
     **/
    function getUserAccountData(address user)
        external
        view
        override
        returns (
            uint256 totalCollateralETH,
            uint256 totalDebtETH,
            uint256 availableBorrowsETH,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        (
            totalCollateralETH,
            totalDebtETH,
            ltv,
            currentLiquidationThreshold,
            healthFactor
        ) = GenericLogic.calculateUserAccountData(
            user,
            _reserves,
            _usersConfig[user],
            _reservesList,
            _reservesCount,
            _addressesProvider.getPriceOracle()
        );

        availableBorrowsETH = GenericLogic.calculateAvailableBorrowsETH(
            totalCollateralETH,
            totalDebtETH,
            ltv
        );
    }

    /**
     * @dev Returns the configuration of the reserve
     * @param asset The address of the underlying asset of the reserve
     * @return The configuration of the reserve
     **/
    function getConfiguration(address asset)
        external
        view
        override
        returns (DataTypes.ReserveConfigurationMap memory)
    {
        return _reserves[asset].configuration;
    }

    /**
     * @dev Returns the configuration of the user across all the reserves
     * @param user The user address
     * @return The configuration of the user
     **/
    function getUserConfiguration(address user)
        external
        view
        override
        returns (DataTypes.UserConfigurationMap memory)
    {
        return _usersConfig[user];
    }

    /**
     * @dev Returns the normalized income per unit of asset
     * @param asset The address of the underlying asset of the reserve
     * @return The reserve's normalized income
     */
    function getReserveNormalizedIncome(address asset)
        external
        view
        virtual
        override
        returns (uint256)
    {
        return _reserves[asset].getNormalizedIncome();
    }

    /**
     * @dev Returns the normalized variable debt per unit of asset
     * @param asset The address of the underlying asset of the reserve
     * @return The reserve normalized variable debt
     */
    function getReserveNormalizedVariableDebt(address asset)
        external
        view
        override
        returns (uint256)
    {
        return _reserves[asset].getNormalizedDebt();
    }

    /**
     * @dev Returns the list of the initialized reserves
     **/
    function getReservesList()
        external
        view
        override
        returns (address[] memory)
    {
        address[] memory _activeReserves = new address[](_reservesCount);

        for (uint256 i = 0; i < _reservesCount; i++) {
            _activeReserves[i] = _reservesList[i];
        }
        return _activeReserves;
    }

    /**
     * @dev Returns the cached LendingPoolAddressesProvider connected to this contract
     **/
    function getAddressesProvider()
        external
        view
        override
        returns (IAddressesProvider)
    {
        return _addressesProvider;
    }

    /**
     * @dev Returns the maximum number of reserves supported to be listed in this LendingPool
     */
    function MAX_NUMBER_RESERVES() public view returns (uint256) {
        return _maxNumberOfReserves;
    }

    /**
     * @dev Validates and finalizes an aToken transfer
     * - Only callable by the overlying aToken of the `asset`
     * @param asset The address of the underlying asset of the aToken
     * @param from The user from which the aTokens are transferred
     * @param to The user receiving the aTokens
     * @param amount The amount being transferred/withdrawn
     * @param balanceFromBefore The aToken balance of the `from` user before the transfer
     * @param balanceToBefore The aToken balance of the `to` user before the transfer
     */
    function finalizeTransfer(
        address asset,
        address from,
        address to,
        uint256 amount,
        uint256 balanceFromBefore,
        uint256 balanceToBefore
    ) external override {
        require(
            msg.sender == _reserves[asset].aTokenAddress,
            Errors.LP_CALLER_MUST_BE_AN_ATOKEN
        );

        ValidationLogic.validateTransfer(
            from,
            _reserves,
            _usersConfig[from],
            _reservesList,
            _reservesCount,
            _addressesProvider.getPriceOracle()
        );

        uint256 reserveId = _reserves[asset].id;

        if (from != to) {
            if (balanceFromBefore.sub(amount) == 0) {
                DataTypes.UserConfigurationMap
                    storage fromConfig = _usersConfig[from];
                fromConfig.setUsingAsCollateral(reserveId, false);
                emit ReserveUsedAsCollateralDisabled(asset, from);
            }

            if (balanceToBefore == 0 && amount != 0) {
                DataTypes.UserConfigurationMap storage toConfig = _usersConfig[
                    to
                ];
                toConfig.setUsingAsCollateral(reserveId, true);
                emit ReserveUsedAsCollateralEnabled(asset, to);
            }
        }
    }

    /**
     * @dev Initializes a reserve, activating it, assigning an aToken and debt tokens and an
     * interest rate strategy
     * - Only callable by the LendingPoolConfigurator contract
     * @param asset The address of the underlying asset of the reserve
     * @param aTokenAddress The address of the aToken that will be assigned to the reserve
     * @param aTokenAddress The address of the VariableDebtToken that will be assigned to the reserve
     * @param interestRateStrategyAddress The address of the interest rate strategy contract
     **/
    //  Make callable by owner only
    function initReserve(
        address asset,
        address aTokenAddress,
        address variableDebtAddress,
        address interestRateStrategyAddress,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint8 decimals
    ) external override {
        require(Address.isContract(asset), Errors.LP_NOT_CONTRACT);
        require(
            msg.sender == address(_addressesProvider),
            Errors.LP_NOT_ADDRESSESPROVIDER
        );

        _reserves[asset].init(
            aTokenAddress,
            variableDebtAddress,
            interestRateStrategyAddress,
            ltv,
            liquidationThreshold,
            liquidationBonus,
            decimals
        );
        _addReserveToList(asset);
    }

    /**
     * @dev Updates the address of the interest rate strategy contract
     * - Only callable by the LendingPoolConfigurator contract
     * @param asset The address of the underlying asset of the reserve
     * @param rateStrategyAddress The address of the interest rate strategy contract
     **/
    function setReserveInterestRateStrategyAddress(
        address asset,
        address rateStrategyAddress /** onlyOwner */
    ) external override {
        _reserves[asset].interestRateStrategyAddress = rateStrategyAddress;
    }

    /**
     * @dev Sets the configuration bitmap of the reserve as a whole
     * - Only callable by the LendingPoolConfigurator contract
     * @param asset The address of the underlying asset of the reserve
     * @param configuration The new configuration bitmap
     **/
    function setConfiguration(address asset, uint256 configuration)
        external
        override
    /** onlyOwner */
    {
        _reserves[asset].configuration.data = configuration;
    }

    function _addReserveToList(address asset) internal {
        uint256 reservesCount = _reservesCount;

        require(
            reservesCount < _maxNumberOfReserves,
            Errors.LP_NO_MORE_RESERVES_ALLOWED
        );

        bool reserveAlreadyAdded = _reserves[asset].id != 0 ||
            _reservesList[0] == asset;

        if (!reserveAlreadyAdded) {
            _reserves[asset].id = uint8(reservesCount);
            _reservesList[reservesCount] = asset;

            _reservesCount = reservesCount + 1;
        }
    }
}
