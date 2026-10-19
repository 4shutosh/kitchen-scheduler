# Deployment Guide

Deploys the frontend and API to a VM behind nginx. The frontend is served as static files on a subdomain. The API runs locally on the VM (`127.0.0.1:8000`) and is not directly exposed to the internet — nginx proxies `/api/*` requests to it.

**Assumes:** Ubuntu/Debian VM, SSH access, subdomain DNS already pointing at the VM IP.

Replace `kitchen.yourdomain.com` and `user@VM_IP` throughout.

**SSH key:** All commands use the key at `~/Documents/SSH/ssh_do_vm1`. Define it as a shell variable once to avoid repeating it:

```bash
export VM_KEY=~/Documents/SSH/ssh_do_vm1
```

**Paths on the VM:**
- Frontend static files: `/var/www/kitchen-scheduler/frontend/` — under `/var/www/` so nginx can read it
- API source: `~/kitchen-scheduler/api/` — only accessed by the systemd service running as root

---

## Prerequisites

Add an **A record** in your DNS provider:

| Type | Name    | Value  |
|------|---------|--------|
| A    | kitchen | VM_IP  |

Verify propagation:
```bash
dig kitchen.yourdomain.com +short
# should return VM_IP
```

---

## First-Time Deployment

### 1. Build the frontend locally

```bash
cd frontend
VITE_API_URL=/api npm run build
```

This produces `frontend/dist/`.

### 2. Prepare the API locally

No compilation needed for Python. Just make sure the dependencies lock file is up to date:

```bash
cd api
uv sync
```

This updates `uv.lock` if anything changed. The actual install happens on the VM.

### 3. Create directories on the VM

```bash
ssh -i $VM_KEY user@VM_IP "mkdir -p /var/www/kitchen-scheduler/frontend ~/kitchen-scheduler/api"
```

### 4. Transfer files to the VM

Run from the project root:

```bash
# Frontend static build → /var/www/ so nginx can read it
rsync -avz -e "ssh -i $VM_KEY" frontend/dist/ user@VM_IP:/var/www/kitchen-scheduler/frontend/

# API source (exclude local venv and cache)
rsync -avz -e "ssh -i $VM_KEY" --exclude '__pycache__' --exclude '.venv' --exclude '*.pyc' --exclude 'kitchen_scheduler.db' \
  api/ user@VM_IP:~/kitchen-scheduler/api/
```

Note: `kitchen_scheduler.db` is excluded — it lives only on the VM after first run.

### 5. On the VM: install system dependencies

```bash
ssh -i $VM_KEY user@VM_IP

sudo apt update && sudo apt install -y nginx

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env   # or re-login
```

### 6. Install API Python dependencies

```bash
cd ~/kitchen-scheduler/api
uv sync
```

### 7. Initialize the database

The database is created automatically when the API starts for the first time — SQLAlchemy runs `create_all()` on startup and creates the SQLite file with all tables. No manual step is needed for a fresh setup.

To verify after starting the service (Step 9):
```bash
ls ~/kitchen-scheduler/api/kitchen_scheduler.db
# file should exist after the service starts
```

### 8. Add nginx config for the subdomain

Create `/etc/nginx/sites-available/kitchen-scheduler`:

```bash
sudo nano /etc/nginx/sites-available/kitchen-scheduler
```

```nginx
server {
    listen 80;
    server_name kitchen.yourdomain.com;

    location / {
        root /var/www/kitchen-scheduler/frontend;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it without touching the existing site config:

```bash
sudo ln -s /etc/nginx/sites-available/kitchen-scheduler /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 9. Create the API systemd service

```bash
sudo nano /etc/systemd/system/kitchen-api.service
```

```ini
[Unit]
Description=Kitchen Scheduler API
After=network.target

[Service]
WorkingDirectory=/root/kitchen-scheduler/api
ExecStart=/root/.local/bin/uv run uvicorn main:app --host 127.0.0.1 --port 8000
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
```

> If your SSH user is not root, replace `/root/.local/bin/uv` with the output of `which uv` and set `User=your_username` and `WorkingDirectory=/home/your_username/kitchen-scheduler/api`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kitchen-api
sudo systemctl status kitchen-api   # should show active (running)
```

### 10. Verify

```bash
curl http://kitchen.yourdomain.com/api/health
# {"status":"healthy","service":"kitchen-scheduler-api"}
```

Open `http://kitchen.yourdomain.com` in a browser. The frontend should load and API calls should work.

### 11. Enable HTTPS (recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kitchen.yourdomain.com
```

Certbot updates the nginx config automatically and sets up HTTP → HTTPS redirect.

---

## Redeployment (data already exists on VM)

The SQLite database lives at `~/kitchen-scheduler/api/kitchen_scheduler.db` on the VM. The rsync command excludes it, so existing data is never overwritten.

### Frontend change only

```bash
# Build locally
cd frontend
VITE_API_URL=/api npm run build

# Deploy — nginx picks up new files immediately, no restart needed
rsync -avz -e "ssh -i $VM_KEY" frontend/dist/ user@VM_IP:/var/www/kitchen-scheduler/frontend/
```

### API change only

```bash
rsync -avz -e "ssh -i $VM_KEY" --exclude '__pycache__' --exclude '.venv' --exclude '*.pyc' --exclude 'kitchen_scheduler.db' \
  api/ user@VM_IP:~/kitchen-scheduler/api/

ssh -i $VM_KEY user@VM_IP "sudo systemctl restart kitchen-api"
```

### Both changed

Run both blocks above in sequence.

### After a schema change (new columns added)

Run the migration script on the VM after syncing API files and before restarting the service:

```bash
ssh -i $VM_KEY user@VM_IP "cd ~/kitchen-scheduler/api && uv run python migrate_db.py"
ssh -i $VM_KEY user@VM_IP "sudo systemctl restart kitchen-api"
```

---

## Useful commands on the VM

```bash
# Check API service status
sudo systemctl status kitchen-api

# Tail API logs
sudo journalctl -u kitchen-api -f

# Restart API
sudo systemctl restart kitchen-api

# Test nginx config
sudo nginx -t

# Reload nginx (no downtime)
sudo systemctl reload nginx
```
