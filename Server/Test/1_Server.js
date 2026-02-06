// Usage: node test-login-request.js
const {encrypWrapper} = require("../Utils/Security");
const API_URL = "http://localhost:3000/api/login";

// --- STEP 1: ENTER YOUR DATA HERE ---
// You can get these by signing "Login to IdentityRegistry" on MyEtherWallet or Etherscan
const TEST_DATA = {
    walletAddress: "0x8042CCF709ABEf7af0B5Ca4d1b4655C6592EA08E",
};

async function sendLoginRequest() {
    console.log(`\nTesting Login Endpoint: ${API_URL}`);
    console.log("Sending Payload:", JSON.stringify(TEST_DATA, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: encrypWrapper(TEST_DATA) // Encrypt the payload before sending
        });

        const result = await response.json();

        console.log("\n--- SERVER RESPONSE ---");
        console.log(`Status Code: ${response.status}`);
        console.log("Body:", result);

        if (response.ok) {
            console.log("\n✅ Test Passed: Token Received");
        } else {
            console.log("\n❌ Test Failed: " + (result.error || "Unknown Error"));
        }

    } catch (error) {
        console.error("\n❌ Network Error: Could not connect to server.");
        console.error("Details:", error.message);
    }
}

sendLoginRequest();