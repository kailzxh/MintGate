import React, { useState, useEffect } from 'react';
import { connectWallet, purchaseTicket } from '../utils/web3';
import { isAddress } from 'ethers';

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs'
];

function EventCard({ event }) {
  const {
    id = '',
    name = '',
    date = null,
    chain = 'ethereum',
    price = 0,
    image: rawImage = '',
    remaining = 0,
    totalTickets = 0
  } = event;

  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const fallbackImage = 'https://placehold.co/400x300?text=No+Image';

  const formatDate = (ts) => {
    if (!ts) return 'Unknown Date';
    const d = ts instanceof Date ? ts : new Date(ts);
    return isNaN(d.getTime())
      ? 'Invalid Date'
      : d.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
  };

  useEffect(() => {
    if (!rawImage) {
      setImgSrc(fallbackImage);
      return;
    }

    async function resolveImage() {
      try {
        let imageUrl = rawImage.trim();
        let candidates = [];

        const isIPFS = imageUrl.startsWith('ipfs://');
        const isCIDOnly = /^[a-zA-Z0-9]+$/.test(imageUrl);

        if (isIPFS) {
          const [, cid, ...pathParts] = imageUrl.split('/');
          const path = pathParts.join('/');
          candidates = IPFS_GATEWAYS.map((gw) => `${gw}/${cid}/${path}`);
        } else if (isCIDOnly) {
          candidates = IPFS_GATEWAYS.map((gw) => `${gw}/${imageUrl}`);
        } else if (imageUrl.startsWith('http')) {
          candidates = [imageUrl];
        } else {
          setImgSrc(fallbackImage);
          return;
        }

        for (let url of candidates) {
          try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
              setImgSrc(url);
              return;
            }
          } catch (_) {}
        }

        setImgSrc(fallbackImage);
      } catch (e) {
        console.error('Image resolution error:', e);
        setImgSrc(fallbackImage);
      }
    }

    resolveImage();
  }, [rawImage]);

  const handlePurchase = async () => {
    setLoadingPurchase(true);
    setError('');
    try {
      const signer = await connectWallet();
      const addr = await signer.getAddress();
      if (!isAddress(addr)) throw new Error('Invalid wallet address');
      const tx = await purchaseTicket(signer, id, chain, quantity);
      alert(`🎟️ ${quantity} ticket(s) purchased!\nTransaction: ${tx.transactionHash}`);
    } catch (err) {
      console.error('Purchase failed:', err);
      let msg = err.message || 'Purchase failed';
      if (msg.includes('network does not support ENS')) {
        msg = 'ENS not supported on this network. Use a valid wallet address.';
      }
      setError(msg);
    } finally {
      setLoadingPurchase(false);
    }
  };

  const maxQty = Math.max(0, Number(remaining));

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.5)] transition-shadow duration-300 flex flex-col text-white">
      <div className="relative h-48 w-full">
        <img
          src={imgSrc || fallbackImage}
          alt={name || 'Event Image'}
          onError={() => setImgSrc(fallbackImage)}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/40 text-sm font-semibold text-white shadow">
          {chain === 'ethereum' ? 'ETH' : 'POL'} {(Number(price) || 0).toFixed(2)}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="font-poppins font-semibold text-xl text-white mb-1 truncate">
            {name || 'Untitled Event'}
          </h3>
          <p className="text-gray-200 text-sm">{formatDate(date)}</p>
          <p className="text-sm text-gray-300 mt-2">
            🎟️ Tickets Remaining: {remaining} {totalTickets ? `/ ${totalTickets}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-auto">
          <input
            type="number"
            min="1"
            max={maxQty}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))
            }
            className="w-20 px-2 py-1 border border-white/20 rounded-md text-sm text-gray-800 bg-white/70 backdrop-blur-sm"
            disabled={maxQty === 0}
          />
          <button
            onClick={handlePurchase}
            disabled={loadingPurchase || quantity < 1 || quantity > maxQty}
            className={`text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              loadingPurchase || maxQty === 0
                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {loadingPurchase
              ? 'Processing…'
              : maxQty === 0
              ? 'Sold Out'
              : `Buy ${quantity > 1 ? `${quantity} Tickets` : 'Ticket'}`}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>}
      </div>
    </div>
  );
}

export default EventCard;
