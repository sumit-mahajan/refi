// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {

    const addressesProviderAddress = "0x76e04335D73d130f1f39f6bBDEE84c4AC7097332"

    const addressesProvider = await hre.ethers.getContractAt(
		"AddressesProvider",
		addressesProviderAddress
	);

	console.log("AddressesProvider fetched from:", addressesProvider.address);

	// For UI testing
	testEnv.addressesProvider = addressesProvider;
	await setupEnvironment();
	await setupData();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

// For UI testing

const MAX_UINT =
	"115792089237316195423570985008687907853269984665640564039457584007913129639935";

const toWei = (num) => {
	return hre.ethers.utils.parseEther(num.toString());
};

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
	dWeth: {},
	dai: {},
	aDai: {},
	dDai: {},
	link: {},
	aLink: {},
	dLink: {},
};

const setupEnvironment = async () => {
	const [_deployer, ...restSigners] = await hre.ethers.getSigners();
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

	testEnv.lendingPool = await hre.ethers.getContractAt(
		"LendingPool",
		await testEnv.addressesProvider.getLendingPool()
	);
	testEnv.wethGateway = await hre.ethers.getContractAt(
		"WETHGateway",
		await testEnv.addressesProvider.getWETHGateway()
	);
	testEnv.priceOracle = await hre.ethers.getContractAt(
		"PriceOracle",
		await testEnv.addressesProvider.getPriceOracle()
	);

	testEnv.protocolDataProvider = await hre.ethers.getContractAt(
		"ProtocolDataProvider",
		await testEnv.addressesProvider.protocolDataProvider()
	);
	testEnv.walletBalanceProvider = await hre.ethers.getContractAt(
		"WalletBalanceProvider",
		await testEnv.addressesProvider.walletBalanceProvider()
	);

	const wethAddress = await testEnv.addressesProvider.WETH();
	const daiAddress = await testEnv.addressesProvider.DAI();
	const linkAddress = await testEnv.addressesProvider.LINK();

	testEnv.weth = await hre.ethers.getContractAt("IWETH", wethAddress);
	testEnv.dai = await hre.ethers.getContractAt("IERC20", daiAddress);
	testEnv.link = await hre.ethers.getContractAt("IERC20", linkAddress);

	const aTokens = await testEnv.protocolDataProvider.getAllATokens();

	const aWEthAddress = aTokens.find(
		(aToken) => aToken.symbol === "aWETH"
	).tokenAddress;
	const aDaiAddress = aTokens.find(
		(aToken) => aToken.symbol === "aDAI"
	).tokenAddress;
	const aLinkAddress = aTokens.find(
		(aToken) => aToken.symbol === "aLINK"
	).tokenAddress;

	testEnv.aWeth = await hre.ethers.getContractAt("AToken", aWEthAddress);
	testEnv.aDai = await hre.ethers.getContractAt("AToken", aDaiAddress);
	testEnv.aLink = await hre.ethers.getContractAt("AToken", aLinkAddress);

	const dWethAddress = (
		await testEnv.protocolDataProvider.getReserveTokensAddresses(
			testEnv.weth.address
		)
	).variableDebtTokenAddress;
	const dDaiAddress = (
		await testEnv.protocolDataProvider.getReserveTokensAddresses(
			testEnv.dai.address
		)
	).variableDebtTokenAddress;
	const dLinkAddress = (
		await testEnv.protocolDataProvider.getReserveTokensAddresses(
			testEnv.link.address
		)
	).variableDebtTokenAddress;

	testEnv.dWeth = await hre.ethers.getContractAt(
		"VariableDebtToken",
		dWethAddress
	);
	testEnv.dDai = await hre.ethers.getContractAt(
		"VariableDebtToken",
		dDaiAddress
	);
	testEnv.dLink = await hre.ethers.getContractAt(
		"VariableDebtToken",
		dLinkAddress
	);
};

const setupData = async () => {
	const { deployer, users, dai, link, aWeth, lendingPool, wethGateway } =
		testEnv;

    // console.log("Deployer - ", deployer.address)
    // console.log("User - ", users[0].address)
    // console.log("User - ", users[1].address)

	// Available accounts
    // deployer, users[0], users[1]

	const approveDaiTx = await dai
        .connect(users[0].signer)
        .approve(lendingPool.address, MAX_UINT);
	await approveDaiTx.wait();

	console.log("User 0 infinite approves the lendingPool for DAI reserve");

	const depositDaiTx = await lendingPool
        .connect(users[0].signer)
        .deposit(dai.address, toWei(80), users[0].address);
	await depositDaiTx.wait();

	console.log("User 0 deposits 80 DAI");

	// One time infinite approve
	const approveLinkTx = await link
		.connect(users[1].signer)
		.approve(lendingPool.address, MAX_UINT);
	await approveLinkTx.wait();

	console.log("User 1 infinite approves the lendingPool for LINK reserve");

	const linkTx = await lendingPool
		.connect(users[1].signer)
		.deposit(link.address, toWei(20), users[1].address);
	await linkTx.wait();

	console.log("User 1 deposits 20 LINK");

	const borrowLinkTx = await lendingPool
        .connect(users[1].signer)
        .borrow(dai.address, toWei(10), users[1].address);
	await borrowLinkTx.wait();

	console.log("User 1 borrows 10 DAI against LINK as collateral");

    // One time infinite approve
	const approveLinkDeployerTx = await link
        .approve(lendingPool.address, MAX_UINT);
    await approveLinkDeployerTx.wait();

    console.log("Deployer infinite approves the lendingPool for LINK reserve");

    const depositLinkDeployerTx = await lendingPool
		.deposit(link.address, toWei(20), deployer.address);
	await depositLinkDeployerTx.wait();

	console.log("Delpoyer deposits 20 LINK");

    const borrowLinkDeployerTx = await lendingPool
        .borrow(dai.address, toWei(10), deployer.address);
    await borrowLinkDeployerTx.wait();

	console.log("Deployer borrows 10 DAI against LINK as collateral");

	// One time infinite approve aWeth
	// Required at withdrawal time. i.e. do this before ETH deposit
	const approveAWethTx = await aWeth
		.connect(users[1].signer)
		.approve(wethGateway.address, MAX_UINT);
	await approveAWethTx.wait();

	console.log("User 1 infinite approves the wEthGateway for aWeth tokens");

	const Tx = await wethGateway
		.connect(users[1].signer)
		.depositETH({ value: toWei(2) });
        await Tx.wait();
        
    console.log("User 1 deposits 2 ETH");

    const withdrawETHTx = await wethGateway
        .connect(users[1].signer)
        .withdrawETH(MAX_UINT);
    await withdrawETHTx.wait();
        
	console.log("User 1 withdraws all ETH");
};
