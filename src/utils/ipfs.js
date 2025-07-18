import { Buffer } from 'buffer';

const JWT = import.meta.env.VITE_PINATA_JWT;
if (!JWT) throw new Error('Missing Pinata JWT (VITE_PINATA_JWT) in environment');

export const IPFS_GATEWAY = 'https://ipfs.io/ipfs';

/**
 * Upload a single file or JSON metadata to IPFS via Pinata.
 * Returns: { cid: string, url: string }
 * 
 * NOTE: wrapWithDirectory:false → our `cid` is the file’s CID
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
  formData.append('file', file, filename);
  formData.append('pinataOptions', JSON.stringify({ wrapWithDirectory: false }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${JWT}` },
    body: formData,
  });

  const result = await res.json();
  if (!res.ok || !result.IpfsHash) {
    console.error('Pinata error response:', result);
    throw new Error(result.error || 'Failed to upload to IPFS');
  }

  const cid = result.IpfsHash;
  const url = `${IPFS_GATEWAY}/${cid}`; // ✅ no filename

  return { cid, url, fileCID: cid };
}

/**
 * Upload event image and nested metadata to IPFS.
 */
export async function uploadEventWithNestedImage(imageFile, eventMetadata) {
  // 1️⃣ Upload raw image file
  const imageUpload = await uploadToIPFS(imageFile, 'event', imageFile.name || 'image.png');
  const imageCID = imageUpload.cid;
  const imageURL = imageUpload.url;
  const imageIpfsPath = `ipfs://${imageCID}`; // ✅ no filename appended

  // 2️⃣ Upload JSON pointing to the image
  const imageMetaData = { image: imageIpfsPath };
  const imageMetaUpload = await uploadToIPFS(imageMetaData, 'event', 'metadata.json');
  const imageMetaCID = imageMetaUpload.cid;
  const imageMetaURL = imageMetaUpload.url;

  // 3️⃣ Upload final event metadata JSON
  const fullMetadata = {
    ...eventMetadata,
    image: imageIpfsPath,
    imageMeta: `ipfs://${imageMetaCID}`,
  };
  const eventMetaUpload = await uploadToIPFS(fullMetadata, 'event', 'metadata.json');
  const eventCID = eventMetaUpload.cid;
  const eventMetaURL = eventMetaUpload.url;

  return {
    eventCID,
    imageCID,
    fileCID: eventCID,
    imageMetaCID,
    eventMetaCID: eventCID,
    urls: {
      image: imageURL,             // ✅ https://ipfs.io/ipfs/<imageCID>
      imageMetadata: imageMetaURL,
      eventMetadata: eventMetaURL,
    },
  };
}


/**
 * Fetch a JSON file from IPFS by CID and filename.
 */
export async function getFromIPFS(cid, filename = 'metadata.json') {
  const url = `${IPFS_GATEWAY}/${cid}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch from IPFS: ${url}`);
  return res.json();
}
