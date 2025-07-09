// scripts/deploy.cjs
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // 1) Deploy EventFactory first
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = await EventFactory.deploy();
  await eventFactory.waitForDeployment();
  console.log("  ↳ EventFactory:", eventFactory.target);

  // 2) Deploy TicketNFT with EventFactory address
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(eventFactory.target);
  await ticketNFT.waitForDeployment();
  console.log("  ↳ TicketNFT:", ticketNFT.target);

  // 3) Transfer ownership of TicketNFT to EventFactory
  console.log("Transferring ownership of TicketNFT to EventFactory...");
  await (await ticketNFT.transferOwnership(eventFactory.target)).wait();

  // 4) Set TicketNFT address inside EventFactory
  console.log("Setting TicketNFT in EventFactory...");
  await (await eventFactory.setTicketNFTContract(ticketNFT.target)).wait();

  // 5) Deploy POAPDistributor
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(ticketNFT.target);
  await poapDistributor.waitForDeployment();
  console.log("  ↳ POAPDistributor:", poapDistributor.target);

  // 6) Deploy CrossChainVerifier
  const CrossChainVerifier = await ethers.getContractFactory("CrossChainVerifier");
  const crossChainVerifier = await CrossChainVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  console.log("  ↳ CrossChainVerifier:", crossChainVerifier.target);

  // 7) Set ticketNFT mapping for Polygon
  await (await crossChainVerifier.setChainTicketContract(
    137,
    ticketNFT.target
  )).wait();

  // Summary
  console.log("\n✅ Deployment complete!");
  console.log("  • TicketNFT          :", ticketNFT.target);
  console.log("  • EventFactory       :", eventFactory.target);
  console.log("  • POAPDistributor    :", poapDistributor.target);
  console.log("  • CrossChainVerifier :", crossChainVerifier.target);

  // Optional: Verify on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    await hre.run("verify:verify", {
      address: eventFactory.target,
      constructorArguments: [],
    });
    await hre.run("verify:verify", {
      address: ticketNFT.target,
      constructorArguments: [eventFactory.target],
    });
    await hre.run("verify:verify", {
      address: poapDistributor.target,
      constructorArguments: [ticketNFT.target],
    });
    await hre.run("verify:verify", {
      address: crossChainVerifier.target,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });
