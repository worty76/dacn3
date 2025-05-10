import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import { Buffer } from "buffer";

dotenv.config();

// Get Pinata credentials from environment variables
const pinataApiKey = process.env.Pinata_API_KEY;
const pinataApiSecret = process.env.Pinata_API_SECRET;
const pinataJWT = process.env.Pinata_JWT;

/**
 * Upload file to Pinata IPFS
 */
export const uploadToIPFS = async (fileBuffer: Buffer): Promise<any> => {
  try {
    console.log("Starting IPFS upload with Pinata...");

    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata credentials not properly configured");
    }

    // Create form data with the file
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: `upload_${Date.now()}.file`,
    });

    // Add metadata - optional
    const metadata = JSON.stringify({
      name: `Upload_${Date.now()}`,
      keyvalues: {
        source: "did-identity-app",
        timestamp: Date.now().toString(),
      },
    });
    formData.append("pinataMetadata", metadata);

    // Upload to Pinata
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity, // Required for large files
        headers: {
          // Use JWT authentication or API key/secret
          ...(pinataJWT
            ? { Authorization: `Bearer ${pinataJWT}` }
            : {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataApiSecret,
              }),
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Pinata upload successful:", response.data.IpfsHash);

    return {
      path: response.data.IpfsHash,
      size: response.data.PinSize,
      url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);

    // Log more detailed error information
    if (axios.isAxiosError(error) && error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    throw new Error(
      `Failed to upload to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get file from IPFS
 */
export const getFromIPFS = async (ipfsHash: string): Promise<Buffer> => {
  try {
    console.log("Retrieving from IPFS gateway:", ipfsHash);

    // Try multiple gateways in case one fails
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://dweb.link/ipfs/${ipfsHash}`,
    ];

    let lastError;

    // Try each gateway until one succeeds
    for (const gateway of gateways) {
      try {
        console.log(`Trying gateway: ${gateway}`);
        const response = await axios.get(gateway, {
          responseType: "arraybuffer",
          timeout: 10000, // 10 second timeout
        });

        console.log(`Successfully retrieved from ${gateway}`);
        return Buffer.from(response.data);
      } catch (error) {
        // Fix the error handling by checking if it's an Error object
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(`Failed to retrieve from ${gateway}: ${errorMessage}`);
        lastError = error;
        // Continue to next gateway
      }
    }

    // If we get here, all gateways failed
    throw lastError || new Error("All IPFS gateways failed");
  } catch (error) {
    console.error("IPFS retrieval error:", error);
    throw new Error(
      `Failed to retrieve from IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Remove file from Pinata
 */
export const unpinFromIPFS = async (ipfsHash: string): Promise<boolean> => {
  try {
    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata credentials not configured");
    }

    console.log("Unpinning from Pinata:", ipfsHash);

    const response = await axios.delete(
      `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
      {
        headers: {
          // Use JWT authentication or API key/secret
          ...(pinataJWT
            ? { Authorization: `Bearer ${pinataJWT}` }
            : {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataApiSecret,
              }),
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error("Error unpinning from Pinata:", error);
    return false;
  }
};
