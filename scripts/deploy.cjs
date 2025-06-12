const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // Deploy EventFactory
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = await EventFactory.deploy();
  await eventFactory.waitForDeployment();
  const eventFactoryAddress = await eventFactory.getAddress();  // FIXED
  console.log("EventFactory deployed:", eventFactoryAddress);

  // Deploy TicketNFT
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(eventFactoryAddress);
  await ticketNFT.waitForDeployment();
  const ticketNFTAddress = await ticketNFT.getAddress();  // FIXED
  console.log("TicketNFT deployed:", ticketNFTAddress);

  // Deploy POAPDistributor
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(ticketNFTAddress);
  await poapDistributor.waitForDeployment();
  const poapDistributorAddress = await poapDistributor.getAddress();  // FIXED
  console.log("POAPDistributor deployed:", poapDistributorAddress);

  // Deploy CrossChainVerifier
  const CrossChainVerifier = await ethers.getContractFactory("CrossChainVerifier");
  const crossChainVerifier = await CrossChainVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  const crossChainVerifierAddress = await crossChainVerifier.getAddress();  // FIXED
  console.log("CrossChainVerifier deployed:", crossChainVerifierAddress);

  // Setup cross-chain mappings
  await crossChainVerifier.setChainTicketContract(137, ticketNFTAddress); // Polygon chainId

  console.log("\nDeployment complete:");
  console.log("EventFactory:", eventFactoryAddress);
  console.log("TicketNFT:", ticketNFTAddress);
  console.log("POAPDistributor:", poapDistributorAddress);
  console.log("CrossChainVerifier:", crossChainVerifierAddress);

  // Verify contracts if API key provided
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts on Etherscan...");
    await hre.run("verify:verify", {
      address: eventFactoryAddress,
      constructorArguments: [],
    });
    await hre.run("verify:verify", {
      address: ticketNFTAddress,
      constructorArguments: [eventFactoryAddress],
    });
    await hre.run("verify:verify", {
      address: poapDistributorAddress,
      constructorArguments: [ticketNFTAddress],
    });
    await hre.run("verify:verify", {
      address: crossChainVerifierAddress,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
