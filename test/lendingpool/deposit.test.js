const { expect } = require("chai");
const { ethers } = require("hardhat");
const { testEnv } = require('../test_suite_setup/setup');
const { ProtocolErrors } = require("../test_suite_setup/errors");
const { rayToNum } = require("../test_suite_setup/helpers");
const { MAX_UINT } = require("../test_suite_setup/constants");

describe("Lending Pool :: Deposit", function () {

    it("Tries to deposit invalid asset and amount", async function () {
        const { deployer, addressesProvider, lendingPool, dai } = testEnv;
        const { VL_INVALID_AMOUNT, VL_INVALID_ASSET } = ProtocolErrors;

        // Invalid asset
        await expect(lendingPool.deposit(
            await addressesProvider.DAI_TO_ETH(),
            ethers.utils.parseEther("1.0"),
            deployer.address
        )).to.be.revertedWith(
            VL_INVALID_ASSET
        );

        // Invalid amount
        await expect(lendingPool.deposit(
            dai.address,
            ethers.utils.parseEther("0"),
            deployer.address
        )).to.be.revertedWith(
            VL_INVALID_AMOUNT
        );
    });

    // User 0 infinite approves the lendingPool for DAI reserve
    it("User 0 tries to deposit more than wallet balance", async function () {
        const { deployer, lendingPool, dai } = testEnv;
        const { ET_AMOUNT_EXCEEDS_BALANCE } = ProtocolErrors;

        // One time infinite approve
        const approveTx = await dai.approve(lendingPool.address, MAX_UINT);
        await approveTx.wait();

        await expect(lendingPool.deposit(
            dai.address,
            ethers.utils.parseEther("10000"),
            deployer.address
        )).to.be.revertedWith(
            ET_AMOUNT_EXCEEDS_BALANCE
        );
    });

    // Checks if reserve lastUpdateTimestamp updated, collateral set to true and equal aTokens minted after a valid 1st deposit
    // State and interest rates are not updated in first deposit
    it("User 0 deposits 10 DAI as a first deposit to protocol", async function () {
        const { deployer, lendingPool, protocolDataProvider, dai, aDai } = testEnv;

        const reserveBefore = await lendingPool.getReserveData(dai.address)

        const Tx = await lendingPool.deposit(
            dai.address,
            ethers.utils.parseEther("10"),
            deployer.address
        )
        await Tx.wait()

        const reserveAfter = await lendingPool.getReserveData(dai.address)
        const userConfig = await protocolDataProvider.getUserReserveData(dai.address, deployer.address);
        const aDaiBalance = parseInt(ethers.utils.formatEther(await aDai.balanceOf(deployer.address)))

        expect(reserveBefore.lastUpdateTimestamp)
            .to.not.equal(reserveAfter.lastUpdateTimestamp, "Timestamp not updated")
        expect(userConfig.usageAsCollateralEnabled).to.equal(true, "Collateral not set true");
        expect(aDaiBalance).to.equal(10, "ATokens not minted to user")
    });

    // it("Checks if state, interest rates updated in next deposit", async function () {
    //     const { deployer, lendingPool, protocolDataProvider, dai } = testEnv;

    //     const reserveBefore = await lendingPool.getReserveData(dai.address)

    //     // Wait for 2 seconds
    //     await new Promise(r => setTimeout(r, 2000))

    //     const Tx = await lendingPool.deposit(
    //         dai.address,
    //         ethers.utils.parseEther("10"),
    //         deployer.address
    //     )
    //     await Tx.wait()

    //     const reserveAfter = await lendingPool.getReserveData(dai.address)

    //     expect(rayToNum(reserveBefore.liquidityIndex))
    //         .to.be.below(rayToNum(reserveAfter.liquidityIndex), "Liquidity index not updated")
    //     expect(rayToNum(reserveBefore.variableBorrowIndex))
    //         .to.be.below(rayToNum(reserveAfter.variableBorrowIndex), "Variable Borrow index not updated")
    // });
});
