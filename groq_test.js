const Groq = require("groq-sdk");
require("dotenv").config();

async function test() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "hello" }],
      // Test the model name used in the code
      model: "llama-3.3-70b-versatile",
    });
    console.log("Success:", completion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
test();
