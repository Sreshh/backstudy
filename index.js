const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/planner', require('./routes/planner'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/admin', require('./routes/admin'));

// New Routes
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/college-admin', require('./routes/collegeAdmin'));

// Legacy/Optional Routes (Restored to prevent breaking frontend)
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/studyPlan', require('./routes/studyPlan'));

app.get('/', (req, res) => {
    res.send('Study Planner API is running');
});

// Export for serverless environments (like Netlify)
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}