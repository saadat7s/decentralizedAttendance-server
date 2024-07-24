// controllers/TeacherController/selectClassController.js

const Class = require('../../models/class');

exports.selectClass = async (req, res) => {
    try {
        const classes = await Class.find({ teacher: req.user.id }).populate('students');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
