// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // 1) Deploy EventFactory
  const EventFactory = await ethers.getContractFactory("EventFactory");
  const eventFactory = await EventFactory.deploy();
  await eventFactory.waitForDeployment();
  console.log("  ↳ EventFactory:", eventFactory.target);

  // 2) Deploy TicketNFT and point it at EventFactory
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const ticketNFT = await TicketNFT.deploy(eventFactory.target);
  await ticketNFT.waitForDeployment();
  console.log("  ↳ TicketNFT:", ticketNFT.target);

  // 3) Wire them up:
  //
  //   • EventFactory needs to know who its TicketNFT is (so it can burn ERC1155 tokens)
  //   • TicketNFT needs to know who its minter is
  console.log("Wiring EventFactory ⇄ TicketNFT...");
  await (await eventFactory.setTicketNFTContract(ticketNFT.target)).wait();
  await (await ticketNFT.setMinter(eventFactory.target)).wait();

  // 4) Deploy POAPDistributor pointing at TicketNFT
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(ticketNFT.target);
  await poapDistributor.waitForDeployment();
  console.log("  ↳ POAPDistributor:", poapDistributor.target);

  // 5) Deploy CrossChainVerifier (if you have one)
  const CrossChainVerifier = await ethers.getContractFactory("CrossChainVerifier");
  const crossChainVerifier = await CrossChainVerifier.deploy();
  await crossChainVerifier.waitForDeployment();
  console.log("  ↳ CrossChainVerifier:", crossChainVerifier.target);

  // 6) (Optional) set up any cross-chain mappings
  //    e.g. if on Polygon (chainId 137) you want to be able to verify TicketNFTs:
  await (await crossChainVerifier.setChainTicketContract(
    /* chainId: */ 137,
    ticketNFT.target
  )).wait();

  console.log("\nDeployment complete!");
  console.log("  • EventFactory       :", eventFactory.target);
  console.log("  • TicketNFT          :", ticketNFT.target);
  console.log("  • POAPDistributor    :", poapDistributor.target);
  console.log("  • CrossChainVerifier:", crossChainVerifier.target);

  // 7) (Optional) verify on Etherscan if you have an ETHERSCAN_API_KEY
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
    console.error(err);
    process.exit(1);
  });
