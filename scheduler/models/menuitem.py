from enum import Enum
from datetime import datetime

class MenuAvailability(Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    SOLD_OUT = "sold_out"

class MenuItem(): 
    id: int
    name: str
    availability: MenuAvailability
    prep_time: int
    category: str
    description: str
    price: float
    ingredients: list[str]
    created_at: datetime