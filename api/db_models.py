from database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum

# Simple enum for availability
class MenuAvailability(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    SOLD_OUT = "sold_out"

# Enum for order status
class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Enum for order item status (kanban states)
class OrderItemStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "inprogress"
    DONE = "done"

# Enum for order type
class OrderType(str, Enum):
    DINE_IN = "dine_in"
    PARCEL = "parcel"

# SQLAlchemy models - simple database representation
class StationDB(Base):
    """SQLAlchemy model for kitchen stations"""
    __tablename__ = "stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MenuItemDB(Base):
    """SQLAlchemy model for menu items"""
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    availability = Column(SQLEnum(MenuAvailability), default=MenuAvailability.AVAILABLE)
    prep_time = Column(Integer, nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    ingredients = Column(Text)  # JSON string
    instructions = Column(Text)
    image_url = Column(String(500))
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    menu_id = Column(Integer, ForeignKey("menus.id"), nullable=True)

class MenuDB(Base):
    """SQLAlchemy model for menus"""
    __tablename__ = "menus"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CustomerDB(Base):
    """SQLAlchemy model for customers"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    plan_type = Column(String(100), nullable=True)
    paid = Column(Integer, default=0)  # Amount paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OrderDB(Base):
    """SQLAlchemy model for orders"""
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(50), nullable=True)  # For dine-in
    order_type = Column(SQLEnum(OrderType), nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    is_out_of_plan = Column(Boolean, default=False)  # Marks if order exceeds customer's paid amount
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OrderItemDB(Base):
    """SQLAlchemy model for order items"""
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    status = Column(SQLEnum(OrderItemStatus), default=OrderItemStatus.TODO)
    is_out_of_plan = Column(Boolean, default=False)  # Marks if order item exceeds customer's paid amount
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Add relationships
StationDB.menu_items = relationship("MenuItemDB", back_populates="station", cascade="all, delete-orphan")
MenuItemDB.station = relationship("StationDB", back_populates="menu_items")
MenuItemDB.menu = relationship("MenuDB", back_populates="menu_items")
MenuDB.menu_items = relationship("MenuItemDB", back_populates="menu")
CustomerDB.orders = relationship("OrderDB", back_populates="customer")
OrderDB.customer = relationship("CustomerDB", back_populates="orders")
OrderDB.order_items = relationship("OrderItemDB", back_populates="order", cascade="all, delete-orphan")
OrderItemDB.order = relationship("OrderDB", back_populates="order_items")
OrderItemDB.menu_item = relationship("MenuItemDB")
