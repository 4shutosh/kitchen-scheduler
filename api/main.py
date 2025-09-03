from fastapi import FastAPI
import uvicorn

# Import from the scheduler package (our core business logic)
from models.menuitem import MenuItem, MenuAvailability

# Create FastAPI instance
app = FastAPI(
    title="Kitchen Scheduler API",
    description="FastAPI consumer for kitchen scheduling system",
    version="1.0.0"
)

# Demo API endpoints
@app.get("/")
async def root():
    """Root endpoint with welcome message"""
    return {"message": "Welcome to Kitchen Scheduler API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "kitchen-scheduler-api"}

@app.get("/models")
async def get_available_models():
    """Demo endpoint showing API consuming scheduler models"""
    return {
        "message": "API successfully consuming scheduler models",
        "available_models": ["MenuItem", "MenuAvailability"],
        "menu_availability_options": [status.value for status in MenuAvailability]
    }

# Run the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)