async function test() {
  // Check root
  let res = await fetch('https://backend1-pggx.onrender.com/');
  console.log("Root:", res.status, await res.text());

  // Check what routes exist
  res = await fetch('https://backend1-pggx.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test', password: 'test' })
  });
  console.log("\nAuth:", res.status);

  res = await fetch('https://backend1-pggx.onrender.com/api/subjects');
  console.log("Subjects:", res.status);

  res = await fetch('https://backend1-pggx.onrender.com/api/ai/chat');
  console.log("AI chat:", res.status);
  
  res = await fetch('https://backend1-pggx.onrender.com/api/planner');
  console.log("Planner:", res.status);
}
test();
