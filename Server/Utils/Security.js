// import CryptoJS from "crypto-js";
// import jwt from "jsonwebtoken";

const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

const secretKey = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3"; // TODO: Change secret Key
const TOKEN_EXPIRY = "24h";

function getJWTToken(walletAddress, role) {
  // 1. Define the Payload (Data inside the token)
  const payload = {
    wallet: walletAddress,
    role: role,
    issuedAt: Date.now(),
  };

  // 2. Sign the Token
  // jwt.sign(payload, secretOrPrivateKey, [options, callback])
  const token = jwt.sign(payload, secretKey, {
    expiresIn: TOKEN_EXPIRY,
  });

  return token;
}

const encrypWrapper = (data) => {
  const jsonString = JSON.stringify(data);
  return JSON.stringify(encrypt(jsonString));
};

const encrypt = (text) => {
  return { content: CryptoJS.AES.encrypt(text, secretKey).toString() };
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext.content, secretKey);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(originalText);
};

const decryptMiddleWare = (req, res, next) => {
  try {
    if (req.body.content) {
      req.body = decrypt(req.body);
    }
    next();
  } catch (error) {
    res.status(400).send({ message: "Invalid encrypted data" });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <TOKEN>

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = {
      wallet: user.wallet,
      role: user.role,
    }; // Attach user info to request
    next();
  });
};

module.exports = {
  getJWTToken,
  encrypWrapper,
  encrypt,
  decrypt,
  decryptMiddleWare,
  authenticateToken,
};
