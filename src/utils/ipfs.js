import { Buffer } from 'buffer';

const JWT = import.meta.env.VITE_PINATA_JWT;

export const uploadToIPFS = async (data) => {
  try {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${JWT}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Failed to upload JSON to IPFS');
    }

    const result = await res.json();
    return result.IpfsHash; // same as result.path before
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

export const getFromIPFS = async (cid) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

    if (!res.ok) {
      throw new Error('Failed to fetch from IPFS');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};
