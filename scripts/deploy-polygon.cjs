const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Polygon with the account:", deployer.address);

  // Deploy EventFactory on Polygon
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = await EventFactory.deploy();
  await eventFactory.waitForDeployment();
  console.log("EventFactory deployed to Polygon:", await eventFactory.getAddress());

  // Deploy TicketNFT with EventFactory address
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(await eventFactory.getAddress());
  await ticketNFT.waitForDeployment();
  console.log("TicketNFT deployed to Polygon:", await ticketNFT.getAddress());

  // Deploy POAPDistributor with TicketNFT address
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(await ticketNFT.getAddress());
  await poapDistributor.waitForDeployment();
  console.log("POAPDistributor deployed to Polygon:", await poapDistributor.getAddress());

  console.log("\nPolygon Deployment Summary:");
  console.log("-------------------------");
  console.log("EventFactory:", await eventFactory.getAddress());
  console.log("TicketNFT:", await ticketNFT.getAddress());
  console.log("POAPDistributor:", await poapDistributor.getAddress());

  // Verify contracts on Polygonscan
  if (process.env.POLYGONSCAN_API_KEY) {
    console.log("\nVerifying contracts on Polygonscan...");
    await hre.run("verify:verify", {
      address: await eventFactory.getAddress(),
      constructorArguments: [],
    });

    await hre.run("verify:verify", {
      address: await ticketNFT.getAddress(),
      constructorArguments: [await eventFactory.getAddress()],
    });

    await hre.run("verify:verify", {
      address: await poapDistributor.getAddress(),
      constructorArguments: [await ticketNFT.getAddress()],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });