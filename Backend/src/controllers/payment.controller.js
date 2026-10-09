// payment.controller.js
require('dotenv').config();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user.model');
const { config } = require('dotenv');
const logger = require('../config/logger');

// Lazy initialization — har call pe fresh instance
const getRazorpay = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
    try {
        const options = {
            amount: 49900,
            currency: 'INR',
           receipt: `rcpt_${Date.now()}`, // ✅ FIXED
            notes: {
                userId: req.user._id.toString(),
                plan: 'unlimited'
            }
        };

        const order = await getRazorpay().orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        logger.error('Razorpay FULL error:', err);
        res.status(500).json({ message: 'Order creation failed' });
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { isPaid: true },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Payment verified successfully',
            isPaid: user.isPaid,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPaid: user.isPaid,
                interviewCount: user.interviewCount
            }
        });

    } catch (err) {
        logger.error('Payment verification error:', err);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('isPaid interviewCount');

        res.json({
            isPaid: user.isPaid,
            interviewCount: user.interviewCount,
            remainingFree: user.isPaid ? 'unlimited' : Math.max(0, 3 - user.interviewCount)
        });

    } catch (err) {
        logger.error('Payment status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};