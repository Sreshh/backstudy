const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  const token = jwt.sign({ userId: 1, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });

  console.log("Testing local AI chat...");
  try {
    const res = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ message: 'hello', history: [] })
    });
    
    const responseText = await res.text();
    console.log("AI Chat Response status:", res.status);
    console.log("AI Chat Response body:", responseText);
    if (res.status === 200) {
      const data = JSON.parse(responseText);
      console.log("AI Chat Reply:", data.reply ? data.reply.substring(0, 100) + "..." : "No reply");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
