"""
Menu item repository for database operations.
Converts between SQLAlchemy models and scheduler business models.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from .base_repository import BaseRepository
from db_models import MenuItemDB
import json
from datetime import datetime

# Import scheduler models (in practice, these would come from your scheduler package)
class MenuAvailability:
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    SOLD_OUT = "sold_out"

from pydantic import BaseModel

class SchedulerMenuItem(BaseModel):
    """Scheduler MenuItem model - your business logic model"""
    id: int
    name: str
    availability: str
    prep_time: int
    category: str
    description: str
    price: float
    ingredients: List[str]
    instructions: str
    image_url: str
    station_id: Optional[int] = None
    menu_id: Optional[int] = None
    created_at: datetime

class MenuItemRepository(BaseRepository[MenuItemDB]):
    """Repository for menu item operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, MenuItemDB)
    
    def create_menu_item(self, name: str, availability: str, prep_time: int, 
                        category: str, description: str, price: float, 
                        ingredients: List[str], instructions: str, 
                        image_url: str, menu_id: Optional[int] = None, 
                        station_id: Optional[int] = None) -> SchedulerMenuItem:
        """Create a menu item and return as scheduler model"""
        db_item = self.create(
            name=name,
            availability=availability,
            prep_time=prep_time,
            category=category,
            description=description,
            price=price,
            ingredients=json.dumps(ingredients) if ingredients else None,
            instructions=instructions,
            image_url=image_url,
            menu_id=menu_id,
            station_id=station_id
        )
        return self._db_to_scheduler(db_item)
    
    def get_menu_item(self, item_id: int) -> Optional[SchedulerMenuItem]:
        """Get menu item by ID as scheduler model"""
        db_item = self.get_by_id(item_id)
        return self._db_to_scheduler(db_item) if db_item else None
    
    def get_all_menu_items(self, skip: int = 0, limit: int = 100) -> List[SchedulerMenuItem]:
        """Get all menu items as scheduler models"""
        db_items = self.get_all(skip, limit)
        return [self._db_to_scheduler(item) for item in db_items]
    
    def update_menu_item(self, item_id: int, **kwargs) -> Optional[SchedulerMenuItem]:
        """Update menu item and return as scheduler model"""
        # Handle ingredients conversion
        if 'ingredients' in kwargs and isinstance(kwargs['ingredients'], list):
            kwargs['ingredients'] = json.dumps(kwargs['ingredients'])
        
        db_item = self.update(item_id, **kwargs)
        return self._db_to_scheduler(db_item) if db_item else None
    
    def delete_menu_item(self, item_id: int) -> bool:
        """Delete menu item"""
        return self.delete(item_id)
    
    def get_menu_items_by_menu(self, menu_id: int) -> List[SchedulerMenuItem]:
        """Get menu items by menu ID"""
        db_items = self.db.query(MenuItemDB).filter(MenuItemDB.menu_id == menu_id).all()
        return [self._db_to_scheduler(item) for item in db_items]
    
    def _db_to_scheduler(self, db_item: MenuItemDB) -> SchedulerMenuItem:
        """Convert database model to scheduler model"""
        return SchedulerMenuItem(
            id=db_item.id,
            name=db_item.name,
            availability=db_item.availability,
            prep_time=db_item.prep_time,
            category=db_item.category,
            description=db_item.description or "",
            price=db_item.price,
            ingredients=json.loads(db_item.ingredients) if db_item.ingredients else [],
            instructions=db_item.instructions or "",
            image_url=db_item.image_url or "",
            station_id=db_item.station_id,
            menu_id=db_item.menu_id,
            created_at=db_item.created_at
        )
