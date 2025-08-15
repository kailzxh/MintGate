import { ethers, Interface, parseEther } from 'ethers';
import EventFactoryJson from '../../artifacts/contracts/EventFactory.sol/EventFactory.json';
import TicketNFTJson from '../../artifacts/contracts/TicketNFT.sol/TicketNFT.json';
import { uploadToIPFS, getFromIPFS, IPFS_GATEWAY } from './ipfs';


export const CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    rpc: import.meta.env.VITE_ETHEREUM_RPC,
    contracts: {
      eventFactory: import.meta.env.VITE_ETHEREUM_EVENT_FACTORY,
      ticketNFT: import.meta.env.VITE_ETHEREUM_TICKET_NFT,
    },
  },
  POLYGON: {
    id: 80002,
    name: 'Polygon',
    rpc: import.meta.env.VITE_POLYGON_RPC,
    contracts: {
      eventFactory: import.meta.env.VITE_POLYGON_EVENT_FACTORY,
      ticketNFT: import.meta.env.VITE_POLYGON_TICKET_NFT,
    },
  },
};

// Connect to MetaMask and return a signer
export async function connectWallet() {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export function getEventFactoryContract(signerOrProvider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  if (!cfg) throw new Error(`Unsupported chain: ${chain}`);

  // Sometimes env‑var strings include "KEY=0x…". Split and grab only the hex.
  let raw = cfg.contracts.eventFactory;
  if (raw.includes('=')) raw = raw.split('=').pop().trim();

  const factoryAddr = ethers.getAddress(raw);
  return new ethers.Contract(factoryAddr, EventFactoryJson.abi, signerOrProvider);
}

export function getTicketNFTContract(signerOrProvider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  if (!cfg) throw new Error(`Unsupported chain: ${chain}`);

  // Strip off any "KEY=" prefix and use only the hex
  let raw = cfg.contracts.ticketNFT;
  if (raw.includes('=')) raw = raw.split('=').pop().trim();

  const nftAddr = ethers.getAddress(raw);
  return new ethers.Contract(nftAddr, TicketNFTJson.abi, signerOrProvider);}

// Create a new event
export async function createEvent(signer, details) {
  const { name, description, date, chain, maxTickets, imageFile, price } = details;

  if (!name || !description || !date || !imageFile || !price || !maxTickets) {
    throw new Error('Missing required event details');
  }

  const ticketCount = BigInt(maxTickets);
  const priceValue = parseFloat(price);
  if (ticketCount <= 0) throw new Error('maxTickets must be > 0');
  if (isNaN(priceValue) || priceValue <= 0) throw new Error('price must be > 0');

  // Convert date to midnight UTC + 1 day
  const selectedDate = new Date(date);
  selectedDate.setUTCHours(0, 0, 0, 0);
  selectedDate.setUTCDate(selectedDate.getUTCDate() + 1);
  let eventTimestamp = Math.floor(selectedDate.getTime() / 1000);

  const provider = signer.provider;
  const latest = await provider.getBlock('latest');
  if (eventTimestamp <= latest.timestamp) {
    eventTimestamp = latest.timestamp + 3600; // 1 hour into the future
  }

  // Upload image
  const { cid: imageCID } = await uploadToIPFS(imageFile);

  // Upload metadata
  const metadata = {
    name,
    description,
    image: `ipfs://${imageCID}/${imageFile.name || 'image.png'}`,
    date: eventTimestamp,
    chain,
    ticketCount: Number(ticketCount),
    pricePerTicket: priceValue,
  };
  const { cid: metadataCID } = await uploadToIPFS(metadata);

  // Prepare contract
  const eventFactory = getEventFactoryContract(signer, chain);
  const priceInWei = parseEther(priceValue.toString());

  console.log("Final data before transaction:", {
    name,
    eventTimestamp,
    metadataCID: metadataCID.toString(),
    imageCID: imageCID.toString(),
    ticketCount: ticketCount.toString(),
    priceInWei: priceInWei.toString(),
  });

  // Optional: callStatic debug for timestamp
  try {
    await eventFactory.callStatic.createEvent(
      name,
      eventTimestamp,
      metadataCID.toString(),
      imageCID.toString(),
      ticketCount,
      priceInWei
    );
  } catch (err) {
    const logs = err.error?.logs || [];
    const topic = ethers.id("DebugTimestamps(uint256,uint256)");
    const dbg = logs.find(l => l.topics[0] === topic);
    if (dbg) {
      const { args } = new Interface(EventFactoryJson.abi).parseLog(dbg);
      console.log('↳ on-chain now:', args.nowTime.toString());
      console.log('↳ your input date:', args.inputDate.toString());
      throw new Error('Your chosen date is before the current block timestamp.');
    }
  }

  // Estimate gas
  let gasLimit;
  try {
    const estimate = await eventFactory.createEvent.estimateGas(
      name,
      eventTimestamp,
      metadataCID.toString(),
      imageCID.toString(),
      ticketCount,
      priceInWei
    );
    gasLimit = estimate * 2n; // Use BigInt if using ethers v6
  } catch (err) {
    console.error('Gas estimate failed:', err);
    const reason = err?.error?.message || err?.message || 'Gas estimation failed';
    throw new Error(`Cannot create event: ${reason}`);
  }

  // Send transaction
  const tx = await eventFactory.createEvent(
    name,
    eventTimestamp,
    metadataCID.toString(),
    imageCID.toString(),
    ticketCount,
    priceInWei
    // { gasLimit }
  );

  const receipt = await tx.wait();

  const iface = new Interface(EventFactoryJson.abi);
  let createdEvent = null;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);

      if (parsed.name === 'DebugTimestamps') {
        console.log('🕒 On-chain time:', parsed.args.nowTime.toString());
        console.log('📅 Provided date:', parsed.args.inputDate.toString());
      }

      if (parsed.name === 'EventCreated') {
        createdEvent = {
          eventId: parsed.args.eventId.toString(),
          ipfsCID: metadataCID.toString(),
          imageCID: imageCID.toString(),
          transactionHash: tx.hash,
        };
      }
    } catch (err) {
      // Ignore non-matching logs
    }
  }

  if (!createdEvent) {
    throw new Error('EventCreated event not found in logs');
  }

  return createdEvent;
}

