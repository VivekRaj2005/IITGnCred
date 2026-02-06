const getContract = async (web3, contractArtifact) => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = contractArtifact.networks[networkId];

  if (!deployedNetwork) {
    throw new Error(
      "Contract not deployed to the current network. Run truffle migrate!",
    );
  }

  return new web3.eth.Contract(contractArtifact.abi, deployedNetwork.address);
};

async function createAccount(web3) {
  const newAccount = web3.eth.accounts.create();
  console.log("\n--- New Account Generated ---");
  console.log("New Ethereum Account Created:", newAccount);
  console.log("Address:", newAccount.address);
  console.log("Private Key:", newAccount.privateKey);
  const nodeAccounts = await web3.eth.getAccounts();
  const admin = nodeAccounts[0]; 
  
  await web3.eth.sendTransaction({
    from: admin,
    to: newAccount.address,
    value: web3.utils.toWei('1', 'ether') 
  });
  web3.eth.accounts.wallet.add(newAccount.privateKey);
  return newAccount;
}

async function requestUniversityAccess(
  web3,
  wallet,
  universityName,
  contractArtifact,
) {
  console.log("\n--- Requesting University Access ---");
  console.log("Requesting access for wallet:", wallet.address);

  const contract = await getContract(web3, contractArtifact);
  const receipt = await contract.methods
    .requestAuthorization(universityName)
    .send({
      from: wallet.address,
      gas: 5000000, // Gas limit
    });
return receipt;
}

async function approveUniversity(  web3,
  wallet,
  universityName,
  contractArtifact) {
  const contract = await getContract(web3, contractArtifact);
  const receipt = await contract.methods
    .approveIssuer(universityName)
    .send({
      from: wallet,
      gas: 5000000, // Gas limit
    });
  return receipt;
}

async function rejectUniversity(  web3,
  wallet,
  universityName,
  contractArtifact) {
  const contract = await getContract(web3, contractArtifact);
  const receipt = await contract.methods
    .rejectIssuer(universityName)
    .send({
      from: wallet,
      gas: 5000000, // Gas limit
    });
  return receipt;
}

module.exports = {
  getContract,
  createAccount,
  requestUniversityAccess,
  approveUniversity,
  rejectUniversity
};
