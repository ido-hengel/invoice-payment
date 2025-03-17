const express = require('express');
const { processInvoicePayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/invoice', processInvoicePayment);

module.exports = router;
