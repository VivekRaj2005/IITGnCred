const { encryptWrapper, decrypt } = require("../Utils/Security");
const { API_URL_, UNI, GOV, STUDENT } = require("./CONSTANT");
const jwt = require("jsonwebtoken");
const { data } = require("./TestImage");
const crypto = require('crypto');

// Endpoints
const REGISTER_STUDENT_URL = `${API_URL_}/api/registerStudent`;
const REQUEST_UNI_URL = `${API_URL_}/api/requestUniversity`;
const APPROVE_UNI_URL = `${API_URL_}/api/approveUniversity`;
const ISSUE_CRED_URL = `${API_URL_}/api/issueCredenctials`;

const SECRET_KEY = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";

// Helper for JWT
const generateToken = (wallet, role) => {
    return jwt.sign({ wallet, role }, SECRET_KEY, { expiresIn: "1h" });
};

describe("Full E2E Blockchain Flow via Server API", () => {
    // Unique data for this test run to avoid "already exists" errors
    const studentUsername = `user_${crypto.randomBytes(3).toString('hex')}`;
    const uniName = `Uni_${crypto.randomBytes(3).toString('hex')}`;
    const credentialHash = "0x" + crypto.randomBytes(32).toString('hex');
    
    let studentToken, uniToken, govToken;

    beforeAll(() => {
        studentToken = generateToken(STUDENT, "Student");
        uniToken = generateToken(UNI, "University");
        govToken = generateToken(GOV, "Government");
    });

    /**
     * STEP 1: STUDENT REGISTRATION
     */
    test("1. Should register a new student profile", async () => {
        const payload = encryptWrapper({ username: studentUsername });

        const response = await fetch(REGISTER_STUDENT_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: payload
        });

        const result = decrypt(await response.json());
        expect(response.status).toBe(200);
        expect(result.status).toBe(true);
    });

    /**
     * STEP 2: UNIVERSITY REQUESTS AUTHORIZATION
     */
    test("2. University should apply for authorization", async () => {
        const payload = encryptWrapper({ universityName: uniName });

        const response = await fetch(REQUEST_UNI_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${uniToken}`
            },
            body: payload
        });

        const result = decrypt(await response.json());
        expect(response.status).toBe(200);
        expect(result.status).toBe(true);
    });

    /**
     * STEP 3: GOVERNMENT APPROVES UNIVERSITY
     */
    test("3. Government should approve the university application", async () => {
        const payload = encryptWrapper({ universityName: uniName });

        const response = await fetch(APPROVE_UNI_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${govToken}`
            },
            body: payload
        });

        const result = decrypt(await response.json());
        expect(response.status).toBe(200);
        expect(result.status).toBe(true);
    });

    /**
     * STEP 4: ISSUE CREDENTIAL
     */
    test("4. Approved University issues credential to registered Student", async () => {
        const payload = encryptWrapper({
            student: studentUsername, // Using the username registered in Step 1
            credentialHash: credentialHash,
            credentialFile: data 
        });

        const response = await fetch(ISSUE_CRED_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${uniToken}`
            },
            body: payload
        });

        const result = decrypt(await response.json());
        
        if (response.status !== 200) {
            console.error("Issuance failed:", result);
        }

        expect(response.status).toBe(200);
        expect(result.status).toBe(true);
        expect(result).toHaveProperty("message");
    });
});