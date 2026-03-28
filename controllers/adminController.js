const prisma = require('../db');

const getStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalSubjects = await prisma.subject.count();
        const totalSessions = await prisma.studySession.count();
        const totalTasks = await prisma.task.count();
        const completedTasks = await prisma.task.count({ where: { isCompleted: true } });
        const totalTopics = await prisma.topic.count();
        const completedTopics = await prisma.topic.count({ where: { isCompleted: true } });
        const totalPomodoros = await prisma.pomodoroSession.count();

        // Users registered today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const usersToday = await prisma.user.count({
            where: { createdAt: { gte: todayStart } }
        });

        // Users registered this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const usersThisWeek = await prisma.user.count({
            where: { createdAt: { gte: weekStart } }
        });

        // Active users (logged in within last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsersToday = await prisma.user.count({
            where: { lastActive: { gte: oneDayAgo } }
        });

        // Daily signups for the last 7 days
        const dailySignups = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);
            
            const count = await prisma.user.count({
                where: { createdAt: { gte: dayStart, lte: dayEnd } }
            });
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dailySignups.push({ day: dayNames[dayStart.getDay()], count });
        }

        // Popular subjects
        const popularSubjects = await prisma.subject.groupBy({
            by: ['name'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        // System health metrics
        const avgSubjectsPerUser = totalUsers > 0 ? (totalSubjects / totalUsers).toFixed(1) : 0;
        const avgTasksPerUser = totalUsers > 0 ? (totalTasks / totalUsers).toFixed(1) : 0;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const topicCompletionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

        res.json({
            totalUsers,
            totalSubjects,
            totalSessions,
            totalTasks,
            completedTasks,
            totalTopics,
            completedTopics,
            totalPomodoros,
            usersToday,
            usersThisWeek,
            activeUsersToday,
            dailySignups,
            avgSubjectsPerUser,
            avgTasksPerUser,
            taskCompletionRate,
            topicCompletionRate,
            popularSubjects: popularSubjects.map(s => ({ name: s.name, count: s._count.id }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                course: true,
                streak: true,
                lastActive: true,
                createdAt: true,
                _count: { select: { subjects: true, tasks: true, pomodoroSessions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecentActivity = async (req, res) => {
    try {
        const recentUsers = await prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, createdAt: true, role: true }
        });

        const recentSessions = await prisma.studySession.findMany({
            take: 10,
            orderBy: { startTime: 'desc' },
            include: { subject: { select: { name: true, user: { select: { name: true } } } } }
        });

        res.json({ recentUsers, recentSessions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        if (!['admin', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStats, getAllUsers, updateUserRole, getRecentActivity };
