const { decrypt } = require("../Utils/Security");
const { GOV, API_URL_ } = require("./CONSTANT");

describe('University Registration & Gov Reject Flow', () => {
  let API_URL = `${API_URL_}/api`;
  
  // Shared state between tests
  let govToken; 
  const targetUniversity = "Blockchain State University (BSU112)" + Date.now(); 
  const govWallet = GOV;

  // --- STEP 1: REGISTER ---
  test('Step 1: Should register a new University', async () => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "University",
        universityName: targetUniversity
      })
    });

    // Decrypting the response body as per your utility
    const rawData = await response.json();
    const data = decrypt(rawData);

    expect(response.status).toBe(200);
    expect(data.status).toBe(true);
    expect(data.account).toHaveProperty('address');
    
    console.log("Registered Uni Address:", data.account.address);
  });

  // --- STEP 2: GOV LOGIN ---
  test('Step 2: Should login as Government and receive JWT', async () => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: govWallet,
      })
    });

    const rawData = await response.json();
    const data = decrypt(rawData);

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token');
    
    govToken = data.token; 
  });

  // --- STEP 3: CHECK REQUESTS ---
  test('Step 3: Should see the pending request in the list', async () => {
    // Note: If /requests requires Gov Auth, add the header here too
    const response = await fetch(`${API_URL}/requests`, {
       headers: { "Authorization": `Bearer ${govToken}` }
    });
    
    const rawData = await response.json();
    const data = decrypt(rawData);

    let requests = data.requests;
    if (typeof requests === 'string') {
        requests = JSON.parse(requests);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(requests)).toBe(true);
    
    const exists = requests.some(req => 
      (req.name === targetUniversity || req[1] === targetUniversity)
    );
    expect(exists).toBe(true);
  });

  // --- STEP 4: REJECT ---
  test('Step 4: Should reject the University using Gov Token', async () => {
    expect(govToken).toBeDefined(); 

    const response = await fetch(`${API_URL}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${govToken}` 
      },
      body: JSON.stringify({
        universityName: targetUniversity
      })
    });

    const rawData = await response.json();
    const data = decrypt(rawData);

    if (!response.ok) console.error("Reject Error:", data);

    expect(response.status).toBe(200);
    expect(data.status).toBe(true);
  });

});