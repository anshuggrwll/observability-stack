# Observability Stack

A small Node.js monitoring app with Prometheus metrics and a Docker Compose setup for Prometheus.

## App Endpoints

- `GET /` - simple JSON response
- `GET /slow` - delayed JSON response
- `GET /metrics` - Prometheus metrics from `prom-client`

## Run The App

Install dependencies:

```bash
npm install
```

Start the app on port `8081`:

```bash
PORT=8081 npm start
```

Open:

```text
http://localhost:8081/
http://localhost:8081/slow
http://localhost:8081/metrics
```

## Run Prometheus

Start Prometheus with Docker Compose:

```bash
docker-compose up -d
```

Prometheus will be available at:

```text
http://localhost:9090
```

The Prometheus config is mounted from `prometheus.yml` and scrapes:

```text
http://192.168.1.9:8081/metrics
```

Stop Prometheus:

```bash
docker-compose down
```
