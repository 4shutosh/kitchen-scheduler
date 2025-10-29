# Running on Local Network

To access the application from other devices on your local network:

## Quick Setup

### 1. Backend (API Server)

The backend is already configured to accept connections from any IP address (`0.0.0.0`).

**Start the backend:**

```bash
cd api
uv run python main.py
```

The backend will be available at:

- **Local machine**: `http://localhost:8000`
- **Other devices**: `http://YOUR_IP_ADDRESS:8000` (e.g., `http://192.168.0.2:8000`)

### 2. Frontend (Web App)

**Start the frontend with network access:**

```bash
cd frontend
npm run dev -- --host
```

Vite will output something like:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.0.2:5173/
```

### 3. Access from Other Devices

1. **Find your machine's IP address:**

   ```bash
   # macOS/Linux
   ipconfig getifaddr en0
   # or
   hostname -I

   # Windows
   ipconfig
   # Look for IPv4 Address
   ```

2. **From other devices on the same network:**

   - Open browser and go to: `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.0.2:5173`

3. **The frontend will automatically detect the network IP** and configure the API to use it!

## How It Works

The frontend automatically detects when it's being accessed via a network IP (not localhost) and configures the API calls to use that same IP address for the backend connection.

**Automatic Detection:**

- If accessed via `http://localhost:5173` → API uses `http://localhost:8000`
- If accessed via `http://192.168.0.2:5173` → API uses `http://192.168.0.2:8000`

## Manual Configuration (Optional)

If you need to manually set the API URL, create a `.env` file in the `frontend` directory:

```bash
# frontend/.env
VITE_API_URL=http://192.168.0.2:8000
```

Then restart the frontend server.

## Troubleshooting

### Backend not accessible from network?

1. **Check firewall settings:**

   - macOS: System Preferences → Security & Privacy → Firewall
   - Allow Python/Terminal to accept incoming connections

2. **Verify backend is binding to all interfaces:**

   ```bash
   # Should see: INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

3. **Test backend from another device:**
   ```bash
   # From another device on the network
   curl http://YOUR_IP_ADDRESS:8000/health
   ```

### Frontend shows CORS errors?

The backend CORS is already configured to allow all origins (`allow_origins=["*"]`). If you see CORS errors:

- Make sure the backend is running
- Check that the API URL is correct
- Verify both frontend and backend are accessible on the network

### Port 8000 blocked?

If port 8000 is blocked, you can change it:

1. Update `api/main.py` line 289: `uvicorn.run(app, host="0.0.0.0", port=8001)`
2. Update frontend API base URL to use port 8001
3. Or use environment variable: `VITE_API_URL=http://YOUR_IP:8001`

## Security Note

⚠️ **For Development Only**: This setup allows connections from any device on your local network. For production:

- Use proper authentication
- Restrict CORS to specific origins
- Use HTTPS
- Configure firewall rules appropriately
