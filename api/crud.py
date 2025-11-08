from sqlalchemy.orm import Session
from typing import List, Optional
from repositories import MenuItemRepository, MenuRepository
from schemas import MenuItemCreate, MenuItemUpdate, MenuCreate, MenuUpdate, StationCreate, StationUpdate, OrderCreate, OrderItemUpdate, CustomerCreate, CustomerUpdate
from db_models import StationDB, OrderDB, OrderItemDB, OrderItemStatus, CustomerDB, MenuItemDB

# Menu Item CRUD operations using repositories
def get_menu_item(db: Session, menu_item_id: int):
    repo = MenuItemRepository(db)
    return repo.get_menu_item(menu_item_id)

def get_menu_items(db: Session, skip: int = 0, limit: int = 100):
    repo = MenuItemRepository(db)
    return repo.get_all_menu_items(skip, limit)

def create_menu_item(db: Session, menu_item: MenuItemCreate, menu_id: Optional[int] = None):
    repo = MenuItemRepository(db)
    # Use menu_id from menu_item if provided, otherwise use parameter
    effective_menu_id = menu_item.menu_id if hasattr(menu_item, 'menu_id') and menu_item.menu_id else menu_id
    return repo.create_menu_item(
        name=menu_item.name,
        availability=menu_item.availability,
        prep_time=menu_item.prep_time,
        category=menu_item.category,
        description=menu_item.description or "",
        price=menu_item.price,
        ingredients=menu_item.ingredients or [],
        instructions=menu_item.instructions or "",
        image_url=menu_item.image_url or "",
        menu_id=effective_menu_id,
        station_id=menu_item.station_id
    )

def update_menu_item(db: Session, menu_item_id: int, menu_item: MenuItemUpdate):
    repo = MenuItemRepository(db)
    update_data = menu_item.dict(exclude_unset=True)
    return repo.update_menu_item(menu_item_id, **update_data)

def delete_menu_item(db: Session, menu_item_id: int) -> bool:
    repo = MenuItemRepository(db)
    return repo.delete_menu_item(menu_item_id)

# Menu CRUD operations using repositories
def get_menu(db: Session, menu_id: int):
    repo = MenuRepository(db)
    return repo.get_menu(menu_id)

def get_menus(db: Session, skip: int = 0, limit: int = 100):
    repo = MenuRepository(db)
    return repo.get_all_menus(skip, limit)

def create_menu(db: Session, menu: MenuCreate):
    repo = MenuRepository(db)
    return repo.create_menu(menu.name, menu.description)

def update_menu(db: Session, menu_id: int, menu: MenuUpdate):
    repo = MenuRepository(db)
    update_data = menu.dict(exclude_unset=True)
    return repo.update_menu(menu_id, **update_data)

def delete_menu(db: Session, menu_id: int) -> bool:
    repo = MenuRepository(db)
    return repo.delete_menu(menu_id)

def get_menu_items_by_menu(db: Session, menu_id: int):
    repo = MenuItemRepository(db)
    return repo.get_menu_items_by_menu(menu_id)

# Station CRUD operations
def get_station(db: Session, station_id: int):
    return db.query(StationDB).filter(StationDB.id == station_id).first()

def get_stations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(StationDB).offset(skip).limit(limit).all()

def create_station(db: Session, station: StationCreate):
    db_station = StationDB(name=station.name, description=station.description)
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station

def update_station(db: Session, station_id: int, station: StationUpdate):
    db_station = get_station(db, station_id)
    if db_station:
        update_data = station.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_station, key, value)
        db.commit()
        db.refresh(db_station)
    return db_station

def delete_station(db: Session, station_id: int) -> dict:
    """Delete station and return info about associated menu items"""
    db_station = get_station(db, station_id)
    if not db_station:
        return {"success": False, "message": "Station not found", "menu_items_count": 0}
    
    # Count associated menu items
    menu_items_count = db.query(MenuItemDB).filter(MenuItemDB.station_id == station_id).count()
    
    # Delete station (cascade will delete menu items)
    db.delete(db_station)
    db.commit()
    
    return {
        "success": True, 
        "message": f"Station deleted along with {menu_items_count} associated menu item(s)",
        "menu_items_count": menu_items_count
    }

