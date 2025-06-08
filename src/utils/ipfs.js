import { Buffer } from 'buffer';

const JWT = import.meta.env.VITE_PINATA_JWT;

export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// Upload single metadata.json file
export const uploadToIPFS = async (metadata, folder = 'folder', filename = 'metadata.json') => {
  try {
    const file = new File(
      [new Blob([JSON.stringify(metadata)], { type: 'application/json' })],
      filename
    );

    const formData = new FormData();
    formData.append('file', file, `${folder}/${filename}`);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error('❌ Failed to upload metadata to IPFS');
    }

    const result = await res.json();
    console.log('✅ IPFS Upload Result:', result);

    return {
      cid: result.IpfsHash,
      url: `${IPFS_GATEWAY}/${result.IpfsHash}/${filename}`,
    };
  } catch (error) {
    console.error('🚨 Error uploading to IPFS:', error);
    throw error;
  }
};

// Upload multiple files in one call (e.g. metadata + image)
export const uploadMultipleFilesToIPFS = async (files, folder = 'folder') => {
  try {
    const formData = new FormData();

    files.forEach(({ file, filename }) => {
      formData.append('file', file, `${folder}/${filename}`);
    });

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error('❌ Failed to upload files to IPFS');
    }

    const result = await res.json();
    console.log('✅ Multiple Files IPFS Upload Result:', result);

    return {
      cid: result.IpfsHash,
      url: `${IPFS_GATEWAY}/${result.IpfsHash}/`,
    };
  } catch (error) {
    console.error('🚨 Error uploading multiple files to IPFS:', error);
    throw error;
  }
};

// Fetch JSON metadata from IPFS
export const getFromIPFS = async (cid, filename = 'metadata.json') => {
  try {
    const res = await fetch(`${IPFS_GATEWAY}/${cid}/${filename}`);

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

// Resolve URL for any path inside CID
export const resolveIPFSUrl = (cid, path = '') => {
  return `${IPFS_GATEWAY}/${cid}/${path}`;
};

// High-level: upload NFT metadata + image (auto folder + auto patch image field)
export const uploadNFTMetadataWithImage = async (metadata, imageFile, folder = null) => {
  try {
    // Auto folder if not provided
    if (!folder) {
      folder = `nfts/${Date.now()}`;
    }

    // Set temporary placeholder for image
    metadata.image = 'ipfs://PLACEHOLDER';

    // Prepare initial metadata file
    const metadataFile = new File(
      [new Blob([JSON.stringify(metadata)], { type: 'application/json' })],
      'metadata.json'
    );

    // First upload: metadata + image
    const { cid, url } = await uploadMultipleFilesToIPFS(
      [
        { file: metadataFile, filename: 'metadata.json' },
        { file: imageFile, filename: imageFile.name },
      ],
      folder
    );

    // Patch image field to correct ipfs://CID/imageFile.name
    const imageIpfsUrl = `ipfs://${cid}/${imageFile.name}`;
    metadata.image = imageIpfsUrl;

    // Prepare final metadata with correct image field
    const finalMetadataFile = new File(
      [new Blob([JSON.stringify(metadata)], { type: 'application/json' })],
      'metadata.json'
    );

    // Final upload to persist correct metadata.json + image
    const { cid: finalCid, url: finalUrl } = await uploadMultipleFilesToIPFS(
      [
        { file: finalMetadataFile, filename: 'metadata.json' },
        { file: imageFile, filename: imageFile.name },
      ],
      folder
    );

    console.log('✅ Final NFT Upload:', {
      finalCid,
      metadataUrl: `${IPFS_GATEWAY}/${finalCid}/metadata.json`,
      imageUrl: `${IPFS_GATEWAY}/${finalCid}/${imageFile.name}`,
    });

    return {
      cid: finalCid,
      metadataUrl: `${IPFS_GATEWAY}/${finalCid}/metadata.json`,
      imageUrl: `${IPFS_GATEWAY}/${finalCid}/${imageFile.name}`,
      metadata,
    };
  } catch (error) {
    console.error('🚨 Error uploading NFT metadata with image:', error);
    throw error;
  }
};
