const Groq = require("groq-sdk");
const prisma = require("../db");

if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY is missing in .env file.");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

const generateAIStudyPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      dailyStudyHours: requestedHours, 
      days: requestedDays, 
      subjectIds, 
      preferredStartHour,
      timezoneOffset 
    } = req.body;

    const studyDays = parseInt(requestedDays) || 7;
    const tzOffset = parseInt(timezoneOffset) || 0; // in minutes

    // 1. Fetch User and Data
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const hoursPerDay = requestedHours || user.dailyStudyGoal || user.dailyStudyHours || 4.0;

    const whereClause = { userId };
    if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
      whereClause.id = { in: subjectIds.map(id => parseInt(id)) };
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        exams: { orderBy: { date: "asc" } },
        topics: { where: { isCompleted: false } },
      },
    });

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({ message: "Add subjects first to generate a plan." });
    }

    // 2. Calculate User's "Today"
    const nowServer = new Date();
    const nowUser = new Date(nowServer.getTime() + (tzOffset * 60 * 1000));
    
    // Generate dates based on User's local time
    const upcomingDates = [];
    for (let i = 0; i < studyDays; i++) {
        const d = new Date(nowUser);
        d.setDate(d.getDate() + i);
        upcomingDates.push(d.toISOString().split('T')[0]);
    }

    const startHour = preferredStartHour || 9;
    const startTimeFormatted = `${startHour}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;

    const subjectsDetails = subjects
      .map((s) => {
        const topicsList = s.topics.map((t) => `${t.name} (Difficulty: ${t.difficulty}/5)`).join(", ");
        return `- ID: ${s.id}, Name: ${s.name}: ${topicsList} (Difficulty: ${s.difficulty}/5, Priority: ${s.priority}/5)`;
      })
      .join("\n");

    const prompt = `You are an AI Study Planner. Create a ${studyDays}-day optimized study schedule.
Available study time: ${hoursPerDay} hours per day.
User Timezone Offset: ${tzOffset} minutes (GMT${tzOffset <= 0 ? '+' : '-'}${Math.abs(tzOffset/60)})

Subjects & Topics (Use these IDs):
${subjectsDetails}

Scheduled Dates:
${upcomingDates.map((d, i) => `Day ${i+1}: ${d}`).join("\n")}

Rules:
1. Start daily sessions at ${startTimeFormatted} LOCAL time each day.
2. Output startTime and endTime as ISO strings in UTC (Z), but calculate them to match the ${startTimeFormatted} LOCAL start time using the provided offset of ${tzOffset} minutes.
3. Suggest one specific "focusTopic" (from the list above) for each session.
4. Ensure no subject sessions overlap in time on the same day.
5. Maximize productivity by putting harder subjects earlier.
6. Output MUST be a valid JSON object with this exact structure:
{
  "schedule": [
    {
      "date": "2026-03-29",
      "startTime": "2026-03-29T04:30:00Z",
      "endTime": "2026-03-29T06:30:00Z",
      "subjectId": 12,
      "focusTopic": "Calculus: Derivatives"
    }
  ]
}
Return ONLY the JSON object.`;

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    let aiResponse;
    try {
      const rawContent = completion.choices[0].message.content;
      // Handle cases where AI might wrap JSON in markdown code blocks
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", completion.choices[0].message.content);
      throw new Error("AI returned an invalid format. Please try again.");
    }

    const sessions = aiResponse.schedule || aiResponse.sessions || [];

    // 4. Clear old sessions for the range
    const todayUserStart = new Date(upcomingDates[0] + 'T00:00:00Z'); 
    const startRangeUtc = new Date(todayUserStart.getTime() - (tzOffset * 60 * 1000));
    
    const rangeEnd = new Date(startRangeUtc);
    rangeEnd.setDate(rangeEnd.getDate() + studyDays + 1);

    await prisma.studySession.deleteMany({
      where: {
        subject: { userId },
        startTime: { gte: startRangeUtc, lt: rangeEnd },
      },
    });

    // 5. Transform and save sessions
    const createdSessions = [];
    for (const s of sessions) {
      const dbSubject = subjects.find((sub) => sub.id === parseInt(s.subjectId));
      if (dbSubject) {
        createdSessions.push({
          subjectId: dbSubject.id,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
          focusTopic: s.focusTopic,
        });
      }
    }

    if (createdSessions.length > 0) {
      await prisma.studySession.createMany({
        data: createdSessions
      });
    }

    // 6. Fetch the newly created sessions to return consistent data
    const finalSchedule = await prisma.studySession.findMany({
      where: {
        subject: { userId },
        startTime: { gte: startRangeUtc },
      },
      include: { subject: true },
      orderBy: { startTime: "asc" },
    });

    res.json({
      message: "AI Study Plan generated successfully",
      dailyTotalHours: hoursPerDay,
      schedule: finalSchedule,
    });
  } catch (error) {
    console.error("Groq AI Error:", error);
    res.status(500).json({ message: "Failed to generate AI plan", error: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const userId = req.userId;
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    // 1. Fetch User Data for Context (with safe fallbacks)
    let userName = "Student";
    let userCourse = "Not specified";
    let userSemester = "Not specified";
    let dailyGoal = 4;
    let subjectsContext = "No subjects added yet.";
    let tasksContext = "No pending tasks.";

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, course: true, semester: true, dailyStudyGoal: true }
      });
      if (user) {
        userName = user.name || "Student";
        userCourse = user.course || "Not specified";
        userSemester = user.semester || "Not specified";
        dailyGoal = user.dailyStudyGoal || 4;
      }
    } catch (_) {}

    try {
      const subjects = await prisma.subject.findMany({
        where: { userId },
        include: {
          topics: { where: { isCompleted: false } },
          exams: { orderBy: { date: "asc" }, take: 1 },
        },
      });
      if (subjects && subjects.length > 0) {
        subjectsContext = subjects.map((s) => {
          const topics = s.topics.map((t) => t.name).join(", ");
          const exam = s.exams.length > 0 ? `Next exam: ${s.exams[0].date}` : "No upcoming exams";
          return `- ${s.name}: ${topics} (${exam})`;
        }).join("\n");
      }
    } catch (_) {}

    try {
      const tasks = await prisma.task.findMany({
        where: { userId, isCompleted: false },
        take: 5,
      });
      if (tasks && tasks.length > 0) {
        tasksContext = tasks.map((t) => `- ${t.title}`).join("\n");
      }
    } catch (_) {}

    // 2. Build context prompt
    const contextPrompt = `You are StudyMate AI, a helpful study assistant. 
Current Student: ${userName}
Course: ${userCourse}
Semester: ${userSemester}
Daily Goal: ${dailyGoal} hours

Current Subjects & Pending Topics:
${subjectsContext}

Pending Tasks:
${tasksContext}

Guidelines:
1. Provide concise, encouraging, and actionable study advice.
2. Help the student plan their study sessions based on their specific subjects and tasks.
3. If they ask about their progress, refer to their subjects and topics.
4. Keep the tone friendly and professional.`;

    const messages = [
      { role: "system", content: contextPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content;

    res.json({
      reply: reply,
    });
  } catch (error) {
    console.error("Chat AI Error:", error);
    res.status(500).json({ message: "Failed to get AI response", error: error.message });
  }
};

module.exports = { generateAIStudyPlan, chatWithAI };
