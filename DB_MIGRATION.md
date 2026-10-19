# Database Migration Guide

## Problem
When you add new columns to existing database tables, SQLAlchemy's `create_all()` doesn't automatically add them. You need to migrate the database.

## Solution Options

### Option 1: Run Migration Script (Recommended - Preserves Data)

Run the migration script to add the new columns without losing data:

```bash
cd api
uv run python migrate_db.py
```

Or if you have dependencies installed globally:
```bash
cd api
python migrate_db.py
```

This will:
- Check if `is_out_of_plan` columns exist
- Add them if missing
- Preserve all existing data

### Option 2: Delete and Recreate Database (Loses Data)

If you don't have important data or the migration fails:

1. **Stop the API server** if it's running

2. **Delete the database file:**
   ```bash
   cd api
   rm kitchen_scheduler.db
   ```

3. **Restart the API server:**
   ```bash
   cd api
   uv run python main.py
   ```

   The database will be automatically recreated with all new columns.

### Option 3: Manual SQL Migration

If you prefer to do it manually:

**For SQLite:**
```sql
ALTER TABLE orders ADD COLUMN is_out_of_plan BOOLEAN DEFAULT 0;
ALTER TABLE order_items ADD COLUMN is_out_of_plan BOOLEAN DEFAULT 0;
```

**For PostgreSQL:**
```sql
ALTER TABLE orders ADD COLUMN is_out_of_plan BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN is_out_of_plan BOOLEAN DEFAULT FALSE;
```

## What Changed?

The following columns were added:
- `orders.is_out_of_plan` - Boolean flag to mark orders that exceed customer's paid amount
- `order_items.is_out_of_plan` - Boolean flag to mark order items that exceed customer's paid amount

Both default to `False` (0 in SQLite).

## Troubleshooting

If you get errors:
1. Make sure the API server is stopped
2. Check that you're in the `api` directory
3. Ensure you have the correct Python environment activated
4. Try Option 2 (delete and recreate) if you don't need existing data


