const express = require('express');
const { Web3 } = require('web3'); 
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// CONFIGURATION
// 1. Connect to Ganache (Ensure port matches truffle-config)
const web3 = new Web3('http://127.0.0.1:8545');

// 2. Load the Contract Artifact (ABI + Address)
const artifactPath = path.join('../', 'Blockchain', 'build', 'contracts', 'SimpleStorage.json');
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// 3. Helper to get Contract Instance
const getContract = async () => {
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

// ENDPOINTS

// GET Request: Read data from blockchain
app.get('/api/storage', async (req, res) => {
    try {
        const contract = await getContract();
        // .call() reads state without costing gas
        const result = await contract.methods.get().call();
        res.json({ value: result.toString() });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// POST Request: Write data to blockchain
app.post('/api/storage', async (req, res) => {
    const { value } = req.body;
    try {
        const contract = await getContract();
        const accounts = await web3.eth.getAccounts();
        
        // .send() modifies state and costs gas.
        // We use accounts[0] which Ganache pre-funds with fake ETH.
        const receipt = await contract.methods.set(value).send({
            from: accounts[0],
            gas: 500000 // Gas limit
        });

        res.json({ 
            success: true, 
            blockNumber: receipt.blockNumber.toString(),
            transactionHash: receipt.transactionHash
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log('Server API running on http://localhost:3000');
});