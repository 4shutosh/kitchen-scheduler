# Quick Start Guide - Kitchen Scheduler

## Backend Setup (Terminal 1)

```bash
cd api
uv sync
uv run python main.py
```

The API will start on **http://localhost:8000**

## Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

## Testing Steps

### 1. Step Zero: Setup Stations & Menu

1. Open http://localhost:5173
2. Click **"Step Zero: Menu Setup"**
3. Create Stations:
   - Click "+ Add Station"
   - Add: "Grill Station", "Salad Station", "Dessert Station"
4. Create Menu:
   - Click "+ Create Menu" → "Main Menu"
5. Add Menu Items:
   - Click "+ Add Menu Item"
   - Create items and assign them to stations

### 2. Step One: Take Orders

1. Click **"Step One: Take Order"**
2. Select menu and order type (Dine In/Parcel)
3. Select items, set quantities
4. Click "Place Order"

### 3. Step Two: Kitchen View

1. Click **"Step Two: Kitchen Staff"**
2. Select a station from dropdown
3. See orders in Kanban: To Do → In Progress → Done
4. Click "Start" to begin, "Mark Done" to complete

## Verify Backend API

Visit http://localhost:8000/docs for interactive API documentation
