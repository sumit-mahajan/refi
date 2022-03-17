import React, { useCallback, useEffect, useState } from "react";
import "../styles/asset-page.scss";
import { useConnection } from "../utils/connection_provider/connection_provider";
import { useParams } from "react-router-dom";
import { MAX_UINT, toEther } from "../utils/helpers";
import BorrowSection from "../components/BorrowSection";
import DepositSection from "../components/DepositSection";
import { toWei } from "../utils/helpers";
import { useAssetProvider } from "../utils/assets_provider/assets_provider";

function AssetPage() {
  const { id } = useParams();

  const {
    protocolDataProvider,
    walletBalanceProvider,
    lendingPoolContract,
    daiContract,
    linkContract,
    wethContract,
    wETHGatewayContract,
    accounts,
  } = useConnection();

  let { state: assets, refresh } = useAssetProvider();

  console.log("REfreshsing");

  const [asset, setAsset] = useState();

  const [positions, setPositions] = useState({
    healthFactor: 0,
    currentBorrowed: 0,
    currentDeposited: 0,
    walletBalance: 0,
    availableToBorrow: 0,
    isApproved: true,
  });

  useEffect(() => {
    const fetchAsset = () => {
      setAsset(assets.find((asset) => asset.symbol === id));
    };

    fetchAsset();
  }, [assets, id]);

  const isTokenApproved = useCallback(async () => {
    switch (asset.symbol) {
      case "DAI":
        const approvedDAI = await daiContract.allowance(
          accounts[0],
          lendingPoolContract.address
        );
        return toEther(approvedDAI) !== 0;
      case "LINK":
        const approvedLINK = await linkContract.allowance(
          accounts[0],
          lendingPoolContract.address
        );
        return toEther(approvedLINK) !== 0;
      case "WETH":
        const approvedaWETH = await wethContract.allowance(
          accounts[0],
          wETHGatewayContract.address
        );
        return toEther(approvedaWETH) !== 0;
      default:
        break;
    }
  }, [asset, daiContract, linkContract, wethContract]);

  const fetchPositons = useCallback(async () => {
    const isApproved = await isTokenApproved();

    //Fetch user data
    const userData = await protocolDataProvider.getUserReserveData(
      asset.tokenAddress,
      accounts[0]
    );

    const walletBalance = await walletBalanceProvider.balanceOf(
      accounts[0],
      asset.tokenAddress
    );
    const {
      currentVariableDebt,
      healthFactor,
      availableToBorrow,
      currentATokenBalance,
    } = userData;

    setPositions({
      currentBorrowed: toEther(currentVariableDebt),
      healthFactor: toEther(healthFactor),
      currentDeposited: toEther(currentATokenBalance),
      walletBalance: toEther(walletBalance),
      availableToBorrow: toEther(availableToBorrow),
      isApproved: isApproved,
    });
  }, [isTokenApproved, protocolDataProvider, walletBalanceProvider]);

  useEffect(() => {
    if (asset === undefined) return;
    if (accounts.length === 0) return;

    fetchPositons();
  }, [asset, accounts, fetchPositons]);

  const depositERC20 = async (amount) => {
    try {
      if (asset.symbol === "WETH") {
        await wETHGatewayContract.depositETH({
          value: toWei(amount),
        });
      } else {
        await lendingPoolContract.deposit(
          asset.tokenAddress,
          toWei(amount),
          accounts[0]
        );
      }

      refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const approveToken = async () => {
    switch (asset.symbol) {
      case "DAI":
        await daiContract.approve(lendingPoolContract.address, MAX_UINT);
        break;

      case "LINK":
        await linkContract.approve(lendingPoolContract.address, MAX_UINT);
        break;

      case "WETH":
        await wethContract.approve(wETHGatewayContract.address, MAX_UINT);
        break;
      default:
        break;
    }
  };

  const borrowAsset = async (amount) => {
    try {
      if (asset.symbol === "WETH") {
        await wETHGatewayContract.borrowETH(toWei(amount));
      } else {
        await lendingPoolContract.borrow(
          asset.tokenAddress,
          toWei(amount),
          accounts[0]
        );
      }

      refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const repayDebt = async (amount) => {
    try {
      if (asset.symbol === "WETH") {
        await wETHGatewayContract.repayETH(toWei(amount), {
          value: toWei(amount),
        });
      } else {
        await lendingPoolContract.repay(
          asset.tokenAddress,
          toWei(amount),
          accounts[0]
        );
      }

      refresh();
    } catch (error) {
      console.log(error);
    }
  };

  const withdrawAsset = async (amount) => {
    try {
      if (asset.symbol === "WETH") {
        await wETHGatewayContract.withdrawETH(toWei(amount));
      } else {
        await lendingPoolContract.withdraw(
          asset.tokenAddress,
          toWei(amount),
          accounts[0]
        );
      }

      refresh();
    } catch (error) {
      console.log(error);
    }
  };

  if (asset === undefined) {
    return <p>Loading</p>;
  }
  return (
    <main>
      <section className="asset-container pt-5 pb-5 pr-5 pl-5 mt-6 mb-5">
        <div className="asset-name mb-5">
          <img
            className="mr-2"
            src={"/images/crypto_logos/" + asset.symbol.toLowerCase() + ".svg"}
            alt="Crypto Icon"
          />
          <h4>{asset.symbol}</h4>
        </div>

        <div className="asset-stats mb-5">
          <div>
            <p>Total Borrowed</p>
            <h4>$ {asset.totalBorrowed.toFixed(2)}</h4>
          </div>
          <div>
            <p>Available Liquidity</p>
            <h4>$ {asset.availableLiquidity.toFixed(2)}</h4>
          </div>
        </div>

        <div className="asset-info">
          <AssetInfo
            name="Deposit APY"
            value={asset.depositAPY.toFixed(2) + "%"}
          />
          <AssetInfo
            name="Borrow APY"
            value={asset.borrowAPY.toFixed(2) + "%"}
          />
          <AssetInfo name="Max LTV" value="75%" />
          <AssetInfo name="Liquidation Threshold" value="80%" />
          <AssetInfo name="Liquidation Penalty" value="10%" />
          <AssetInfo
            name="Percentage Utilization"
            value={(asset.utilizationRatio * 100).toFixed(2) + "%"}
          />
        </div>
      </section>

      <section className="market-container mb-8">
        <DepositSection
          currentDeposited={positions.currentDeposited}
          walletBalance={positions.walletBalance}
          depositERC20={depositERC20}
          symbol={asset.symbol}
          isApproved={positions.isApproved}
          approveToken={approveToken}
          withdrawAsset={withdrawAsset}
        />
        <BorrowSection
          currentBorrowed={positions.currentBorrowed}
          healthFactor={positions.healthFactor}
          walletBalance={positions.walletBalance}
          availableToBorrow={positions.availableToBorrow}
          symbol={asset.symbol}
          borrowAsset={borrowAsset}
          repayDebt={repayDebt}
        />
      </section>
    </main>
  );
}
export default AssetPage;

function AssetInfo({ name, value }) {
  return (
    <div>
      <p>{name}</p>
      <h4>{value}</h4>
    </div>
  );
}
