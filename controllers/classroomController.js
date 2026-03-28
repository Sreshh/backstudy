const prisma = require('../db');

const getClassrooms = async (req, res) => {
    try {
        res.json({ message: "Classrooms list placeholder", classrooms: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getClassrooms };
