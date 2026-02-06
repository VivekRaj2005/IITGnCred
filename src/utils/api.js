import { encryptData, generateDummyDID } from './crypto';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const registerUser = async (name, username, password, role) => {
  await delay(1000);
  
  const didDocument = {
    did: generateDummyDID(),
    name: name,
    username: username,
    role: role,
    publicKey: `pk_${Math.random().toString(36).substring(2, 15)}`,
    createdAt: new Date().toISOString(),
    status: role === 'issuer' ? 'pending' : 'active'
  };
  
  const encryptedFile = encryptData(didDocument, username, password);
  
  return {
    success: true,
    encryptedFile,
    name,
    message: role === 'issuer' 
      ? 'Registration successful! Awaiting admin approval.' 
      : 'Registration successful!'
  };
};

export const loginUser = async (username, password, role) => {
  await delay(800);
  
  const storedEncryptedFile = localStorage.getItem(`${role}_${username}_encrypted`);
  const storedName = localStorage.getItem(`${role}_${username}_name`);
  
  if (!storedEncryptedFile) {
    throw new Error('User not found. Please register first.');
  }
  
  return {
    success: true,
    encryptedFile: storedEncryptedFile,
    name: storedName
  };
};

export const adminLogin = async (username, password) => {
  await delay(800);
  
  if (username === 'admin' && password === 'admin123') {
    return {
      success: true,
      message: 'Admin login successful'
    };
  }
  
  throw new Error('Invalid admin credentials');
};

export const getApprovedIssuers = async () => {
  await delay(500);
  const approvedIssuers = JSON.parse(localStorage.getItem('approvedIssuers') || '[]');
  return approvedIssuers;
};

export const getPendingIssuers = async () => {
  await delay(500);
  const pendingIssuers = JSON.parse(localStorage.getItem('pendingIssuers') || '[]');
  return pendingIssuers;
};

export const approveIssuer = async (username) => {
  await delay(500);
  
  const pendingIssuers = JSON.parse(localStorage.getItem('pendingIssuers') || '[]');
  const approvedIssuers = JSON.parse(localStorage.getItem('approvedIssuers') || '[]');
  
  const issuerIndex = pendingIssuers.findIndex(i => i.username === username);
  if (issuerIndex !== -1) {
    const issuer = pendingIssuers[issuerIndex];
    issuer.status = 'approved';
    issuer.approvedAt = new Date().toISOString();
    
    approvedIssuers.push(issuer);
    pendingIssuers.splice(issuerIndex, 1);
    
    localStorage.setItem('approvedIssuers', JSON.stringify(approvedIssuers));
    localStorage.setItem('pendingIssuers', JSON.stringify(pendingIssuers));
    
    return { success: true, message: 'Issuer approved successfully' };
  }
  
  throw new Error('Issuer not found');
};

export const rejectIssuer = async (username) => {
  await delay(500);
  
  const pendingIssuers = JSON.parse(localStorage.getItem('pendingIssuers') || '[]');
  const updatedIssuers = pendingIssuers.filter(i => i.username !== username);
  
  localStorage.setItem('pendingIssuers', JSON.stringify(updatedIssuers));
  
  return { success: true, message: 'Issuer rejected' };
};

export const issueCredential = async (holderUsername, file) => {
  await delay(1000);
  
  const credential = {
    id: `cred_${Math.random().toString(36).substring(2, 15)}`,
    holderUsername: holderUsername,
    fileName: file.name,
    fileData: file.data,
    fileType: file.type,
    issuedAt: new Date().toISOString(),
    issuer: 'current_issuer'
  };
  
  const credentials = JSON.parse(localStorage.getItem('credentials') || '[]');
  credentials.push(credential);
  localStorage.setItem('credentials', JSON.stringify(credentials));
  
  return {
    success: true,
    message: 'Credential issued successfully',
    credential
  };
};

export const getHolderCredentials = async (holderUsername) => {
  await delay(500);
  
  const credentials = JSON.parse(localStorage.getItem('credentials') || '[]');
  const holderCredentials = credentials.filter(c => c.holderUsername === holderUsername);
  
  return holderCredentials;
};

export const verifyCredential = async (file) => {
  await delay(1500);
  
  const isValid = Math.random() > 0.3;
  
  return {
    success: true,
    isValid: isValid,
    message: isValid ? 'Credential is valid and verified' : 'Credential verification failed',
    details: {
      fileName: file.name,
      verifiedAt: new Date().toISOString(),
      issuer: isValid ? 'Trusted Issuer' : 'Unknown',
      status: isValid ? 'VERIFIED' : 'INVALID'
    }
  };
};