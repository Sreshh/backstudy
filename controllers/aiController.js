const Groq = require("groq-sdk");
const prisma = require("../db");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const generateAIStudyPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const { dailyStudyHours: requestedHours, days: requestedDays, subjectIds, preferredStartHour } = req.body;

    const studyDays = parseInt(requestedDays) || 7;

    // 1. Fetch User and Data
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const hoursPerDay = requestedHours || user.dailyStudyGoal || user.dailyStudyHours || 4.0;

    // Update user's preference if provided
    if (requestedHours && requestedHours !== user.dailyStudyGoal) {
      await prisma.user.update({
        where: { id: userId },
        data: { dailyStudyGoal: parseFloat(requestedHours) },
      });
    }

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

    // 2. Prepare context for AI
    const subjectData = subjects.map((s) => ({
      name: s.name,
      difficulty: s.difficulty,
      priority: s.priority,
      topics: s.topics.map((t) => t.name),
      nextExam: s.exams.length > 0 ? s.exams[0].date : "None",
    }));

    const subjectsDetails = subjects
      .map((s) => {
        const topicsList = s.topics.map((t) => `${t.name} (Difficulty: ${t.difficulty}/5, Completed: ${t.isCompleted})`).join(", ");
        return `- ${s.name}: ${topicsList} (Overall Subject Difficulty: ${s.difficulty}/5, Priority: ${s.priority}/5)`;
      })
      .join("\n");

    const startDate = new Date().toISOString().split('T')[0];

    const startHour = preferredStartHour || 9;
    const startTimeFormatted = `${startHour}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;

    const prompt = `You are an AI Study Planner. Create a ${studyDays}-day optimized study schedule for a student.
Available study time: ${hoursPerDay} hours per day.

Subjects & Topics:
${subjectsDetails}

Start the daily sessions from ${startTimeFormatted} local time each day, starting from ${startDate}.

Rules:
1. Prioritize subjects with higher priority and topics with higher difficulty.
2. Ensure all selected subjects are covered throughout the ${studyDays} days.
3. Suggest one specific "focusTopic" (from the list above) for each session.
4. Output MUST be a valid JSON object with this exact structure:
{
  "dailyTotalHours": ${hoursPerDay},
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

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    const sessions = aiResponse.schedule || aiResponse.sessions;

    // 4. Clear old future sessions for the requested range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + studyDays + 1);

    await prisma.studySession.deleteMany({
      where: {
        subject: { userId },
        startTime: { gte: today, lt: rangeEnd },
      },
    });

    // 5. Transform and save sessions
    const createdSessions = [];
    for (const s of sessions) {
      const dbSubject = subjects.find((sub) => sub.name.toLowerCase() === s.subjectName.toLowerCase());
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
      for (const ds of createdSessions) {
        await prisma.studySession.create({
          data: ds,
        });
      }
    }

    // 6. Fetch the newly created sessions to return consistent data
    const finalSchedule = await prisma.studySession.findMany({
      where: {
        subject: { userId },
        startTime: { gte: today },
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
