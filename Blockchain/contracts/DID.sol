// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IdentityRegistry {

    // ==========================================
    // 1. STATE VARIABLES & MAPPINGS
    // ==========================================

    address public governmentAdmin;

    // --- Enums & Structs ---
    enum IssuerStatus { None, Pending, Authorized, Rejected }

    struct IssuerDetails {
        string name;
        IssuerStatus status;
        uint256 joinedAt;
    }

    struct Credential {
        string credentialName;
        string dataHash;
        address issuer;
        uint256 issueDate;
        bool isValid;
        string cid;
    }

    struct GlobalMetadata {
        address student;
        address issuer;
        uint256 indexInUserArray;
        bool isValid;
        bool exists;
    }

    // A helper struct for returning data to the frontend
    struct IssuerRequestView {
        address walletAddress;
        string name;
        IssuerStatus status;
        uint256 joinedAt;
    }

    // --- Mappings ---
    
    // Identity & Permissions
    mapping(address => IssuerDetails) public issuers;
    mapping(string => address) public nameToAddress; // University Name -> Address
    address[] public issuerList; // List for iteration

    // Student Registry (NEW)
    mapping(string => address) public usernameToAddress; // Username -> Address
    mapping(address => string) public addressToUsername; // Address -> Username

    // Credentials
    mapping(address => Credential[]) public userCredentials;
    mapping(string => GlobalMetadata) private globalHashRegistry; // Hash -> Metadata

    // ==========================================
    // 2. EVENTS
    // ==========================================

    event IssuerRequested(string name, address indexed issuer);
    event IssuerApproved(string name, address indexed issuer);
    event CredentialIssued(address indexed student, string dataHash, address indexed issuer);
    event CredentialRevoked(string dataHash);
    event StudentRegistered(string username, address indexed student);

    // ==========================================
    // 3. MODIFIERS & CONSTRUCTOR
    // ==========================================

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

    // ==========================================
    // 4. HELPER FUNCTIONS
    // ==========================================

    function getAuthLevel(address _user) public view returns (string memory) {
        if (_user == governmentAdmin) {
            return "Gov";
        } else if (issuers[_user].status == IssuerStatus.Authorized) {
            return "Uni";
        } else {
            return "Stu";
        }
    }

    // ==========================================
    // 5. STUDENT FUNCTIONS
    // ==========================================

    /** * @dev Registers a human-readable username for the caller's wallet address.
     */
    function registerStudent(string memory _username) public {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(usernameToAddress[_username] == address(0), "Username already taken");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Wallet already registered");

        usernameToAddress[_username] = msg.sender;
        addressToUsername[msg.sender] = _username;

        emit StudentRegistered(_username, msg.sender);
    }

    /** * @dev Fetch credentials using a username.
     */
    function getCredentialsByUsername(string memory _username) public view returns (Credential[] memory) {
        address studentAddr = usernameToAddress[_username];
        require(studentAddr != address(0), "Username not found");

        return userCredentials[studentAddr];
    }
    
    /** * @dev Fetch the caller's own credentials directly.
     * Useful for the "My Wallet" page in the frontend.
     */
    function getMyCredentials() public view returns (Credential[] memory) {
        return userCredentials[msg.sender];
    }

    function getAddressByUsername(string memory _username) public view returns (address) {
        address studentAddr = usernameToAddress[_username];
        return studentAddr;
    }

    // ==========================================
    // 6. GOVERNANCE (University Approval)
    // ==========================================

    function requestAuthorization(string memory _universityName) public {
        require(issuers[msg.sender].status == IssuerStatus.None, "Application already exists or processed");
        require(bytes(_universityName).length > 0, "Name cannot be empty");
        require(nameToAddress[_universityName] == address(0), "University name already taken");

        issuers[msg.sender] = IssuerDetails({
            name: _universityName,
            status: IssuerStatus.Pending,
            joinedAt: 0
        });

        nameToAddress[_universityName] = msg.sender;
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

    /**
     * @dev Returns ALL requests (Pending, Authorized, and Rejected).
     */
    function getAllRequests() public view returns (IssuerRequestView[] memory) {
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
    // 7. ISSUANCE & VERIFICATION
    // ==========================================

    function issueCredential(address _student, string memory _name, string memory _dataHash, string memory _cid) public onlyAuthorizedIssuer {
        require(!globalHashRegistry[_dataHash].exists, "This document hash already exists on-chain!");

        Credential memory newCred = Credential({
            credentialName: _name,
            dataHash: _dataHash,
            issuer: msg.sender,
            issueDate: block.timestamp,
            isValid: true,
            cid: _cid
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
        uint256 issueDate,
        string memory cid
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
            credDetails.issueDate,
            credDetails.cid
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