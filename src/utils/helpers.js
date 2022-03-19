import { gql } from "@apollo/client";
const { ethers } = require("ethers");

const customPrint = (str) => {
  // console.log(str);
};

const toWei = (num) => {
  return ethers.utils.parseEther(num.toString());
};

const toEther = (num) => {
  return parseFloat(ethers.utils.formatEther(num.toString()));
};

const calculateAPY = (aprInWei) => {
  // const apr = toEther(aprInWei);
  const apr = (aprInWei * 100) / 1e27;

  let rate = apr / 2102400;

  rate = rate / 100;

  let apy = (1 + rate) ** 2102400 - 1;

  return apy * 100;
};

const MAX_UINT =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

const WETH_ADDRESS = "0x851356ae760d987E095750cCeb3bC6014560891C";

const query = gql`
  {
    users(where: { isBorrowingAny: true }) {
      id
      collateralReserve: reserves(where: { isUsingAsCollateral: true }) {
        reserve
      }
      borrowReserve: reserves(where: { isBorrowing: true }) {
        reserve
      }
    }
  }
`;

const getImageFromSymbol = (symbol) => {
  switch (symbol) {
    case "ETH":
      return "/images/eth.svg";
    case "DAI":
      return "/images/dai.svg";
    case "LINK":
      return "/images/link.svg";

    default:
      return "/images/eth.svg";
  }
};

const displayAddress = (address) =>
  address.substring(0, 5) +
  "..." +
  address.substring(address.length - 3, address.length);

export {
  toWei,
  toEther,
  customPrint,
  query,
  calculateAPY,
  getImageFromSymbol,
  displayAddress,
  MAX_UINT,
  WETH_ADDRESS,
};
