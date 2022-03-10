// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { testEnv } = require('./test_suite_setup/setup');

// describe("Mock ERC20", function () {

//     it("Mints 10 DAI to User 0", async function () {
//         const { deployer, walletBalanceProvider, dai } = testEnv

//         const beforeBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         )

//         const Tx = await dai.mint(deployer.address, ethers.utils.parseEther("10.0"));
//         await Tx.wait();

//         const afterBalance = ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         )

//         expect(parseInt(afterBalance)).to.equal(parseInt(beforeBalance) + 10, "Incorrect ERC20 balance");
//     });

//     it("User 0 Transfers 1 DAI to User 1", async function () {
//         const { deployer, users, walletBalanceProvider, dai } = testEnv;

//         const beforeBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         ))
//         const beforeBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 dai.address
//             )
//         ))

//         const Tx = await dai.transfer(users[1].address, ethers.utils.parseEther("1.0"));
//         await Tx.wait();

//         const afterBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         ))
//         const afterBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 dai.address
//             )
//         ))

//         expect(afterBalanceA).to.equal(beforeBalanceA - 1, "Incorrect 'from' balance");
//         expect(afterBalanceB).to.equal(beforeBalanceB + 1, "Incorrect 'to' balance");
//     });

//     it("User 0 approves User 1 to transfer 1 WETH", async function () {
//         const { deployer, users, walletBalanceProvider, dai } = testEnv;

//         const beforeBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         ))
//         const beforeBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 dai.address
//             )
//         ))

//         const approveTx = await dai.approve(users[1].address, ethers.utils.parseEther("1.0"));
//         await approveTx.wait();

//         const transferTx = await dai.connect(users[1].signer).transferFrom(
//             deployer.address, users[1].address, ethers.utils.parseEther("1.0")
//         );
//         await transferTx.wait();

//         const afterBalanceA = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 deployer.address,
//                 dai.address
//             )
//         ))
//         const afterBalanceB = parseInt(ethers.utils.formatEther(
//             await walletBalanceProvider.balanceOf(
//                 users[1].address,
//                 dai.address
//             )
//         ))

//         expect(afterBalanceA).to.equal(beforeBalanceA - 1, "Incorrect 'from' balance");
//         expect(afterBalanceB).to.equal(beforeBalanceB + 1, "Incorrect 'to' balance");
//     });
// });
