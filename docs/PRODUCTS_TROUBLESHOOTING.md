# Products System Troubleshooting Guide

## Common Issues and Solutions

### Issue: Products not loading on homepage
**Symptoms**: Empty product configurator, loading state persists
**Diagnosis Steps**:
1. Check browser console for API errors
2. Visit `/api/products` directly to test API
3. Run `/debug-homepage-products` for system analysis
4. Execute `scripts/037-debug-products-for-homepage.sql`

**Common Causes**:
- Database connection issues
- Missing products in database
- API validation failures
- Client-side validation errors

### Issue: Cart not saving properly
**Symptoms**: Cart items disappear, checkout shows empty cart
**Diagnosis Steps**:
1. Check browser localStorage for cart data
2. Review console logs for cart storage errors
3. Verify product data structure matches CartItem interface
4. Test cart operations in isolation

**Common Causes**:
- Invalid product data structure
- localStorage quota exceeded
- Type validation failures
- Corrupted cart data

### Issue: Checkout process failing
**Symptoms**: Form submission errors, order not created
**Diagnosis Steps**:
1. Verify cart data is valid
2. Check form validation errors
3. Test API endpoints individually
4. Review authentication state

**Common Causes**:
- Invalid cart data
- Form validation failures
- Authentication issues
- API endpoint errors

## Debug Commands

### Check Database Products:
\`\`\`sql
SELECT id, title, weight, selling_price, regular_price, available 
FROM products 
WHERE available = true 
ORDER BY weight;
\`\`\`

### Test API Endpoint:
\`\`\`bash
curl -X GET "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache"
\`\`\`

### Clear Cart Storage:
\`\`\`javascript
localStorage.removeItem('carolina_bumper_plates_cart');
\`\`\`

### Check Cart Data:
\`\`\`javascript
console.log(JSON.parse(localStorage.getItem('carolina_bumper_plates_cart') || 'null'));
\`\`\`

## System Health Checks

### 1. Database Connectivity
- Visit `/api/test-supabase`
- Should return success response

### 2. Products API
- Visit `/api/products`
- Should return products array with valid data

### 3. Debug Dashboard
- Visit `/debug-homepage-products`
- Should show all systems operational

### 4. Homepage Integration
- Visit homepage
- Products should load in configurator section

## Recovery Procedures

### Complete System Reset:
1. Clear browser cache and localStorage
2. Run database debug script
3. Restart application
4. Test all functionality

### Data Recovery:
1. Check database for valid products
2. Run sample data insertion if needed
3. Clear client-side cache
4. Refresh application

### Emergency Fallback:
If products system fails completely:
1. Check database connection
2. Verify environment variables
3. Run all debug scripts
4. Contact system administrator

---

**Remember**: Always check this troubleshooting guide before making changes to the products system.
