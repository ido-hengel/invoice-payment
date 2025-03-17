const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * @typedef {Object} PaymentDetails
 * @property {string} cardholderName - Name as it appears on the card
 * @property {string} cardNumber - Credit card number
 * @property {number} expiryMonth - Card expiry month (1-12)
 * @property {number} expiryYear - Card expiry year (e.g., 2025)
 * @property {string} cvv - Card security code
 * @property {string} address - Billing address line 1
 * @property {string} [addressLine2] - Optional billing address line 2
 * @property {string} city - Billing city
 * @property {string} state - Billing state (2-letter code)
 * @property {string} postalCode - Billing postal code (5 or 9 digits)
 * @property {number} amount - Payment amount
 */

class FedExService {
  constructor() {
    // Initialize payment URL
    this.paymentUrl = 'https://www.fedex.com/payment/invoice';

    // Initialize browser-related properties
    this.browser = null;
    this.context = null;
    this.page = null;
    
    // Set up debug directory
    this.debugDir = path.join(process.cwd(), 'debug');
    if (!fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }
  }

  /**
   * Initialize browser with appropriate settings
   * @private
   */
  async initBrowser() {
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: false,
          slowMo: 12000,
          args: ['--no-sandbox']
        });
        
        // Create a new context with US settings
        this.context = await this.browser.newContext({
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          locale: 'en-US',
          timezoneId: 'America/New_York',
          viewport: { width: 1280, height: 720 }
        });
      }
      
      if (!this.page) {
        this.page = await this.context.newPage();
        
        // Log errors and warnings
        this.page.on('console', msg => {
          if (msg.type() === 'error' || msg.type() === 'warning') {
            console.error(`Browser ${msg.type()}:`, msg.text());
          }
        });
        
        this.page.on('pageerror', err => {
          console.error('Page error:', err);
        });
      }
    } catch (error) {
      console.error('Browser initialization error:', error);
      await this.cleanup();
      throw new Error('Failed to initialize browser');
    }
  }

  /**
   * Clean up browser resources
   * @private
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Browser cleanup error:', error);
    }
  }

  /**
   * Process a payment for a FedEx invoice
   * @param {string} invoiceNumber - FedEx invoice number
   * @param {PaymentDetails} paymentDetails - Payment and billing details
   * @returns {Promise<Object>} Payment result
   */
  /**
   * Initialize browser in non-headless mode for testing
   */
  async initBrowser() {
    this.browser = await chromium.launch({
      headless: false
    });
    this.page = await this.browser.newPage();
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) await this.browser.close();
    this.browser = null;
    this.page = null;
  }

  /**
   * Process a FedEx invoice payment
   * @param {string} invoiceNumber - FedEx invoice number
   * @param {Object} paymentDetails - Payment information
   * @returns {Promise<Object>} Payment result
   */
  /**
   * Verify invoice details before payment
   */
  async verifyInvoice(invoiceNumber, country, amount, date, email) {
    try {
      await this.initBrowser();
      console.log('Opening FedEx payment page...');
      await this.page.goto(this.paymentUrl);

      // Wait for form to load
      await this.page.waitForSelector('#invoiceType');

      // Step 1: Select invoice type
      console.log('Selecting invoice type...');
      await this.page.selectOption('#invoiceType', 'FEDEX');

      // Step 2: Enter invoice number
      console.log('Entering invoice number...');
      await this.page.fill('#invoiceNumber', invoiceNumber);

      // Step 3: Select country
      console.log('Selecting country...');
      await this.page.selectOption('#country', country);

      // Step 4: Enter amount
      console.log('Entering amount...', amount);
      await this.page.fill('#amount', amount.toFixed(2));

      // Step 5: Enter date
      console.log('Entering date...');
      await this.page.fill('#date', date);
      
      // Wait for email field to appear
      console.log('Waiting for email field...');
      await this.page.waitForSelector('#email', { timeout: 5000 });
      
      // Step 6: Enter email
      console.log('Entering email...', email);
      await this.page.fill('#email', email);
      
      // Step 7: Click verify button
      console.log('Verifying invoice...');
      await this.page.click('button.fdx-c-button--primary');
      
      // Wait for verification result
      try {
        // First check for error message
        const errorSelector = '.fdx-c-message--error';
        try {
          await this.page.waitForSelector(errorSelector, { timeout: 10000 });
          const errorMessage = await this.page.textContent(errorSelector);
          throw new Error(`Invoice verification failed: ${errorMessage}`);
        } catch (e) {
          if (!e.message.includes('Timeout')) throw e;
        }
        
        // If no error, wait for success state
        await this.page.waitForSelector('.fdx-c-message--success, .verified-amount', { timeout: 5000 });
      } catch (e) {
        if (!e.message.includes('Timeout')) throw e;
      }

      return {
        success: true,
        invoice_number: invoiceNumber,
        amount: amount,
        country: country,
        date: date
      };

    } catch (error) {
      console.error('Invoice verification failed:', error.message);
      throw error;
    } finally {
      //await this.cleanup();
    }
  }

  /**
   * Process payment after invoice verification
   */
  async processPayment(invoiceNumber, paymentDetails) {
    try {
      // First verify the invoice
      const verificationResult = await this.verifyInvoice(
        invoiceNumber,
        paymentDetails.country || 'US',
        paymentDetails.amount,
        paymentDetails.date || new Date().toISOString().split('T')[0],
        paymentDetails.email
      );

      // If verification successful, proceed with payment
      console.log('Invoice verified, proceeding with payment...');
      
      // Wait for credit card form to be visible
      await this.page.waitForSelector('#ccForm');
      
      // Fill credit card information
      console.log('Filling credit card details...');
      await this.page.fill('input#ccName', paymentDetails.cardholderName);
      await this.page.fill('input#ccNumber', paymentDetails.cardNumber);
      await this.page.selectOption('select#expMonth', paymentDetails.expiryMonth.padStart(2, '0'));
      await this.page.selectOption('select#expYear', paymentDetails.expiryYear.toString());
      await this.page.fill('input#cvv', paymentDetails.cvv);
      
      // Fill billing address
      console.log('Filling billing address...');
      await this.page.selectOption('select#country', paymentDetails.country);
      await this.page.fill('input#address1', paymentDetails.address1);
      if (paymentDetails.address2) {
        await this.page.fill('input#address2', paymentDetails.address2);
      }
      await this.page.fill('input#city', paymentDetails.city);
      await this.page.selectOption('select#state', paymentDetails.state);
      await this.page.fill('input#postalCode', paymentDetails.postalCode);
      
      // Accept terms and conditions
      console.log('Accepting terms...');
      await this.page.check('.fdx-c-checkbox__input');
      
      // Click pay button
      console.log('Submitting payment...');
      await this.page.click('button[type="submit"]');
      
      // Wait for success or error message
      try {
        await this.page.waitForSelector('.fdx-c-message--success', { timeout: 5000 });
        return {
          success: true,
          message: 'Payment processed successfully',
          invoice_number: invoiceNumber,
          verification: verificationResult
        };
      } catch (e) {
        // Check for error message
        try {
          const errorMessage = await this.page.textContent('.fdx-c-message--error');
          throw new Error(`Payment failed: ${errorMessage}`);
        } catch (e2) {
          throw new Error('Payment failed: No success or error message found');
        }
      }

    } catch (error) {
      console.error('Payment failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = FedExService;
