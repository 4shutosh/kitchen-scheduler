# Kitchen Scheduler Frontend

A React-based web portal for managing restaurant operations.

## Features

### Step Zero: Menu Management

- Create and manage kitchen stations
- Create menus
- Add menu items with station assignments
- View all stations and menu items

### Step One: Order Taking

- Select items from menu (multi-select)
- Choose order type (Dine In or Parcel) per item
- Set table number for dine-in orders
- Place orders

### Step Two: Kitchen Staff View

- View order items by station (dropdown selection)
- Kanban board with 3 columns: To Do, In Progress, Done
- Real-time updates (polling every 2 seconds)
- Move items between states

## Getting Started

### Prerequisites

- Node.js and npm installed
- Backend API running on http://localhost:8000

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on http://localhost:5173 (or the next available port).

### Build for Production

```bash
npm run build
```

## API Integration

The frontend communicates with the FastAPI backend at `http://localhost:8000`. Make sure the backend is running before using the frontend.

## Project Structure

```
src/
  ├── api.js           # API service functions
  ├── App.jsx          # Main app component with routing
  ├── App.css          # App styles
  ├── index.css        # Global styles
  └── pages/
      ├── StepZero.jsx # Menu management page
      ├── StepOne.jsx  # Order taking page
      └── StepTwo.jsx  # Kitchen staff kanban view
```

## Usage

1. **Start with Step Zero**: Create stations and menus before taking orders
2. **Step One**: Take orders from customers
3. **Step Two**: Kitchen staff processes orders at their stations

## Technologies

- React 18
- React Router DOM
- Axios
- Vite
