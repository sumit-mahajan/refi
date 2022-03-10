// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { ProtocolErrors } = require("./test_suite_setup/errors");
// const { testEnv } = require('./test_suite_setup/setup');

// describe("Variable Debt Token", function () {

//     it('Tries to invoke mint not being the LendingPool', async () => {
//         const { deployer, dai, protocolDataProvider } = testEnv;
//         const { CT_CALLER_MUST_BE_LENDING_POOL } = ProtocolErrors;

//         const daiVariableDebtTokenAddress = (
//             await protocolDataProvider.getReserveTokensAddresses(dai.address)
//         ).variableDebtTokenAddress;
//         const variableDebtContract = await ethers.getContractAt("VariableDebtToken", daiVariableDebtTokenAddress);

//         await expect(
//             variableDebtContract.mint(deployer.address, deployer.address, '1', '1')
//         ).to.be.revertedWith(CT_CALLER_MUST_BE_LENDING_POOL);
//     });

//     it('Tries to invoke burn not being the LendingPool', async () => {
//         const { deployer, dai, protocolDataProvider } = testEnv;
//         const { CT_CALLER_MUST_BE_LENDING_POOL } = ProtocolErrors;

//         const daiVariableDebtTokenAddress = (
//             await protocolDataProvider.getReserveTokensAddresses(dai.address)
//         ).variableDebtTokenAddress;
//         const variableDebtContract = await ethers.getContractAt("VariableDebtToken", daiVariableDebtTokenAddress);

//         await expect(variableDebtContract.burn(deployer.address, '1', '1')).to.be.revertedWith(
//             CT_CALLER_MUST_BE_LENDING_POOL
//         );
//     });
// });
