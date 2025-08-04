# Carolina Bumper Plates

A comprehensive e-commerce platform for selling factory-second Hi-Temp bumper plates at wholesale prices through a pre-order batch system.

## Overview

Carolina Bumper Plates operates as a specialized reseller of official Hi-Temp USA-made bumper plates that have minor cosmetic blemishes. The platform uses a unique batch-based pre-order system where customers reserve plates without upfront payment, and orders are fulfilled once a minimum weight threshold (10,000 lbs) is reached.

## Key Features

### 🏋️ Product Management
- **Factory-Second Plates**: Official Hi-Temp bumper plates with minor cosmetic defects
- **Weight-Based Catalog**: Products organized by weight (25lb, 35lb, 45lb, etc.)
- **Dynamic Pricing**: Significant savings compared to retail prices
- **Image Management**: Product photos with upload capabilities
- **Stripe Integration**: Automated product and pricing synchronization

### 📦 Pre-Order System
- **Batch Collection**: Orders accumulate until 10,000 lb minimum is reached
- **No Upfront Payment**: Customers reserve without immediate payment
- **Progress Tracking**: Real-time display of batch progress toward goal
- **Flexible Modifications**: Customers can modify orders before invoicing

### 💳 Payment Processing
- **Stripe Integration**: Secure payment processing with webhooks
- **Payment Links**: Automated generation when batch goals are met
- **Invoice System**: Comprehensive invoicing with PDF generation
- **Multiple Payment Methods**: Support for cards, ACH, and other Stripe methods

### 👥 Customer Management
- **Account System**: User registration and authentication via Supabase
- **Order History**: Complete order tracking and status updates
- **Profile Management**: Address, contact, and delivery preferences
- **Guest Checkout**: Option to order without creating account

### 🛠️ Admin Dashboard
- **Order Management**: Complete order lifecycle management
- **Customer Database**: Comprehensive customer information system
- **Product Administration**: Add, edit, and manage product catalog
- **Payment Tracking**: Monitor payment status and process refunds
- **Analytics**: Sales reports, weight tracking, and performance metrics

## Technical Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Modern component library
- **Responsive Design**: Mobile-first approach

### Backend
- **Next.js API Routes**: Server-side functionality
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Secure data access patterns
- **Server Actions**: Form handling and data mutations

### Integrations
- **Stripe**: Payment processing and subscription management
- **Supabase Auth**: User authentication and authorization
- **Vercel Blob**: File storage for product images
- **Webhook System**: Real-time event processing

### Database Schema
- **Orders**: Complete order information with JSON item storage
- **Customers**: User profiles and delivery information
- **Products**: Catalog with pricing and Stripe synchronization
- **Timeline**: Audit trail for all order events
- **Webhook Logs**: Integration monitoring and debugging

## Business Model

### Pre-Order Batch System
1. **Collection Phase**: Customers place pre-orders without payment
2. **Batch Threshold**: Orders accumulate until 10,000 lb minimum
3. **Payment Processing**: Automated invoicing when threshold is met
4. **Fulfillment**: Bulk pickup from Hi-Temp and local delivery

### Pricing Strategy
- **Wholesale Pricing**: Direct factory-second pricing
- **Volume Discounts**: Savings increase with batch size
- **Transparent Pricing**: Clear comparison with retail prices
- **No Hidden Fees**: Upfront pricing with tax calculation

## User Workflows

### Customer Journey
1. **Product Selection**: Browse catalog and configure plate sets
2. **Pre-Order Placement**: Submit order with delivery information
3. **Batch Monitoring**: Track progress toward fulfillment goal
4. **Payment Notification**: Receive invoice when batch is ready
5. **Payment Processing**: Complete payment via secure link
6. **Delivery Coordination**: Receive delivery scheduling notification

### Admin Operations
1. **Order Processing**: Monitor and manage incoming orders
2. **Batch Management**: Track progress and trigger fulfillment
3. **Payment Collection**: Generate and send payment links
4. **Inventory Coordination**: Coordinate with Hi-Temp for pickup
5. **Delivery Management**: Schedule and track deliveries

