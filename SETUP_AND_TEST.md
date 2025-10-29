# Kitchen Scheduler - Setup and Testing Guide

## Prerequisites

- Python 3.9+ installed
- Node.js 18+ and npm installed
- Terminal/Command Prompt access

## Step 1: Backend Setup

### 1.1 Navigate to API directory

```bash
cd api
```

### 1.2 Install Python dependencies

```bash
# Using uv (if available)
uv sync

# OR using pip
pip install -r requirements.txt

# OR if using pyproject.toml directly
pip install fastapi uvicorn sqlalchemy pydantic
```

### 1.3 Start the Backend Server

```bash
python main.py
```

The API will start on **http://localhost:8000**

You can verify it's running by:

- Visiting http://localhost:8000/health
- Visiting http://localhost:8000/docs for interactive API documentation

## Step 2: Frontend Setup

### 2.1 Navigate to Frontend directory (in a NEW terminal)

```bash
cd frontend
```

### 2.2 Install Node dependencies

```bash
npm install
```

### 2.3 Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on **http://localhost:5173** (or the next available port)

## Step 3: Testing the Application

### 3.1 Step Zero: Menu Management

1. **Create Stations**

   - Click "Step Zero: Menu Setup" in navigation
   - Click "+ Add Station"
   - Enter station name (e.g., "Grill Station", "Salad Station", "Dessert Station")
   - Optionally add a description
   - Click "Create Station"
   - Repeat to create multiple stations

2. **Create a Menu**

   - Click "+ Create Menu"
   - Enter menu name (e.g., "Lunch Menu")
   - Select the menu from dropdown

3. **Add Menu Items**
   - Click "+ Add Menu Item"
   - Fill in the form:
     - Name: (e.g., "Grilled Chicken")
     - Station: Select from dropdown (e.g., "Grill Station")
     - Category: (e.g., "Main Course")
     - Price: (e.g., 15.99)
     - Prep Time: (e.g., 20 minutes)
     - Availability: Keep as "Available"
     - Description: (optional)
   - Click "Create Menu Item"
   - Repeat to add multiple items to different stations

### 3.2 Step One: Take Orders

1. **Navigate to Order Taking**

   - Click "Step One: Take Order" in navigation

2. **Select Menu**

   - Choose the menu you created from dropdown

3. **Set Default Order Type**

   - Select "Dine In" or "Parcel" as default
   - If "Dine In", enter a table number (e.g., "Table 5")

4. **Select Menu Items**

   - Click on menu items to select them
   - For each selected item:
     - Choose Type: "Dine In" or "Parcel" (can be different per item)
     - Set Quantity: Enter the number needed
   - View order summary in the right sidebar

5. **Place Order**
   - Review the order summary
   - Click "Place Order" button
   - Verify success message

### 3.3 Step Two: Kitchen Staff View

1. **Navigate to Kitchen View**

   - Click "Step Two: Kitchen Staff" in navigation

2. **Select Station**

   - Choose a station from the dropdown (e.g., "Grill Station")

3. **View Kanban Board**

   - **To Do Column**: Shows new order items for this station
   - **In Progress Column**: Shows items currently being prepared
   - **Done Column**: Shows completed items

4. **Process Orders**

   - Click "Start" button on an item in "To Do" to move it to "In Progress"
   - Click "Mark Done" to move from "In Progress" to "Done"
   - Click "Back to Todo" to revert an item if needed

5. **Real-time Updates**
   - The board auto-refreshes every 2 seconds
   - New orders will appear in "To Do" automatically
   - Switch between stations to see different order queues

## Step 4: Complete Test Flow

### Full Restaurant Workflow Test:

1. **Setup Phase (Step Zero)**

   ```
   - Create 3 stations: "Grill Station", "Salad Station", "Dessert Station"
   - Create 1 menu: "Main Menu"
   - Add 2-3 items per station:
     * Grill Station: "Burger", "Steak"
     * Salad Station: "Caesar Salad", "Garden Salad"
     * Dessert Station: "Ice Cream", "Cake"
   ```

2. **Order Taking Phase (Step One)**

   ```
   - Create 2-3 orders:
     * Order 1: Table 5, Dine In, Burger (Dine In) + Caesar Salad (Dine In)
     * Order 2: Parcel, Steak (Parcel) + Ice Cream (Parcel)
     * Order 3: Table 3, Dine In, Garden Salad (Dine In)
   ```

3. **Kitchen Processing Phase (Step Two)**
   ```
   - Switch to "Grill Station": See Burger and Steak in To Do
   - Start Burger → moves to In Progress
   - Switch to "Salad Station": See both salads in To Do
   - Process items through In Progress to Done
   - Switch stations to verify different queues
   ```

## Troubleshooting

### Backend Issues:

- **Port 8000 already in use**:

  - Change port in `api/main.py` line 289: `uvicorn.run(app, host="0.0.0.0", port=8001)`
  - Update frontend `api.js`: Change `API_BASE_URL` to `http://localhost:8001`

- **Database errors**:

  - Delete `api/kitchen_scheduler.db` and restart backend (will recreate tables)

- **Module not found errors**:
  - Ensure you're in the `api` directory
  - Check Python version: `python --version` (should be 3.9+)

### Frontend Issues:

- **Port 5173 already in use**:

  - Vite will auto-select next available port
  - Check terminal output for actual port

- **API connection errors**:

  - Verify backend is running on port 8000
  - Check browser console for CORS errors
  - Ensure backend CORS middleware is configured

- **npm install errors**:
  - Clear cache: `npm cache clean --force`
  - Delete `node_modules` and `package-lock.json`, then `npm install`

## API Endpoints Reference

While testing, you can also use the API directly:

- **Health Check**: `GET http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs` (Interactive Swagger UI)
- **Stations**: `GET http://localhost:8000/stations/`
- **Menus**: `GET http://localhost:8000/menus/`
- **Orders**: `GET http://localhost:8000/orders/`

## Next Steps

Once testing is complete:

- Customize stations and menu items for your restaurant
- Adjust real-time polling interval in StepTwo.jsx (currently 2000ms)
- Add authentication if needed
- Deploy to production

## Support

If you encounter issues:

1. Check browser console (F12) for frontend errors
2. Check backend terminal for server errors
3. Verify database file exists: `api/kitchen_scheduler.db`
4. Ensure both servers are running simultaneously