# Order CRUD operations
def get_order(db: Session, order_id: int):
    return db.query(OrderDB).filter(OrderDB.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(OrderDB).offset(skip).limit(limit).all()

def create_order(db: Session, order: OrderCreate):
    from sqlalchemy import text
    from database import DATABASE_URL
    
    # Get customer to check paid amount (for reference, not auto-detection)
    customer = get_customer(db, order.customer_id)
    
    # Calculate menu item prices for order items
    menu_item_prices = {}
    for item in order.order_items:
        menu_item = get_menu_item(db, item["menu_item_id"])
        if menu_item:
            menu_item_prices[item["menu_item_id"]] = menu_item.price
    
    # Use only the explicit is_out_of_plan flag from the request (checkbox value)
    # No automatic detection - user must manually mark it
    is_out_of_plan = order.is_out_of_plan if order.is_out_of_plan is not None else False
    
    # Check if customer_id column exists, if not, create order without it first
    # then add the column and update if needed
    try:
        # Try to create order with customer_id and is_out_of_plan
        db_order = OrderDB(
            table_number=order.table_number,
            order_type=order.order_type,
            customer_id=order.customer_id,
            status="pending",
            is_out_of_plan=is_out_of_plan
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
    except Exception as e:
        # If customer_id or is_out_of_plan column doesn't exist, add it first
        if "customer_id" in str(e).lower() or "is_out_of_plan" in str(e).lower() or "no such column" in str(e).lower():
            db.rollback()
            # Add columns if they don't exist
            try:
                if "sqlite" in DATABASE_URL.lower():
                    result = db.execute(text("PRAGMA table_info(orders)"))
                    columns = [row[1] for row in result.fetchall()]
                    if 'customer_id' not in columns:
                        db.execute(text("ALTER TABLE orders ADD COLUMN customer_id INTEGER"))
                        db.commit()
                    if 'is_out_of_plan' not in columns:
                        db.execute(text("ALTER TABLE orders ADD COLUMN is_out_of_plan BOOLEAN DEFAULT 0"))
                        db.commit()
                else:
                    # PostgreSQL
                    result = db.execute(text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name='orders' AND column_name IN ('customer_id', 'is_out_of_plan')
                    """))
                    existing_columns = [row[0] for row in result.fetchall()]
                    if 'customer_id' not in existing_columns:
                        db.execute(text("ALTER TABLE orders ADD COLUMN customer_id INTEGER"))
                        db.commit()
                    if 'is_out_of_plan' not in existing_columns:
                        db.execute(text("ALTER TABLE orders ADD COLUMN is_out_of_plan BOOLEAN DEFAULT FALSE"))
                        db.commit()
            except Exception:
                db.rollback()
            
            # Now create the order
            db_order = OrderDB(
                table_number=order.table_number,
                order_type=order.order_type,
                customer_id=order.customer_id,
                status="pending",
                is_out_of_plan=is_out_of_plan
            )
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
        else:
            raise
    
    # Create order items with is_out_of_plan flag
    order_items_list = []
    for item in order.order_items:
        menu_item_id = item["menu_item_id"]
        quantity = item.get("quantity", 1)
        
        # Calculate if this specific item makes the order exceed the paid amount
        # We'll mark items as out of plan if the cumulative total exceeds paid amount
        item_price = menu_item_prices.get(menu_item_id, 0)
        item_value = item_price * quantity
        
        # For simplicity, mark item as out of plan if order is out of plan
        # In a more sophisticated implementation, you could track which specific items exceed the limit
        item_is_out_of_plan = is_out_of_plan
        
        try:
            db_order_item = OrderItemDB(
                order_id=db_order.id,
                menu_item_id=menu_item_id,
                quantity=quantity,
                status=OrderItemStatus.TODO,
                is_out_of_plan=item_is_out_of_plan
            )
            db.add(db_order_item)
            order_items_list.append(db_order_item)
        except Exception as e:
            # If is_out_of_plan column doesn't exist, add it first
            if "is_out_of_plan" in str(e).lower() or "no such column" in str(e).lower():
                db.rollback()
                try:
                    if "sqlite" in DATABASE_URL.lower():
                        result = db.execute(text("PRAGMA table_info(order_items)"))
                        columns = [row[1] for row in result.fetchall()]
                        if 'is_out_of_plan' not in columns:
                            db.execute(text("ALTER TABLE order_items ADD COLUMN is_out_of_plan BOOLEAN DEFAULT 0"))
                            db.commit()
                    else:
                        # PostgreSQL
                        result = db.execute(text("""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name='order_items' AND column_name='is_out_of_plan'
                        """))
                        if not result.fetchone():
                            db.execute(text("ALTER TABLE order_items ADD COLUMN is_out_of_plan BOOLEAN DEFAULT FALSE"))
                            db.commit()
                except Exception:
                    db.rollback()
                
                # Now create the order item
                db_order_item = OrderItemDB(
                    order_id=db_order.id,
                    menu_item_id=menu_item_id,
                    quantity=quantity,
                    status=OrderItemStatus.TODO,
                    is_out_of_plan=item_is_out_of_plan
                )
                db.add(db_order_item)
                order_items_list.append(db_order_item)
            else:
                raise
    
    db.commit()
    
    # Refresh all order items to get IDs
    for item in order_items_list:
        db.refresh(item)
    
    db.refresh(db_order)
    
    # Get customer info if exists
    customer_info = None
    if db_order.customer_id:
        customer = get_customer(db, db_order.customer_id)
        if customer:
            customer_info = {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "phone_number": customer.phone_number,
                "plan_type": customer.plan_type,
                "paid": customer.paid
            }
    
    # Return formatted response with order items
    return {
        "id": db_order.id,
        "table_number": db_order.table_number,
        "order_type": db_order.order_type,
        "status": db_order.status,
        "customer_id": db_order.customer_id,
        "customer": customer_info,
        "is_out_of_plan": db_order.is_out_of_plan if hasattr(db_order, 'is_out_of_plan') else False,
        "created_at": db_order.created_at,
        "order_items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "status": item.status,
                "is_out_of_plan": item.is_out_of_plan if hasattr(item, 'is_out_of_plan') else False,
                "created_at": item.created_at,
            }
            for item in order_items_list
        ]
    }

def get_order_items_by_station(db: Session, station_id: int, status: Optional[str] = None):
    from db_models import MenuItemDB
    query = db.query(OrderItemDB).join(MenuItemDB, OrderItemDB.menu_item_id == MenuItemDB.id).filter(
        MenuItemDB.station_id == station_id
    )
    if status:
        query = query.filter(OrderItemDB.status == status)
    return query.all()

def update_order_item_status(db: Session, order_item_id: int, status: str):
    db_order_item = db.query(OrderItemDB).filter(OrderItemDB.id == order_item_id).first()
    if db_order_item:
        # Convert string status to enum if needed
        if isinstance(status, str):
            status_map = {
                "todo": OrderItemStatus.TODO,
                "inprogress": OrderItemStatus.IN_PROGRESS,
                "done": OrderItemStatus.DONE
            }
            db_order_item.status = status_map.get(status.lower(), status)
        else:
            db_order_item.status = status
        db.commit()
        db.refresh(db_order_item)
        
        # Check if all order items for this order are done
        order_id = db_order_item.order_id
        
        # Get the order and use relationship to access order items
        db_order = db.query(OrderDB).filter(OrderDB.id == order_id).first()
        if db_order:
            # Refresh the order to ensure relationship is loaded
            db.refresh(db_order)
            
            # Get all order items for this order
            all_order_items = db.query(OrderItemDB).filter(OrderItemDB.order_id == order_id).all()
            
            if all_order_items:
                # Debug: Print statuses for debugging
                print(f"DEBUG: Order {order_id} - Order items statuses:")
                for item in all_order_items:
                    print(f"  Item {item.id}: status={item.status}, type={type(item.status)}")
                
                # Compare using string values to ensure proper comparison
                # Handle both enum and string types
                item_statuses = []
                for item in all_order_items:
                    if hasattr(item.status, 'value'):
                        item_statuses.append(item.status.value)
                    else:
                        item_statuses.append(str(item.status))
                
                print(f"DEBUG: Status strings: {item_statuses}")
                
                all_done = all(status == "done" for status in item_statuses)
                any_in_progress = any(status == "inprogress" for status in item_statuses)
                
                print(f"DEBUG: all_done={all_done}, any_in_progress={any_in_progress}")
                
                # Update order status based on item statuses
                if all_done:
                    db_order.status = "completed"
                    print(f"DEBUG: Setting order {order_id} status to 'completed'")
                elif any_in_progress:
                    db_order.status = "in_progress"
                    print(f"DEBUG: Setting order {order_id} status to 'in_progress'")
                else:
                    db_order.status = "pending"
                    print(f"DEBUG: Setting order {order_id} status to 'pending'")
                
                db.commit()
                db.refresh(db_order)
                print(f"DEBUG: Order {order_id} status after update: {db_order.status}")
    
    return db_order_item

def get_order_item(db: Session, order_item_id: int):
    return db.query(OrderItemDB).filter(OrderItemDB.id == order_item_id).first()

# Customer CRUD operations
def get_customer(db: Session, customer_id: int):
    return db.query(CustomerDB).filter(CustomerDB.id == customer_id).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(CustomerDB).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate):
    db_customer = CustomerDB(
        email=customer.email,
        name=customer.name,
        phone_number=customer.phone_number,
        plan_type=customer.plan_type,
        paid=customer.paid
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, customer: CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        update_data = customer.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_customer, key, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int) -> bool:
    from sqlalchemy import text
    from database import DATABASE_URL
    
    db_customer = get_customer(db, customer_id)
    if db_customer:
        # In development: delete associated orders first using raw SQL to avoid ORM relationship issues
        try:
            # Check if customer_id column exists using raw SQL
            if "sqlite" in DATABASE_URL.lower():
                # Check if column exists
                result = db.execute(text("PRAGMA table_info(orders)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'customer_id' in columns:
                    # Column exists, delete orders using raw SQL
                    db.execute(text("DELETE FROM orders WHERE customer_id = :customer_id"), 
                              {"customer_id": customer_id})
                    db.commit()
            else:
                # PostgreSQL: check and delete
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='orders' AND column_name='customer_id'
                """))
                if result.fetchone():
                    db.execute(text("DELETE FROM orders WHERE customer_id = :customer_id"), 
                              {"customer_id": customer_id})
                    db.commit()
        except Exception as e:
            # If column doesn't exist or any error, just continue with customer deletion
            db.rollback()
        
        # Delete the customer using raw SQL to avoid relationship loading issues
        try:
            db.execute(text("DELETE FROM customers WHERE id = :customer_id"), 
                      {"customer_id": customer_id})
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False
    return False

def upsert_customer(db: Session, customer: CustomerCreate):
    """Create or update customer based on email"""
    # Check if customer with this email already exists
    existing = db.query(CustomerDB).filter(CustomerDB.email == customer.email).first()
    
    if existing:
        # Update existing customer
        existing.name = customer.name
        existing.phone_number = customer.phone_number
        existing.plan_type = customer.plan_type
        existing.paid = customer.paid
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new customer
        db_customer = CustomerDB(
            email=customer.email,
            name=customer.name,
            phone_number=customer.phone_number,
            plan_type=customer.plan_type,
            paid=customer.paid
        )
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
