const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy EventFactory
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = await EventFactory.deploy();
  await eventFactory.waitForDeployment();
  console.log("EventFactory deployed to:", await eventFactory.getAddress());

  // Deploy TicketNFT with EventFactory address
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(await eventFactory.getAddress());
  await ticketNFT.waitForDeployment();
  console.log("TicketNFT deployed to:", await ticketNFT.getAddress());

  // Deploy POAPDistributor with TicketNFT address
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(await ticketNFT.getAddress());
  await poapDistributor.waitForDeployment();
  console.log("POAPDistributor deployed to:", await poapDistributor.getAddress());

  // Deploy CrossChainVerifier
  const CrossChainVerifier = await ethers.getContractFactory("CrossChainVerifier");
  const crossChainVerifier = await CrossChainVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  console.log("CrossChainVerifier deployed to:", await crossChainVerifier.getAddress());

  // Set up cross-chain verification
  await crossChainVerifier.setChainTicketContract(1, await ticketNFT.getAddress()); // Ethereum
  await crossChainVerifier.setChainTicketContract(137, await ticketNFT.getAddress()); // Polygon

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("EventFactory:", await eventFactory.getAddress());
  console.log("TicketNFT:", await ticketNFT.getAddress());
  console.log("POAPDistributor:", await poapDistributor.getAddress());
  console.log("CrossChainVerifier:", await crossChainVerifier.getAddress());

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying contracts on Etherscan...");
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

    await hre.run("verify:verify", {
      address: await crossChainVerifier.getAddress(),
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });