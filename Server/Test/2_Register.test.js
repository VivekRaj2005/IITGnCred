// register.test.js
const { encrypWrapper, decrypt } = require("../Utils/Security");

const API_URL = "http://localhost:3000/api/register";

describe("POST /api/register Integration Tests", () => {

    test("should create a new Ethereum account and return encrypted details", async () => {
        
        // 1. Prepare Request
        // Even though the register endpoint doesn't read the body, 
        // the middleware might expect valid encrypted JSON structure.
        const payload = encrypWrapper({});

        // 2. Send Request
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        // 3. Assert HTTP Status
        expect(response.status).toBe(200);

        // 4. Get and Decrypt Response
        const encryptedResponse = await response.json();
        
        // We use decryptWrapper here to read what the server sent back
        const decryptedData = decrypt(encryptedResponse);

        // 5. Assert Structure
        expect(decryptedData).toHaveProperty("status", true);
        expect(decryptedData).toHaveProperty("account");
        
        const newAccount = decryptedData.account;
        expect(newAccount).toHaveProperty("address");
        expect(newAccount).toHaveProperty("privateKey");

        // 6. Log Output (As requested)
        console.log('\n--- New Account Generated ---');
        console.log('New Ethereum Account Created:', newAccount);
        console.log('Address:', newAccount.address);
        console.log('Private Key:', newAccount.privateKey);
    });
});