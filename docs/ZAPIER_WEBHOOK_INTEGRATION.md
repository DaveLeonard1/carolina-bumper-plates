# Zapier Webhook Integration

## Overview

The Carolina Bumper Plates system includes comprehensive Zapier webhook integration that automatically sends order and customer data to external services whenever payment links are generated. This enables real-time data synchronization with tools like Zapier, Make.com, or any custom webhook endpoint.

## Features

### 🔗 **Automatic Webhook Triggers**
- Triggered immediately after payment link creation
- Works with both individual and bulk payment link generation
- Includes comprehensive order and customer data
- Configurable data inclusion options

### 🛡️ **Reliable Delivery System**
- Queued webhook delivery for reliability
- Automatic retry mechanism with exponential backoff
- Comprehensive error handling and logging
- Webhook signature verification support

### 📊 **Monitoring & Analytics**
- Real-time webhook statistics
- Detailed delivery logs
- Queue monitoring and management
- Performance metrics tracking

## Configuration

### Admin Settings

Navigate to **Admin > Settings > Zapier Integration** to configure:

#### Basic Settings
- **Webhook URL**: Your Zapier webhook URL or any HTTP endpoint
- **Enable/Disable**: Toggle webhook integration on/off
- **Timeout**: Request timeout (5-300 seconds)
- **Retry Attempts**: Number of retry attempts (0-10)

#### Data Inclusion Options
- ✅ **Customer Information**: Name, email, phone, Stripe ID
- ✅ **Order Items**: Product details, quantities, prices
- ✅ **Pricing Data**: Subtotal, tax, shipping, total
- ✅ **Shipping Information**: Address and delivery details

#### Security
- **Webhook Secret**: Optional secret for signature verification
- **HTTPS Only**: All webhooks sent over secure connections

## Webhook Payload Structure

### Event Type: `payment_link_created`

