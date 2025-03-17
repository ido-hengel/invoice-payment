const Joi = require('joi');

const paymentRequestSchema = Joi.object({
  invoice_number: Joi.string()
    .required()
    .pattern(/^\d{9}$/)
    .messages({
      'string.pattern.base': 'Invoice number must be exactly 9 digits',
      'string.empty': 'Invoice number is required'
    }),

  payment_details: Joi.object({
    cardholderName: Joi.string()
      .required()
      .min(2)
      .max(100)
      .messages({
        'string.empty': 'Cardholder name is required',
        'string.min': 'Cardholder name must be at least 2 characters',
        'string.max': 'Cardholder name cannot exceed 100 characters'
      }),

    cardNumber: Joi.string()
      .required()
      .creditCard()
      .messages({
        'string.empty': 'Credit card number is required',
        'string.creditCard': 'Please provide a valid credit card number'
      }),

    expiryMonth: Joi.number()
      .required()
      .min(1)
      .max(12)
      .messages({
        'number.base': 'Expiry month must be a number',
        'number.min': 'Expiry month must be between 1 and 12',
        'number.max': 'Expiry month must be between 1 and 12'
      }),

    expiryYear: Joi.number()
      .required()
      .min(2025)
      .max(2044)
      .messages({
        'number.base': 'Expiry year must be a number',
        'number.min': 'Expiry year must be 2025 or later',
        'number.max': 'Expiry year cannot be later than 2044'
      }),

    cvv: Joi.string()
      .required()
      .pattern(/^\d{3,4}$/)
      .messages({
        'string.pattern.base': 'CVV must be 3 or 4 digits',
        'string.empty': 'CVV is required'
      }),

    address: Joi.string()
      .required()
      .max(60)
      .messages({
        'string.empty': 'Billing address is required',
        'string.max': 'Billing address cannot exceed 60 characters'
      }),

    addressLine2: Joi.string()
      .allow('')
      .max(60)
      .messages({
        'string.max': 'Address line 2 cannot exceed 60 characters'
      }),

    city: Joi.string()
      .required()
      .max(60)
      .messages({
        'string.empty': 'City is required',
        'string.max': 'City name cannot exceed 60 characters'
      }),

    postalCode: Joi.string()
      .required()
      .max(13)
      .messages({
        'string.empty': 'Postal code is required',
        'string.max': 'Postal code cannot exceed 13 characters'
      }),

    country: Joi.string()
      .length(2)
      .default('IL')
      .messages({
        'string.length': 'Country code must be exactly 2 characters'
      }),

    amount: Joi.number()
      .required()
      .positive()
      .precision(2)
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be greater than 0',
        'number.precision': 'Amount cannot have more than 2 decimal places'
      }),

    date: Joi.date()
      .required()
      .iso()
      .messages({
        'date.base': 'Please provide a valid date',
        'date.format': 'Date must be in YYYY-MM-DD format'
      })
  }).required()
});

exports.validatePaymentRequest = (req, res, next) => {
  const { error } = paymentRequestSchema.validate(req.body, { 
    abortEarly: false,
    stripUnknown: false
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      errors
    });
  }
  
  next();
};
