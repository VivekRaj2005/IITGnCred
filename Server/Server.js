const express = require("express");
const path = require("path");
const {
  decryptMiddleWare,
  getJWTToken,
  JWTAuthMiddleware,
  encryptWrapper,
} = require("./Utils/Security");
const app = express();
const { Web3 } = require("web3");
const {
  getContract,
  createAccount,
  requestUniversityAccess,
  approveUniversity,
  rejectUniversity,
} = require("./Utils/Web3");
const fs = require("fs");
const { get } = require("http");

app.use(express.json());
const web3 = new Web3("http://127.0.0.1:8545");
const artifactPath = path.join(
  "../",
  "Blockchain",
  "build",
  "contracts",
  "IdentityRegistry.json",
);
const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

app.get("/api/health", async (_, res) => {
  res.status(200).send({ message: "System Running Smoothly" });
});

app.post("/api/login", decryptMiddleWare, async (req, res) => {
  try {
    const walletAddress = req.body.walletAddress;
    const contract = await getContract(web3, contractArtifact);
    const role = await contract.methods.getAuthLevel(walletAddress).call();
    console.log("[INFO] Auth Level for", walletAddress, "is", role);
    const token = getJWTToken(walletAddress, role);
    res
      .status(200)
      .send(encryptWrapper({ token: token, role: role, status: true }));
  } catch (error) {
    console.error("[ERROR] Login Failed:", error.message);
    res.status(500).send(
      encryptWrapper({
        error: "Login Failed: " + error.message,
        status: false,
      }),
    );
  }
});

app.post("/api/register", decryptMiddleWare, async (req, res) => {
  try {
    const role = req.body.role;
    if (role == "Student") {
      const newAccount = await createAccount(web3);
      res
        .status(200)
        .send(encryptWrapper({ account: newAccount, status: true }));
    } else if (role == "University") {
      const newAccount = await createAccount(web3);
      const universityName = req.body.universityName;
      const receipt = await requestUniversityAccess(
        web3,
        newAccount,
        universityName,
        contractArtifact,
      );
      res
        .status(200)
        .send(encryptWrapper({ account: newAccount, status: true }));
    } else {
      throw new Error("Invalid role specified");
    }
  } catch (error) {
    console.error("[ERROR] Registration Failed:", error.message);
    res.status(500).send(
      encryptWrapper({
        error: "Registration Failed: " + error.message,
        status: false,
      }),
    );
  }
});

app.post(
  "/api/approve",
  JWTAuthMiddleware,
  decryptMiddleWare,
  async (req, res) => {
    try {
      const { wallet, role } = req.user; // Extracted from JWT
      if (role !== "Gov") {
        return res
          .status(403)
          .send(
            encryptWrapper({
              error: "Access Denied: Only Gov can approve",
              status: false,
            }),
          );
      }
      const { universityName } = req.body; // Extract from decrypted body
      const receipt = await approveUniversity(
        web3,
        wallet,
        universityName,
        contractArtifact,
      );
      res.status(200).send(encryptWrapper({ status: true }));
    } catch (error) {
      console.error("[ERROR] Approve Failed:", error.message);
      res
        .status(500)
        .send(
          encryptWrapper({
            error: "Approve Failed: " + error.message,
            status: false,
          }),
        );
    }
  },
);

app.post(
  "/api/reject",
  JWTAuthMiddleware,
  decryptMiddleWare,
  async (req, res) => {
    try {
      const { wallet, role } = req.user; // Extracted from JWT
      if (role !== "Gov") {
        return res
          .status(403)
          .send(
            encryptWrapper({
              error: "Access Denied: Only Gov can reject",
              status: false,
            }),
          );
      }
      const { universityName } = req.body; // Extract from decrypted body
      const receipt = await rejectUniversity(
        web3,
        wallet,
        universityName,
        contractArtifact,
      );
      res.status(200).send(encryptWrapper({ status: true }));
    } catch (error) {
      console.error("[ERROR] Reject Failed:", error.message);
      res
        .status(500)
        .send(
          encryptWrapper({
            error: "Reject Failed: " + error.message,
            status: false,
          }),
        );
    }
  },
);

app.get(
  "/api/requests",
  JWTAuthMiddleware,
  async (req, res) => {
    try {
      const { wallet, role } = req.user; // Extracted from JWT
      if (role !== "Gov") {
        return res
          .status(403)
          .send(
            encryptWrapper({
              error: "Access Denied: Only Gov can view requests",
              status: false,
            }),
          );
      }

      // This returns an array of structs/objects containing BigInts
      const requests = await contract.methods
        .getAllRequests()
        .call({ from: wallet });

      // FIX: Add a replacer function as the second argument
      const safeRequests = JSON.stringify(requests, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      );

      // Note: safeRequests is already a string now, so we parse it back
      // if you want 'requests' to be a JSON object in the response,
      // OR just send it as a string property as you were doing.

      res.status(200).send(encryptWrapper({
        requests: JSON.parse(safeRequests), // Parsing it back makes it a clean JSON object
        status: true,
      }));
    } catch (error) {
      console.error("[ERROR] Fetching Requests Failed:", error.message);
      res.status(500).send(encryptWrapper({
        error: "Fetching Requests Failed: " + error.message,
        status: false,
      }));
    }
  },
);

//TODO: Remove this endpoint in production, only for testing purposes
app.get("/api/dev/requests", async (req, res) => {
  try {
    const account = await web3.eth.getAccounts();
    const contract = await getContract(web3, contractArtifact);

    // This returns an array of structs/objects containing BigInts
    const requests = await contract.methods
      .getAllRequests()
      .call({ from: account[0] });

    // FIX: Add a replacer function as the second argument
    const safeRequests = JSON.stringify(requests, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );

    // Note: safeRequests is already a string now, so we parse it back
    // if you want 'requests' to be a JSON object in the response,
    // OR just send it as a string property as you were doing.

    res.status(200).send({
      requests: JSON.parse(safeRequests), // Parsing it back makes it a clean JSON object
      status: true,
    });
  } catch (error) {
    console.error("[ERROR] Fetching Requests Failed:", error.message);
    res.status(500).send({
      error: "Fetching Requests Failed: " + error.message,
      status: false,
    });
  }
});

app.listen(3000, () => {
  console.log("Server API running on http://localhost:3000");
});
