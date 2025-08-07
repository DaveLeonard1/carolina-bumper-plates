# Email Service Compatibility Guide

## Overview

This document explains how the Carolina Bumper Plates email system handles different environment configurations, particularly when Mailgun credentials are not yet configured.

## Current Issues

1. **Missing Environment Variables**: When Mailgun credentials (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`) are not configured, API endpoints fail with 500 errors instead of gracefully continuing.

2. **Method Name Inconsistencies**: The codebase has inconsistent method names between different files:
   - `sendOrderReceiptEmail` in Stripe webhook handler
   - `sendOrderPaidEmail` in email service

3. **Lack of Defensive Programming**: Some API endpoints don't properly handle email service failures.

## Solutions

### Email Service Enhancements

The email service has been updated to:

1. Log warnings instead of errors when Mailgun isn't configured
2. Return early with a clear error message without crashing
3. Use consistent method names across the codebase

### API Endpoint Modifications

The following endpoints have been modified to handle missing email credentials:

1. `/api/create-payment-link/route.ts`:
   - Added try/catch blocks around email sending
   - Made email sending non-blocking for payment link creation
   - Improved logging with warnings instead of errors

2. `/api/admin/orders/[id]/route.ts`:
   - Added email service for order fulfillment
   - Made email sending non-blocking
   - Added Zapier webhook trigger as a backup notification system

3. `/api/stripe/webhook/route.ts` (manual changes needed):
   - Change `sendOrderReceiptEmail` to `sendOrderPaidEmail`
   - Wrap email sending in additional try/catch blocks
   - Change error logging to warnings to prevent confusion

## Development Environment

During development (v0):
- Email service is intentionally disabled until ready for production
- All API endpoints will continue functioning without email capabilities
- Zapier webhooks provide a fallback notification system
- Console logs clearly indicate when email functionality is skipped

## Going Live

Before moving to production:

1. Add the following environment variables:
   \`\`\`
   MAILGUN_API_KEY=your_api_key
   MAILGUN_DOMAIN=your_domain
   MAILGUN_FROM_EMAIL=your_from_email
   \`\`\`

2. Test email sending with a sample order
3. Verify all transactional emails are sending correctly
4. Monitor webhook events and email delivery logs

## Troubleshooting

If you encounter issues with the email service:

1. Check if all environment variables are set correctly
2. Verify Mailgun account status and API key permissions
3. Check webhook logs for any email-related failures
4. Ensure email templates exist in the Mailgun dashboard
