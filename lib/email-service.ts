import formData from 'form-data';
import Mailgun from 'mailgun.js';

/**
 * Email service powered by Mailgun
 * Used for sending transactional emails for order events
 */
export class EmailService {
  private mailgun: any;
  private domain: string;
  private fromEmail: string;
  private isConfigured: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Initialize but don't connect until needed
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || 'orders@carolinabumperplates.com';
  }

  /**
   * Initialize Mailgun client
   * This is called lazily when first email is sent
   */
  private initialize(): boolean {
    if (this.initialized) return this.isConfigured;

    this.initialized = true;
    
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey || !this.domain) {
      console.error("📧 Mailgun not configured properly. Check MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.");
      this.isConfigured = false;
      return false;
    }

    const mailgun = new Mailgun(formData);
    this.mailgun = mailgun.client({ username: 'api', key: apiKey });
    this.isConfigured = true;
    return true;
  }

  /**
   * Send a preorder confirmation email when a user first submits a preorder
   */
  async sendPreorderConfirmationEmail(
    toEmail: string, 
    orderNumber: string, 
    customerName: string,
    orderDetails: any
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.initialize()) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      const messageData = {
        from: this.fromEmail,
        to: toEmail,
        subject: `Your Preorder Confirmation #${orderNumber} - Carolina Bumper Plates`,
        template: 'preorder-confirmation',
        'h:X-Mailgun-Variables': JSON.stringify({
          orderNumber,
          customerName,
          orderDetails: JSON.stringify(orderDetails),
          orderDate: new Date().toLocaleDateString(),
          totalAmount: orderDetails.total_amount,
        })
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);
      console.log(`📧 Preorder confirmation email sent to ${toEmail} for order ${orderNumber}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending preorder confirmation email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Send a payment link email when Stripe payment link is generated
   */
  async sendPaymentLinkEmail(
    toEmail: string,
    orderNumber: string,
    customerName: string,
    paymentLink: string,
    orderDetails: any
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.initialize()) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      const messageData = {
        from: this.fromEmail,
        to: toEmail,
        subject: `Complete Your Order #${orderNumber} - Carolina Bumper Plates`,
        template: 'payment-link',
        'h:X-Mailgun-Variables': JSON.stringify({
          orderNumber,
          customerName,
          paymentLink,
          orderDetails: JSON.stringify(orderDetails),
          orderTotal: orderDetails.total_amount,
          expirationDate: this.calculateExpirationDate(7) // 7 days expiration
        })
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);
      console.log(`📧 Payment link email sent to ${toEmail} for order ${orderNumber}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending payment link email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Send an order receipt email when payment is complete
   */
  async sendOrderReceiptEmail(
    toEmail: string,
    orderNumber: string,
    customerName: string,
    orderDetails: any,
    paymentDetails: any
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.initialize()) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      const messageData = {
        from: this.fromEmail,
        to: toEmail,
        subject: `Your Receipt for Order #${orderNumber} - Carolina Bumper Plates`,
        template: 'order-receipt',
        'h:X-Mailgun-Variables': JSON.stringify({
          orderNumber,
          customerName,
          orderDetails: JSON.stringify(orderDetails),
          paymentDetails: JSON.stringify(paymentDetails),
          orderDate: new Date().toLocaleDateString(),
          paidAmount: paymentDetails.amount_paid,
          paymentMethod: this.formatPaymentMethod(paymentDetails.method),
          estimatedShipDate: this.calculateEstimatedShipDate()
        })
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);
      console.log(`📧 Order receipt email sent to ${toEmail} for order ${orderNumber}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending order receipt email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Send an order fulfillment email when an order is marked as fulfilled
   */
  async sendFulfillmentEmail(
    toEmail: string,
    orderNumber: string,
    customerName: string,
    orderItems: any[],
    totalAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.initialize()) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      const messageData = {
        from: this.fromEmail,
        to: toEmail,
        subject: `Your Order #${orderNumber} Has Been Fulfilled - Carolina Bumper Plates`,
        template: 'order-fulfilled',
        'h:X-Mailgun-Variables': JSON.stringify({
          order_number: orderNumber,
          customer_name: customerName || 'Valued Customer',
          items: orderItems,
          total: totalAmount,
          fulfilled_date: new Date().toLocaleDateString(),
        })
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);
      console.log(`📧 Fulfillment email sent to ${toEmail} for order ${orderNumber}`);
      return { success: true };
    } catch (error) {
      console.error("Error sending fulfillment email:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(method: string): string {
    if (method.toLowerCase().includes('card')) {
      return 'Credit Card';
    }
    // Capitalize first letter of each word
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Calculate expiration date for payment links
   * @param days Days until expiration
   * @returns Formatted date string
   */
  private calculateExpirationDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calculate estimated ship date (typically 5-7 business days)
   * @returns Formatted date range string
   */
  private calculateEstimatedShipDate(): string {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    const formatOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    
    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  }
}

// Export singleton instance
export const emailService = new EmailService();
