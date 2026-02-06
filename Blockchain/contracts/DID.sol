// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IdentityRegistry {

    // --- ROLES & PERMISSIONS ---
    address public governmentAdmin;

    enum IssuerStatus { None, Pending, Authorized, Rejected }

    struct IssuerDetails {
        string name;
        IssuerStatus status;
        uint256 joinedAt;
    }

    // 1. Primary storage: Find details by Address
    mapping(address => IssuerDetails) public issuers;

    // 2. Lookup storage: Find Address by Name (For "Approve by Name")
    mapping(string => address) public nameToAddress;

    // 3. NEW: Iterable list of all applicants (For "Get All Requests")
    address[] public issuerList;

    // --- CREDENTIAL STORAGE ---
    struct Credential {
        string credentialName;
        string dataHash;
        address issuer;
        uint256 issueDate;
        bool isValid;
    }

    mapping(address => Credential[]) public userCredentials;

    struct GlobalMetadata {
        address student;
        address issuer;
        uint256 indexInUserArray;
        bool isValid;
        bool exists;
    }
    mapping(string => GlobalMetadata) private globalHashRegistry;

    // --- EVENTS ---
    event IssuerRequested(string name, address indexed issuer);
    event IssuerApproved(string name, address indexed issuer);
    event CredentialIssued(address indexed student, string dataHash, address indexed issuer);
    event CredentialRevoked(string dataHash);

    modifier onlyGov() {
        require(msg.sender == governmentAdmin, "Caller is not the Government");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(issuers[msg.sender].status == IssuerStatus.Authorized, "Caller is not an authorized issuer");
        _;
    }

    constructor() {
        governmentAdmin = msg.sender;
    }

    // Get Authorizoation Level
    function getAuthLevel(address _user) public view returns (string memory) {
        // 1. Check if the address is the Government Admin
        if (_user == governmentAdmin) {
            return "Gov";
        } 
        // 2. Check if the address is an AUTHORIZED Issuer
        else if (issuers[_user].status == IssuerStatus.Authorized) {
            return "Uni";
        } 
        // 3. Default to Student/Public for everyone else (including Pending issuers)
        else {
            return "Stu";
        }
    }

    // ==========================================
    // 1. GOVERNANCE
    // ==========================================

    function requestAuthorization(string memory _universityName) public {
        require(issuers[msg.sender].status == IssuerStatus.None, "Application already exists or processed");
        require(bytes(_universityName).length > 0, "Name cannot be empty");
        require(nameToAddress[_universityName] == address(0), "University name already taken");

        // 1. Store Details
        issuers[msg.sender] = IssuerDetails({
            name: _universityName,
            status: IssuerStatus.Pending,
            joinedAt: 0
        });

        // 2. Map Name -> Address
        nameToAddress[_universityName] = msg.sender;

        // 3. NEW: Add to the list so we can loop over it later
        issuerList.push(msg.sender);

        emit IssuerRequested(_universityName, msg.sender);
    }

    function approveIssuer(string memory _universityName) public onlyGov {
        address uniAddress = nameToAddress[_universityName];
        require(uniAddress != address(0), "University name not found in registry");
        require(issuers[uniAddress].status == IssuerStatus.Pending, "Issuer is not in Pending state");
        
        issuers[uniAddress].status = IssuerStatus.Authorized;
        issuers[uniAddress].joinedAt = block.timestamp;

        emit IssuerApproved(_universityName, uniAddress);
    }

    function rejectIssuer(string memory _universityName) public onlyGov {
        address uniAddress = nameToAddress[_universityName];
        require(uniAddress != address(0), "University name not found");
        require(issuers[uniAddress].status == IssuerStatus.Pending, "Issuer is not in Pending state");

        issuers[uniAddress].status = IssuerStatus.Rejected;
    }

    // ==========================================
    // 2. NEW: VIEW FUNCTIONS (For Frontend)
    // ==========================================

    // A helper struct to return data cleanly to the frontend
    struct IssuerRequestView {
        address walletAddress;
        string name;
        IssuerStatus status;
        uint256 joinedAt;
    }

    /**
     * @dev Returns ALL requests (Pending, Authorized, and Rejected).
     * Useful for the Government Dashboard.
     */
    function getAllRequests() public view returns (IssuerRequestView[] memory) {
        // Create a temporary array to hold the results
        IssuerRequestView[] memory allRequests = new IssuerRequestView[](issuerList.length);

        for (uint i = 0; i < issuerList.length; i++) {
            address addr = issuerList[i];
            IssuerDetails memory details = issuers[addr];

            allRequests[i] = IssuerRequestView({
                walletAddress: addr,
                name: details.name,
                status: details.status,
                joinedAt: details.joinedAt
            });
        }

        return allRequests;
    }

    // ==========================================
    // 3. ISSUANCE & VERIFICATION
    // ==========================================

    function issueCredential(address _student, string memory _name, string memory _dataHash) public onlyAuthorizedIssuer {
        require(!globalHashRegistry[_dataHash].exists, "This document hash already exists on-chain!");

        Credential memory newCred = Credential({
            credentialName: _name,
            dataHash: _dataHash,
            issuer: msg.sender,
            issueDate: block.timestamp,
            isValid: true
        });

        userCredentials[_student].push(newCred);
        uint256 indexId = userCredentials[_student].length - 1;

        globalHashRegistry[_dataHash] = GlobalMetadata({
            student: _student,
            issuer: msg.sender,
            indexInUserArray: indexId,
            isValid: true,
            exists: true
        });

        emit CredentialIssued(_student, _dataHash, msg.sender);
    }

    function verifyByHash(string memory _dataHash) public view returns (
        bool isValid, 
        address issuer, 
        string memory issuerName,
        address student, 
        uint256 issueDate
    ) {
        GlobalMetadata memory meta = globalHashRegistry[_dataHash];
        require(meta.exists, "Credential does not exist");

        Credential memory credDetails = userCredentials[meta.student][meta.indexInUserArray];
        string memory nameOfIssuer = issuers[meta.issuer].name;

        return (
            meta.isValid,
            meta.issuer,
            nameOfIssuer,
            meta.student,
            credDetails.issueDate
        );
    }

    function revokeCredential(string memory _dataHash) public {
        GlobalMetadata storage meta = globalHashRegistry[_dataHash];
        require(meta.exists, "Credential not found");
        require(msg.sender == meta.issuer, "Only the issuer can revoke");
        require(meta.isValid == true, "Already revoked");

        meta.isValid = false;
        userCredentials[meta.student][meta.indexInUserArray].isValid = false;

        emit CredentialRevoked(_dataHash);
    }
}