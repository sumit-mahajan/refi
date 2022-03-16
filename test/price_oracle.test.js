const { expect } = require("chai");
const { ethers } = require("hardhat");
const { testEnv } = require('./test_suite_setup/setup');
const { toWei, toEther } = require("./test_suite_setup/helpers");
// Run after variable_debt_token
require('./variable_debt_token.test')

describe("Price Oracle", function () {

    it("Checks BASE_CURRENCY and BASE_CURRENCY_UNIT", async function () {
        const { priceOracle, addressesProvider } = testEnv;

        expect(await priceOracle.BASE_CURRENCY())
            .to.equal(await addressesProvider.WETH(), "Invalid BASE_CURRENCY")

        expect(parseFloat(toEther(await priceOracle.BASE_CURRENCY_UNIT()))).to.equal(1, "Invalid BASE_CURRENCY_UNIT")
    });

    it("Checks if mock price sources working", async function () {
        const { priceOracle, weth, dai, link } = testEnv;

        const prices = await priceOracle.getAssetsPrices(
            [
                weth.address,
                dai.address,
                link.address,
            ]
        )

        expect(parseFloat(toEther(prices[0]))).to.equal(1, "Wrong Price for WETH")
        expect(parseFloat(toEther(prices[1]))).to.equal(0.5, "Wrong Price for DAI")
        expect(parseFloat(toEther(prices[2]))).to.equal(0.5, "Wrong Price for LINK")
    });

    it("Tries to set price for mock DAI source", async function () {
        const { priceOracle, dai } = testEnv;

        const sourceAddress = await priceOracle.getSourceOfAsset(dai.address);
        const daiSource = await ethers.getContractAt("MockAggregatorV3", sourceAddress);

        const Tx = await daiSource.setPrice(toWei(1));
        await Tx.wait();

        const price = parseFloat(toEther(await priceOracle.getAssetPrice(dai.address)));
        expect(price).to.equal(1, "Price set for DAI source failed")

        const resetTx = await daiSource.setPrice(toWei(0.5));
        await resetTx.wait();
    });
});
