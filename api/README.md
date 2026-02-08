# Kitchen Scheduler API

A simple FastAPI-based REST API for managing menus and menu items with PostgreSQL database.

## Features

- **Menu Management**: Full CRUD operations for menus
- **Menu Item Management**: Full CRUD operations for menu items
- **PostgreSQL Database**: Persistent storage with SQLAlchemy ORM
- **Auto-generated Documentation**: Interactive API docs at `/docs`

## Quick Start

1. **Setup the environment:**

   ```bash
   ./setup.sh
   ```

2. **Start the API server:**

   ```bash
   cd api
   python main.py
   ```

3. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/health

## API Endpoints

### Menus

- `GET /menus/` - Get all menus
- `POST /menus/` - Create a new menu
- `GET /menus/{menu_id}` - Get a specific menu
- `PUT /menus/{menu_id}` - Update a menu
- `DELETE /menus/{menu_id}` - Delete a menu
- `GET /menus/{menu_id}/menu-items/` - Get menu items for a menu

### Menu Items

- `GET /menu-items/` - Get all menu items
- `POST /menu-items/` - Create a new menu item
- `GET /menu-items/{menu_item_id}` - Get a specific menu item
- `PUT /menu-items/{menu_item_id}` - Update a menu item
- `DELETE /menu-items/{menu_item_id}` - Delete a menu item

## Database

The API uses PostgreSQL with the following tables:

- `menus`: Stores menu information
- `menu_items`: Stores menu item details with foreign key to menus

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:password@localhost:5432/kitchen_scheduler`)

## Example Usage

### Create a Menu

```bash
curl -X POST "http://localhost:8000/menus/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Breakfast Menu", "description": "Morning delights"}'
```

### Create a Menu Item

```bash
curl -X POST "http://localhost:8000/menu-items/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pancakes",
    "prep_time": 15,
    "category": "Breakfast",
    "price": 8.99,
    "ingredients": ["flour", "eggs", "milk"],
    "availability": "available"
  }'
```
