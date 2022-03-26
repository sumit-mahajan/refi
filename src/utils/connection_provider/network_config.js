const defaultChainId = 31337;

const supportedNetworks = {
  // npx hardhat node
  // npx hardhat run scripts/deploy.js --network localhost
  // Copy console address
  31337: {
    name: "Hardhat",
    tokenSymbol: "ETH",
    rpcURL: "http://localhost:8545",
    address: "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5",
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
  // npx hardhat run scripts/deployForSubgraph.js --network rinkeby
  // Copy console address
  4: {
    name: "Rinkeby",
    tokenSymbol: "ETH",
    rpcURL: "https://rinkeby-light.eth.linkpool.io/",
    address: "0xFA93ae5dFE5D363EE5f490a710354333b984e984",
  },
};

export { defaultChainId, supportedNetworks };
