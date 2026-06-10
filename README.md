# Observability Stack

A small Node.js monitoring app with Prometheus metrics, Grafana dashboards, and Loki log aggregation.

## Stack

| Service | URL | Description |
|---------|-----|-------------|
| App | http://localhost:8083 | Node.js app exposing `/metrics` (host port 8083 → container 8081) |
| Prometheus | http://localhost:9090 | Scrapes app and Grafana metrics |
| Grafana | http://localhost:3000 | Dashboards, Explore (metrics + logs) |
| Loki | http://localhost:3100 | Log storage (queried via Grafana) |

Default Grafana login: `admin` / `admin`

## App Endpoints

- `GET /` - simple JSON response
- `GET /slow` - delayed JSON response (default 5s)
- `GET /metrics` - Prometheus metrics from `prom-client`

## Custom Metrics

- `app_http_requests_total` - total requests by method, route, and status code
- `app_http_request_duration_seconds` - request duration histogram by method, route, and status code
- `app_total_requests` - total request counter
- `app_total_requests_duration` - total request duration histogram

## Run Everything (Docker)

Start the full stack:

```bash
docker-compose up -d --build
```

This starts:

- **app** - monitoring app (built from `Dockerfile` + `server.js`)
- **prometheus** - scrapes metrics
- **grafana** - pre-provisioned with Prometheus + Loki data sources and a Monitoring App dashboard
- **loki** - log storage
- **promtail** - ships Docker container logs to Loki

Rebuild after changing app code:

```bash
docker-compose up -d --build app
```

Stop the stack:

```bash
docker-compose down
```

## Run The App Locally (optional)

Install dependencies:

```bash
npm install
```

Start the app on port `8081`:

```bash
PORT=8081 npm start
```

Do not run both the Docker app and local `npm start` on port `8081` at the same time. Loki only collects logs from the Docker container.

## Prometheus

Prometheus config is mounted from `prometheus.yml` and scrapes:

```text
http://app:8081/metrics       (monitoring-app, via Docker network)
http://grafana:3000/metrics   (grafana)
```

Both Prometheus and the app run in Docker Compose, so Prometheus reaches the app by service name (`app`), not the host IP.

Check scrape targets: http://localhost:9090/targets

## Grafana

Grafana is provisioned with:

- **Prometheus** data source (default)
- **Loki** data source
- **Monitoring App** dashboard (Dashboards → Monitoring → Monitoring App)

## Loki Logs

Promtail collects logs from containers in the `monitoring` Docker Compose project and sends them to Loki.

View logs in Grafana → **Explore** → select **Loki**:

```logql
{container="monitoring-app"}
```

Other useful queries:

```logql
{container="monitoring-app"} |= "GET"
{container="monitoring-app"} |= "/slow"
{container=~"monitoring-.*"}
```

Generate sample traffic:

```bash
curl http://localhost:8083/
curl http://localhost:8083/slow
```

> **Colima users:** Port `8081` localhost forwarding is unreliable on Colima, so Docker maps host `8083` → container `8081`. If `localhost:8083` fails, try `http://192.168.64.2:8083` (Colima VM IP from `colima ls`). After recreating containers, if metrics stop updating in Grafana, recreate the app with `docker-compose up -d --force-recreate app` — stale Colima port forwards can send traffic to an old container instance.

Each request is logged to stdout as `GET / 200`, `GET /slow 200`, etc.

## Project Layout

```text
monitoring/
├── server.js              # Express app + prom-client metrics
├── Dockerfile             # App container image
├── docker-compose.yml     # Full stack
├── prometheus.yml         # Prometheus scrape config
├── loki/loki-config.yml   # Loki config
├── promtail/promtail-config.yml  # Promtail config
└── grafana/provisioning/  # Grafana datasources + dashboards
```
