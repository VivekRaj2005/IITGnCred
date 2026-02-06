const express = require("express");
const path = require("path");
const security = require("./Utils/Security");
const app = express();
const { Web3 } = require("web3");
const { getContract } = require("./Utils/Web3");
const fs = require("fs");
const { get } = require("http");

app.use(express.json());
const web3 = new Web3("http://127.0.0.1:8545");
const artifactPath = path.join(
  "../",
  "Blockchain",
  "build",
  "contracts",
  "IdentityRegistry.json"
);
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const { decryptMiddleWare, getJWTToken } = security;

app.get("/api/health", (_, res) => {
  res.status(200).send({ message: "System Running Smoothly" });
});

app.post("/api/login", decryptMiddleWare, async (req, res) => {
  const walletAddress = req.body.walletAddress;
  const contract = await getContract(web3, contractArtifact);
  const role = await contract.methods.getAuthLevel(walletAddress).call();
	console.log("[INFO] Auth Level for", walletAddress, "is", role);
	const token = getJWTToken(walletAddress, role);
  res.status(200).send({ message: "Login Endpoint - To be implemented" });
});

app.listen(3000, () => {
  console.log("Server API running on http://localhost:3000");
});
