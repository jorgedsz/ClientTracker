require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const clientRoutes = require('./routes/clientRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const gmailRoutes = require('./routes/gmailRoutes');
const emailFilterRoutes = require('./routes/emailFilterRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/email-filters', emailFilterRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ClientTracker server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
