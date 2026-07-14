# Uptime Monitor

A lightweight full-stack uptime monitor. Register URLs, and a background scheduler pings each
one every ~60 seconds, recording HTTP status code, response time, and timestamp for every check.
A React dashboard polls the API and shows live up/down status.

```
/backend    Django API, and the APScheduler-based pinger/scheduler
/frontend   React + Vite dashboard (table of monitored URLs + add-URL form)
docker-compose.yml   Orchestrates mysql + backend + frontend
```

See [AI_LOG.md](./AI_LOG.md) for the AI collaboration log.

## 1-Line Setup

```bash
docker compose up --build
```

Then open **http://localhost:3000**.

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- MySQL: localhost:3306 (user/pass/db default to `uptime`)

To customize the check interval or DB credentials, create a `.env` file in the repo root with any
of `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, or
`CHECK_INTERVAL_SECONDS` before running `docker compose up` — `docker-compose.yml` picks it up
automatically. Everything has a working default, so this step is optional.

## Testing Up/Down Detection

This is the core thing to verify: the monitor should correctly detect both a healthy URL and a
broken one, and reflect that in the UI within about a minute.

1. Start the stack: `docker compose up --build`
2. Open http://localhost:3000
3. In the "Add URL" box, add a **known-good** URL and click Add:
   ```
   https://example.com
   ```
4. Add a **known-bad** URL (either an unresolvable host or a closed port):
   ```
   https://this-domain-does-not-exist-abcxyz12345.invalid
   ```
5. Wait up to ~60 seconds (the scheduler runs an initial check immediately on boot, then every
   `CHECK_INTERVAL_SECONDS`, default 60). The dashboard polls the API every 5 seconds, so you'll
   see the status flip from "○ Pending" to:
   - `https://example.com` → **● Up**, status code `200`, a response time in ms
   - the invalid domain → **● Down**, no status code, no response time

You can also verify directly against the API without the UI:

```bash
# Register a URL
curl -X POST localhost:8000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# List all monitored URLs with their latest check
curl localhost:8000/api/urls

# Check history for a single URL
curl localhost:8000/api/urls/1/checks
```

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/urls` | Register a URL. Body: `{ "url": "https://..." }` |
| `GET` | `/api/urls` | List all URLs with their latest check (status/code/response time/timestamp) |
| `GET` | `/api/urls/:id/checks` | Last 50 checks for one URL |
| `DELETE` | `/api/urls/:id` | Stop monitoring a URL |
| `GET` | `/api/health` | Container healthcheck |

## Local Development (without Docker)

```bash
# Backend (no MySQL needed — falls back to a local SQLite file automatically.
# To test against MySQL instead, set MYSQL_HOST/MYSQL_DATABASE/MYSQL_USER/MYSQL_PASSWORD.)
cd backend
python -m venv .venv       # use `python3` here if `python` isn't found (common on macOS/Linux)
```

Activate the virtual environment — the command depends on your OS and shell:

| OS / Shell | Command |
|---|---|
| macOS / Linux (bash, zsh) | `source .venv/bin/activate` |
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (cmd.exe) | `.venv\Scripts\activate.bat` |
| Windows (Git Bash) | `source .venv/Scripts/activate` |

If PowerShell blocks the script with an execution-policy error, run
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, or activate via cmd.exe instead.

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

```bash
# Frontend (in a separate terminal — identical on every OS)
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.mts`).

## Deployment Sketch (AWS)

For a real deployment, the shape stays the same as the compose file — just swap containers for
managed services:

- **ECR**: two repos, one per image (`backend`, `frontend`), built by CI and pushed on merge.
- **ECS Fargate**: one service per image, each with 1 task to start. No servers to manage.
- **RDS MySQL**: replaces the `db` container. Single small instance (`db.t4g.micro`) is plenty
  at this scale.
- **ALB**: routes `/` to the frontend service and `/api/*` to the backend service (or serve the
  frontend from S3 + CloudFront and only put the backend behind the ALB — either works at MVP
  scale).
- **Secrets Manager**: holds the MySQL credentials, injected into the backend task as env vars.

```hcl
resource "aws_ecr_repository" "backend"  { name = "uptime-monitor-backend" }
resource "aws_ecr_repository" "frontend" { name = "uptime-monitor-frontend" }

resource "aws_ecs_cluster" "uptime" {
  name = "uptime-monitor"
}

resource "aws_db_instance" "mysql" {
  identifier        = "uptime-monitor-db"
  engine            = "mysql"
  engine_version    = "8.4"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20
  db_name           = "uptime"
  username          = "uptime"
  password          = var.db_password
  skip_final_snapshot = true
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "uptime-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.backend.repository_url}:latest"
    portMappings = [{ containerPort = 8000 }]
    environment = [
      { name = "CHECK_INTERVAL_SECONDS", value = "60" },
      { name = "MYSQL_HOST", value = aws_db_instance.mysql.address },
      { name = "MYSQL_DATABASE", value = "uptime" },
      { name = "MYSQL_USER", value = "uptime" }
    ]
    secrets = [
      { name = "MYSQL_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn }
    ]
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "backend"
  cluster         = aws_ecs_cluster.uptime.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.backend.id]
  }
}
```

This is illustrative, not production-hardened — no autoscaling, multi-AZ, or WAF configuration
included on purpose, since that's out of scope for this MVP.

## Known Limitations (MVP scope)

- Single scheduler process (`gunicorn --workers 1`) — fine at "a few dozen URLs checked every
  minute," would need a dedicated worker/queue (e.g. Celery + Redis, or a separate ECS scheduled
  task) beyond this scale.
- No auth on the API — anyone who can reach it can add/remove URLs. Fine for a local MVP, not
  for a public deployment.
- No alerting (email/Slack on state change) — out of scope per the assignment, but the `Check`
  history table makes it straightforward to add later (diff latest two checks, notify on flip).
