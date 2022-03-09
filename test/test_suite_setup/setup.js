const { ethers } = require("hardhat");

const testEnv = {
    deployer: {},
    users: [],
    addressesProvider: {},
    lendingPool: {},
    wethGateway: {},
    priceOracle: {},
    protocolDataProvider: {},
    walletBalanceProvider: {},
    weth: {},
    aWeth: {},
    dai: {},
    aDai: {},
    link: {},
    aLink: {},
}

async function deployProtocol() {
    // Deploy ReserveLogic Library for linking purpose
    const ReserveLogic = await hre.ethers.getContractFactory("ReserveLogic");
    const reserveLogic = await ReserveLogic.deploy();
    await reserveLogic.deployed();

    // Deploy GenericLogic Library for linking purpose
    const GenericLogic = await hre.ethers.getContractFactory("GenericLogic");
    const genericLogic = await GenericLogic.deploy();
    await genericLogic.deployed();

    // Deploy ValidationLogic Library for linking purpose
    const ValidationLogic = await hre.ethers.getContractFactory("ValidationLogic", {
        libraries: {
            GenericLogic: genericLogic.address,
        }
    });
    const validationLogic = await ValidationLogic.deploy();
    await validationLogic.deployed();

    // Deploy AddressesProvider contract
    const AddressesProvider = await hre.ethers.getContractFactory("AddressesProvider", {
        libraries: {
            ReserveLogic: reserveLogic.address,
            ValidationLogic: validationLogic.address,
        }
    });
    const addressesProvider = await AddressesProvider.deploy();
    await addressesProvider.deployed();

    return addressesProvider;
}

async function initializeSuite() {
    const [_deployer, ...restSigners] = await ethers.getSigners();
    const deployer = {
        address: await _deployer.getAddress(),
        signer: _deployer,
    };

    for (const signer of restSigners) {
        testEnv.users.push({
            signer,
            address: await signer.getAddress(),
        });
    }
    testEnv.deployer = deployer;

    const addressesProvider = await deployProtocol();

    testEnv.addressesProvider = addressesProvider;

    testEnv.lendingPool = await ethers.getContractAt("LendingPool", await addressesProvider.getLendingPool());
    testEnv.wethGateway = await ethers.getContractAt("WETHGateway", await addressesProvider.getWETHGateway());
    testEnv.priceOracle = await ethers.getContractAt("PriceOracle", await addressesProvider.getPriceOracle());

    testEnv.protocolDataProvider = await ethers.getContractAt("ProtocolDataProvider", await addressesProvider.protocolDataProvider());
    testEnv.walletBalanceProvider = await ethers.getContractAt("WalletBalanceProvider", await addressesProvider.walletBalanceProvider());

    const wethAddress = await testEnv.addressesProvider.WETH();
    const daiAddress = await testEnv.addressesProvider.DAI();
    const linkAddress = await testEnv.addressesProvider.LINK();

    testEnv.weth = await ethers.getContractAt("MockWETH", wethAddress);
    testEnv.dai = await ethers.getContractAt("MockERC20", daiAddress);
    testEnv.link = await ethers.getContractAt("MockERC20", linkAddress);

    const aTokens = await testEnv.protocolDataProvider.getAllATokens();

    const aWEthAddress = aTokens.find((aToken) => aToken.symbol === 'aWETH')?.tokenAddress;
    const aDaiAddress = aTokens.find((aToken) => aToken.symbol === 'aDAI')?.tokenAddress;
    const aLinkAddress = aTokens.find((aToken) => aToken.symbol === 'aLINK')?.tokenAddress;

    testEnv.aWeth = await ethers.getContractAt("AToken", aWEthAddress);
    testEnv.aDai = await ethers.getContractAt("AToken", aDaiAddress);
    testEnv.aLink = await ethers.getContractAt("AToken", aLinkAddress);
}

module.exports = {
    testEnv,
    initializeSuite
}