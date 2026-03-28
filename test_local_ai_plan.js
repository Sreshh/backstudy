const jwt = require('jsonwebtoken');
require('dotenv').config();

async function test() {
  const token = jwt.sign({ userId: 1, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });

  console.log("Testing AI generate plan...");
  try {
    const res = await fetch('http://localhost:5000/api/ai/generate-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ dailyStudyHours: 4, days: 7 })
    });
    
    const responseText = await res.text();
    console.log("AI Generate Plan Response status:", res.status);
    console.log("AI Generate Plan Response body:", responseText.substring(0, 500) + "...");
    
    if (res.status === 200) {
      const data = JSON.parse(responseText);
      console.log("Plan generated with", data.schedule ? data.schedule.length : 0, "sessions");
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
