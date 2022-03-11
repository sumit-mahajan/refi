const { expect } = require("chai");
const { testEnv } = require('./test_suite_setup/setup');
const { toWei, toEther, customPrint } = require("./test_suite_setup/helpers");
const { MAX_UINT } = require("./test_suite_setup/constants");
// Run after lendingpool/withdraw
require('./lendingpool/withdraw.test')

describe("WETH Gateway", function () {

    before("User 1 deposits 100 DAI and 100 LINK", async function () {
        const { users, lendingPool, wethGateway, dai, link, aWeth } = testEnv;

        // One time infinite approve DAI
        const approveDaiTx = await dai.connect(users[1].signer).approve(lendingPool.address, MAX_UINT);
        await approveDaiTx.wait();

        customPrint("User 1 infinite approves the lendingPool for DAI reserve");

        const daiTx = await lendingPool.connect(users[1].signer).deposit(
            dai.address,
            toWei(100),
            users[1].address
        )
        await daiTx.wait()

        customPrint("User 1 deposits 100 DAI");

        const linkTx = await lendingPool.connect(users[1].signer).deposit(
            link.address,
            toWei(100),
            users[1].address
        )
        await linkTx.wait()

        customPrint("User 1 deposits 100 LINK");

        // One time infinite approve aWeth
        // Required at withdrawal time
        const approveAWethTx = await aWeth.approve(wethGateway.address, MAX_UINT);
        await approveAWethTx.wait();

        customPrint("User 0 infinite approves the wEthGateway for aWeth tokens");
    })

    it("Deposits ETH", async function () {
        const { deployer, lendingPool, wethGateway, protocolDataProvider, weth, aWeth } = testEnv;

        const reserveBefore = await lendingPool.getReserveData(weth.address)

        const Tx = await wethGateway.depositETH({ value: toWei(10) })
        await Tx.wait()

        customPrint("User 0 deposits 10 ETH");

        const reserveAfter = await lendingPool.getReserveData(weth.address)
        const userData = await lendingPool.getUserAccountData(deployer.address)
        const userConfig = await protocolDataProvider.getUserReserveData(weth.address, deployer.address);
        const aWethBalance = parseFloat(toEther(await aWeth.balanceOf(deployer.address)))

        expect(reserveBefore.lastUpdateTimestamp)
            .to.not.equal(reserveAfter.lastUpdateTimestamp, "Timestamp not updated")

        expect(userConfig.usageAsCollateralEnabled).to.equal(true, "Collateral not set true");
        expect(parseFloat(toEther(userData.totalCollateralETH))).to.equal(10, "Invalid collateral amount")
        expect(aWethBalance).to.equal(10, "ATokens not minted to user")
    });

    it("Borrows ETH and against ETH", async function () {
        const { deployer, users, lendingPool, wethGateway,
            protocolDataProvider, walletBalanceProvider, weth, dai, dWeth, dDai } = testEnv;

        customPrint("User 1 borrows 10 ETH against deposited LINK as collateral");

        const ethBalanceBefore = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                deployer.address,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            )
        ))

        const borrowEthTx = await wethGateway.connect(users[1].signer).borrowETH(toWei(10))
        await borrowEthTx.wait()

        const user1Config = await protocolDataProvider.getUserReserveData(weth.address, users[1].address);
        const dWethBalance = parseFloat(toEther(await dWeth.balanceOf(users[1].address)))
        const ethBalanceAfter = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                users[1].address,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            )
        ))

        expect(user1Config.isBorrowed).to.equal(true, "Borrowing not set true");
        expect(dWethBalance).to.equal(10, "Incorrect Debt Tokens minted")
        expect(ethBalanceBefore).to.be.lessThanOrEqual(ethBalanceAfter + 10, "Incorrect funds borrowed")

        customPrint("User 0 borrows 10 DAI against depsited ETH as collateral");

        const daiBalanceBefore = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                deployer.address,
                dai.address
            )
        ))

        const borrowDaiTx = await lendingPool.borrow(
            dai.address,
            toWei(10),
            deployer.address
        )
        await borrowDaiTx.wait()

        const user0Config = await protocolDataProvider.getUserReserveData(dai.address, deployer.address);
        const dDaiBalance = parseFloat(toEther(await dDai.balanceOf(deployer.address)))
        const daiBalanceAfter = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                deployer.address,
                dai.address
            )
        ))

        expect(user0Config.isBorrowed).to.equal(true, "Borrowing not set true");
        expect(dDaiBalance).to.equal(10, "Incorrect Debt Tokens minted")
        expect(daiBalanceAfter).to.equal(daiBalanceBefore + 10, "Incorrect funds borrowed")
    });

    it("Repays ETH loan", async function () {
        const { deployer, users, wethGateway, protocolDataProvider, weth, aWeth, dWeth } = testEnv;

        const wethBalanceBefore = parseFloat(toEther(await weth.balanceOf(aWeth.address)))

        // Repay any amount more than borrowed for a full repay
        const Tx = await wethGateway.connect(users[1].signer).repayETH(toWei(100), { value: toWei(100) })
        await Tx.wait()

        customPrint("User 1 repays entire ETH loan");

        const userConfig = await protocolDataProvider.getUserReserveData(weth.address, deployer.address);
        const dWethBalance = parseFloat(toEther(await dWeth.balanceOf(deployer.address)))
        const wethBalanceAfter = parseFloat(toEther(await weth.balanceOf(aWeth.address)))

        expect(userConfig.isBorrowed).to.equal(false, "Borrowing not set false");
        expect(dWethBalance).to.equal(0, "Incorrect Debt Tokens burned")
        // Interest has to be paid
        expect(wethBalanceAfter).to.be.above(wethBalanceBefore + 10, "Incorrect funds repaid")
    });

    it("Withdraws all ETH", async function () {
        const { deployer, lendingPool, wethGateway, protocolDataProvider,
            walletBalanceProvider, dai, aWeth, weth } = testEnv;

        // Repay any amount more than borrowed for a full repay
        const repayTx = await lendingPool.repay(
            dai.address,
            toWei(100),
            deployer.address
        )
        await repayTx.wait()

        customPrint("User 0 repays entire DAI loan");

        const beforeEthBalance = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                deployer.address,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            )
        ))

        const Tx = await wethGateway.withdrawETH(MAX_UINT)
        await Tx.wait()

        customPrint("User 0 withdraws all deposited ETH");

        const afterEthBalance = parseFloat(toEther(
            await walletBalanceProvider.balanceOf(
                deployer.address,
                "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            )
        ))
        const userConfig = await protocolDataProvider.getUserReserveData(weth.address, deployer.address);
        const aWethBalance = parseFloat(toEther(await aWeth.balanceOf(deployer.address)))

        expect(userConfig.usageAsCollateralEnabled).to.equal(false, "Collateral not set false");
        expect(aWethBalance).to.equal(0, "ATokens not burned")
        // Interest is earned
        expect(afterEthBalance).to.be.above(parseInt(beforeEthBalance) + 10, "Incorrect ETH balance"
        )
    });

});
