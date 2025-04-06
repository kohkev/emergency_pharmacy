// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import pharmacyRoutes from './routes/pharmacyRoutes';

const app = express();
const PORT = process.env.PORT || 3001; // Changed port to 3001

app.use(cors());
app.use(express.json());

// Mount the pharmacy routes under the /api endpoint
app.use('/api', pharmacyRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.send('Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
