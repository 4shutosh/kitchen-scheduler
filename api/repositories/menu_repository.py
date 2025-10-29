"""
Menu repository for database operations.
Converts between SQLAlchemy models and scheduler business models.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from .base_repository import BaseRepository
from .menu_item_repository import SchedulerMenuItem
from db_models import MenuDB
from datetime import datetime

from pydantic import BaseModel

class SchedulerMenu(BaseModel):
    """Scheduler Menu model - your business logic model"""
    id: int
    name: str
    description: Optional[str] = None
    menu_items: List[SchedulerMenuItem] = []
    updated_at: datetime

class MenuRepository(BaseRepository[MenuDB]):
    """Repository for menu operations"""
    
    def __init__(self, db: Session):
        super().__init__(db, MenuDB)
        self.menu_item_repo = None  # Will be set by dependency injection
    
    def set_menu_item_repository(self, menu_item_repo):
        """Set menu item repository for handling related items"""
        self.menu_item_repo = menu_item_repo
    
    def create_menu(self, name: str, description: str = None) -> SchedulerMenu:
        """Create a menu and return as scheduler model"""
        db_menu = self.create(name=name, description=description)
        return self._db_to_scheduler(db_menu)
    
    def get_menu(self, menu_id: int) -> Optional[SchedulerMenu]:
        """Get menu by ID with menu items as scheduler model"""
        db_menu = self.get_by_id(menu_id)
        return self._db_to_scheduler(db_menu) if db_menu else None
    
    def get_all_menus(self, skip: int = 0, limit: int = 100) -> List[SchedulerMenu]:
        """Get all menus as scheduler models"""
        db_menus = self.get_all(skip, limit)
        return [self._db_to_scheduler(menu) for menu in db_menus]
    
    def update_menu(self, menu_id: int, name: str = None, description: str = None) -> Optional[SchedulerMenu]:
        """Update menu and return as scheduler model"""
        kwargs = {}
        if name is not None:
            kwargs['name'] = name
        if description is not None:
            kwargs['description'] = description
        
        db_menu = self.update(menu_id, **kwargs)
        return self._db_to_scheduler(db_menu) if db_menu else None
    
    def delete_menu(self, menu_id: int) -> bool:
        """Delete menu"""
        return self.delete(menu_id)
    
    def _db_to_scheduler(self, db_menu: MenuDB) -> SchedulerMenu:
        """Convert database model to scheduler model"""
        # Get menu items if repository is available
        menu_items = []
        if self.menu_item_repo:
            menu_items = self.menu_item_repo.get_menu_items_by_menu(db_menu.id)
        
        return SchedulerMenu(
            id=db_menu.id,
            name=db_menu.name,
            description=db_menu.description,
            menu_items=menu_items,
            updated_at=db_menu.updated_at or db_menu.created_at
        )
