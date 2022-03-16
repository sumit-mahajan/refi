import React, { useEffect, useState } from "react";
import "../styles/asset-page.scss";
import { useConnection } from "../utils/connection_provider/connection_provider";
import { useLocation } from "react-router-dom";
import { MAX_UINT, toEther } from "../utils/helpers";
import BorrowSection from "../components/BorrowSection";
import SimpleTile from "../components/SimpleTile";
import DepositSection from "../components/DepositSection";
import { toWei } from "../utils/helpers";

function AssetPage() {
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

  let {
    state: { asset },
  } = useLocation();

  const [positions, setPositions] = useState({
    healthFactor: 0,
    currentBorrowed: 0,
    currentDeposited: 0,
    walletBalance: 0,
    availableToBorrow: 0,
  });

  useEffect(() => {
    fetchUserPositions();
  }, [lendingPoolContract, accounts, protocolDataProvider]);

  const fetchUserPositions = async () => {
    if (accounts.length === 0) return;
    if (walletBalanceProvider === null) return;
    if (protocolDataProvider === null) return;

    const data = await protocolDataProvider.getUserReserveData(
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
    } = data;

    setPositions({
      currentBorrowed: toEther(currentVariableDebt),
      healthFactor: toEther(healthFactor),
      currentDeposited: toEther(currentATokenBalance),
      walletBalance: toEther(walletBalance),
      availableToBorrow: toEther(availableToBorrow),
    });
  };

  const depositERC20 = async (amount) => {
    try {
      if (asset.symbol === "WETH") {
        await wETHGatewayContract.depositETH({
          value: toWei(amount),
        });

        return;
      } else {
        await lendingPoolContract.deposit(
          asset.tokenAddress,
          toWei(amount),
          accounts[0]
        );
      }

      window.location.reload(false);
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

      window.location.reload(false);
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

      window.location.reload(false);
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

      window.location.reload(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main>
      <section className="asset-container pt-5 pb-5 pr-5 pl-5 mt-6 mb-5">
        <div className="asset-name mb-5">
          <img
            className="mr-2"
            src="https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png"
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
            name="Utilization Ratio"
            value={asset.utilizationRatio + "%"}
          />
        </div>
      </section>

      <section className="market-container mb-8">
        <BorrowSection
          currentBorrowed={positions.currentBorrowed}
          healthFactor={positions.healthFactor}
          walletBalance={positions.walletBalance}
          availableToBorrow={positions.availableToBorrow}
          symbol={asset.symbol}
          borrowAsset={borrowAsset}
          repayDebt={repayDebt}
        />
        <DepositSection
          currentDeposited={positions.currentDeposited}
          walletBalance={positions.walletBalance}
          depositERC20={depositERC20}
          symbol={asset.symbol}
          approveToken={approveToken}
          withdrawAsset={withdrawAsset}
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
