const { ethers } = require("hardhat");

async function main() {
  const contracts = {
    EventFactory: process.env.VITE_ETHEREUM_EVENT_FACTORY,
    TicketNFT: process.env.VITE_ETHEREUM_TICKET_NFT,
    POAPDistributor: process.env.VITE_ETHEREUM_POAP_DISTRIBUTOR,
    CrossChainVerifier: process.env.VITE_ETHEREUM_CROSS_CHAIN_VERIFIER,
  };

  console.log("Verifying contracts on Ethereum...");
  
  // Verify EventFactory
  await hre.run("verify:verify", {
    address: contracts.EventFactory,
    constructorArguments: [],
  });

  // Verify TicketNFT
  await hre.run("verify:verify", {
    address: contracts.TicketNFT,
    constructorArguments: [contracts.EventFactory],
  });

  // Verify POAPDistributor
  await hre.run("verify:verify", {
    address: contracts.POAPDistributor,
    constructorArguments: [contracts.TicketNFT],
  });

  // Verify CrossChainVerifier
  await hre.run("verify:verify", {
    address: contracts.CrossChainVerifier,
    constructorArguments: [],
  });

  console.log("Contract verification completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });