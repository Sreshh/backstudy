const axios = require('axios');

async function testSignup() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Test Agent',
      email: 'agent_test_' + Date.now() + '@test.com',
      password: 'password123'
    });
    console.log('Signup success:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Signup error:', error.response.status, error.response.data);
    } else {
      console.log('Signup error:', error.message);
    }
  }
}

testSignup();
