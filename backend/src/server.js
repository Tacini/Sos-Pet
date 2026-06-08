require('dotenv').config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`❌ Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const reportsRoutes = require('./routes/reports.routes');
const petsRoutes = require('./routes/pets.routes');
const searchRoutes = require('./routes/search.routes');
const geocodeRoutes = require('./routes/geocode.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
      ].filter(Boolean);

      if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SOS Pet API' })
);

app.use('/auth', authRoutes);
app.use('/reports', reportsRoutes);
app.use('/pets', petsRoutes);
app.use('/search', searchRoutes);
app.use('/geocode', geocodeRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🐾  SOS Pet API`);
  console.log(`🚀  Rodando em http://localhost:${PORT}`);
  console.log(`📦  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
