const FedExService = require('../services/fedexService');
const fedexService = new FedExService();

/**
 * Process a FedEx invoice payment
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next middleware function
 */
exports.processInvoicePayment = async (req, res, next) => {
  try {
    const { invoice_number: invoiceNumber, payment, amount, country, date, email } = req.body;

    console.log('Processing payment...');
    const paymentResult = await fedexService.processPayment(invoiceNumber, {
      ...payment,
      amount,
      country,
      date,
      email
    });

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        invoice_number,
        status: paymentResult.status,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        transaction_date: paymentResult.transaction_date,
        confirmation_number: paymentResult.confirmation_number
      }
    });

  } catch (error) {
    // Log error for debugging
    console.error('Payment processing error:', error);
    return res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};
