# kitchen-scheduler

### Problem
At any given moment in a busy restaurant, a critical question arises: what should the kitchen cook next?
This decision is typically made by the Head Chef or Sous Chef, who must juggle dozens of orders, multiple stations, and limited staff. The aim of this project is to support and enhance that decision-making, making the kitchen run more smoothly and efficiently.
This decision is important because it impacts the business directly by affecting: the wait time for the people on a table and for a table, resource optimisation in the kitchen, satisfaction of the guests, and the sentiment of all the people involved across.


### Goal
Create a software system which helps make you decide better, and improve on:
- minimize guest wait (time from order to table served)
- fairness: minimize per-table max wait & spread across tables/courses
- maximize throughput/utilization (reduce idle/clean changeovers)
- quality constraints: deliver a table’s course within a small window (e.g., ±2 min)


## Project layout
- `api/` — FastAPI backend (SQLite by default, `DATABASE_URL` for Postgres)
- `frontend/` — React + Vite web dashboard
- `scheduler/` — scheduling core

## Running locally
Requires Python 3.9+, [uv](https://docs.astral.sh/uv/) and Node.js.

```bash
# API → http://localhost:8000 (docs at /docs)
cd api && uv sync && uv run python main.py

# Frontend → http://localhost:5173
cd frontend && npm install && npm run dev   # or `npm run dev:network` for LAN access
```

Tests: `cd api && uv run pytest` and `cd frontend && npm test`.

### API environment variables
| Variable | Purpose | Default |
|---|---|---|
| `APP_USERNAME` / `APP_PASSWORD` | Dashboard login | dev-only fallback in `main.py` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` |
| `DATABASE_URL` | SQLAlchemy URL | `sqlite:///./kitchen_scheduler.db` |

The frontend calls `VITE_API_URL` (set at build time), falling back to `http://localhost:8000`.

## Customer CSV import
The Customers page imports CSV or TSV exports of the booking sheet. Only rows whose payment column starts with "Paid" are imported, and the amount after `₹` becomes `paid`. Two layouts are recognised from the headers:

- **Tickets/Savoury:** `Name, Email, Phone, Tickets: N, Savoury: N, Payment Status` — `plan_type` becomes e.g. `2 × Ticket, 1 × Savoury`
- **Original:** `Full Name, Email, Mobile Number, Quantity: N, Ticket, Payment` — `plan_type` is the Ticket text

Other columns are ignored. Paid rows with nothing ordered are reported as skipped.

## Deployment
- **Frontend:** Cloudflare Pages project `kitchen-scheduler`, served at `kitchen.andkuchen.com`.
  ```bash
  cd frontend
  VITE_API_URL=https://kitchen-api.andkuchen.com npm run build
  npx wrangler pages deploy dist --project-name kitchen-scheduler --branch main
  ```
- **API:** VM at `kitchen-api.andkuchen.com` — nginx (Let's Encrypt) proxies to uvicorn on `127.0.0.1:8000`, run by the `kitchen-api` systemd service. Code lives in `/root/kitchen-scheduler/api`, env vars in `/etc/kitchen-api.env`.
  ```bash
  rsync -az --exclude '__pycache__' --exclude '.venv' --exclude '*.db' --exclude 'node_modules' \
    api/ root@<VM>:/root/kitchen-scheduler/api/
  ssh root@<VM> "cd /root/kitchen-scheduler/api && ~/.local/bin/uv sync --no-dev && systemctl restart kitchen-api"
  ```
  The SQLite database lives only on the VM; never sync it over. New tables are created on startup, but new columns on existing tables need a manual `ALTER TABLE` (back up the `.db` first).
