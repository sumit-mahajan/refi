const defaultChainId = 31337;

const supportedNetworks = {
  // npx hardhat node
  // npx hardhat run scripts/deploy.js --network localhost
  // Copy console address
  31337: {
    name: "Hardhat",
    tokenSymbol: "ETH",
    rpcURL: "http://localhost:8545",
    address: "0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f",
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
  // npx hardhat run scripts/deploy.js --network rinkeby
  // Copy console address
  4: {
    name: "Rinkeby",
    tokenSymbol: "ETH",
    rpcURL: "https://rinkeby-light.eth.linkpool.io/",
    address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  },
};

export { defaultChainId, supportedNetworks };
