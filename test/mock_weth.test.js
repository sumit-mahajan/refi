// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { testEnv } = require('./test_suite_setup/setup');

// describe("Mock WETH", function () {

//     it("Deposits 5 ETH to mint 5 WETH", async function () {
//         const { deployer, walletBalanceProvider, weth } = testEnv

//         const beforeEthBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
//             )
//         )
//         const beforeWethBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         )

//         const Tx = await weth.deposit({ value: ethers.utils.parseEther("5.0") });
//         await Tx.wait();

//         const afterEthBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
//             )
//         )
//         const afterWethBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         )

//         // Considering gas used, ETH balance will be slightly less
//         expect(parseInt(afterEthBalance)).to.be.lessThanOrEqual(parseInt(beforeEthBalance - 5), "Incorrect ETH balance");
//         expect(parseInt(afterWethBalance)).to.equal(parseInt(beforeWethBalance) + 5, "Incorrect WETH balance");
//     });

//     it("Withdraws 1 ETH by burning 1 WETH", async function () {
//         const { deployer, walletBalanceProvider, weth } = testEnv

//         const beforeEthBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
//             )
//         )
//         const beforeWethBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         )

//         const Tx = await weth.withdraw(ethers.utils.parseEther("1.0"));
//         await Tx.wait();

//         const afterEthBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
//             )
//         )
//         const afterWethBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         )

//         // Considering gas used, ETH balance will be slightly less
//         expect(parseInt(afterEthBalance)).to.be.within(
//             parseInt(beforeEthBalance), parseInt(beforeEthBalance) + 1, "Incorrect ETH balance"
//         )
//         expect(parseInt(afterWethBalance)).to.equal(parseInt(beforeWethBalance) - 1, "Incorrect WETH balance");
//     });

//     it("User 0 Transfers 1 WETH to User 1", async function () {
//         const { deployer, users, walletBalanceProvider, weth } = testEnv;

//         const beforeBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         ))
//         const beforeBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 weth.address
//             )
//         ))

//         const Tx = await weth.transfer(users[1].address, ethers.utils.parseEther("1.0"));
//         await Tx.wait();

//         const afterBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         ))
//         const afterBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 weth.address
//             )
//         ))

//         expect(afterBalanceA).to.equal(beforeBalanceA - 1, "Incorrect 'from' balance");
//         expect(afterBalanceB).to.equal(beforeBalanceB + 1, "Incorrect 'to' balance");
//     });

//     it("User 0 approves User 1 to transfer 1 WETH", async function () {
//         const { deployer, users, walletBalanceProvider, weth } = testEnv;

//         const beforeBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         ))
//         const beforeBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 weth.address
//             )
//         ))

//         const approveTx = await weth.approve(users[1].address, ethers.utils.parseEther("1.0"));
//         await approveTx.wait();

//         const transferTx = await weth.connect(users[1].signer).transferFrom(
//             deployer.address, users[1].address, ethers.utils.parseEther("1.0")
//         );
//         await transferTx.wait();

//         const afterBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 weth.address
//             )
//         ))
//         const afterBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 weth.address
//             )
//         ))

//         expect(afterBalanceA).to.equal(beforeBalanceA - 1, "Incorrect 'from' balance");
//         expect(afterBalanceB).to.equal(beforeBalanceB + 1, "Incorrect 'to' balance");
//     });
// });
