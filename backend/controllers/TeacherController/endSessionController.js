const Session = require('../../models/session');

exports.endSession = async (req, res) => {
    const { sessionId } = req.body;
    const teacherId = req.user.id;

    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        if (session.teacher.toString() !== teacherId) {
            return res.status(403).json({ msg: 'You are not authorized to end this session' });
        }

        session.isCompleted = true;
        await session.save();

        res.status(200).json({ msg: 'Session ended successfully', session });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
