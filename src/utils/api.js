import axios from "axios";
import { encryptData, decryptData } from "./crypto";

// Update Base URL to match the Express server port
const API = axios.create({
  baseURL: "http://10.2.40.0:76/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to convert file to Base64 for IPFS upload on server
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

/* ---------------- REGISTER ---------------- */
export const registerUser = async (name, walletAddress, password, role) => {
  const payload =
    role === "Student"
      ? { role, studentName: name }
      : { role, universityName: name };

  const encrypted = encryptData(payload, walletAddress, password);

  const res = await API.post("/register", encrypted);
  const data = decryptData(res.data, walletAddress, password);

  return {
    success: data.status,
    account: data.account,
    message:
      role === "University"
        ? "Registration successful! Awaiting government approval."
        : "Registration successful!",
  };
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (walletAddress, password, role) => {
  // Encrypt wallet address as expected by decryptMiddleWare
  const encrypted = encryptData({ walletAddress }, walletAddress, password);

  const res = await API.post("/login", encrypted);
  // Server returns { token, role, status } inside encryptWrapper
  const data = decryptData(res.data, walletAddress, password);

  if (data.status) {
    localStorage.setItem("jwt", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("wallet", walletAddress);
  }

  return {
    success: data.status,
    role: data.role,
    token: data.token,
    error: data.error,
  };
};

/* ---------------- ADMIN LOGIN (Gov) ---------------- */
export const adminLogin = async (walletAddress, password) => {
  return loginUser(walletAddress, password, "Gov");
};

/* ---------------- PENDING ISSUERS ---------------- */
export const getPendingIssuers = async () => {
  const res = await API.get("/requests");
  const data = decryptData(res.data);

  if (!data.requests) return [];

  // Filter for status '0' (Pending)
  return data.requests.filter(
    (req) => req.status === "0" || req.status === 0
  );
};

export const getApprovedIssuers = async () => {
  const res = await API.get("/requests");
  const data = decryptData(res.data);

  if (!data.requests) return [];

  // Filter for status '2' (Approved) - Server converts BigInt to string
  const approved = data.requests.filter(
    (req) => req.status === "2" || req.status === 2
  );

  return approved;
};

/* ---------------- APPROVE ISSUER ---------------- */
export const approveIssuer = async (universityName) => {
  const encrypted = encryptData({ universityName });

  const res = await API.post("/approve", encrypted);
  const data = decryptData(res.data);

  return { success: data.status, error: data.error };
};

/* ---------------- REJECT ISSUER ---------------- */
export const rejectIssuer = async (universityName) => {
  const encrypted = encryptData({ universityName });

  const res = await API.post("/reject", encrypted);
  const data = decryptData(res.data);

  return { success: data.status, error: data.error };
};

/* ---------------- ISSUE CREDENTIAL ---------------- */
export const issueCredential = async (studentUsername, file) => {
  // 1. Calculate Hash
  const credentialHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer()
  );
  const credentialHash = Array.from(new Uint8Array(credentialHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 2. Convert File to Base64 (Server expects data for IPFS upload)
  const fileBase64 = await toBase64(file);

  const encrypted = encryptData({
    student: studentUsername,
    credentialHash: credentialHash, // Hex string
    credentialFile: fileBase64,     // Actual file data
  });

  // NOTE: Server defines this as app.get(), but expects a body.
  // Axios requires `data` property for body in GET requests.
  const res = await API.get("/issueCredenctials", {
    data: encrypted
  });
  
  const data = decryptData(res.data);

  return {
    success: data.status,
    message: data.status ? "Credential issued successfully" : data.error,
  };
};

/* ---------------- HOLDER CREDENTIALS ---------------- */
export const getHolderCredentials = async () => {
  // Matches server endpoint: /api/getAllCrentials (Typos preserved)
  const res = await API.get("/getAllCrentials");
  const data = decryptData(res.data);

  if (!data.status) {
    throw new Error(data.error || "Failed to fetch credentials");
  }

  return data.credentials;
};

/* ---------------- VERIFY CREDENTIAL ---------------- */
export const verifyCredential = async (file) => {
  // The server does not expose a public /verify endpoint. 
  // Verification is done on-chain or via the revoke endpoint internally.
  // We can calculate the hash here for the UI to show.
  
  const credentialHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer()
  );
  const hash = Array.from(new Uint8Array(credentialHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    success: true,
    message: "Local hash calculated. Use Blockchain explorer to verify.",
    hash: hash
  };
};

/* ---------------- REVOKE CREDENTIAL ---------------- */
export const revokeCredential = async (credentialHash) => {
  const encrypted = encryptData({ credentialHash });

  const res = await API.post("/revokeCredential", encrypted);
  const data = decryptData(res.data);

  return {
    success: data.status,
    message: data.message || data.error,
  };
};
