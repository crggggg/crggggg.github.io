const express = require('express');
const redis = require('redis');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from your frontend

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const redisClient = redis.createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

const LEADERBOARD_KEY = 'leaderboard';

// GET /leaderboard - Fetches top 10 scores
app.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await redisClient.zRangeWithScores(LEADERBOARD_KEY, 0, 9);
        // zRangeWithScores returns a flat array [value, score, value, score]
        // We reverse it to get highest score first, which in our case is lowest time
        res.json(leaderboard.reverse());
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// POST /leaderboard - Submits a new score
app.post('/leaderboard', async (req, res) => {
    const { name, time } = req.body;

    if (typeof name !== 'string' || typeof time !== 'number' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid name or time.' });
    }

    try {
        // We use a negative score because Redis sorted sets are ascending.
        // The lowest time (best score) should come first.
        await redisClient.zAdd(LEADERBOARD_KEY, { score: -time, value: name.slice(0, 15) });
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
