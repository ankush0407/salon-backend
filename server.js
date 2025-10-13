const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();

// CORS Configuration - Allow Vercel domain
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://salon-subscription-app.vercel.app',
    'https://salon-subscription-app-*.vercel.app', // For preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Salon API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});