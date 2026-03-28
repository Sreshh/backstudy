const prisma = require('../db');

const getTeachers = async (req, res) => {
    try {
        res.json({ message: "Teachers list placeholder", teachers: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTeachers };
