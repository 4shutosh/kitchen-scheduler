#!/bin/bash

echo "Setting up Kitchen Scheduler API..."

# Check if Docker is available and user wants PostgreSQL
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Docker is available. Starting PostgreSQL database..."
    docker-compose up -d postgres
    echo "Waiting for PostgreSQL to be ready..."
    sleep 10
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/kitchen_scheduler"
    echo "Using PostgreSQL database"
else
    echo "Docker not available or not running. Using SQLite database (default)"
    echo "To use PostgreSQL later, install Docker and run: docker-compose up -d postgres"
    export DATABASE_URL="sqlite:///./kitchen_scheduler.db"
fi

# Install Python dependencies
echo "Installing Python dependencies..."

# First, install the scheduler package (local dependency)
echo "Installing scheduler package..."
cd scheduler
# Get the absolute path to scheduler directory
SCHEDULER_PATH=$(pwd)
# Install scheduler package in editable mode
uv pip install -e "$SCHEDULER_PATH"
cd ..

# Then install API dependencies
echo "Installing API dependencies..."
cd api
uv sync

echo "Setup complete!"
echo ""

# Detect local IP address for network access
LOCAL_IP=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="YOUR_LOCAL_IP"
fi

echo "To start the API server:"
echo "cd api && python main.py"
echo ""
echo "The API will be available at:"
echo "  - Local: http://localhost:8000"
echo "  - Network: http://${LOCAL_IP}:8000"
echo ""
echo "API documentation at: http://localhost:8000/docs"
echo ""
echo "Note: The server is configured to bind to 0.0.0.0, making it accessible"
echo "      from all machines on your local network."
if [ "$LOCAL_IP" != "YOUR_LOCAL_IP" ]; then
    echo "      Other devices can access it at: http://${LOCAL_IP}:8000"
else
    echo "      Find your local IP with: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
fi
echo ""
if [[ "$DATABASE_URL" == *"postgresql"* ]]; then
    echo "Database connection (PostgreSQL):"
    echo "Host: localhost"
    echo "Port: 5432"
    echo "Database: kitchen_scheduler"
    echo "Username: postgres"
    echo "Password: password"
else
    echo "Database: SQLite (kitchen_scheduler.db file)"
fi

