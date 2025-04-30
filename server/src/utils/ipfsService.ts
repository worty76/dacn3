import { create } from "ipfs-http-client";

// IPFS client setup
// Note: In production, you would configure this with your own IPFS node or a service like Pinata
const ipfsClient = create({
  url: process.env.IPFS_URL || "https://ipfs.infura.io:5001/api/v0",
});

/**
 * Upload file to IPFS
 */
export const uploadToIPFS = async (file: any) => {
  try {
    // Convert file to buffer if needed
    const fileBuffer = file.data || Buffer.from(file);

    // Add file to IPFS
    const result = await ipfsClient.add(fileBuffer);

    return {
      path: result.path,
      size: result.size,
      url: `https://ipfs.io/ipfs/${result.path}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("Failed to upload to IPFS");
  }
};

/**
 * Get file from IPFS by hash
 */
export const getFromIPFS = async (ipfsHash: string) => {
  try {
    const stream = ipfsClient.cat(ipfsHash);

    // Collect all chunks
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // Combine chunks into a single buffer
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("IPFS retrieval error:", error);
    throw new Error("Failed to retrieve from IPFS");
  }
};
