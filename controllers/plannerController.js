const prisma = require('../db');

const generatePlan = async (req, res) => {
    try {
        const { availableHoursPerDay, timezoneOffset } = req.body;
        const userId = req.userId;
        const tzOffset = parseInt(timezoneOffset) || 0;

        // 1. Fetch Subjects and Exams
        const subjects = await prisma.subject.findMany({
            where: { userId: userId },
            include: { exams: true },
        });

        if (subjects.length === 0) {
            return res.status(400).json({ message: 'No subjects found. Add subjects first.' });
        }

        // 2. Calculate Weights
        const now = new Date();
        const subjectWeights = subjects.map(subject => {
            let daysUntilExam = 30; // Default if no exam
            if (subject.exams.length > 0) {
                const earliestExam = new Date(Math.min(...subject.exams.map(e => new Date(e.date))));
                daysUntilExam = Math.max(1, Math.ceil((earliestExam - now) / (1000 * 60 * 60 * 24)));
            }
            const weight = (subject.priority * subject.difficulty) / Math.sqrt(daysUntilExam);
            return { id: subject.id, weight };
        });

        const totalWeight = subjectWeights.reduce((acc, s) => acc + s.weight, 0);

        // 3. Clear future sessions
        const deletePromise = prisma.studySession.deleteMany({
            where: {
                subject: { userId: userId },
                startTime: { gte: now },
                isDone: false // Don't delete completed ones
            },
        });

        // 4. Distribute hours and create sessions for next 7 days
        const sessionsToCreate = [];
        
        // Calculate start of "today" at 9 AM in user's timezone
        const startOfTodayLocal = new Date(now.getTime() - (tzOffset * 60 * 1000));
        startOfTodayLocal.setUTCHours(9, 0, 0, 0);

        for (let day = 0; day < 7; day++) {
            let currentStartTimeLocal = new Date(startOfTodayLocal);
            currentStartTimeLocal.setUTCDate(currentStartTimeLocal.getUTCDate() + day);

            subjectWeights.forEach(sw => {
                const hoursForThisSubject = (sw.weight / totalWeight) * (availableHoursPerDay || 4);
                if (hoursForThisSubject < 0.5) return; // Skip if less than 30 mins

                const startTimeUtc = new Date(currentStartTimeLocal.getTime() + (tzOffset * 60 * 1000));
                const endTimeUtc = new Date(startTimeUtc.getTime() + Math.round(hoursForThisSubject * 60 * 60 * 1000));

                // Only schedule if it's in the future
                if (startTimeUtc > now) {
                    sessionsToCreate.push({
                        subjectId: sw.id,
                        startTime: startTimeUtc,
                        endTime: endTimeUtc,
                    });
                }

                // Add 15 min break to local tracker
                currentStartTimeLocal = new Date(currentStartTimeLocal.getTime() + Math.round(hoursForThisSubject * 60 * 60 * 1000) + (15 * 60 * 1000));
            });
        }

        // 5. Execute as a transaction
        const result = await prisma.$transaction(async (tx) => {
            await deletePromise;
            const created = [];
            for (const data of sessionsToCreate) {
                const s = await tx.studySession.create({ data });
                created.push(s);
            }
            return created;
        });

        console.log(`Planner: Regraphed ${result.length} future sessions for user ${userId}`);
        res.json({ message: 'Study plan generated successfully', sessions: result });

    } catch (error) {
        console.error('generatePlan error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getPlan = async (req, res) => {
    try {
        const { timezoneOffset } = req.query;
        const tzOffset = parseInt(timezoneOffset) || 0;
        
        const now = new Date();
        
        // Calculate Start of Today and End of Tomorrow in User's timezone
        const startOfTodayUtc = new Date(now);
        startOfTodayUtc.setMinutes(startOfTodayUtc.getMinutes() - tzOffset);
        startOfTodayUtc.setUTCHours(0, 0, 0, 0);
        startOfTodayUtc.setMinutes(startOfTodayUtc.getMinutes() + tzOffset);

        const endRangeUtc = new Date(startOfTodayUtc);
        endRangeUtc.setUTCDate(endRangeUtc.getUTCDate() + 30); // Show up to 30 days
        endRangeUtc.setMilliseconds(-1);

        const sessions = await prisma.studySession.findMany({
            where: {
                subject: { userId: req.userId },
                startTime: { gte: startOfTodayUtc, lte: endRangeUtc },
            },
            include: { subject: { select: { name: true } } },
            orderBy: { startTime: 'asc' },
        });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const toggleSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.studySession.findUnique({
            where: { id: parseInt(id) },
            include: { subject: { select: { userId: true } } },
        });

        if (!session || session.subject.userId !== req.userId) {
            return res.status(404).json({ message: 'Study session not found' });
        }

        const updatedSession = await prisma.studySession.update({
            where: { id: parseInt(id) },
            data: { isDone: !session.isDone },
        });

        res.json(updatedSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { generatePlan, getPlan, toggleSession };
