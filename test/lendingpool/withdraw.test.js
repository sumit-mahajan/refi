// const { expect } = require("chai");
// const { testEnv } = require('../test_suite_setup/setup');
// const { ProtocolErrors } = require("../test_suite_setup/errors");
// const { rayToNum, toWei, toEther } = require("../test_suite_setup/helpers");
// const { MAX_UINT } = require("../test_suite_setup/constants");
// require('./borrow.test')

// describe("Lending Pool :: Withdraw", function () {

//     it("Tries to withdraw invalid asset and amount", async function () {
//         const { deployer, addressesProvider, lendingPool, dai } = testEnv;
//         const { VL_INVALID_AMOUNT, VL_INVALID_ASSET } = ProtocolErrors;

//         // Invalid asset
//         await expect(lendingPool.deposit(
//             await addressesProvider.DAI_TO_ETH(),
//             toWei(1),
//             deployer.address
//         )).to.be.revertedWith(
//             VL_INVALID_ASSET
//         );

//         // Invalid amount
//         await expect(lendingPool.deposit(
//             dai.address,
//             toWei(0),
//             deployer.address
//         )).to.be.revertedWith(
//             VL_INVALID_AMOUNT
//         );
//     });

//     it("Tries to withdraw more than deposited balance", async function () {
//         const { deployer, lendingPool, dai } = testEnv;
//         const { VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE } = ProtocolErrors;

//         await expect(lendingPool.withdraw(
//             dai.address,
//             toWei(10000),
//             deployer.address
//         )).to.be.revertedWith(
//             VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE
//         );
//     });

//     it("Checks if equal aTokens burned after a valid withdrawal", async function () {
//         const { deployer, lendingPool, protocolDataProvider, dai, aDai } = testEnv;

//         const reserveBefore = await lendingPool.getReserveData(dai.address)

//         const Tx = await lendingPool.withdraw(
//             dai.address,
//             toWei(1),
//             deployer.address
//         )
//         await Tx.wait()

//         const reserveAfter = await lendingPool.getReserveData(dai.address)
//         const userConfig = await protocolDataProvider.getUserReserveData(dai.address, deployer.address);
//         const aDaiBalance = parseFloat(toEther(await aDai.balanceOf(deployer.address)))

//         expect(reserveBefore.lastUpdateTimestamp)
//             .to.not.equal(reserveAfter.lastUpdateTimestamp, "Timestamp not updated")
//         expect(userConfig.usageAsCollateralEnabled).to.equal(true, "Collateral not set true");
//         expect(aDaiBalance).to.equal(99, "ATokens not burned")
//     });

//     // it("Checks if state, interest rates updated after valid withdrawal", async function () {
//     //     const { deployer, lendingPool, dai } = testEnv;

//     //     const reserveBefore = await lendingPool.getReserveData(dai.address)

//     //     // Wait for 2 seconds
//     //     await new Promise(r => setTimeout(r, 2000))

//     //     const Tx = await lendingPool.withdraw(
//     //         dai.address,
//     //         toWei(1),
//     //         deployer.address
//     //     )
//     //     await Tx.wait()

//     //     const reserveAfter = await lendingPool.getReserveData(dai.address)

//     //     expect(reserveBefore.lastUpdateTimestamp)
//     //         .to.not.equal(reserveAfter.lastUpdateTimestamp, "Timestamp not updated")
//     //     expect(rayToNum(reserveBefore.liquidityIndex))
//     //         .to.be.below(rayToNum(reserveAfter.liquidityIndex), "Liquidity index not updated")
//     //     expect(rayToNum(reserveBefore.variableBorrowIndex))
//     //         .to.be.below(rayToNum(reserveAfter.variableBorrowIndex), "Variable Borrow index not updated")
//     // });

//     it("Checks if collateral set to false after a valid full withdrawal", async function () {
//         const { deployer, lendingPool, protocolDataProvider, dai, aDai } = testEnv;

//         const reserveBefore = await lendingPool.getReserveData(dai.address)

//         const Tx = await lendingPool.withdraw(
//             dai.address,
//             MAX_UINT,
//             deployer.address
//         )
//         await Tx.wait()

//         const reserveAfter = await lendingPool.getReserveData(dai.address)
//         const userConfig = await protocolDataProvider.getUserReserveData(dai.address, deployer.address);
//         const aDaiBalance = parseFloat(toEther(await aDai.balanceOf(deployer.address)))

//         expect(reserveBefore.lastUpdateTimestamp)
//             .to.not.equal(reserveAfter.lastUpdateTimestamp, "Timestamp not updated")
//         expect(userConfig.usageAsCollateralEnabled).to.equal(false, "Collateral not set false");
//         expect(aDaiBalance).to.equal(0, "ATokens not burned")
//     });
// });
