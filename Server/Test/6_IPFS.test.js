const { encryptWrapper } = require("../Utils/Security");
const { API_URL_ } = require("./CONSTANT");

// Configuration
const API_URL = `${API_URL_}/api/dev/upload`;

// Test Data: A tiny 1x1 pixel red dot image (Base64)
const FAKE_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const VALID_PAYLOAD = {
    fileName: "test-red-dot.png",
    base64Data: FAKE_IMAGE
};

describe("POST /api/dev/upload Integration Tests", () => {

    test("should return 200 and IPFS CID when valid encrypted image is sent", async () => {
        // 1. Prepare Request
        // We encrypt the file payload just like the client does
        const encryptedBody = JSON.stringify(VALID_PAYLOAD);

        // 2. Send Request
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: encryptedBody
        });

        // 3. Assert Response Status
        if (!response.ok) {
            const err = await response.text();
            console.error("Upload Failed:", err);
        }
        
        expect(response.status).toBe(200);

        // 4. Assert Response Body
        const decryptedResult = await response.json();
        
        // Log for debugging
        console.log("Uploaded CID:", decryptedResult.cid);

        // Check that we got the IPFS details back
        expect(decryptedResult.success).toBe(true);
        expect(decryptedResult).toHaveProperty("cid");
        expect(decryptedResult).toHaveProperty("url");
        expect(decryptedResult.url).toContain(decryptedResult.cid);
    });

    test("should return 400/500 if base64 data is missing", async () => {
        // Prepare invalid payload (missing base64Data)
        const INVALID_PAYLOAD = {
            fileName: "empty.png"
        };
        const encryptedBody = encryptWrapper(INVALID_PAYLOAD);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: encryptedBody
        });

        expect(response.status).not.toBe(200);
    });
});