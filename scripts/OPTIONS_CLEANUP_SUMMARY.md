# Options Table Cleanup Summary

## What This Script Does

Cleans up the `options` table from **56 unused entries** down to **7 essential settings**.

---

## ✅ KEPT (7 options)

These are actively used by the application:

| Option Name | Current Value | Used By |
|------------|---------------|---------|
| `business_name` | The Plate Yard | Settings page, emails |
| `business_email` | info@theplateyard.com | Settings page, contact info |
| `business_phone` | (607) 329-5976 | Settings page, contact info |
| `business_address` | 1013 Hazeltn ln. Fuquay-Varina, NC 27526 | Settings page, contact info |
| `website` | https://carolinabumperplates.com | Settings page |
| `minimum_order_weight` | 7000 | Order validation |
| `tax_rate` | 0.0725 | Order calculations |

---

## 🗑️ DELETED (49 options)

### Security Risks (10) - Already in .env.local
- `stripe_publishable_key` ⚠️
- `stripe_secret_key` ⚠️
- `stripe_webhook_secret` ⚠️
- `mailgun_api_key` ⚠️
- `supabase_anon_key` ⚠️
- `supabase_service_role_key` ⚠️
- `stripe_test_secret_key` ⚠️
- `stripe_test_publishable_key` ⚠️
- `stripe_test_webhook_secret` ⚠️
- `zapier_webhook_secret` ⚠️

### Unused Features (29)
- `shipping_rate` - Set to 0, never used
- `pickup_location` - Not implemented
- `pickup_instructions` - Not implemented
- `email_notifications_enabled` - Not used
- `order_confirmation_email_enabled` - Not used
- `invoice_email_enabled` - Not used
- `supabase_url` - Should be in .env
- `mailgun_domain` - Should be in .env
- `mailgun_from_email` - Should be in .env
- `app_base_url` - Not used
- `app_environment` - Should use NODE_ENV
- `debug_mode` - Not used
- `zapier_webhook_url` - Empty
- `zapier_webhook_enabled` - Disabled
- `zapier_webhook_timeout` - Not used
- `zapier_retry_attempts` - Not used
- `zapier_retry_delay` - Not used
- `zapier_include_customer_data` - Not used
- `zapier_include_order_items` - Not used
- `zapier_include_pricing_data` - Not used
- `zapier_include_shipping_data` - Not used
- `order_confirmation_enabled` - Not used
- `invoice_auto_send` - Not used
- `order_numbering_prefix` - Not used
- `order_retention_days` - Not used
- `stripe_auto_sync` - Not used
- `stripe_test_mode` - Not used
- `email_notifications` - Duplicate
- `order_confirmation_email` - Duplicate
- `invoice_email` - Duplicate

### Not Implemented (7)
- `database_backup_enabled`
- `database_backup_frequency`
- `database_retention_days`
- `app_name`
- `app_version`
- `maintenance_mode`
- `session_timeout`

### Duplicates Consolidated (3)
- `business_website` → merged into `website`
- `website_url` → merged into `website`
- Extra `website` entries → kept only one

---

## 📝 How to Run

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `cleanup-options-table.sql`
4. Run the script
5. Verify the output shows only 7 rows

---

## ⚠️ Before Running

**Backup your database first!** This operation is irreversible.

```sql
-- Quick backup (optional)
CREATE TABLE options_backup AS SELECT * FROM options;
```

---

## 🔒 Security Improvement

All sensitive API keys are now **only** in `.env.local` where they belong:
- ✅ Not exposed in database
- ✅ Not in version control
- ✅ Properly secured

---

## 📊 Results

- **Before:** 56 options (with security risks)
- **After:** 7 options (clean and secure)
- **Removed:** 49 unused/risky options
- **Storage saved:** ~85% reduction

---

## Next Steps

After running the cleanup:

1. ✅ Test the settings page: `/admin/settings`
2. ✅ Verify orders still calculate correctly
3. ✅ Check that all features work as expected
4. ✅ Remove the backup table if everything works:
   ```sql
   DROP TABLE IF EXISTS options_backup;
   ```
