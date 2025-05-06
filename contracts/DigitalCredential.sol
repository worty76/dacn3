// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DigitalCredential
 * @dev Issue and verify digital credentials on blockchain
 */
contract DigitalCredential {
    address public owner;
    
    struct Credential {
        string credentialId;     // Unique identifier for credential
        string credentialType;   // Type of credential (e.g., "Degree", "Certificate")
        string metadataHash;     // IPFS hash of credential metadata
        address issuer;          // Who issued the credential
        address recipient;       // Who received the credential
        bool isValid;            // Whether the credential is currently valid
        uint256 issuedAt;        // When the credential was issued
        uint256 expirationDate;  // When the credential expires (0 for never)
    }
    
    // Mapping from credential ID to Credential
    mapping(string => Credential) public credentials;
    
    // Mapping from user address to credential IDs received
    mapping(address => string[]) public userCredentials;
    
    // List of issuers who can issue credentials
    mapping(address => bool) public issuers;
    
    event CredentialIssued(
        string credentialId,
        string credentialType,
        address issuer,
        address recipient,
        uint256 timestamp
    );
    event CredentialRevoked(string credentialId, address issuer, uint256 timestamp);
    event IssuerAdded(address issuer);
    event IssuerRemoved(address issuer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyIssuer() {
        require(issuers[msg.sender] || msg.sender == owner, "Only issuers can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        issuers[msg.sender] = true; // Owner is an issuer by default
    }
    
    /**
     * @dev Issue a new credential
     * @param credentialId Unique ID of the credential
     * @param credentialType Type of credential
     * @param metadataHash IPFS hash of credential metadata
     * @param recipient Recipient of the credential
     * @param expirationDate Expiration date (0 for never)
     */
    function issueCredential(
        string memory credentialId,
        string memory credentialType,
        string memory metadataHash,
        address recipient,
        uint256 expirationDate
    ) public onlyIssuer {
        require(bytes(credentials[credentialId].credentialId).length == 0, "Credential ID already exists");
        
        credentials[credentialId] = Credential({
            credentialId: credentialId,
            credentialType: credentialType,
            metadataHash: metadataHash,
            issuer: msg.sender,
            recipient: recipient,
            isValid: true,
            issuedAt: block.timestamp,
            expirationDate: expirationDate
        });
        
        userCredentials[recipient].push(credentialId);
        
        emit CredentialIssued(credentialId, credentialType, msg.sender, recipient, block.timestamp);
    }
    
    /**
     * @dev Revoke a credential
     * @param credentialId ID of the credential to revoke
     */
    function revokeCredential(string memory credentialId) public {
        Credential storage credential = credentials[credentialId];
        
        require(bytes(credential.credentialId).length > 0, "Credential does not exist");
        require(msg.sender == credential.issuer || msg.sender == owner, "Only issuer or owner can revoke");
        require(credential.isValid, "Credential already revoked");
        
        credential.isValid = false;
        
        emit CredentialRevoked(credentialId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if a credential is valid
     * @param credentialId The ID of the credential to check
     * @return isValid True if the credential is valid and not expired
     */
    function isCredentialValid(string memory credentialId) public view returns (bool) {
        Credential memory credential = credentials[credentialId];
        
        if (bytes(credential.credentialId).length == 0) {
            return false; // Credential doesn't exist
        }
        
        if (!credential.isValid) {
            return false; // Credential was revoked
        }
        
        if (credential.expirationDate != 0 && block.timestamp > credential.expirationDate) {
            return false; // Credential has expired
        }
        
        return true;
    }
    
    /**
     * @dev Get credential details
     * @param credentialId The ID of the credential
     * @return Credential details
     */
    function getCredential(string memory credentialId) public view returns (
        string memory,
        string memory,
        string memory,
        address,
        address,
        bool,
        uint256,
        uint256
    ) {
        Credential memory credential = credentials[credentialId];
        
        return (
            credential.credentialId,
            credential.credentialType,
            credential.metadataHash,
            credential.issuer,
            credential.recipient,
            credential.isValid,
            credential.issuedAt,
            credential.expirationDate
        );
    }
    
    /**
     * @dev Get all credentials for a user
     * @param userAddress The address of the user
     * @return Array of credential IDs
     */
    function getUserCredentials(address userAddress) public view returns (string[] memory) {
        return userCredentials[userAddress];
    }
    
    /**
     * @dev Add an issuer
     * @param issuerAddress The address to add as issuer
     */
    function addIssuer(address issuerAddress) public onlyOwner {
        issuers[issuerAddress] = true;
        emit IssuerAdded(issuerAddress);
    }
    
    /**
     * @dev Remove an issuer
     * @param issuerAddress The address to remove as issuer
     */
    function removeIssuer(address issuerAddress) public onlyOwner {
        require(issuerAddress != owner, "Cannot remove owner as issuer");
        issuers[issuerAddress] = false;
        emit IssuerRemoved(issuerAddress);
    }
    
    /**
     * @dev Check if an address is an issuer
     * @param issuerAddress The address to check
     * @return isIssuer True if address is an issuer
     */
    function isIssuer(address issuerAddress) public view returns (bool) {
        return issuers[issuerAddress];
    }
}
