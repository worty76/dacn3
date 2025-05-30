// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IdentityRegistry
 * @dev Register and verify user identities on the blockchain
 */
contract IdentityRegistry {
    address public owner;
    
    struct Identity {
        string did;              // DID (decentralized identifier)
        address userAddress;     // User's blockchain address
        bool verified;           // Whether the identity is verified
        uint256 registeredAt;    // When the identity was registered
        uint256 verifiedAt;      // When the identity was verified
        address verifiedBy;      // Who verified the identity
        bool active;             // Whether the identity is active
    }
    
    // Mapping from DID to Identity
    mapping(string => Identity) public identities;
    
    // Mapping from user address to their DIDs
    mapping(address => string) public addressToDid;
    
    // List of verifiers who can verify identities
    mapping(address => bool) public verifiers;
    
    event IdentityRegistered(string did, address userAddress, uint256 timestamp);
    event IdentityVerified(string did, address verifier, uint256 timestamp);
    event IdentityRevoked(string did, address revoker, uint256 timestamp);
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
     * @dev Register a new identity
     * @param did The decentralized identifier
     */
    function registerIdentity(string memory did) public {
        require(bytes(identities[did].did).length == 0, "DID already registered");
        require(bytes(addressToDid[msg.sender]).length == 0, "Address already has a DID");
        
        identities[did] = Identity({
            did: did,
            userAddress: msg.sender,
            verified: false,
            registeredAt: block.timestamp,
            verifiedAt: 0,
            verifiedBy: address(0),
            active: true
        });
        
        addressToDid[msg.sender] = did;
        
        emit IdentityRegistered(did, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify an identity
     * @param did The DID to verify
     */
    function verifyIdentity(string memory did) public onlyVerifier {
        require(bytes(identities[did].did).length > 0, "DID not registered");
        require(identities[did].active, "Identity not active");
        require(!identities[did].verified, "Identity already verified");
        
        identities[did].verified = true;
        identities[did].verifiedAt = block.timestamp;
        identities[did].verifiedBy = msg.sender;
        
        emit IdentityVerified(did, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke an identity
     * @param did The DID to revoke
     */
    function revokeIdentity(string memory did) public onlyVerifier {
        require(bytes(identities[did].did).length > 0, "DID not registered");
        
        identities[did].verified = false;
        identities[did].active = false;
        
        emit IdentityRevoked(did, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if an identity is verified
     * @param did The DID to check
     * @return True if identity is verified and active
     */
    function isIdentityVerified(string memory did) public view returns (bool) {
        return identities[did].verified && identities[did].active;
    }
    
    /**
     * @dev Get identity details
     * @param did The DID
     * @return Identity details tuple
     */
    function getIdentity(string memory did) public view returns (
        string memory,
        address,
        bool,
        uint256,
        uint256,
        address,
        bool
    ) {
        Identity memory identity = identities[did];
        return (
            identity.did,
            identity.userAddress,
            identity.verified,
            identity.registeredAt,
            identity.verifiedAt,
            identity.verifiedBy,
            identity.active
        );
    }
    
    /**
     * @dev Get DID by user address
     * @param userAddress The user's address
     * @return The user's DID
     */
    function getDid(address userAddress) public view returns (string memory) {
        return addressToDid[userAddress];
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
