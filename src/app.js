const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/payments', paymentRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
