from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

# Import database and models
from database import get_db, engine
from db_models import Base
from schemas import (
    MenuItem, MenuItemCreate, MenuItemUpdate, Menu, MenuCreate, MenuUpdate,
    Station, StationCreate, StationUpdate, Order, OrderCreate, OrderItem, OrderItemUpdate,
    Customer, CustomerCreate, CustomerUpdate
)
from crud import (
    get_menu_item, get_menu_items, create_menu_item, update_menu_item, delete_menu_item,
    get_menu, get_menus, create_menu, update_menu, delete_menu, get_menu_items_by_menu,
    get_station, get_stations, create_station, update_station, delete_station,
    get_order, get_orders, create_order, get_order_items_by_station, 
    update_order_item_status, get_order_item,
    get_customer, get_customers, create_customer, update_customer, delete_customer, upsert_customer
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI instance
app = FastAPI(
    title="Kitchen Scheduler API",
    description="FastAPI consumer for kitchen scheduling system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with welcome message"""
    return {"message": "Welcome to Kitchen Scheduler API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "kitchen-scheduler-api"}

# Menu Item endpoints
@app.post("/menu-items/", response_model=MenuItem, status_code=status.HTTP_201_CREATED)
def create_menu_item_endpoint(menu_item: MenuItemCreate, db: Session = Depends(get_db)):
    """Create a new menu item"""
    menu_id = menu_item.dict().get('menu_id')  # Get menu_id from request body
    return create_menu_item(db=db, menu_item=menu_item, menu_id=menu_id)

@app.get("/menu-items/", response_model=List[MenuItem])
def read_menu_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all menu items"""
    menu_items = get_menu_items(db, skip=skip, limit=limit)
    return menu_items

@app.get("/menu-items/{menu_item_id}", response_model=MenuItem)
def read_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    """Get a specific menu item by ID"""
    menu_item = get_menu_item(db, menu_item_id=menu_item_id)
    if menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return menu_item

@app.put("/menu-items/{menu_item_id}", response_model=MenuItem)
def update_menu_item_endpoint(menu_item_id: int, menu_item: MenuItemUpdate, db: Session = Depends(get_db)):
    """Update a menu item"""
    updated_menu_item = update_menu_item(db, menu_item_id=menu_item_id, menu_item=menu_item)
    if updated_menu_item is None:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return updated_menu_item

@app.delete("/menu-items/{menu_item_id}")
def delete_menu_item_endpoint(menu_item_id: int, db: Session = Depends(get_db)):
    """Delete a menu item"""
    success = delete_menu_item(db, menu_item_id=menu_item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

# Menu endpoints
@app.post("/menus/", response_model=Menu, status_code=status.HTTP_201_CREATED)
def create_menu_endpoint(menu: MenuCreate, db: Session = Depends(get_db)):
    """Create a new menu"""
    return create_menu(db=db, menu=menu)

@app.get("/menus/", response_model=List[Menu])
def read_menus(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all menus"""
    menus = get_menus(db, skip=skip, limit=limit)
    return menus

@app.get("/menus/{menu_id}", response_model=Menu)
def read_menu(menu_id: int, db: Session = Depends(get_db)):
    """Get a specific menu by ID"""
    menu = get_menu(db, menu_id=menu_id)
    if menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu

@app.put("/menus/{menu_id}", response_model=Menu)
def update_menu_endpoint(menu_id: int, menu: MenuUpdate, db: Session = Depends(get_db)):
    """Update a menu"""
    updated_menu = update_menu(db, menu_id=menu_id, menu=menu)
    if updated_menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    return updated_menu

@app.delete("/menus/{menu_id}")
def delete_menu_endpoint(menu_id: int, db: Session = Depends(get_db)):
    """Delete a menu"""
    success = delete_menu(db, menu_id=menu_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu not found")
    return {"message": "Menu deleted successfully"}

@app.get("/menus/{menu_id}/menu-items/", response_model=List[MenuItem])
def read_menu_items_by_menu(menu_id: int, db: Session = Depends(get_db)):
    """Get all menu items for a specific menu"""
    menu_items = get_menu_items_by_menu(db, menu_id=menu_id)
    return menu_items

# Station endpoints
@app.post("/stations/", response_model=Station, status_code=status.HTTP_201_CREATED)
def create_station_endpoint(station: StationCreate, db: Session = Depends(get_db)):
    """Create a new station"""
    return create_station(db=db, station=station)

@app.get("/stations/", response_model=List[Station])
def read_stations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all stations"""
    stations = get_stations(db, skip=skip, limit=limit)
    return stations

@app.get("/stations/{station_id}", response_model=Station)
def read_station(station_id: int, db: Session = Depends(get_db)):
    """Get a specific station by ID"""
    station = get_station(db, station_id=station_id)
    if station is None:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@app.put("/stations/{station_id}", response_model=Station)
def update_station_endpoint(station_id: int, station: StationUpdate, db: Session = Depends(get_db)):
    """Update a station"""
    updated_station = update_station(db, station_id=station_id, station=station)
    if updated_station is None:
        raise HTTPException(status_code=404, detail="Station not found")
    return updated_station

@app.delete("/stations/{station_id}")
def delete_station_endpoint(station_id: int, db: Session = Depends(get_db)):
    """Delete a station and all associated menu items"""
    result = delete_station(db, station_id=station_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

# Order endpoints
@app.post("/orders/", response_model=Order, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order"""
    order_dict = create_order(db=db, order=order)
    # Populate menu_item details for each order item
    for item_dict in order_dict["order_items"]:
        menu_item = get_menu_item(db, item_dict["menu_item_id"])
        item_dict["menu_item"] = menu_item.dict() if menu_item else None
    return order_dict

@app.get("/orders/", response_model=List[Order])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all orders"""
    orders = get_orders(db, skip=skip, limit=limit)
    # Populate order items with menu item details
    result = []
    for order in orders:
        # Get customer info if exists
        customer_info = None
        if order.customer_id:
            customer = get_customer(db, order.customer_id)
            if customer:
                customer_info = {
                    "id": customer.id,
                    "email": customer.email,
                    "name": customer.name,
                    "phone_number": customer.phone_number,
                    "plan_type": customer.plan_type,
                    "paid": customer.paid
                }
        
        order_dict = {
            "id": order.id,
            "table_number": order.table_number,
            "order_type": order.order_type,
            "status": order.status,
            "customer_id": order.customer_id,
            "customer": customer_info,
            "is_out_of_plan": order.is_out_of_plan if hasattr(order, 'is_out_of_plan') else False,
            "created_at": order.created_at,
            "order_items": []
        }
        for item in order.order_items:
            menu_item = get_menu_item(db, item.menu_item_id)
            item_dict = {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "status": item.status,
                "is_out_of_plan": item.is_out_of_plan if hasattr(item, 'is_out_of_plan') else False,
                "created_at": item.created_at,
                "menu_item": menu_item.dict() if menu_item else None
            }
            order_dict["order_items"].append(item_dict)
        result.append(order_dict)
    return result

@app.get("/orders/{order_id}", response_model=Order)
def read_order(order_id: int, db: Session = Depends(get_db)):
    """Get a specific order by ID"""
    order = get_order(db, order_id=order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer info if exists
    customer_info = None
    if order.customer_id:
        customer = get_customer(db, order.customer_id)
        if customer:
            customer_info = {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "phone_number": customer.phone_number,
                "plan_type": customer.plan_type,
                "paid": customer.paid
            }
    
    # Populate order items with menu item details
    order_dict = {
        "id": order.id,
        "table_number": order.table_number,
        "order_type": order.order_type,
        "status": order.status,
        "customer_id": order.customer_id,
        "customer": customer_info,
        "is_out_of_plan": order.is_out_of_plan if hasattr(order, 'is_out_of_plan') else False,
        "created_at": order.created_at,
        "order_items": []
    }
    for item in order.order_items:
        menu_item = get_menu_item(db, item.menu_item_id)
        item_dict = {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_id": item.menu_item_id,
            "quantity": item.quantity,
            "status": item.status,
            "is_out_of_plan": item.is_out_of_plan if hasattr(item, 'is_out_of_plan') else False,
            "created_at": item.created_at,
            "menu_item": menu_item.dict() if menu_item else None
        }
        order_dict["order_items"].append(item_dict)
    return order_dict

# Kitchen staff endpoints - get order items by station
@app.get("/stations/{station_id}/order-items/")
def read_order_items_by_station(station_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get order items for a specific station, optionally filtered by status"""
    from sqlalchemy import text
    from database import DATABASE_URL
    
    order_items = get_order_items_by_station(db, station_id=station_id, status=status)
    
    # Check once if customer_id column exists (for efficiency)
    customer_column_exists = True
    try:
        if "sqlite" in DATABASE_URL.lower():
            pragma_result = db.execute(text("PRAGMA table_info(orders)"))
            columns = [row[1] for row in pragma_result.fetchall()]
            customer_column_exists = 'customer_id' in columns
        else:
            check_result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='orders' AND column_name='customer_id'
            """))
            customer_column_exists = check_result.fetchone() is not None
    except Exception:
        customer_column_exists = False
    
    # Populate with menu item and order details
    result = []
    for item in order_items:
        menu_item = get_menu_item(db, item.menu_item_id)
        order = get_order(db, item.order_id)
        
        # Get customer info if exists - query directly from orders table
        customer_info = None
        if order and customer_column_exists:
            # Query customer_id directly from orders table using raw SQL
            customer_id = None
            try:
                query_result = db.execute(
                    text("SELECT customer_id FROM orders WHERE id = :order_id"),
                    {"order_id": order.id}
                ).fetchone()
                if query_result and query_result[0] is not None:
                    customer_id = query_result[0]
            except Exception:
                customer_id = None
            
            if customer_id:
                try:
                    customer = get_customer(db, customer_id)
                    if customer:
                        customer_info = {
                            "id": customer.id,
                            "email": customer.email,
                            "name": customer.name,
                            "phone_number": customer.phone_number,
                            "plan_type": customer.plan_type,
                            "paid": customer.paid
                        }
                except Exception:
                    customer_info = None
        
        item_dict = {
            "id": item.id,
            "order_id": item.order_id,
            "menu_item_id": item.menu_item_id,
            "quantity": item.quantity,
            "status": item.status,
            "is_out_of_plan": item.is_out_of_plan if hasattr(item, 'is_out_of_plan') else False,
            "created_at": item.created_at,
            "menu_item": menu_item.dict() if menu_item else None,
            "order": {
                "id": order.id,
                "table_number": order.table_number,
                "order_type": order.order_type,
                "status": order.status,
                "is_out_of_plan": order.is_out_of_plan if hasattr(order, 'is_out_of_plan') else False,
                "created_at": order.created_at,
                "customer": customer_info
            } if order else None
        }
        result.append(item_dict)
    return result

@app.patch("/order-items/{order_item_id}/status", response_model=OrderItem)
def update_order_item_status_endpoint(order_item_id: int, status_update: OrderItemUpdate, db: Session = Depends(get_db)):
    """Update the status of an order item"""
    updated_item = update_order_item_status(db, order_item_id=order_item_id, status=status_update.status)
    if updated_item is None:
        raise HTTPException(status_code=404, detail="Order item not found")
    # Populate with menu item details
    menu_item = get_menu_item(db, updated_item.menu_item_id)
    order = get_order(db, updated_item.order_id)
    return {
        "id": updated_item.id,
        "order_id": updated_item.order_id,
        "menu_item_id": updated_item.menu_item_id,
        "quantity": updated_item.quantity,
        "status": updated_item.status,
        "is_out_of_plan": updated_item.is_out_of_plan if hasattr(updated_item, 'is_out_of_plan') else False,
        "created_at": updated_item.created_at,
        "menu_item": menu_item.dict() if menu_item else None,
        "order": {
            "id": order.id,
            "table_number": order.table_number,
            "order_type": order.order_type,
            "status": order.status,
            "is_out_of_plan": order.is_out_of_plan if hasattr(order, 'is_out_of_plan') else False,
            "created_at": order.created_at
        } if order else None
    }

# Customer endpoints
@app.post("/customers/", response_model=Customer, status_code=status.HTTP_201_CREATED)
def create_customer_endpoint(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer"""
    return create_customer(db=db, customer=customer)

@app.get("/customers/", response_model=List[Customer])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all customers"""
    customers = get_customers(db, skip=skip, limit=limit)
    return customers

@app.get("/customers/{customer_id}", response_model=Customer)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a specific customer"""
    customer = get_customer(db, customer_id=customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.put("/customers/{customer_id}", response_model=Customer)
def update_customer_endpoint(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db)):
    """Update a customer"""
    updated_customer = update_customer(db, customer_id=customer_id, customer=customer)
    if updated_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return updated_customer

@app.delete("/customers/{customer_id}")
def delete_customer_endpoint(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer"""
    success = delete_customer(db, customer_id=customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

@app.post("/customers/upsert", response_model=Customer, status_code=status.HTTP_200_OK)
def upsert_customer_endpoint(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create or update a customer based on email"""
    return upsert_customer(db=db, customer=customer)

# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)