const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // const EventFactory = await ethers.getContractFactory("EventFactory");
// const eventFactory = await EventFactory.deploy();
// await eventFactory.waitForDeployment();
// console.log("EventFactory deployed:", await eventFactory.getAddress());

  // EventFactory already deployed:
  const eventFactoryAddress = "0x2198a5435C2ACdF4b27520D9c37Ed9eE88231F76";

  // Deploy TicketNFT
  // const TicketNFT = await ethers.getContractFactory("TicketNFT");
  // const ticketNFT = await TicketNFT.deploy(eventFactoryAddress);
  // await ticketNFT.waitForDeployment();
  // console.log("TicketNFT deployed:", await ticketNFT.getAddress());

  // Deploy POAPDistributor
  const ticketNFT ="0x73AF9Fa545f25734ECcC60A0d7F21Ac8d7b05E58";
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(ticketNFT);
  await poapDistributor.waitForDeployment();
  console.log("POAPDistributor deployed:", await poapDistributor.getAddress());

  // Deploy CrossChainVerifier
  const CrossChainVerifier = await ethers.getContractFactory("CrossChainVerifier");
  const crossChainVerifier = await CrossChainVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  console.log("CrossChainVerifier deployed:", await crossChainVerifier.getAddress());

  // Setup cross-chain mappings
  
  // await crossChainVerifier.setChainTicketContract(1, ticketNFT); // Ethereum chainId
  await crossChainVerifier.setChainTicketContract(137, ticketNFT); // Polygon chainId

  console.log("\nDeployment complete:");
  console.log("EventFactory:", eventFactoryAddress);
  console.log("TicketNFT:", ticketNFT);
  console.log("POAPDistributor:", await poapDistributor.getAddress());
  console.log("CrossChainVerifier:", await crossChainVerifier.getAddress());

  // Verify contracts if API key provided
  if (process.env.ETHERSCAN_API_KEY) {
  console.log("Verifying contracts on Etherscan...");
  await hre.run("verify:verify", {
    address: eventFactoryAddress,
    constructorArguments: [],
  });
  await hre.run("verify:verify", {
    address: ticketNFT,
    constructorArguments: [eventFactoryAddress],
  });
  await hre.run("verify:verify", {
    address: await poapDistributor.getAddress(),
    constructorArguments: [ticketNFT],
  });
  await hre.run("verify:verify", {
    address: await crossChainVerifier.getAddress(),
    constructorArguments: [],
  });
}

}

main()
  .then(() => process.exit(0))
  .catch(console.error);
