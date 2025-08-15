import { Buffer } from 'buffer';

const JWT = import.meta.env.VITE_PINATA_JWT;
if (!JWT) {
  throw new Error('Missing Pinata JWT (VITE_PINATA_JWT) in environment');
}

export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

/**
 * Upload a single file or JSON metadata to IPFS via Pinata.
 * - If `data` is a File, uploads it directly.
 * - Otherwise JSON‐stringifies `data` and uploads as a file.
 * Returns: { cid: string, url: string }
 */
export async function uploadToIPFS(data, folder = 'folder', filename = 'metadata.json') {
  let file;
  if (data instanceof File) {
    file = data;
  } else {
    file = new File(
      [new Blob([JSON.stringify(data)], { type: 'application/json' })],
      filename
    );
  }

  const formData = new FormData();
  formData.append('file', file, `${folder}/${filename}`);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${JWT}`,
    },
    body: formData,
  });

  const result = await res.json();
  if (!res.ok || !result.IpfsHash) {
    console.error('Pinata error response:', result);
    throw new Error(result.error || 'Failed to upload to IPFS');
  }

  return {
    cid: result.IpfsHash,
    url: `${IPFS_GATEWAY}/${result.IpfsHash}/${filename}`,
  };
}

/**
 * Upload event image and nested metadata to IPFS.
 * Returns:
 * - eventCID: main metadata CID
 * - imageCID: raw image CID
 * - imageMetaCID: JSON with image IPFS path
 * - urls: { image, imageMetadata, eventMetadata }
 */
export async function uploadEventWithNestedImage(imageFile, eventMetadata) {
  // Step 1: Upload image
  const imageUpload = await uploadToIPFS(imageFile, 'event', imageFile.name || 'image.png');
  const imageCID = imageUpload.cid;
  const imageURL = imageUpload.url;
  const imageName = imageFile.name || 'image.png';
  const imageIpfsPath = `ipfs://${imageCID}/${imageName}`;

  // Step 2: Upload image metadata
  const imageMetaData = { image: imageIpfsPath };
  const imageMetaUpload = await uploadToIPFS(imageMetaData, 'event', 'metadata.json');
  const imageMetaCID = imageMetaUpload.cid;
  const imageMetaURL = imageMetaUpload.url;

  // Step 3: Final event metadata with image
  const fullMetadata = {
    ...eventMetadata,
    image: imageIpfsPath,
    imageMeta: `ipfs://${imageMetaCID}/metadata.json`,
  };
  const eventMetaUpload = await uploadToIPFS(fullMetadata, 'event', 'metadata.json');
  const eventCID = eventMetaUpload.cid;
  const eventMetaURL = eventMetaUpload.url;

  return {
    eventCID,
    imageCID,
    imageMetaCID,
    urls: {
      image: imageURL,
      imageMetadata: imageMetaURL,
      eventMetadata: eventMetaURL,
    },
  };
}

/**
 * Fetch a JSON file from IPFS by CID and filename.
 * Default filename = metadata.json
 */
export async function getFromIPFS(cid, filename = 'metadata.json') {
  const url = `${IPFS_GATEWAY}/${cid}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch from IPFS: ${url}`);
  }
  return await res.json();
}
