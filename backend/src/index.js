import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'navio-backend' });
});

app.listen(port, () => {
  console.log(`Navio backend listening on http://localhost:${port}`);
});
