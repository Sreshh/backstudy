const axios = require('axios');

async function main() {
  console.log('Attempting to signup admin@studymate.com via API...');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Admin User',
      email: 'admin@studymate.com',
      password: 'admin123'
    });
    console.log('Signup Successful:', response.data);
  } catch (e) {
    if (e.response) {
      console.error('Signup Failed:', e.response.status, e.response.data);
    } else {
      console.error('Signup Failed:', e.message);
    }
  }
}

main();
