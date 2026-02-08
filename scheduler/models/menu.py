from models.menuitem import MenuItem
from datetime import datetime

class Menu(): 
    id: int
    menu_items: list[MenuItem]
    updated_at: datetime