\`\`\`json
{
  "event_type": "payment_link_created",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "order": {
    "id": "123",
    "order_number": "CBP-20240101-1001",
    "status": "pending",
    "payment_status": "pending_payment",
    "payment_link_url": "https://checkout.stripe.com/c/pay/cs_...",
    "total_amount": 299.98,
    "currency": "USD",
    "created_at": "2024-01-01T11:30:00.000Z",
    "items": [
      {
        "weight": 45,
        "quantity": 2,
        "price": 149.99,
        "total": 299.98,
        "product_title": "45lb Bumper Plate"
      }
    ],
    "shipping": {
      "address": "123 Main St",
      "city": "Charlotte",
      "state": "NC",
      "zip_code": "28202",
      "phone": "+1234567890"
    },
    "pricing": {
      "subtotal": 299.98,
      "tax_amount": 21.75,
      "shipping_cost": 25.00,
      "total": 346.73
    }
  },
  "customer": {
    "id": "456",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "stripe_customer_id": "cus_..."
  },
  "metadata": {
    "source": "payment_link_creation",
    "created_via": "individual",
    "batch_id": null
  }
}
\`\`\`

## Webhook Security

### Signature Verification

If a webhook secret is configured, each webhook includes an `X-Webhook-Signature` header:

\`\`\`
X-Webhook-Signature: sha256=<signature>
\`\`\`

To verify the signature:

\`\`\`javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
\`\`\`

### Headers Sent

\`\`\`
Content-Type: application/json
User-Agent: Carolina-Bumper-Plates-Webhook/1.0
X-Webhook-Signature: sha256=... (if secret configured)
\`\`\`

## Reliability & Error Handling

### Retry Logic

- **Initial Attempt**: Immediate delivery after payment link creation
- **Retry Delays**: Exponential backoff (5s, 10s, 20s, 40s...)
- **Max Attempts**: Configurable (default: 3 attempts)
- **Timeout**: Configurable per request (default: 30 seconds)

### Error Scenarios

#### Network Errors
- Connection timeouts
- DNS resolution failures
- SSL/TLS errors

#### HTTP Errors
- **4xx Client Errors**: Invalid URL, authentication issues
- **5xx Server Errors**: Temporary server problems
- **Rate Limiting**: Automatic retry with backoff

### Queue Management

Webhooks are queued for reliable delivery:

1. **Immediate Queuing**: Webhook queued immediately after payment link creation
2. **Background Processing**: Separate process handles queue delivery
3. **Status Tracking**: Real-time status updates (pending, processing, completed, failed)
4. **Manual Processing**: Admin can manually trigger queue processing

## Monitoring

### Admin Dashboard

Navigate to **Admin > Webhook Monitor** to view:

#### Statistics
- **Total Sent**: All webhook attempts
- **Successful**: Successfully delivered webhooks
- **Failed**: Permanently failed webhooks
- **Pending**: Webhooks waiting for delivery
- **Avg Response Time**: Average delivery time

#### Webhook Queue
- Real-time queue status
- Retry schedules and attempts
- Error messages and diagnostics
- Manual queue processing

#### Delivery Logs
- Complete delivery history
- Response codes and times
- Error details and troubleshooting
- Payload inspection

## Setup Instructions

### 1. Zapier Setup

1. **Create Zap**: Start with "Webhooks by Zapier" trigger
2. **Choose Trigger**: Select "Catch Hook"
3. **Copy Webhook URL**: Copy the provided webhook URL
4. **Test Hook**: Zapier will provide a test URL

### 2. Carolina Bumper Plates Configuration

1. **Navigate to Settings**: Admin > Settings > Zapier Integration
2. **Enable Webhook**: Toggle webhook integration on
3. **Enter URL**: Paste your Zapier webhook URL
4. **Configure Data**: Select which data to include
5. **Test Webhook**: Use the "Test" button to verify connection
6. **Save Settings**: Save your configuration

### 3. Test Integration

1. **Create Test Order**: Create a test order in the system
2. **Generate Payment Link**: Create a payment link for the test order
3. **Check Zapier**: Verify webhook was received in Zapier
4. **Monitor Logs**: Check webhook monitor for delivery status

## Troubleshooting

### Common Issues

#### Webhook Not Received
- ✅ Check webhook URL is correct
- ✅ Verify webhook is enabled in settings
- ✅ Check webhook monitor for delivery status
- ✅ Review error logs for specific issues

#### Authentication Errors
- ✅ Verify webhook URL includes authentication parameters
- ✅ Check if webhook endpoint requires specific headers
- ✅ Ensure webhook secret is configured correctly

#### Timeout Issues
- ✅ Increase webhook timeout in settings
- ✅ Check if webhook endpoint is responding slowly
- ✅ Monitor response times in webhook logs

#### Data Missing
- ✅ Verify data inclusion options are enabled
- ✅ Check if order has required data fields
- ✅ Review webhook payload in logs

### Diagnostic Tools

#### Test Webhook
Use the built-in test webhook feature to verify connectivity:
- Sends sample payload to webhook URL
- Shows response time and status
- Displays error messages if any

#### Webhook Monitor
Real-time monitoring dashboard shows:
- Queue status and pending webhooks
- Delivery success/failure rates
- Response times and error details
- Complete delivery history

#### Manual Queue Processing
Force process webhook queue manually:
- Useful for debugging delivery issues
- Processes all pending webhooks immediately
- Shows real-time processing results

## Performance Considerations

### Scalability
- **Asynchronous Processing**: Webhooks don't block payment link creation
- **Queue-Based Delivery**: Handles high volume efficiently
- **Batch Processing**: Bulk operations trigger individual webhooks
- **Rate Limiting**: Respects webhook endpoint limits

### Resource Usage
- **Minimal Impact**: Webhook processing uses minimal server resources
- **Background Jobs**: Processing happens outside request cycle
- **Efficient Storage**: Logs are automatically cleaned up
- **Monitoring**: Built-in performance monitoring

## API Reference

### Webhook Settings API

#### Get Settings
\`\`\`
GET /api/admin/zapier-settings
\`\`\`

#### Update Settings
\`\`\`
PATCH /api/admin/zapier-settings
Content-Type: application/json

{
  "webhook_url": "https://hooks.zapier.com/hooks/catch/...",
  "webhook_enabled": true,
  "webhook_timeout": 30,
  "webhook_retry_attempts": 3,
  "include_customer_data": true,
  "include_order_items": true,
  "include_pricing_data": true,
  "include_shipping_data": true
}
\`\`\`

### Webhook Management API

#### Test Webhook
\`\`\`
POST /api/admin/test-zapier-webhook
Content-Type: application/json

{
  "webhook_url": "https://hooks.zapier.com/hooks/catch/..."
}
\`\`\`

#### Process Queue
\`\`\`
POST /api/process-webhook-queue
\`\`\`

#### Get Statistics
\`\`\`
GET /api/admin/zapier-webhook-stats
\`\`\`

## Best Practices

### Configuration
- ✅ **Test First**: Always test webhook before enabling
- ✅ **Use HTTPS**: Only use secure webhook URLs
- ✅ **Set Reasonable Timeouts**: Balance reliability with performance
- ✅ **Configure Retries**: Set appropriate retry attempts for your use case

### Monitoring
- ✅ **Regular Checks**: Monitor webhook delivery regularly
- ✅ **Set Up Alerts**: Configure alerts for failed webhooks
- ✅ **Review Logs**: Regularly review delivery logs for issues
- ✅ **Performance Monitoring**: Track response times and success rates

### Security
- ✅ **Use Webhook Secrets**: Always configure webhook secrets for verification
- ✅ **Validate Signatures**: Verify webhook signatures in your endpoint
- ✅ **Secure Endpoints**: Ensure webhook endpoints are properly secured
- ✅ **Monitor Access**: Track webhook delivery attempts and sources

## Support

For webhook integration support:

1. **Check Documentation**: Review this guide and troubleshooting section
2. **Monitor Dashboard**: Use webhook monitor for real-time diagnostics
3. **Test Integration**: Use built-in test tools to verify setup
4. **Review Logs**: Check delivery logs for specific error details

The Zapier webhook integration provides robust, reliable data synchronization with comprehensive monitoring and error handling to ensure your external integrations stay in sync with your Carolina Bumper Plates orders.