## Key Pages and Functionality

### Public Pages
- **Homepage** (`/`): Product showcase and batch progress
- **Product Configurator**: Interactive plate set builder
- **Checkout** (`/checkout`): Order placement and customer information
- **Order Confirmation**: Success page with order details
- **Order Lookup** (`/order-lookup`): Find orders by number/email

### Customer Account
- **My Account** (`/my-account`): Order history and profile management
- **Order Modification** (`/modify-order`): Edit pending orders
- **Payment Processing**: Secure payment completion

### Admin Dashboard
- **Dashboard** (`/admin`): Overview and key metrics
- **Orders Management** (`/admin/orders`): Complete order administration
- **Customer Database** (`/admin/customers`): Customer information management
- **Product Catalog** (`/admin/products`): Inventory and pricing management
- **Payment Tools** (`/admin/payment-discrepancy-tools`): Payment issue resolution
- **System Health** (`/admin/system-health`): Platform monitoring
- **Webhook Diagnostics** (`/admin/webhook-diagnostics`): Integration debugging

## Security Features

### Data Protection
- **Row Level Security**: Database-level access control
- **Authentication**: Secure user login and session management
- **Authorization**: Role-based access to admin functions
- **Input Validation**: Comprehensive form and API validation

### Payment Security
- **PCI Compliance**: Stripe handles all payment data
- **Webhook Verification**: Cryptographic signature validation
- **Secure Tokens**: JWT-based authentication
- **HTTPS Enforcement**: All traffic encrypted

## Monitoring and Diagnostics

### System Health
- **Database Monitoring**: Connection and query performance
- **Payment Tracking**: Transaction success rates
- **Webhook Reliability**: Integration failure detection
- **Error Logging**: Comprehensive error tracking

### Business Intelligence
- **Sales Analytics**: Revenue and conversion tracking
- **Batch Analysis**: Fulfillment cycle optimization
- **Customer Insights**: Order patterns and preferences
- **Inventory Planning**: Demand forecasting

## Development and Deployment

### Local Development
\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
\`\`\`

### Environment Variables
- `SUPABASE_URL`: Database connection
- `SUPABASE_ANON_KEY`: Public database access
- `STRIPE_SECRET_KEY`: Payment processing
- `STRIPE_WEBHOOK_SECRET`: Webhook verification
- `BLOB_READ_WRITE_TOKEN`: File storage access

### Database Setup
1. Create Supabase project
2. Run migration scripts in order (001-099)
3. Configure Row Level Security policies
4. Set up webhook endpoints

### Deployment
- **Platform**: Vercel for optimal Next.js performance
- **Database**: Supabase managed PostgreSQL
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Built-in error tracking and analytics

## Support and Maintenance

### Customer Support
- **Order Lookup**: Self-service order tracking
- **Email Support**: Direct customer service contact
- **FAQ System**: Common questions and answers
- **Live Chat**: Real-time customer assistance

### System Maintenance
- **Automated Backups**: Daily database snapshots
- **Health Monitoring**: Proactive issue detection
- **Performance Optimization**: Continuous improvement
- **Security Updates**: Regular dependency updates

## Future Enhancements

### Planned Features
- **Mobile App**: Native iOS/Android applications
- **Subscription Model**: Recurring plate deliveries
- **Loyalty Program**: Customer rewards and discounts
- **Advanced Analytics**: Machine learning insights

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Advanced Caching**: Redis implementation
- **API Expansion**: Third-party integrations
- **Performance Optimization**: Edge computing

---

## Contact Information

- **Website**: [Carolina Bumper Plates](https://carolinabumperplates.com)
- **Email**: orders@carolinabumperplates.com
- **Support**: support@carolinabumperplates.com

## License

This project is proprietary software developed for Carolina Bumper Plates LLC.
