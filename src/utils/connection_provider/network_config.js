const defaultChainId = 31337;

const supportedNetworks = {
  // npx hardhat node
  // npx hardhat run scripts/deployForHardhat.js --network localhost
  // Copy console address
  31337: {
    name: "Hardhat",
    tokenSymbol: "ETH",
    rpcURL: "http://localhost:8545",
    address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  },
  // npx hardhat run scripts/deploy.js --network mumbai
  // Returned address is wrong. https://github.com/nomiclabs/hardhat/issues/2162.
  // Copy address from polygonscan
  80001: {
    name: "Mumbai",
    tokenSymbol: "MATIC",
    rpcURL: "https://rpc-mumbai.maticvigil.com",
    address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  },
  // npx hardhat run scripts/deployForRinkeby.js --network rinkeby
  // Copy console address
  4: {
    name: "Rinkeby",
    tokenSymbol: "ETH",
    rpcURL: "https://rinkeby-light.eth.linkpool.io/",
    address: "0x8DaFB181A28924F4bF8936BD732802ef0FF7982C",
  },
};

export { defaultChainId, supportedNetworks };
