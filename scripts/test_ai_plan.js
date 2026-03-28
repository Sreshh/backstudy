const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const Groq = require('groq-sdk');
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    // 1. Get the user (admin@studymate.com = id likely 1)
    const user = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!user) {
      console.log('No student user found. Trying any user...');
      const anyUser = await prisma.user.findFirst();
      if (!anyUser) { console.log('NO USERS AT ALL'); return; }
    }
    const userId = user ? user.id : 1;
    console.log('User ID:', userId, 'Name:', user?.name);

    // 2. Get subjects
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        exams: { orderBy: { date: 'asc' } },
        topics: { where: { isCompleted: false } },
      },
    });

    console.log('Subjects found:', subjects.length);
    if (subjects.length === 0) {
      console.log('ERROR: No subjects found for this user. Add subjects first!');
      return;
    }

    subjects.forEach(s => {
      console.log(`  - ${s.name}: ${s.topics.length} topics, ${s.exams.length} exams`);
    });

    // 3. Try to generate with Groq
    const startDate = new Date().toISOString().split('T')[0];
    const subjectsDetails = subjects.map(s => {
      const topicsList = s.topics.map(t => `${t.name} (Difficulty: ${t.difficulty}/5)`).join(', ');
      return `- ${s.name}: ${topicsList || 'No topics'} (Difficulty: ${s.difficulty}/5, Priority: ${s.priority}/5)`;
    }).join('\n');

    const prompt = `You are an AI Study Planner. Create a 7-day optimized study schedule for a student.
Available study time: 4 hours per day.

Subjects & Topics:
${subjectsDetails}

Start the daily sessions from 9:00 AM local time each day, starting from ${startDate}.

Rules:
1. Prioritize subjects with higher priority and topics with higher difficulty.
2. Ensure all selected subjects are covered throughout the 7 days.
3. Suggest one specific "focusTopic" (from the list above) for each session.
4. Output MUST be a valid JSON object with this exact structure:
{
  "dailyTotalHours": 4,
  "schedule": [
    {
      "day": "Monday",
      "startTime": "${startDate}T09:00:00Z",
      "endTime": "${startDate}T11:00:00Z",
      "subjectName": "Math",
      "focusTopic": "Calculus: Derivatives"
    }
  ]
}
Return ONLY the JSON object.`;

    console.log('\nCalling Groq API...');
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    const sessions = aiResponse.schedule || aiResponse.sessions;
    console.log('AI returned', sessions?.length, 'sessions');

    if (!sessions || sessions.length === 0) {
      console.log('ERROR: AI returned no sessions!');
      console.log('Raw AI response:', JSON.stringify(aiResponse, null, 2));
      return;
    }

    // 4. Try saving
    let created = 0;
    for (const s of sessions) {
      const dbSubject = subjects.find(sub => sub.name.toLowerCase() === s.subjectName.toLowerCase());
      if (!dbSubject) {
        console.log(`  SKIP: No DB subject matches "${s.subjectName}"`);
        continue;
      }
      try {
        await prisma.studySession.create({
          data: {
            subjectId: dbSubject.id,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            focusTopic: s.focusTopic,
          },
        });
        created++;
      } catch (e) {
        console.log(`  FAIL: ${e.message.substring(0, 80)}`);
      }
    }
    console.log(`\nSaved ${created}/${sessions.length} sessions to DB`);

  } catch (e) {
    console.error('CRITICAL ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
