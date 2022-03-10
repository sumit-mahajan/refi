//SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {LendingPool} from "./lendingpool/LendingPool.sol";
import {WETHGateway} from "./utils/WETHGateway.sol";
import {PriceOracle} from "./utils/PriceOracle.sol";
import {ReserveInterestRateStrategy} from "./lendingpool/ReserveInterestRateStrategy.sol";
import {AToken} from "./tokenization/AToken.sol";
import {VariableDebtToken} from "./tokenization/VariableDebtToken.sol";

import {MockWETH} from "./mocks/MockWETH.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockAggregatorV3} from "./mocks/MockAggregatorV3.sol";

import {ProtocolDataProvider} from "./data_provider/ProtocolDataProvider.sol";
import {WalletBalanceProvider} from "./data_provider/WalletBalanceProvider.sol";

/**
 * @title AddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol
 * @author Aave
 **/
contract AddressesProvider is Ownable, IAddressesProvider {
    bool public constant isProduction = false;

    address private immutable LENDING_POOL;
    address private immutable WETH_GATEWAY;
    address private immutable PRICE_ORACLE;

    address public immutable protocolDataProvider;
    address public immutable walletBalanceProvider;

    // Rinkeby Addresses
    address public WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address public DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;
    address public LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    address public DAI_TO_ETH = 0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D;
    address public LINK_TO_ETH = 0xFABe80711F3ea886C3AC102c81ffC9825E16162E;

    constructor() {
        // Deploy LendingPool
        LendingPool lendingPool = new LendingPool(this);
        LENDING_POOL = address(lendingPool);

        // Deploy WETHGateway
        address wethGateway = address(new WETHGateway(WETH));
        WETH_GATEWAY = wethGateway;

        if (!isProduction) {
            // Deploy mock tokens and source for tests
            WETH = address(new MockWETH());
            DAI = address(new MockERC20("DAI Token", "DAI", msg.sender));
            LINK = address(new MockERC20("LINK Token", "LINK", msg.sender));

            DAI_TO_ETH = address(new MockAggregatorV3());
            LINK_TO_ETH = DAI_TO_ETH;
        }

        address[] memory assets = new address[](2);
        address[] memory sources = new address[](2);
        (assets, sources) = getAssetsAndPriceSources();

        // Deploy PriceOracle
        address priceOracle = address(
            new PriceOracle(assets, sources, WETH, 1)
        );
        PRICE_ORACLE = priceOracle;

        // Initialize WETH Reserve
        initializeWETHReserve(lendingPool);

        // Initialize DAI Reserve
        initializeDAIReserve(lendingPool);

        // Initialize LINK Reserve
        initializeLINKReserve(lendingPool);

        // Deploy data providers for frontend
        protocolDataProvider = address(new ProtocolDataProvider(this));
        walletBalanceProvider = address(new WalletBalanceProvider());
    }

    function getAssetsAndPriceSources()
        public
        view
        returns (address[] memory, address[] memory)
    {
        address[] memory assets = new address[](2);
        address[] memory sources = new address[](2);
        assets[0] = DAI;
        assets[1] = LINK;
        sources[0] = DAI_TO_ETH;
        sources[1] = LINK_TO_ETH;

        return (assets, sources);
    }

    function initializeWETHReserve(LendingPool lendingPool) private {
        address aToken = address(
            new AToken(lendingPool, WETH, 18, "aWETH Token", "aWETH")
        );

        address variableDebtToken = address(
            new VariableDebtToken(lendingPool, WETH, 18, "dETH Token", "dETH")
        );

        address interestRateStrategy = address(
            new ReserveInterestRateStrategy(this, 65, 0, 8, 100)
        );

        lendingPool.initReserve(
            WETH,
            aToken,
            variableDebtToken,
            interestRateStrategy
        );
    }

    function initializeDAIReserve(LendingPool lendingPool) private {
        address aToken = address(
            new AToken(lendingPool, DAI, 18, "aDAI Token", "aDAI")
        );

        address variableDebtToken = address(
            new VariableDebtToken(lendingPool, DAI, 18, "dDAI Token", "dDAI")
        );

        address interestRateStrategy = address(
            new ReserveInterestRateStrategy(this, 80, 0, 4, 75)
        );

        lendingPool.initReserve(
            DAI,
            aToken,
            variableDebtToken,
            interestRateStrategy
        );
    }

    function initializeLINKReserve(LendingPool lendingPool) private {
        address aToken = address(
            new AToken(lendingPool, LINK, 18, "aLINK Token", "aLINK")
        );

        address variableDebtToken = address(
            new VariableDebtToken(lendingPool, LINK, 18, "dLINK Token", "dLINK")
        );

        address interestRateStrategy = address(
            new ReserveInterestRateStrategy(this, 45, 0, 7, 300)
        );

        lendingPool.initReserve(
            LINK,
            aToken,
            variableDebtToken,
            interestRateStrategy
        );
    }

    /**
     * @dev Returns the address of the deployed LendingPool contract
     * @return The address of the LendingPool contract
     **/
    function getLendingPool() external view override returns (address) {
        return LENDING_POOL;
    }

    /**
     * @dev Returns the address of the deployed WETHGateway contract
     * @return The address of the WETHGateway contract
     **/
    function getWETHGateway() external view override returns (address) {
        return WETH_GATEWAY;
    }

    /**
     * @dev Returns the address of the deployed PriceOracle contract
     * @return The address of the PriceOracle contract
     **/
    function getPriceOracle() external view override returns (address) {
        return PRICE_ORACLE;
    }
}
