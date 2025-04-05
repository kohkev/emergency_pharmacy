import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// A simple health check route
app.get('/health', (req, res) => {
    res.send('Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});