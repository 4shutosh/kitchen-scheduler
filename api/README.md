# Kitchen Scheduler API

A FastAPI application for managing kitchen scheduling and menu items.

## Setup

This project uses `uv` as the dependency manager. Make sure you have `uv` installed.

### Installation

```bash
# Install dependencies
uv sync

# Or if you want to add new dependencies
uv add <package-name>
```

### Running the Application

```bash
# Run with uv
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or run directly
uv run python main.py
```

### API Documentation

Once the server is running, you can access:

- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc
- **OpenAPI schema**: http://localhost:8000/openapi.json

## API Endpoints

### Basic Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check

### Menu Management

- `GET /menu` - Get all menu items
- `GET /menu/{item_id}` - Get specific menu item
- `POST /menu` - Create new menu item
- `PUT /menu/{item_id}` - Update menu item
- `DELETE /menu/{item_id}` - Delete menu item
- `GET /menu/category/{category}` - Get items by category

## Example Usage

```bash
# Get all menu items
curl http://localhost:8000/menu

# Create a new menu item
curl -X POST http://localhost:8000/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pasta Carbonara",
    "description": "Creamy pasta with bacon and eggs",
    "prep_time": 20,
    "category": "Main Course"
  }'

# Get items by category
curl http://localhost:8000/menu/category/Salad
```

## Development

The application includes:

- FastAPI with automatic API documentation
- Pydantic models for request/response validation
- In-memory storage (replace with database for production)
- CORS support (can be added if needed)
- Hot reload during development
