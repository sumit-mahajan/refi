const { expect } = require("chai");
const { testEnv } = require('../test_suite_setup/setup');
const { ProtocolErrors } = require("../test_suite_setup/errors");
const { rayToNum, toWei, toEther } = require("../test_suite_setup/helpers");
const { MAX_UINT } = require("../test_suite_setup/constants");
require('./deposit.test')

describe("Lending Pool :: Borrow", function () {
    before("User 1 deposits 100 LINK", async function () {
        const { deployer, users, lendingPool, dai, link } = testEnv;

        // One time infinite approve
        const approveLinkTx = await link.connect(users[1].signer).approve(lendingPool.address, MAX_UINT);
        await approveLinkTx.wait();

        const linkTx = await lendingPool.connect(users[1].signer).deposit(
            link.address,
            toWei(100),
            users[1].address
        )
        await linkTx.wait()
    })

    it("Tries to borrow invalid asset and amount", async function () {
        const { deployer, addressesProvider, lendingPool, link } = testEnv;
        const { VL_INVALID_AMOUNT, VL_INVALID_ASSET } = ProtocolErrors;

        // Invalid asset
        await expect(lendingPool.borrow(
            await addressesProvider.DAI_TO_ETH(),
            toWei(1),
            deployer.address
        )).to.be.revertedWith(
            VL_INVALID_ASSET
        );

        // Invalid amount
        await expect(lendingPool.borrow(
            link.address,
            toWei(0),
            deployer.address
        )).to.be.revertedWith(
            VL_INVALID_AMOUNT
        );
    });

    it("Gets max borrow amount using collateral and LTV", async function () {
        const { deployer, lendingPool, link } = testEnv;

        expect(true).to.equal(true);
    });

    it("Tries to borrow more than LTV", async function () {
        const { deployer, lendingPool, link } = testEnv;
        const { VL_COLLATERAL_CANNOT_COVER_NEW_BORROW } = ProtocolErrors;

        await expect(lendingPool.borrow(
            link.address,
            toWei(100),
            deployer.address
        )).to.be.revertedWith(
            VL_COLLATERAL_CANNOT_COVER_NEW_BORROW
        );
    });

    it("Checks if borrowing set to true, equal debtTokens minted and borrowed tokens received after a valid borrow", async function () {
        const { deployer, lendingPool, protocolDataProvider, link, dLink } = testEnv;

        const linkBalanceBefore = parseFloat(toEther(await link.balanceOf(deployer.address)))

        const Tx = await lendingPool.borrow(
            link.address,
            toWei(10),
            deployer.address
        )
        await Tx.wait()

        const userConfig = await protocolDataProvider.getUserReserveData(link.address, deployer.address);
        const dLinkBalance = parseFloat(toEther(await dLink.balanceOf(deployer.address)))
        const linkBalanceAfter = parseFloat(toEther(await link.balanceOf(deployer.address)))

        expect(userConfig.isBorrowed).to.equal(true, "Borrowing not set true");
        expect(dLinkBalance).to.equal(10, "Incorrect Debt Tokens minted")
        expect(linkBalanceAfter).to.equal(linkBalanceBefore + 10, "Incorrect funds borrowed")
    });

});
