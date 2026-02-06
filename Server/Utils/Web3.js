export const getContract = async (web3, contractArtifact) => {
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