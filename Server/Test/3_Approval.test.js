const { decrypt } = require("../Utils/Security");
const {GOV, API_URL_} = require("./CONSTANT");

describe('University Registration & Gov Approval Flow', () => {
  let API_URL=`${API_URL_}/api`;
  
  // Shared state between tests
  let govToken; 
  const targetUniversity = "Blockchain State University (BSU111)" + Date.now(); // Unique name for testing
  const govWallet = GOV; // Removed trailing dot


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

    const data = decrypt(await response.json());

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

    const data = decrypt(await response.json());

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token');
    
    // Save token for the next steps
    govToken = data.token; 
  });

  // --- STEP 3: CHECK REQUESTS ---
  test('Step 3: Should see the pending request in the list', async () => {
    const response = await fetch(`${API_URL}/dev/requests`);
    const data = await response.json();

    // If your API returns { requests: "stringifiedJson" }, parse it
    let requests = data.requests;
    if (typeof requests === 'string') {
        requests = JSON.parse(requests);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(requests)).toBe(true);
    
    // Verify our specific university is in the list
    // (Assuming structure matches your contract return values)
    const exists = requests.some(req => 
      (req.name === targetUniversity || req[1] === targetUniversity)
    );
    expect(exists).toBe(true);
  });

  // --- STEP 4: APPROVE ---
  test('Step 4: Should approve the University using Gov Token', async () => {
    expect(govToken).toBeDefined(); // Fail if login failed
    console.log("Using Gov Token:", govToken);

    const response = await fetch(`${API_URL}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${govToken}` // Use the saved token
      },
      body: JSON.stringify({
        universityName: targetUniversity
      })
    });
    console.log("Approval Response Status:", response);
    const data = decrypt(await response.json());

    if (!response.ok) console.error("Approval Error:", data);

    expect(response.status).toBe(200);
    expect(data.status).toBe(true);
  });

});