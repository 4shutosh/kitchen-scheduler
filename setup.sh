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
cd api
uv sync

echo "Setup complete!"
echo ""
echo "To start the API server:"
echo "cd api && python main.py"
echo ""
echo "The API will be available at: http://localhost:8000"
echo "API documentation at: http://localhost:8000/docs"
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

