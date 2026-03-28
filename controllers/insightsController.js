const prisma = require('../db');
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const getInsights = async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({
            where: { userId: req.userId },
            include: { topics: true, exams: true },
        });

        if (subjects.length === 0) {
            return res.json({ suggestions: ["Add some subjects to get personalized AI insights!"] });
        }

        // Prepare data for AI
        const dataSummary = subjects.map(s => {
            const totalTopics = s.topics.length;
            const completedTopics = s.topics.filter(t => t.isCompleted).length;
            const progress = totalTopics > 0 ? (completedTopics / totalTopics * 100).toFixed(1) : 0;
            const nextExam = s.exams.length > 0 ? s.exams[0].date : 'No upcoming exam';
            return `- ${s.name}: ${progress}% complete. Priority: ${s.priority}/5. Difficulty: ${s.difficulty}/5. Next Exam: ${nextExam}`;
        }).join('\n');

        const prompt = `
        You are an intelligent study assistant. Based on the following student's progress, provide 3-5 concise, actionable, and encouraging study tips. Focus on subjects with low progress, high priority, or upcoming exams.
        
        Student Data:
        ${dataSummary}
        
        Format the response as a simple JSON array of strings, e.g., ["Tip 1", "Tip 2"]. Do not include markdown formatting or extra text.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
        });

        let aiResponse = chatCompletion.choices[0]?.message?.content || '[]';
        
        // Clean up markdown code blocks if present
        if (aiResponse.includes('```')) {
            const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) aiResponse = match[1];
        }

        let suggestions = [];
        try {
            // Find the start and end of the JSON array
            const startIdx = aiResponse.indexOf('[');
            const endIdx = aiResponse.lastIndexOf(']');
            
            if (startIdx !== -1 && endIdx !== -1) {
                const jsonStr = aiResponse.substring(startIdx, endIdx + 1);
                suggestions = JSON.parse(jsonStr);
            } else {
                // Fallback to line splitting if no JSON array markers found
                suggestions = aiResponse.split('\n')
                    .map(s => s.replace(/^\s*[-*•\d.]+\s*/, '').trim())
                    .filter(s => s.length > 10);
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
            suggestions = aiResponse.split('\n')
                .map(s => s.replace(/^\s*[-*•\d.]+\s*/, '').trim())
                .filter(s => s.length > 10);
        }

        // Take only first 5 tips
        suggestions = suggestions.slice(0, 5);

        res.json({ suggestions });

    } catch (error) {
        console.error("Error generating insights:", error);
        res.status(500).json({ message: "Failed to generate AI insights.", error: error.message });
    }
};

module.exports = { getInsights };
