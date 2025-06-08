import { ethers, Interface } from 'ethers';
import EventFactory from '../../artifacts/contracts/EventFactory.sol/EventFactory.json';
import TicketNFT from '../../artifacts/contracts/TicketNFT.sol/TicketNFT.json';
import { uploadToIPFS, getFromIPFS, IPFS_GATEWAY } from './ipfs';

const CHAINS = {
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
    id: 137,
    name: 'Polygon',
    rpc: import.meta.env.VITE_POLYGON_RPC,
    contracts: {
      eventFactory: import.meta.env.VITE_POLYGON_EVENT_FACTORY,
      ticketNFT: import.meta.env.VITE_POLYGON_TICKET_NFT,
    },
  },
};

// Connect Wallet
export const connectWallet = async () => {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
};

// Get EventFactory contract instance
export const getEventFactoryContract = (signerOrProvider, chain = 'POLYGON') => {
  const chainConfig = CHAINS[chain.toUpperCase()];
  return new ethers.Contract(chainConfig.contracts.eventFactory, EventFactory.abi, signerOrProvider);
};

// Create Event
export const createEvent = async (signer, eventDetails) => {
  const { name, date, description, chain, maxTickets, imageFile, attributes } = eventDetails;

  // Build metadata
  const metadata = {
    name,
    description,
    date: date.toISOString(),
    attributes: attributes || [],
  };

  // Upload metadata + image
  const { cid: ipfsCID } = await uploadToIPFS(metadata);

  const chainConfig = CHAINS[chain.toUpperCase()];
  const eventFactory = new ethers.Contract(
    chainConfig.contracts.eventFactory,
    EventFactory.abi,
    signer
  );

  const tx = await eventFactory.createEvent(
    name,
    Math.floor(date.getTime() / 1000),
    ipfsCID,
    maxTickets
  );
  const receipt = await tx.wait();

  const iface = new Interface(EventFactory.abi);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === 'EventCreated') {
        return {
          eventId: parsed.args.eventId,
          ipfsCID,
          transactionHash: receipt.hash,
        };
      }
    } catch {}
  }

  throw new Error('EventCreated not found in logs');
};

// Purchase Ticket
export const purchaseTicket = async (signer, eventId, chain) => {
  const chainKey = chain.toUpperCase();
  const chainConfig = CHAINS[chainKey];
  if (!chainConfig) throw new Error(`Unsupported chain: ${chainKey}`);

  const eventFactory = new ethers.Contract(
    chainConfig.contracts.eventFactory,
    EventFactory.abi,
    signer
  );

  const eventDetails = await eventFactory.events(eventId);
  const ipfsCID = eventDetails.ipfsCID;

  const ticketContract = new ethers.Contract(
    chainConfig.contracts.ticketNFT,
    TicketNFT.abi,
    signer
  );

  const tx = await ticketContract.mintTicket(
    await signer.getAddress(),
    eventId,
    ipfsCID
  );

  const receipt = await tx.wait();
  const iface = new Interface(TicketNFT.abi);

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed.name === 'TicketMinted') {
        return {
          tokenId: parsed.args.tokenId,
          transactionHash: receipt.hash,
        };
      }
    } catch {}
  }

  throw new Error('TicketMinted not found in logs');
};

// Fetch created events (parse IPFS metadata properly)
export async function fetchCreatedEvents(provider, chain = 'POLYGON') {
  try {
    const chainKey = chain.toUpperCase();
    const chainConfig = CHAINS[chainKey];
    if (!chainConfig) throw new Error(`Unsupported chain: ${chain}`);

    const eventFactoryAddress = chainConfig.contracts.eventFactory;
    const iface = new Interface(EventFactory.abi);

    const filter = {
      address: eventFactoryAddress,
      topics: [ethers.id('EventCreated(uint256,address,string)')],
      fromBlock: 20212544,
      toBlock: 'latest',
    };

    const logs = await provider.getLogs(filter);

    const parsed = await Promise.all(
      logs.map(async (log) => {
        const decoded = iface.decodeEventLog('EventCreated', log.data, log.topics);
        const eventId = decoded.eventId.toString();
        const ipfsCID = decoded.ipfsCID;

        const contract = new ethers.Contract(eventFactoryAddress, EventFactory.abi, provider);
        const ev = await contract.events(eventId);

        // Fetch metadata.json from IPFS
        let metadata = {};
        try {
          metadata = await getFromIPFS(ipfsCID, 'metadata.json');
        } catch (err) {
          console.warn(`Failed to fetch IPFS metadata for CID ${ipfsCID}`);
        }

        return {
          id: eventId,
          title: ev.name,
          date: new Date(Number(ev.date) * 1000).toISOString().split('T')[0],
          chain: chain.toLowerCase(),
          price: '0.00',
          remaining: 'N/A',
          total: 'N/A',
          image: metadata.image
            ? metadata.image.replace('ipfs://', `${IPFS_GATEWAY}/`)
            : `${IPFS_GATEWAY}/${ipfsCID}/image.png`,
        };
      })
    );

    return parsed;
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    return [];
  }
}

// Fetch user tickets
export async function fetchUserTickets(address, provider, chain = 'POLYGON') {
  try {
    const chainKey = chain.toUpperCase();
    const chainConfig = CHAINS[chainKey];
    if (!chainConfig) throw new Error(`Unsupported chain: ${chainKey}`);

    const ticketNFT = new ethers.Contract(
      chainConfig.contracts.ticketNFT,
      TicketNFT.abi,
      provider
    );

    const iface = new Interface(TicketNFT.abi);
    const filter = {
      address: chainConfig.contracts.ticketNFT,
      topics: [
        ethers.id('TicketMinted(uint256,address,uint256)'),
        null,
        ethers.zeroPadValue(address, 32), // pad address
      ],
      fromBlock: 20212544,
      toBlock: 'latest',
    };

    const logs = await provider.getLogs(filter);
    const tickets = await Promise.all(
      logs.map(async (log) => {
        const parsed = iface.parseLog(log);
        const tokenId = parsed.args.tokenId.toString();
        const tokenURI = await ticketNFT.tokenURI(tokenId);

        // Optional: fetch tokenURI metadata
        let metadata = {};
        try {
          const ipfsUrl = tokenURI.replace('ipfs://', `${IPFS_GATEWAY}/`);
          const res = await fetch(ipfsUrl);
          metadata = await res.json();
        } catch (err) {
          console.warn(`Failed to fetch tokenURI metadata for tokenId ${tokenId}`);
        }

        return {
          tokenId,
          tokenURI,
          chain: chain.toLowerCase(),
          metadata,
        };
      })
    );

    return tickets;
  } catch (err) {
    console.error('Failed to fetch user tickets:', err);
    return [];
  }
}
