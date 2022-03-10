// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { testEnv } = require('./test_suite_setup/setup');

// describe("Price Oracle", function () {

//     it("Checks BASE_CURRENCY and BASE_CURRENCY_UNIT", async function () {
//         const { priceOracle, addressesProvider } = testEnv;

//         expect(await priceOracle.BASE_CURRENCY())
//             .to.equal(await addressesProvider.WETH(), "Invalid BASE_CURRENCY")

//         expect(await priceOracle.BASE_CURRENCY_UNIT()).to.equal(1, "Invalid BASE_CURRENCY_UNIT")
//     });

//     it("Checks if mock price sources working", async function () {
//         const { priceOracle, weth, dai, link } = testEnv;

//         const prices = await priceOracle.getAssetsPrices(
//             [
//                 weth.address,
//                 dai.address,
//                 link.address,
//             ]
//         )

//         expect(prices[0]).to.equal(1, "Wrong Price for WETH")
//         expect(prices[1]).to.equal(2, "Wrong Price for DAI")
//         expect(prices[2]).to.equal(2, "Wrong Price for LINK")
//     });

//     it("Tries to set price for mock DAI source", async function () {
//         const { priceOracle, dai } = testEnv;

//         const sourceAddress = await priceOracle.getSourceOfAsset(dai.address);
//         const daiSource = await ethers.getContractAt("MockAggregatorV3", sourceAddress);

//         const Tx = await daiSource.setPrice(5);
//         await Tx.wait();

//         const price = await priceOracle.getAssetPrice(dai.address);
//         expect(price).to.equal(5, "Price set for DAI source failed")
//     });
// });
