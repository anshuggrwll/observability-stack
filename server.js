import express from "express";
import client from "prom-client";

const app = express();
const PORT = process.env.PORT || 8000;
const SLOW_DELAY_MS = Number(process.env.SLOW_DELAY_MS || 5000);
const register = new client.Registry();

client.collectDefaultMetrics({ register });

const totalRequests = new client.Counter({
  name: "app_total_requests",
  help: "Total number of requests handled by the app"
});

const totalRequestsDuration = new client.Histogram({
  name: "app_total_requests_duration",
  help: "Total duration of requests handled by the app",
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new client.Counter({
  name: "app_http_requests_total",
  help: "Total number of HTTP requests handled by the app",
  labelNames: ["method", "route", "status_code"]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "app_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

app.use((req, res, next) => {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    console.log(`${req.method} ${route} ${res.statusCode}`);
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
});

app.get("/", (req, res) => {
  const start = Date.now();
  totalRequests.inc();
  const duration = (Date.now() - start) / 1000;
  totalRequestsDuration.observe(duration);
  res.json({
    message: "Monitoring app is running",
    endpoint: "simple"
  });
});

app.get("/slow", async (req, res) => {
  totalRequests.inc();
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, SLOW_DELAY_MS));

  const end = Date.now();
  const duration = (end - start) / 1000;
  totalRequestsDuration.observe(duration);

  res.json({
    message: "Slow endpoint completed",
    delayMs: SLOW_DELAY_MS
  });
});

app.get("/metrics", async (req, res) => {
  
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`Monitoring app listening at http://localhost:${PORT}`);
});