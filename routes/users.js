const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { isValidDate } = require('../utils/isValidDate');


// getting all users
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT * FROM users');
        if (!users.length) {
            res.status(404).send('No users found!');
        }
        else {
            res.send(users);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
})

// creating new user
router.post('/', async (req, res) => {
    const { username } = req.body;
    if (!username) {
        res.status(400).send("Username can not be empty!");
    }

    try {
        const db = await getDb();
        const result = await db.run('INSERT INTO users (username) VALUES (?)', [username]);

        res.send({
            username: username,
            id: result.lastID
        });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'User with same username already exists!' });
        }
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
})

// creating exercise
router.post('/:_id/exercises', async (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // if anything misses we return 400
    if (!description) return res.status(400).json({ error: 'Description is required' });
    if (!duration) return res.status(400).json({ error: 'Duration is required' });


    // checking the date, providing default value
    let exerciseDate = date;
    if (!exerciseDate) {
        exerciseDate = new Date().toISOString().split('T')[0];
    } else {
        if (!isValidDate(exerciseDate)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }
    }

    try {
        const db = await getDb();

        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User with that id does not exist!' });
        }

        const result = await db.run(
            `INSERT INTO exercises (user_id, description, duration, date) VALUES (?, ?, ?, ?)`,
            [userId, description, parseInt(duration), exerciseDate]
        );

        res.json({
            userId: user.id,
            exerciseId: result.lastID,
            duration: parseInt(duration),
            description: description,
            date: exerciseDate
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})

// getting all logs
router.get('/:_id/logs', async (req, res) => {
    const userId = req.params._id;
    const { from, to, limit } = req.query;


    try {
        const db = await getDb();

        const user = await db.get('SELECT id, username FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User with this id does not exist!' });
        }

        let query = `SELECT id, description, duration, date FROM exercises WHERE user_id = ?`;
        let params = [userId];

        if (from) {
            query += ` AND date >= ?`;
            params.push(from);
        }
        if (to) {
            query += ` AND date <= ?`;
            params.push(to);
        }

        query += ` ORDER BY date ASC`;

        let logs = await db.all(query, params);

        const count = logs.length;

        if (limit) {
            logs = logs.slice(0, parseInt(limit));
        }

        res.json({
            id: user.id,
            username: user.username,
            logs: logs.map(l => ({
                id: l.id,
                description: l.description,
                duration: l.duration,
                date: l.date
            })),
            count
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;