const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const logger = require('./config/logger');  // ye missing tha

app.use(helmet());

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'https://prep-ai-inky-three.vercel.app',
    'https://prep-186srn6u2-theharshitcodes-projects.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // Also allow specific domains and any Vercel preview deployments
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']          // cookies frontend se aane ke liye zaroori
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/auth.route.js');
const companyRoutes = require('./routes/company.routes');  // ye missing tha

app.get('/api/ping', (req, res) => res.status(200).send('pong'));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interview', require('./routes/interview.route.js'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status || 500).json({ message: err.message || 'Server error' })
})
module.exports = app;