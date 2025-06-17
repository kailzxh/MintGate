import { ethers, Interface, parseEther } from 'ethers'

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
  return new ethers.Contract(cfg.contracts.eventFactory, EventFactoryJson.abi, signerOrProvider);
}

export function getTicketNFTContract(signerOrProvider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  if (!cfg) throw new Error(`Unsupported chain: ${chain}`);
  return new ethers.Contract(cfg.contracts.ticketNFT, TicketNFTJson.abi, signerOrProvider);
}

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
          transactionHash: receipt.transactionHash,
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
export async function purchaseTicket(signer, eventId, chain) {
  const cfg = CHAINS[chain.toUpperCase()];
  if (!cfg) throw new Error(`Unsupported chain: ${chain}`);

  const factory = getEventFactoryContract(signer, chain);
  const ticketNFT = getTicketNFTContract(signer, chain);

  const details = await factory.events(eventId);
  const ipfsCID = details.ipfsCID;

  const tx = await ticketNFT.mintTicket(await signer.getAddress(), eventId, ipfsCID);
  const receipt = await tx.wait();

  const iface = new Interface(TicketNFTJson.abi);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === 'TicketMinted') {
        return {
          tokenId: parsed.args.tokenId.toString(),
          transactionHash: receipt.transactionHash,
        };
      }
    } catch {}
  }

  throw new Error('TicketMinted event not found in logs');
}

// Fetch created events
export async function fetchCreatedEvents(provider, chain = 'POLYGON') {
  const cfg = CHAINS[chain.toUpperCase()];
  const factoryAddr = cfg.contracts.eventFactory;
  const iface = new Interface(EventFactoryJson.abi);
  const filter = {
    address: factoryAddr,
    topics: [ethers.id('EventCreated(uint256,address,string,string)')],
    fromBlock: 20212544,
    toBlock: 'latest',
  };

  const logs = await provider.getLogs(filter);
  return Promise.all(
    logs.map(async (log) => {
      const decoded = iface.decodeEventLog('EventCreated', log.data, log.topics);
      const eventId = decoded.eventId.toString();
      const ipfsCID = decoded.ipfsCID;

      const contract = new ethers.Contract(factoryAddr, EventFactoryJson.abi, provider);
      const ev = await contract.getEventDetails(eventId);

      let metadata = {};
      try {
        metadata = await getFromIPFS(ipfsCID, 'metadata.json');
      } catch {}

      return {
        id: eventId,
        name: ev.name,
        date: new Date(Number(ev.date) * 1000).toISOString().split('T')[0],
        chain: chain.toLowerCase(),
        price: ethers.formatEther(ev.pricePerTicket),
        remaining: ev.ticketsRemaining.toString(),
        image: metadata.image
          ? metadata.image.replace('ipfs://', `${IPFS_GATEWAY}/`)
          : `${IPFS_GATEWAY}/${ipfsCID}/image.png`,
      };
    })
  );
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
    fromBlock: 20212544,
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
