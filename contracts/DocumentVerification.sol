// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DocumentVerification
 * @dev Store and verify document hashes on the blockchain
 */
contract DocumentVerification {
    address public owner;
    
    struct Document {
        string documentId;      // Database ID of document
        string ipfsHash;        // IPFS hash of document
        address documentOwner;  // Changed from 'owner' to avoid conflict
        bool isVerified;        // Verification status
        uint256 timestamp;      // When document was added
        uint256 verifiedAt;     // When document was verified
        address verifiedBy;     // Who verified the document
    }
    
    // Mapping from document ID to Document struct
    mapping(string => Document) public documents;
    
    // Mapping from user address to their document IDs
    mapping(address => string[]) public userDocuments;
    
    // List of verifiers who can verify documents
    mapping(address => bool) public verifiers;
    
    event DocumentAdded(string documentId, string ipfsHash, address documentOwner, uint256 timestamp);
    event DocumentVerified(string documentId, address verifier, uint256 timestamp);
    event DocumentRevoked(string documentId, address verifier, uint256 timestamp);
    event VerifierAdded(address verifier);
    event VerifierRemoved(address verifier);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner, "Only verifiers can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        verifiers[msg.sender] = true; // Owner is a verifier by default
    }
    
    /**
     * @dev Add a new document to the blockchain
     * @param documentId The database ID of the document
     * @param ipfsHash The IPFS hash of the document
     */
    function addDocument(string memory documentId, string memory ipfsHash) public {
        require(bytes(documents[documentId].documentId).length == 0, "Document already exists");
        
        documents[documentId] = Document({
            documentId: documentId,
            ipfsHash: ipfsHash,
            documentOwner: msg.sender,  // Updated field name
            isVerified: false,
            timestamp: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0)
        });
        
        userDocuments[msg.sender].push(documentId);
        
        emit DocumentAdded(documentId, ipfsHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify a document
     * @param documentId The ID of the document to verify
     */
    function verifyDocument(string memory documentId) public onlyVerifier {
        require(bytes(documents[documentId].documentId).length > 0, "Document does not exist");
        require(!documents[documentId].isVerified, "Document already verified");
        
        documents[documentId].isVerified = true;
        documents[documentId].verifiedAt = block.timestamp;
        documents[documentId].verifiedBy = msg.sender;
        
        emit DocumentVerified(documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke verification of a document
     * @param documentId The ID of the document to revoke
     */
    function revokeDocument(string memory documentId) public onlyVerifier {
        require(bytes(documents[documentId].documentId).length > 0, "Document does not exist");
        require(documents[documentId].isVerified, "Document not verified yet");
        
        documents[documentId].isVerified = false;
        
        emit DocumentRevoked(documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if a document is verified
     * @param documentId The ID of the document to check
     * @return verification status
     */
    function isDocumentVerified(string memory documentId) public view returns (bool) {
        return documents[documentId].isVerified;
    }
    
    /**
     * @dev Get document details
     * @param documentId The ID of the document
     * @return Document details tuple
     */
    function getDocument(string memory documentId) public view returns (
        string memory,
        string memory,
        address,
        bool,
        uint256,
        uint256,
        address
    ) {
        Document memory doc = documents[documentId];
        return (
            doc.documentId,
            doc.ipfsHash,
            doc.documentOwner,  // Updated field name
            doc.isVerified,
            doc.timestamp,
            doc.verifiedAt,
            doc.verifiedBy
        );
    }
    
    /**
     * @dev Get all documents for a user
     * @param userAddress The address of the user
     * @return Array of document IDs
     */
    function getUserDocuments(address userAddress) public view returns (string[] memory) {
        return userDocuments[userAddress];
    }
    
    /**
     * @dev Add a verifier
     * @param verifierAddress The address to add as verifier
     */
    function addVerifier(address verifierAddress) public onlyOwner {
        verifiers[verifierAddress] = true;
        emit VerifierAdded(verifierAddress);
    }
    
    /**
     * @dev Remove a verifier
     * @param verifierAddress The address to remove as verifier
     */
    function removeVerifier(address verifierAddress) public onlyOwner {
        require(verifierAddress != owner, "Cannot remove owner as verifier");
        verifiers[verifierAddress] = false;
        emit VerifierRemoved(verifierAddress);
    }
    
    /**
     * @dev Check if an address is a verifier
     * @param verifierAddress The address to check
     * @return True if address is a verifier
     */
    function isVerifier(address verifierAddress) public view returns (bool) {
        return verifiers[verifierAddress];
    }
}
