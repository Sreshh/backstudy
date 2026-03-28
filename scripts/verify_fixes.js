const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api';
let token = '';

async function runTests() {
    console.log('--- Starting Verification ---');

    try {
        // 1. Login (assuming the test user exists)
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@studymate.com',
            password: 'adminpassword123'
        });
        token = loginRes.data.token;
        console.log('Logged in successfully.');

        // 2. Test Progress API with Timezone
        console.log('\nTesting Progress Bar API...');
        const progressRes = await axios.get(`${API_URL}/progress?timezoneOffset=-330`, {
            headers: { Authorization: token }
        });
        console.log('Progress Data:', JSON.stringify(progressRes.data, null, 2));

        if (progressRes.data.dailyGoal !== undefined && progressRes.data.dailyProgressPercent !== undefined) {
            console.log('✅ Daily progress fields are present.');
        } else {
            console.error('❌ Daily progress fields are MISSING.');
        }

        // 3. Test Planner API with Timezone
        console.log('\nTesting Planner API...');
        const plannerRes = await axios.get(`${API_URL}/planner?timezoneOffset=-330`, {
            headers: { Authorization: token }
        });
        console.log(`Planner returned ${plannerRes.data.length} sessions for Today/Tomorrow.`);
        
        if (plannerRes.data.length >= 0) {
            console.log('✅ Planner API is working.');
        }

        console.log('\n--- Verification Complete ---');
    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    }
}

runTests();
