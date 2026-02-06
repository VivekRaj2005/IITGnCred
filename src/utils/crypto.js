import CryptoJS from 'crypto-js';

export const encryptData = (data, username, password) => {
  const key = username + password;
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  return encrypted;
};

export const decryptData = (encryptedData, username, password) => {
  try {
    const key = username + password;
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const generateDummyDID = () => {
  return `did:example:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
};