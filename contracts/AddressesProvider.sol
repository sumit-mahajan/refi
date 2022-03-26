//SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {IAddressesProvider} from "./interfaces/IAddressesProvider.sol";
import {LendingPool} from "./lendingpool/LendingPool.sol";
import {WETHGateway} from "./utils/WETHGateway.sol";
import {PriceOracle} from "./utils/PriceOracle.sol";
import {ReserveInterestRateStrategy} from "./lendingpool/ReserveInterestRateStrategy.sol";
import {AToken} from "./tokenization/AToken.sol";
import {VariableDebtToken} from "./tokenization/VariableDebtToken.sol";
import {RefiCollection} from "./tokenization/RefiCollection.sol";
import {WadRayMath} from "./libraries/math/WadRayMath.sol";

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
contract AddressesProvider is IAddressesProvider {
    bool public constant isProduction = false;

    address private immutable LENDING_POOL;
    address private immutable WETH_GATEWAY;
    address private immutable PRICE_ORACLE;
    address private immutable REFI_COLLECTION;

    address public immutable protocolDataProvider;
    address public immutable walletBalanceProvider;

    // Rinkeby Addresses
    address public override WETH = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    address public DAI = 0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa;
    address public LINK = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    address public DAI_TO_ETH = 0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D;
    address public LINK_TO_ETH = 0xFABe80711F3ea886C3AC102c81ffC9825E16162E;

    address public ETH_TO_USD = 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e;
    address public DAI_TO_USD = 0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF;
    address public LINK_TO_USD = 0xd8bD0a1cB028a31AA859A21A3758685a95dE4623;

    // // Mumbai Addresses
    // address public override WETH = 0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889; // WMATIC
    // address public DAI = 0xcB1e72786A6eb3b44C2a2429e317c8a2462CFeb1;
    // address public LINK = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    // TODO : handle DAI_TO_ETH and LINK_TO_USD for mumbai chain
    // address public DAI_TO_ETH = 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada; // ** MATIC_TO_USD
    // address public LINK_TO_ETH = 0x12162c3E810393dEC01362aBf156D7ecf6159528; // LINK_TO_MATIC

    // address public ETH_TO_USD = 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada; // MATIC_TO_USD
    // address public DAI_TO_USD = 0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046;
    // address public LINK_TO_USD = 0x12162c3E810393dEC01362aBf156D7ecf6159528; // ** LINK_TO_MATIC

    constructor() {
        // Deploy LendingPool
        LendingPool lendingPool = new LendingPool(this);
        LENDING_POOL = address(lendingPool);

        RefiCollection refiCollection = new RefiCollection(
            address(lendingPool)
        );
        REFI_COLLECTION = address(refiCollection);

        if (!isProduction) {
            // Deploy mock tokens and sources for tests
            WETH = address(new MockWETH());
            DAI = address(new MockERC20("DAI Token", "DAI"));
            LINK = address(new MockERC20("LINK Token", "LINK"));

            // DAI_TO_ETH = address(new MockAggregatorV3(0.5 ether)); // 1 DAI = 0.5 ether
            // LINK_TO_ETH = address(new MockAggregatorV3(0.5 ether));
            // ETH_TO_USD = address(new MockAggregatorV3(300000000000)); // 3000 USD + 8 decimals
            // DAI_TO_USD = address(new MockAggregatorV3(99000000)); // 0.99 USD
            // LINK_TO_USD = address(new MockAggregatorV3(2000000000)); // 20 USD

            DAI_TO_ETH = address(new MockAggregatorV3(0.5 ether)); // 1 DAI = 0.5 ether
            LINK_TO_ETH = address(new MockAggregatorV3(0.5 ether));
        
            ETH_TO_USD = address(new MockAggregatorV3(3000000000)); // 30 USD + 8 decimals
            DAI_TO_USD = address(new MockAggregatorV3(1500000000)); // 15 USD
            LINK_TO_USD = address(new MockAggregatorV3(1500000000)); // 15 USD
        }

        // Deploy WETHGateway
        address wethGateway = address(
            new WETHGateway(WETH, address(lendingPool))
        );
        WETH_GATEWAY = wethGateway;

        address[] memory assets = new address[](2);
        address[] memory sources = new address[](2);
        (assets, sources) = getAssetsAndETHPriceSources();

        // Deploy PriceOracle
        address priceOracle = address(
            new PriceOracle(assets, sources, WETH, 1 ether)
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

        bytes32[] memory _assets = new bytes32[](3);
        address[] memory _sources = new address[](3);
        (_assets, _sources) = getAssetsAndUSDPriceSources();
        walletBalanceProvider = address(
            new WalletBalanceProvider(_assets, _sources)
        );
    }

    function getAssetsAndETHPriceSources()
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

    function getAssetsAndUSDPriceSources()
        public
        view
        returns (bytes32[] memory, address[] memory)
    {
        bytes32[] memory assets = new bytes32[](3);
        address[] memory sources = new address[](3);
        assets[0] = "DAI";
        assets[1] = "LINK";
        assets[2] = "ETH";
        sources[0] = DAI_TO_USD;
        sources[1] = LINK_TO_USD;
        sources[2] = ETH_TO_USD;

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
            new ReserveInterestRateStrategy(
                this,
                WadRayMath.toRay(65),
                WadRayMath.toRay(0),
                WadRayMath.toRay(8),
                WadRayMath.toRay(100)
            )
        );

        lendingPool.initReserve(
            WETH,
            aToken,
            variableDebtToken,
            interestRateStrategy,
            7500,
            8000,
            11000,
            18
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
            new ReserveInterestRateStrategy(
                this,
                WadRayMath.toRay(80),
                WadRayMath.toRay(0),
                WadRayMath.toRay(4),
                WadRayMath.toRay(75)
            )
        );

        lendingPool.initReserve(
            DAI,
            aToken,
            variableDebtToken,
            interestRateStrategy,
            7500,
            8000,
            11000,
            18
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
            new ReserveInterestRateStrategy(
                this,
                WadRayMath.toRay(45),
                WadRayMath.toRay(0),
                WadRayMath.toRay(7),
                WadRayMath.toRay(300)
            )
        );

        lendingPool.initReserve(
            LINK,
            aToken,
            variableDebtToken,
            interestRateStrategy,
            7500,
            8000,
            11000,
            18
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
     * @dev Returns the address of the deployed RefiCollection contract
     * @return The address of the RefiCollection contract
     **/
    function getRefiCollection() external view override returns (address) {
        return REFI_COLLECTION;
    }

    /**
     * @dev Returns the address of the deployed PriceOracle contract
     * @return The address of the PriceOracle contract
     **/
    function getPriceOracle() external view override returns (address) {
        return PRICE_ORACLE;
    }
}
