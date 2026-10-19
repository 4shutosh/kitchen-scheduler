# CSV Import Guide for Customer Management

## Overview

The Customer Management page supports importing customers from a CSV file with automatic data mapping and filtering.

## CSV Format Requirements

### Required Columns

Your CSV file must include these exact column headers:

1. **name** - Customer's full name
2. **email** - Customer's email address
3. **phone_number** - Customer's phone number (can be empty)
4. **Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp)** - Plan type information
5. **approval_status** - Must be "approved" for the row to be imported

### Column Mapping

| CSV Column                      | Database Field | Processing                               |
| ------------------------------- | -------------- | ---------------------------------------- |
| `name`                          | `name`         | Direct mapping                           |
| `email`                         | `email`        | Direct mapping                           |
| `phone_number`                  | `phone_number` | Direct mapping (optional)                |
| `Pick your tasting plate (...)` | `plan_type`    | Direct mapping to plan_type field        |
| `Pick your tasting plate (...)` | `paid`         | Extracts first integer found in the text |
| `approval_status`               | (filter)       | Only rows with "approved" are imported   |

### Paid Amount Extraction

The system automatically extracts the `paid` amount from the plan type text by finding the integer that follows the ₹ (Rupee) symbol.

**Examples:**

- "Premium Plan ₹500" → paid = 500
- "Basic Package ₹250" → paid = 250
- "Deluxe Plan 750" → paid = 0 (no ₹ symbol found)
- "Special ₹1200 (multiple guests)" → paid = 1200

## Sample CSV File

```csv
name,email,phone_number,Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp),approval_status
John Doe,john@example.com,+1234567890,Premium Plan ₹500,approved
Jane Smith,jane@example.com,+9876543210,Basic Package ₹250,approved
Bob Wilson,bob@example.com,,Standard Plan ₹350,pending
Alice Brown,alice@example.com,+5551234567,Deluxe ₹750,approved
```

In this example:

- **John Doe** will be imported with paid=500 (₹ symbol found)
- **Jane Smith** will be imported with paid=250 (₹ symbol found)
- **Bob Wilson** will be SKIPPED (status is "pending", not "approved")
- **Alice Brown** will be imported with paid=750 (₹ symbol found)

## How to Import

1. **Navigate** to the Customer Management page
2. **Click** the "📥 Import CSV" button
3. **Select** your CSV file
4. **Wait** for the import process to complete
5. **Review** the import status message showing:
   - Number of successful imports
   - Number of failed imports
   - First 5 error messages (if any)

## Import Rules

### What Gets Imported

✅ Rows with `approval_status` = "approved"  
✅ Valid email and name fields  
✅ Automatically extract paid amount from plan type

### What Gets Skipped

❌ Rows where approval_status is NOT "approved"  
❌ Rows missing email or name  
❌ Duplicate emails (will show error)

## Error Handling

### Common Errors

1. **Missing columns**: Ensure all required column headers are present
2. **Duplicate emails**: The database requires unique emails
3. **Missing required fields**: name and email must not be empty
4. **Invalid CSV format**: Ensure proper CSV formatting (commas, quotes)

### Success Indicators

- Green success message with count of imported customers
- Customer list automatically refreshes
- New customers appear in the grid below

## Tips

- **Test with a small file first** (5-10 rows) to verify format
- **Check approval_status** values are exactly "approved" (case-insensitive)
- **Ensure email uniqueness** - duplicate emails will be updated, not fail
- **Review error messages** - first 5 errors are displayed for debugging
- **Phone numbers are optional** - can be left empty
- **Plan type format** - **Must include ₹ symbol** before the amount (e.g., "Plan ₹500")

## Example CSV Templates

### Template 1: Basic

```csv
name,email,phone_number,Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp),approval_status
Test Customer,test@example.com,1234567890,Premium ₹500,approved
```

### Template 2: With Multiple Guests

```csv
name,email,phone_number,Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp),approval_status
Family Plan,family@example.com,+1234567890,Family Package ₹1500 (4 guests),approved
Couple Plan,couple@example.com,+9876543210,Romantic Dinner ₹800 (2 guests),approved
```

### Template 3: Mixed Status (Only Approved Imported)

```csv
name,email,phone_number,Pick your tasting plate (You can pick one or more, payment will be collected via Whatsapp),approval_status
Approved User,approved@example.com,1111111111,Plan A ₹300,approved
Pending User,pending@example.com,2222222222,Plan B ₹400,pending
Rejected User,rejected@example.com,3333333333,Plan C ₹500,rejected
```

Result: Only "Approved User" will be imported.

## Technical Notes

- CSV parsing uses simple comma-split logic
- For production use with complex CSVs (quotes, commas in values), consider upgrading to PapaParse library
- Import is processed sequentially (one customer at a time)
- Database constraints (unique email) are enforced during import
- File input is reset after each import attempt

## Troubleshooting

### Import shows "0 successful, X failed"

- Check if any rows have approval_status = "approved"
- Verify email and name fields are not empty
- Check for duplicate emails in your CSV
- Review the error messages displayed

### "Missing required columns" error

- Ensure column headers match exactly
- The "Pick your tasting plate..." header must match character-for-character
- Headers are case-sensitive

### Paid amount shows 0

- Make sure the plan_type includes the ₹ symbol before the amount
- Example: "Premium ₹500" not "Premium 500"
- The ₹ symbol is required for amount extraction

### Some customers imported, some failed

- This is normal - review the error list
- Common causes: missing data (customers are updated if email exists)
- Successfully imported customers are added/updated even if others fail

## Need Help?

If you encounter issues:

1. Verify your CSV format matches the requirements
2. Check the sample CSV templates above
3. Try importing a single test row first
4. Review error messages carefully
