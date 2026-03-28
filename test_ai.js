const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({ userId: 1, role: 'student' }, 'study_planner_secret_12345', { expiresIn: '7d' });

  // Test AI chat
  const res = await fetch('https://backend1-pggx.onrender.com/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ message: 'hello', history: [] })
  });
  
  const text = await res.text();
  console.log("AI Chat Response:", res.status, text.substring(0, 300));
}

test();
