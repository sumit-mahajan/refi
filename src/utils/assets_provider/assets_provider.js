import React, { useContext, useState, useEffect, useCallback } from "react";
import { useConnection } from "../connection_provider/connection_provider";
import { calculateAPY, toEther } from "../helpers";
import { ethers } from "ethers";

const AssetContext = React.createContext();

const AssetsProvider = ({ children }) => {
  const [state, setState] = useState([]);
  const { protocolDataProvider, walletBalanceProvider } = useConnection();

  const refresh = useCallback(async () => {
    if (!protocolDataProvider) return;

    //Get All Assets
    const assets = await protocolDataProvider.getAllReservesTokens();

    //Get Asset Info for each Asset
    const promises = assets.map(async (asset) => {
      const assetInfo = await protocolDataProvider.getReserveData(
        asset.tokenAddress
      );

      const isWETH = asset.symbol === "WETH";

      const byte32 = ethers.utils.formatBytes32String(
        isWETH ? "ETH" : asset.symbol
      );

      const value = await walletBalanceProvider.getPriceInUsd(byte32);

      const priceInUsd = value / 1e8;

      const {
        liquidityRate,
        variableBorrowRate,
        totalVariableDebt,
        availableLiquidity,
        utilizationRate,
      } = assetInfo;

      const data = {
        symbol: isWETH ? "ETH" : asset.symbol,
        tokenAddress: asset.tokenAddress,
        depositAPY: calculateAPY(liquidityRate),
        borrowAPY: calculateAPY(variableBorrowRate),
        availableLiquidity: toEther(availableLiquidity),
        totalBorrowed: toEther(totalVariableDebt),
        availableLiquidityUsd: priceInUsd * toEther(availableLiquidity),
        totalBorrowedUsd: priceInUsd * toEther(totalVariableDebt),
        utilizationRatio: utilizationRate / 1e27,
        isERC20: isWETH,
        priceInUsd
      };

      return data;
    }, []);

    const data = await Promise.all(promises);

    setState(data);
  }, [protocolDataProvider, walletBalanceProvider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <AssetContext.Provider value={{ state, refresh }}>
        {children}
      </AssetContext.Provider>
    </>
  );
};

const useAssetProvider = () => useContext(AssetContext);

export { AssetsProvider, AssetContext, useAssetProvider };
