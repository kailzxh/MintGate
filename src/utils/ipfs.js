import { Buffer } from 'buffer';

const JWT = import.meta.env.VITE_PINATA_JWT;


export const uploadToIPFS = async (metadata) => {
  try {
    const file = new File(
      [new Blob([JSON.stringify(metadata)], { type: 'application/json' })],
      'metadata.json'
    );
  
    const formData = new FormData();
    formData.append('file', file, 'folder/metadata.json'); // Wrap in folder

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${JWT}`
      },
      body: formData
    });

    if (!res.ok) {
      throw new Error('❌ Failed to upload metadata to IPFS');
    }

    const result = await res.json();
    console.log("✅ IPFS Upload Result:", result);
    return result.IpfsHash; // This is the folder CID
  } catch (error) {
    console.error('🚨 Error uploading to IPFS:', error);
    throw error;
  }
};


export const getFromIPFS = async (cid) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}/metadata.json`);

    if (!res.ok) {
      throw new Error('❌ Failed to fetch metadata from IPFS');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('🚨 Error fetching from IPFS:', error);
    throw error;
  }
};