// Purchase ticket



export async function purchaseTicket(
  signer,
  eventId,
  chain,
  quantity = 1
) {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  // 1) Buy ERC-1155 tickets from EventFactory
  const factory = getEventFactoryContract(signer, chain);
  const ev = await factory.events(eventId);
  // ev.pricePerTicket is a BigInt in ethers v6
  const pricePerTicket = ev.pricePerTicket;
  const totalPrice = pricePerTicket * BigInt(quantity);

  const tx1 = await factory.purchaseTicket(eventId, quantity, {
    value: totalPrice
  });
  await tx1.wait();

  // 2) Convert ERC-1155 into ERC-721 via TicketNFT
  const ticketNFT = getTicketNFTContract(signer, chain);
  // await approveTicketNFTIfNeeded(signer, chain);
  const tx2 = await ticketNFT.mintTicketsFromFactory(eventId, quantity);
  const receipt2 = await tx2.wait();

  // 3) Parse TicketMinted logs
  const iface = new Interface(TicketNFTJson.abi);
  const results = [];

  for (const log of receipt2.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === 'TicketMinted') {
        results.push({
          tokenId: parsed.args.tokenId.toString(),
          transactionHash: receipt2.transactionHash
        });
      }
    } catch {
      // ignore non-TicketMinted logs
    }
  }

  if (results.length === 0) {
    throw new Error('No TicketMinted events found after conversion');
  }

  // Return single object or array
  return quantity === 1 ? results[0] : results;
}






