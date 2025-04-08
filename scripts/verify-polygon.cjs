const { ethers } = require("hardhat");

async function main() {
  const contracts = {
    EventFactory: process.env.VITE_POLYGON_EVENT_FACTORY,
    TicketNFT: process.env.VITE_POLYGON_TICKET_NFT,
    POAPDistributor: process.env.VITE_POLYGON_POAP_DISTRIBUTOR,
  };

  console.log("Verifying contracts on Polygon...");
  
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

  console.log("Polygon contract verification completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });