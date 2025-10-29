from sqlalchemy.orm import Session
from typing import List, Optional
from repositories import MenuItemRepository, MenuRepository
from schemas import MenuItemCreate, MenuItemUpdate, MenuCreate, MenuUpdate, StationCreate, StationUpdate, OrderCreate, OrderItemUpdate
from db_models import StationDB, OrderDB, OrderItemDB, OrderItemStatus

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

def delete_station(db: Session, station_id: int) -> bool:
    db_station = get_station(db, station_id)
    if db_station:
        db.delete(db_station)
        db.commit()
        return True
    return False

# Order CRUD operations
def get_order(db: Session, order_id: int):
    return db.query(OrderDB).filter(OrderDB.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(OrderDB).offset(skip).limit(limit).all()

def create_order(db: Session, order: OrderCreate):
    db_order = OrderDB(
        table_number=order.table_number,
        order_type=order.order_type,
        status="pending"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Create order items
    order_items_list = []
    for item in order.order_items:
        db_order_item = OrderItemDB(
            order_id=db_order.id,
            menu_item_id=item["menu_item_id"],
            quantity=item.get("quantity", 1),
            status=OrderItemStatus.TODO
        )
        db.add(db_order_item)
        order_items_list.append(db_order_item)
    
    db.commit()
    
    # Refresh all order items to get IDs
    for item in order_items_list:
        db.refresh(item)
    
    db.refresh(db_order)
    
    # Return formatted response with order items
    return {
        "id": db_order.id,
        "table_number": db_order.table_number,
        "order_type": db_order.order_type,
        "status": db_order.status,
        "created_at": db_order.created_at,
        "order_items": [
            {
                "id": item.id,
                "order_id": item.order_id,
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "status": item.status,
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
        db_order_item.status = status
        db.commit()
        db.refresh(db_order_item)
    return db_order_item

def get_order_item(db: Session, order_item_id: int):
    return db.query(OrderItemDB).filter(OrderItemDB.id == order_item_id).first()
