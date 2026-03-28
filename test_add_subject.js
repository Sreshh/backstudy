const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({ userId: 1, role: 'student' }, 'study_planner_secret_12345', { expiresIn: '7d' });

  const data = {
    name: 'Array of strings subject',
    difficulty: 3,
    priority: 3,
    topics: ['topic1']
  };

  const res = await fetch('https://backend1-pggx.onrender.com/api/subjects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(data)
  });
  
  const text = await res.text();
  console.log("Response:", res.status, text);
}

test();
