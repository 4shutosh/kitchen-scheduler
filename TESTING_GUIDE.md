# Kitchen Scheduler - Testing Guide

## Quick Start (2 Terminals)

### Terminal 1: Backend

```bash
cd api
uv sync
uv run python main.py
```

✅ Backend running on http://localhost:8000

### Terminal 2: Frontend

```bash
cd frontend
npm install  # Only first time
npm run dev
```

✅ Frontend running on http://localhost:5173

---

## Complete Test Flow

### Step 0: Setup (Menu Management)

1. **Open**: http://localhost:5173
2. **Navigate**: Click "Step Zero: Menu Setup"
3. **Create Stations**:
   - Click "+ Add Station"
   - Create: "Grill Station", "Salad Station", "Dessert Station"
4. **Create Menu**:
   - Click "+ Create Menu"
   - Name: "Main Menu"
5. **Add Menu Items** (select the menu first):
   - Click "+ Add Menu Item"
   - Example items:
     - **Grill Station**: "Burger" ($12.99, 15min), "Steak" ($25.99, 25min)
     - **Salad Station**: "Caesar Salad" ($9.99, 10min), "Garden Salad" ($8.99, 8min)
     - **Dessert Station**: "Ice Cream" ($5.99, 5min), "Chocolate Cake" ($7.99, 10min)

### Step 1: Take Orders

1. **Navigate**: Click "Step One: Take Order"
2. **Select Menu**: Choose "Main Menu"
3. **Set Default Order Type**: Select "Dine In" or "Parcel"
4. **Enter Table Number**: If Dine In, enter "Table 5"
5. **Select Items**:
   - Click items to select
   - For each selected item:
     - Choose Type: "Dine In" or "Parcel" (per item)
     - Set Quantity
   - Check order summary in sidebar
6. **Place Order**: Click "Place Order" button

**Test Cases**:

- Create Order 1: Table 5, Dine In, Burger (x2) + Caesar Salad (x1)
- Create Order 2: Parcel, Steak (x1) + Ice Cream (x2)
- Create Order 3: Table 3, Dine In, Garden Salad (x1)

### Step 2: Kitchen Staff View

1. **Navigate**: Click "Step Two: Kitchen Staff"
2. **Select Station**: Choose "Grill Station" from dropdown
3. **View Kanban**:
   - **To Do**: Shows Burger and Steak orders
   - **In Progress**: Empty (move items here)
   - **Done**: Empty (completed items)
4. **Process Orders**:
   - Click "Start" on a Burger item → moves to In Progress
   - Click "Mark Done" → moves to Done
5. **Switch Stations**:
   - Select "Salad Station" → see salad orders in To Do
   - Select "Dessert Station" → see dessert orders in To Do
6. **Verify Real-time**:
   - Items auto-refresh every 2 seconds
   - New orders appear automatically in To Do

---

## Verify Backend API

Visit **http://localhost:8000/docs** for interactive Swagger UI

Test endpoints directly:

```bash
# Get all stations
curl http://localhost:8000/stations/

# Get all menus
curl http://localhost:8000/menus/

# Get orders
curl http://localhost:8000/orders/

# Get order items by station
curl "http://localhost:8000/stations/1/order-items/?status=todo"
```

---

## Troubleshooting

### Backend Issues

- **Port 8000 in use**: Kill process: `lsof -ti:8000 | xargs kill`
- **Database errors**: Delete `api/kitchen_scheduler.db` and restart
- **Import errors**: Run `uv sync` again

### Frontend Issues

- **Port 5173 in use**: Vite auto-selects next port
- **API errors**: Check backend is running, check browser console (F12)
- **CORS errors**: Backend CORS is configured, should work

### Database Reset

```bash
cd api
rm kitchen_scheduler.db
uv run python main.py  # Recreates database with latest schema
```

---

## Expected Results

✅ Stations created and visible in Step Zero
✅ Menu items created with station assignments
✅ Orders placed successfully
✅ Order items appear in correct station's "To Do" column
✅ Status updates work (Start → In Progress → Done)
✅ Real-time updates every 2 seconds
✅ Switching stations shows different order queues
