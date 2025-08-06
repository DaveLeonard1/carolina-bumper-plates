# Transactional Email System Setup

This document describes the transactional email system implemented for Carolina Bumper Plates using Mailgun as the delivery service.

## Overview

The system sends transactional emails at three key points in the customer journey:

1. **Preorder Confirmation** - Sent when a customer initially submits a preorder
2. **Payment Link Email** - Sent when a payment link is generated for the customer to complete payment
3. **Order Receipt** - Sent when payment is successfully completed

## Implementation Details

### Email Service

The email service (`/lib/email-service.ts`) uses Mailgun's JavaScript SDK to send emails. It provides three main methods:

- `sendPreorderConfirmationEmail()`
- `sendPaymentLinkEmail()`
- `sendOrderReceiptEmail()`

### Integration Points

Emails are sent at the following integration points in the codebase:

1. **Preorder Submission** - `/lib/actions/orders.ts` in the `submitOrder()` function
2. **Payment Link Creation** - `/app/api/create-payment-link/route.ts` in the POST handler
3. **Order Payment Receipt** - `/app/api/stripe/webhook/route.ts` in the `checkout.session.completed` event handler

## Mailgun Setup Instructions

### Required Environment Variables

Add the following environment variables to your `.env` file and deployment environment:

\`\`\`
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain.com
MAILGUN_FROM_EMAIL=orders@carolinabumperplates.com
\`\`\`

### Email Template Setup in Mailgun

1. Log into your Mailgun account
2. Navigate to "Sending" > "Templates"
3. Create the following templates:

#### 1. Preorder Confirmation Template

**Name**: `preorder-confirmation`

**Subject**: Thank you for your Carolina Bumper Plates preorder!

**Example Content**:
\`\`\`html
<h1>Thank you for your preorder!</h1>
<p>Dear {{customer.name}},</p>
<p>We've received your preorder for Carolina Bumper Plates. Your order number is <strong>{{order.number}}</strong>.</p>
<p>Order Summary:</p>
<ul>
  <li>Order Total: ${{order.total_amount}}</li>
  <li>Order Status: {{order.status}}</li>
  <li>Order Date: {{order.date}}</li>
</ul>
<p>We'll send you a payment link shortly to complete your purchase.</p>
<p>Thank you for choosing Carolina Bumper Plates!</p>
\`\`\`

#### 2. Payment Link Template

**Name**: `payment-link`

**Subject**: Complete your Carolina Bumper Plates order

**Example Content**:
\`\`\`html
<h1>Complete Your Order</h1>
<p>Dear {{customer.name}},</p>
<p>Your Carolina Bumper Plates order ({{order.number}}) is ready for payment.</p>
<p><a href="{{payment.link}}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block;">Complete Payment</a></p>
<p>Order Summary:</p>
<ul>
  <li>Order Total: ${{order.total_amount}}</li>
  <li>Payment Link Expiration: {{payment.expiration_date}}</li>
  <li>Estimated Shipping: {{order.estimated_ship_date}}</li>
</ul>
<p>If you have any questions, please reply to this email.</p>
\`\`\`

#### 3. Order Receipt Template

**Name**: `order-receipt`

**Subject**: Your Carolina Bumper Plates order receipt

**Example Content**:
\`\`\`html
<h1>Thank You For Your Order!</h1>
<p>Dear {{customer.name}},</p>
<p>Your payment for Carolina Bumper Plates order <strong>{{order.number}}</strong> has been successfully processed.</p>
<p>Order Details:</p>
<ul>
  <li>Order Total: ${{order.total_amount}}</li>
  <li>Payment Date: {{payment.date}}</li>
  <li>Payment Method: {{payment.method}}</li>
</ul>
<h2>Items Ordered</h2>
<table style="width: 100%; border-collapse: collapse;">
  <tr style="background-color: #f2f2f2;">
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Quantity</th>
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Price</th>
  </tr>
  {{#each order.items}}
  <tr>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">{{this.name}}</td>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">{{this.quantity}}</td>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">${{this.price}}</td>
  </tr>
  {{/each}}
</table>
<p>We're preparing your order for shipping. You'll receive a shipping confirmation when your order is on its way.</p>
<p>Thank you for choosing Carolina Bumper Plates!</p>
\`\`\`

### Testing Email Templates

1. In Mailgun, click on each template and use the "Send Test" feature
2. Enter a test recipient email to verify formatting and content display

## Monitoring Email Delivery

Email sending is implemented asynchronously to avoid blocking the main application flow. Failures are logged to the console but do not prevent the main process from continuing.

To monitor email delivery:
1. Check application logs for success/failure messages
2. Use Mailgun's dashboard to view delivery status, opens, and clicks
3. For detailed troubleshooting, check the "Logs" section in your Mailgun dashboard

### Order Fulfillment Email

**Template Name**: `order-fulfilled`  
**Subject**: Your Order #{{order_number}} Has Been Fulfilled - Carolina Bumper Plates

\`\`\`html
<h1>Your Order Has Been Fulfilled!</h1>
<p>Hello {{customer_name}},</p>
<p>Great news! Your order #{{order_number}} has been fulfilled and is being prepared for shipping.</p>

<h3>Order Summary:</h3>
<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
  <tr style="background-color: #f2f2f2;">
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Product</th>
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Quantity</th>
    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Price</th>
  </tr>
  {{#each items}}
  <tr>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">{{this.product_title}}</td>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">{{this.quantity}}</td>
    <td style="padding: 12px; text-align: left; border: 1px solid #ddd;">${{this.price}}</td>
  </tr>
  {{/each}}
</table>

<p>Your order is now being prepared for shipping. You'll receive a shipping confirmation with tracking information once your order is on its way.</p>

<p>If you have any questions about your order, please don't hesitate to contact us.</p>

<p>Thank you for choosing Carolina Bumper Plates!</p>
\`\`\`

## Fallback Mechanism

If the direct email sending fails, the system still triggers the existing Zapier webhooks, which can serve as a fallback mechanism for sending emails through alternative channels.
