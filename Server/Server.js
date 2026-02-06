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
  registerStudent,
  IssueCredentials,
  verifyCredential,
  RevokeCredential,
} = require("./Utils/Web3");
const fs = require("fs");
const ipfsModule = require("ipfs-http-client");
const cors = require("cors");
const { Upload } = require("./Utils/Upload");

app.use(express.json());
app.use(cors());
app.use(express.json({ limit: "100mb" }));

const web3 = new Web3("http://127.0.0.1:8545");
const ipfs = ipfsModule.create({ url: "http://127.0.0.1:5001" });
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
    if (role === "Student") {
      const newAccount = await createAccount(web3);
      const studentName = req.body.studentName;
      // eslint-disable-next-line no-unused-vars
      const _ = await registerStudent(
        web3,
        newAccount,
        studentName,
        contractArtifact,
      );
      res
        .status(200)
        .send(encryptWrapper({ account: newAccount, status: true }));
    } else if (role === "University") {
      const newAccount = await createAccount(web3);
      const universityName = req.body.universityName;
      // eslint-disable-next-line no-unused-vars
      const _ = await requestUniversityAccess(
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
        return res.status(403).send(
          encryptWrapper({
            error: "Access Denied: Only Gov can approve",
            status: false,
          }),
        );
      }
      const { universityName } = req.body; // Extract from decrypted body
      // eslint-disable-next-line no-unused-vars
      const _ = await approveUniversity(
        web3,
        wallet,
        universityName,
        contractArtifact,
      );
      res.status(200).send(encryptWrapper({ status: true }));
    } catch (error) {
      console.error("[ERROR] Approve Failed:", error.message);
      res.status(500).send(
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
        return res.status(403).send(
          encryptWrapper({
            error: "Access Denied: Only Gov can reject",
            status: false,
          }),
        );
      }
      const { universityName } = req.body; // Extract from decrypted body
      // eslint-disable-next-line no-unused-vars
      const _ = await rejectUniversity(
        web3,
        wallet,
        universityName,
        contractArtifact,
      );
      res.status(200).send(encryptWrapper({ status: true }));
    } catch (error) {
      console.error("[ERROR] Reject Failed:", error.message);
      res.status(500).send(
        encryptWrapper({
          error: "Reject Failed: " + error.message,
          status: false,
        }),
      );
    }
  },
);

app.get("/api/requests", JWTAuthMiddleware, async (req, res) => {
  try {
    const { wallet, role } = req.user; // Extracted from JWT
    if (role !== "Gov") {
      return res.status(403).send(
        encryptWrapper({
          error: "Access Denied: Only Gov can view requests",
          status: false,
        }),
      );
    }
    const contract = await getContract(web3, contractArtifact);
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

    res.status(200).send(
      encryptWrapper({
        requests: JSON.parse(safeRequests), // Parsing it back makes it a clean JSON object
        status: true,
      }),
    );
  } catch (error) {
    console.error("[ERROR] Fetching Requests Failed:", error.message);
    res.status(500).send(
      encryptWrapper({
        error: "Fetching Requests Failed: " + error.message,
        status: false,
      }),
    );
  }
});

app.get(
  "/api/issueCredenctials",
  JWTAuthMiddleware,
  decryptMiddleWare,
  async (req, res) => {
    try {
      const { wallet, role } = req.user; // Extracted from JWT
      if (role !== "University") {
        return res.status(403).send(
          encryptWrapper({
            error: "Access Denied: Only Universities can issue credentials",
            status: false,
          }),
        );
      }
      const contract = await getContract(web3, contractArtifact);
      const { student, credentialHash, credentialFile } = req.body; // Extract from decrypted body
      const cid = await Upload(credentialFile, ipfs);
      const studentAddress = await contract.methods
        .getAddressByUsername(student)
        .call();
      // eslint-disable-next-line no-unused-vars
      const _ = await IssueCredentials(
        web3,
        wallet,
        studentAddress,
        credentialHash,
        contractArtifact,
        cid,
      );
    } catch (error) {
      console.error("[ERROR] Issue Credentials Failed:", error.message);
      res.status(500).send(
        encryptWrapper({
          error: "Issue Credentials Failed: " + error.message,
          status: false,
        }),
      );
    }
  },
);

app.post(
  "/api/revokeCredential",
  JWTAuthMiddleware,
  decryptMiddleWare,
  async (req, res) => {
    try {
      const { wallet, role } = req.user; // Extracted from JWT
      if (role !== "University") {
        return res.status(403).send(
          encryptWrapper({
            error: "Access Denied: Only Universities can revoke credentials",
            status: false,
          }),
        );
      }
      const { credentialHash } = req.body;
      const isValid = await verifyCredential(
        web3,
        credentialHash,
        contractArtifact,
      );
      if (!isValid) {
        return res.status(200).send(
          encryptWrapper({
            message: "Credential is already invalid or does not exist",
            status: false,
          }),
        );
      }
      // eslint-disable-next-line no-unused-vars
      const _ = RevokeCredential(
        web3,
        credentialHash,
        contractArtifact,
        wallet,
      );
      res.status(200).send(
        encryptWrapper({
          message: "Credential revoked successfully",
          status: true,
        }),
      );
    } catch (error) {
      console.error("[ERROR] Revoke Credential Failed:", error.message);
      res.status(500).send(
        encryptWrapper({
          error: "Revoke Credential Failed: " + error.message,
          status: false,
        }),
      );
    }
  },
);

app.get("/api/getAllCrentials", JWTAuthMiddleware, async (req, res) => {
  try {
    const { wallet, role } = req.user; // Extracted from JWT
    if (role !== "Student") {
      return res.status(403).send(
        encryptWrapper({
          error: "Access Denied: Only Students can view their credentials",
          status: false,
        }),
      );
    }
    const contract = await getContract(web3, contractArtifact);
    const credentials = await contract.methods
      .getCredentialsByAddress(wallet)
      .call({ from: wallet });
    res.status(200).send(
      encryptWrapper({
        credentials,
        status: true,
      }),
    );
  } catch (error) {
    console.error("[ERROR] Fetching Credentials Failed:", error.message);
    res.status(500).send(
      encryptWrapper({
        error: "Fetching Credentials Failed: " + error.message,
        status: false,
      }),
    );
  }
});

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

app.post("/api/dev/upload", async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: "No base64Data provided" });
    }

    console.log(`Processing file: ${fileName || "Unknown"}`);

    // 3. Clean Base64 String
    // Removes the prefix if present (e.g., "data:image/png;base64,")
    const base64Content = base64Data.replace(/^data:.+;base64,/, "");

    // 4. Convert to Buffer
    const fileBuffer = Buffer.from(base64Content, "base64");

    // 5. Upload to IPFS
    // ipfs.add takes a Buffer, String, or Stream
    const result = await ipfs.add(fileBuffer);

    console.log("Upload successful. CID:", result.cid.toString());

    // 6. Return Result
    res.json({
      success: true,
      cid: result.cid.toString(),
      url: `http://127.0.0.1:8080/ipfs/${result.cid.toString()}`, // Local Gateway URL
    });
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    res.status(500).json({
      error: "Failed to upload to IPFS",
      details: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server API running on http://localhost:3000");
});