// Fetch created events
export async function fetchCreatedEvents(provider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  const factoryAddr = ethers.getAddress(cfg.contracts.eventFactory);
  const iface = new Interface(EventFactoryJson.abi);

  const filter = {
    address: factoryAddr,
    topics:  [ethers.id('EventCreated(uint256,address,string,string)')],
    fromBlock: 25000000,
    toBlock:   'latest',
  };

  const logs = await provider.getLogs(filter);
  const events = await Promise.all(
    logs.map(async (log) => {
      try {
        const decoded = iface.decodeEventLog('EventCreated', log.data, log.topics);
        const eventId     = decoded.eventId.toString();
        const metadataCID = decoded.ipfsCID;
        const imageCID    = decoded.imageCID;

        const contract = new ethers.Contract(factoryAddr, EventFactoryJson.abi, provider);
        const ev       = await contract.getEventDetails(eventId);

        let metadata = {};
        try {
          metadata = await getFromIPFS(metadataCID, 'metadata.json');
        } catch (err) {
          console.warn(`Failed to fetch metadata for ${eventId}:`, err);
        }

        const ticketsRemaining = Number(ev.ticketsRemaining ?? 0);
        const totalTickets     = metadata.ticketCount != null
          ? Number(metadata.ticketCount)
          : ticketsRemaining;

        const image = metadata.image
          ? metadata.image.replace('ipfs://', `${IPFS_GATEWAY}/`)
          : `${IPFS_GATEWAY}/${imageCID}/image.png`;

        return {
          id:           eventId,
          name:         ev.name,
          date:         new Date(Number(ev.date) * 1000).toISOString().split('T')[0],
          chain:        chain.toLowerCase(),
          price:        ethers.formatEther(ev.pricePerTicket.toString()),
          remaining:    ticketsRemaining,
          totalTickets,
          ipfsCID:      metadataCID,
          imageCID,
          image,
        };
      } catch (err) {
        console.error('Failed to decode log or fetch details:', err);
        return null;
      }
    })
  );

  return events.filter(Boolean);
}




// Fetch user tickets
export async function fetchUserTickets(address, provider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  const ticketNFT = getTicketNFTContract(provider, chain);
  const iface = new Interface(TicketNFTJson.abi);

  const filter = {
    address: cfg.contracts.ticketNFT,
    topics: [
      ethers.id('TicketMinted(uint256,address,uint256)'),
      null,
      ethers.zeroPadValue(address, 32),
    ],
    fromBlock: 25000000,
    toBlock: 'latest',
  };

  const logs = await provider.getLogs(filter);
  return Promise.all(
    logs.map(async (log) => {
      const parsed = iface.parseLog(log);
      const tokenId = parsed.args.tokenId.toString();
      const tokenURI = await ticketNFT.tokenURI(tokenId);

      let metadata = {};
      try {
        const ipfsUrl = tokenURI.replace('ipfs://', `${IPFS_GATEWAY}/`);
        const res = await fetch(ipfsUrl);
        metadata = await res.json();
      } catch {}

      return { tokenId, tokenURI, metadata };
    })
  );
}





// export async function approveTicketNFTIfNeeded(signer, chain = 'polygon') {
//   const userAddress = await signer.getAddress();

//   const ticketNFTContract = getTicketNFTContract(signer, chain);
//   const eventFactoryContract = getEventFactoryContract(signer, chain);

//   const ticketNFTAddress = ticketNFTContract.target;
//   const eventFactoryAddress = eventFactoryContract.target;

//   const ERC1155_ABI = [
//     "function setApprovalForAll(address operator, bool approved) external",
//     "function isApprovedForAll(address owner, address operator) external view returns (bool)"
//   ];

//   const erc1155 = new ethers.Contract(ticketNFTAddress, ERC1155_ABI, signer);

//   try {
//     const isApproved = await erc1155.isApprovedForAll(userAddress, eventFactoryAddress);
//     if (!isApproved) {
//       const tx = await erc1155.setApprovalForAll(eventFactoryAddress, true);
//       await tx.wait();
//       console.log(`✅ Approved EventFactory (${eventFactoryAddress}) to manage your ERC-1155 tickets`);
//     } else {
//       console.log(`ℹ️ EventFactory is already approved to manage your tickets`);
//     }
//   } catch (err) {
//     console.error('❌ Approval check or transaction failed:', err);
//     throw err;
//   }
// }
