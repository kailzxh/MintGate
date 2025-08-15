
import React, { useState, useEffect, useContext } from 'react';
import { connectWallet, purchaseTicket, fetchCreatedEvents } from '../utils/web3';
import { isAddress } from 'ethers';
import { ThemeContext } from '../contexts/ThemeContext'; // assumes you have a ThemeContext

const IPFS_GATEWAYS = [
  
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs'
];

const themeStyles = {
  light: {
    cardBg: 'bg-white/10 border-white/30 text-gray-900',
    blur: 'backdrop-blur-xl',
    border: 'border-white/30',
    shadow: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
    shadowHover: 'hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.5)]',
    primaryText: 'text-gray-900',
    secondaryText: 'text-gray-700',
    accentText: 'text-indigo-500',
    inputBg: 'bg-white/70',
    inputText: 'text-gray-800',
    inputBorder: 'border-white/20',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
    buttonText: 'text-white',
    buttonDisabled: 'bg-gray-400 text-gray-300 cursor-not-allowed'
  },
  dark: {
    cardBg: 'bg-black/20 border-black/30 text-gray-100',
    blur: 'backdrop-blur-xl',
    border: 'border-black/30',
    shadow: 'shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]',
    shadowHover: 'hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.7)]',
    primaryText: 'text-gray-100',
    secondaryText: 'text-gray-300',
    accentText: 'text-indigo-400',
    inputBg: 'bg-black/40',
    inputText: 'text-gray-200',
    inputBorder: 'border-black/30',
    buttonBg: 'bg-indigo-500 hover:bg-indigo-600',
    buttonText: 'text-white',
    buttonDisabled: 'bg-gray-600 text-gray-400 cursor-not-allowed'
  }
};

/**
 * EventCard
 * @param {{
 *   event: {
 *     id: string;
 *     name: string;
 *     date: string;
 *     chain: string;
 *     price: string | number;
 *     image: string;
 *     remaining: string | number;
 *     totalTickets: string | number;
 *     ipfsCID: string;
 *     imageCID: string;
 *   };
 *   onRefresh?: () => void;
 * }} props
 */
function EventCard({ event, onRefresh }) {
  const { theme } = useContext(ThemeContext);
  const styles = themeStyles[theme] || themeStyles.light;

  const {
    id = '',
    name = 'Untitled Event',
    date = null,
    chain = 'ethereum',
    price = 0,
    image: rawImage = '',
    remaining,
    totalTickets,
    ipfsCID,
    
    imageCID,
    imageMetaURL,
    imageMetaCID,
    eventCID,
    fileCID,
    eventMetaFileCID,
  } = event;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [remainingCount, setRemainingCount] = useState(Number(remaining ?? 0));
  const [totalCount] = useState(Number(totalTickets ?? 0));

  const fallbackImage = 'https://placehold.co/400x300?text=No+Image';

  const formatDate = (ts) => {
    if (!ts) return 'Unknown Date';
    const d = ts instanceof Date ? ts : new Date(ts);
    return isNaN(d.getTime())
      ? 'Invalid Date'
      : d.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
  };

 useEffect(() => {
  async function fetchImageFromMetadata() {
    try {
      const metadataUrl = ipfsCID?.startsWith('ipfs://')
        ? `${IPFS_GATEWAYS[0]}/${ipfsCID.replace('ipfs://', '')}`
        : ipfsCID;

      const res = await fetch(metadataUrl);
      if (!res.ok) throw new Error('Metadata fetch failed');

      const metadata = await res.json();
      let image = metadata.image || '';

      if (!image) throw new Error('No image found in metadata');

      const imageCID = image.startsWith('ipfs://')
        ? image.replace('ipfs://', '')
        : image;

      const candidates = IPFS_GATEWAYS.map((gw) => `${gw}/${imageCID}`);
      for (let url of candidates) {
        try {
          const head = await fetch(url, { method: 'HEAD' });
          if (head.ok) {
            setImgSrc(url);
            return;
          }
        } catch {}
      }

      setImgSrc(fallbackImage);
    } catch (err) {
      console.error('Failed to load event image:', err);
      setImgSrc(fallbackImage);
    }
  }

  fetchImageFromMetadata();
}, [ipfsCID]);


  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const signer = await connectWallet();
      const addr = await signer.getAddress();
      if (!isAddress(addr)) throw new Error('Invalid wallet address');

      if (!ipfsCID || !imageCID) {
        throw new Error('Missing metadataCID or imageCID for this event.');
      }

      const txResult = await purchaseTicket(
        signer,
        id,
        chain,
        quantity,
        ipfsCID,
        imageCID
      );

      const hashes = Array.isArray(txResult)
        ? txResult.map((r) => r.transactionHash).join(', ')
        : txResult.transactionHash;

      alert(`🎟️ ${quantity} ticket(s) purchased! Txn hash: ${hashes}`);

      setRemainingCount((prev) => prev - quantity);
      onRefresh?.();
    } catch (err) {
      console.error('Purchase failed:', err);
      let msg = err.message || 'Purchase failed';
      if (msg.includes('ENS') || msg.includes('getEnsAddress')) {
        msg = 'ENS not supported on this network.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const maxQty = Math.max(0, remainingCount);
  // console.log(imageMetaCID);
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-3xl ${styles.blur} ${styles.cardBg} ${styles.border} ${styles.shadow} ${styles.shadowHover} transition-shadow duration-300`}
    >
      <div className="relative h-48 w-full">
        <img
          src={imageMetaCID||fallbackImage}
          alt={name}
          onError={() => setImgSrc(fallbackImage)}
          className="w-full h-full object-cover"
        />
        <div
          className={`absolute top-4 right-4 px-3 py-1 rounded-full ${styles.blur} ${styles.accentText} ${styles.inputBg} ${styles.inputBorder} ${styles.buttonText} text-sm font-semibold shadow`}
        >
          {chain === 'ethereum' ? 'ETH' : 'POL'}{' '}
          {(Number(price) || 0).toFixed(2)}
        </div>
      </div>

      <div className="p-6 flex flex-1 flex-col justify-between">
        <div className="mb-4">
          <h3
            className={`truncate text-xl font-semibold ${styles.primaryText}`}
          >
            {name}
          </h3>
          <p className={`mt-1 text-sm ${styles.secondaryText}`}>
            {formatDate(date)}
          </p>
          <p className={`mt-2 text-sm ${styles.secondaryText}`}>
            🎟️ Tickets Remaining: {remainingCount} / {totalCount}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-4">
          <input
            type="number"
            min="1"
            max={maxQty}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(maxQty, Number(e.target.value) || 1))
              )
            }
            disabled={maxQty === 0}
            className={`w-20 rounded-md px-2 py-1 text-sm ${styles.inputBg} ${styles.inputText} ${styles.inputBorder}`}
          />
          <button
            onClick={handlePurchase}
            disabled={loading || quantity < 1 || quantity > maxQty}
            className={`rounded-lg px-4 py-2 font-medium transition-colors duration-200 ${
              loading || maxQty === 0
                ? styles.buttonDisabled
                : `${styles.buttonBg} ${styles.buttonText}`
            }`}
          >
            {loading
              ? 'Processing…'
              : maxQty === 0
              ? 'Sold Out'
              : `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">⚠️ {error}</p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
