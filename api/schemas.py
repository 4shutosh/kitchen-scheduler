from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Import scheduler models from repositories
from repositories.menu_item_repository import SchedulerMenuItem, MenuAvailability
from repositories.menu_repository import SchedulerMenu

# Station Schemas
class StationCreate(BaseModel):
    name: str
    description: Optional[str] = None

class StationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Station(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Menu Item Schemas - using scheduler models as base
class MenuItemCreate(BaseModel):
    name: str
    station_id: Optional[int] = None
    availability: str = MenuAvailability.AVAILABLE
    prep_time: int = 0
    category: str = ""
    description: Optional[str] = None
    price: float = 0.0
    ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    menu_id: Optional[int] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    availability: Optional[str] = None
    prep_time: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    ingredients: Optional[List[str]] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    station_id: Optional[int] = None

# Menu Schemas
class MenuCreate(BaseModel):
    name: str
    description: Optional[str] = None

class MenuUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Order Schemas
class OrderCreate(BaseModel):
    table_number: Optional[str] = None
    order_type: str  # "dine_in" or "parcel"
    order_items: List[dict]  # [{"menu_item_id": int, "quantity": int}]

class OrderItem(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    status: str  # "todo", "inprogress", "done"
    created_at: datetime
    menu_item: Optional[dict] = None  # Will be populated with menu item details
    
    class Config:
        from_attributes = True

class Order(BaseModel):
    id: int
    table_number: Optional[str] = None
    order_type: str
    status: str
    created_at: datetime
    order_items: List[OrderItem] = []
    
    class Config:
        from_attributes = True

class OrderItemUpdate(BaseModel):
    status: str  # "todo", "inprogress", "done"

# Use the scheduler models directly for responses
MenuItem = SchedulerMenuItem
Menu = SchedulerMenu
