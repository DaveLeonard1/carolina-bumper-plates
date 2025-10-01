# Order Timeline Events - Complete Reference

## 📋 **All Timeline Events Tracked**

### **1. Order Created** 🎉
- **Event Type**: `order_created`
- **Triggered**: When customer submits preorder at `/checkout`
- **Description**: "Preorder submitted by customer"
- **Created By**: `customer`
- **Data Includes**:
  - Order number
  - Subtotal
  - Total weight
  - Item count
  - Customer email
  - Whether account was created

---

### **2. Order Modified** ✏️
- **Event Type**: `order_modified`
- **Triggered**: When customer updates order at `/modify-order`
- **Description**: "Order details modified by customer"
- **Created By**: `customer`
- **Data Includes**:
  - Modified fields
  - New subtotal
  - New total weight

---

### **3. Payment Link Created** 💳
- **Event Type**: `payment_link_created`
- **Triggered**: When admin creates payment link
- **Description**: "Payment link created - order locked for modifications"
- **Created By**: `admin`
- **Data Includes**:
  - Checkout session ID
  - Payment URL
  - Order locked status
  - Created via (individual/bulk)

---

### **4. Payment Link Email Sent** 📧
- **Event Type**: `email_sent`
- **Triggered**: When payment link email is successfully sent
- **Description**: "Payment link email sent to customer"
- **Created By**: `admin`
- **Data Includes**:
  - Email type: "payment_link"
  - Recipient email
  - Message ID
  - Payment URL

---

### **5. Order Confirmation Email Sent** 📧
- **Event Type**: `email_sent`
- **Triggered**: When order confirmation email is successfully sent
- **Description**: "Order confirmation email sent to customer"
- **Created By**: `system`
- **Data Includes**:
  - Email type: "order_confirmation"
  - Recipient email
  - Message ID

---

### **6. Payment Completed** 💰
- **Event Type**: `payment_completed`
- **Triggered**: When customer pays via Stripe (webhook)
- **Description**: "Payment completed via Stripe payment link"
- **Created By**: `stripe_webhook`
- **Data Includes**:
  - Checkout session ID
  - Payment intent ID
  - Amount paid
  - Currency
  - Payment method types
  - Update attempts

---

### **7. Payment Receipt Email Sent** 📧
- **Event Type**: `email_sent`
- **Triggered**: When payment receipt email is successfully sent
- **Description**: "Payment receipt email sent to customer"
- **Created By**: `stripe_webhook`
- **Data Includes**:
  - Email type: "payment_receipt"
  - Recipient email
  - Message ID
  - Amount paid

---

### **8. Email Failed** ❌
- **Event Type**: `email_failed`
- **Triggered**: When any email fails to send
- **Description**: Varies by email type
- **Created By**: `system`, `admin`, or `stripe_webhook`
- **Data Includes**:
  - Email type
  - Recipient email
  - Error message

---

### **9. Payment Link Expired** ⏰
- **Event Type**: `payment_link_expired`
- **Triggered**: When Stripe checkout session expires
- **Description**: "Payment link expired without completion"
- **Created By**: `stripe_webhook`
- **Data Includes**:
  - Checkout session ID

---

### **10. Payment Received (Invoice)** 💵
- **Event Type**: `payment_received`
- **Triggered**: When payment is received via invoice
- **Description**: "Payment received via invoice"
- **Created By**: `stripe_webhook`

---

### **11. Payment Failed** ⚠️
- **Event Type**: `payment_failed`
- **Triggered**: When payment attempt fails
- **Description**: "Payment attempt failed"
- **Created By**: `stripe_webhook`

---

### **12. Invoice Finalized** 📄
- **Event Type**: `invoice_finalized`
- **Triggered**: When invoice is finalized
- **Description**: "Invoice finalized"
- **Created By**: `stripe_webhook`

---

## 🔍 **Typical Order Flow Timeline**

### **Scenario 1: Successful Payment Link Flow**

```
1. ORDER CREATED                     by customer
   Preorder submitted by customer

2. EMAIL SENT                        by system
   Order confirmation email sent to customer

3. PAYMENT LINK CREATED              by admin
   Payment link created - order locked for modifications

4. EMAIL SENT                        by admin
   Payment link email sent to customer

5. PAYMENT COMPLETED                 by stripe_webhook
   Payment completed via Stripe payment link

6. EMAIL SENT                        by stripe_webhook
   Payment receipt email sent to customer
```

### **Scenario 2: Customer Modifies Before Payment**

```
1. ORDER CREATED                     by customer
   Preorder submitted by customer

2. EMAIL SENT                        by system
   Order confirmation email sent to customer

3. ORDER MODIFIED                    by customer
   Order details modified by customer

4. PAYMENT LINK CREATED              by admin
   Payment link created - order locked for modifications

5. EMAIL SENT                        by admin
   Payment link email sent to customer

6. PAYMENT COMPLETED                 by stripe_webhook
   Payment completed via Stripe payment link

7. EMAIL SENT                        by stripe_webhook
   Payment receipt email sent to customer
```

---

## 📊 **Timeline Display**

### **Location**: `/admin/orders/[id]`

Each event shows:
- Event icon
- Event type name
- Description
- Created by
- Timestamp
- Expandable event data (JSON)

### **Filtering Options**:
- All events
- Email events only
- Payment events only
- System events only

---

## 🔧 **Database Schema**

```sql
order_timeline table:
- id (uuid)
- order_id (uuid) -- Foreign key to orders
- event_type (text)
- event_description (text)
- event_data (jsonb)
- created_by (text)
- created_at (timestamp)
```

---

## 📝 **Notes**

- All timeline events are **immutable** - once created, they cannot be edited
- Failed operations still create timeline entries for audit purposes
- Email failures don't block the main operation (e.g., payment link still created)
- Timeline provides complete audit trail for customer support and debugging
