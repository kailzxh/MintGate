require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {},
    ethereum: {
      url: process.env.VITE_ETHEREUM_RPC,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    },
    polygon: {
      url: process.env.VITE_POLYGON_RPC,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY, 
      sepolia: process.env.ETHERSCAN_API_KEY,       
    },
  },
};

module.exports = config;
