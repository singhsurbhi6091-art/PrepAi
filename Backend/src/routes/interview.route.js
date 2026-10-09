const Interview = require('../models/interview.model');
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const {
    startInterviewValidator,
    submitAnswerValidator,
    reportValidator
} = require('../validators/interview.validator');
const {
    startInterview,
    submitAnswer,
    getReport
} = require('../controllers/interview.controller');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/';
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop() || 'tmp';
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + ext);
    }
});

const upload = multer({ storage }).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

router.post('/start', auth, startInterviewValidator, validate, startInterview);
router.post('/answer', auth, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
}, submitAnswerValidator, validate, submitAnswer);

router.get('/report/:id', auth, reportValidator, validate, getReport);

// interview.routes.js mein add karo
router.get('/my-interviews', auth, async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 10

    const total = await Interview.countDocuments({ candidate: req.user._id })

    const interviews = await Interview.find({ candidate: req.user._id })
        .populate('company', 'name industry')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

    res.json({
        total,
        page,
        totalPages: Math.ceil(total / limit),
        interviews
    })
})

module.exports = router;