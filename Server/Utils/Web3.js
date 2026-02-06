const getContract = async (web3, contractArtifact) => {
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = contractArtifact.networks[networkId];

    if (!deployedNetwork) {
        throw new Error('Contract not deployed to the current network. Run truffle migrate!');
    }

    return new web3.eth.Contract(
        contractArtifact.abi,
        deployedNetwork.address
    );
};

function createAccount(web3) {
    const newAccount = web3.eth.accounts.create();
    console.log('\n--- New Account Generated ---');
    console.log('New Ethereum Account Created:', newAccount);
    console.log('Address:', newAccount.address);
    console.log('Private Key:', newAccount.privateKey);
    return newAccount;
}

module.exports = {
    getContract,
    createAccount
}


