const express = require('express');
const { processInvoicePayment, getPaymentStatus } = require('../controllers/paymentController');
const { validatePaymentRequest } = require('../middleware/validation');

const router = express.Router();

router.post('/invoice', processInvoicePayment);
router.get('/:paymentId', getPaymentStatus);

module.exports = router;
