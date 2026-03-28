const Groq = require('groq-sdk');
require('dotenv').config();

async function main() {
  console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
  console.log('Key prefix:', process.env.GROQ_API_KEY?.substring(0, 10));
  
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
    });
    console.log('Groq Response:', completion.choices[0].message.content);
  } catch (e) {
    console.error('Groq Error:', e.message);
  }
}

main();
