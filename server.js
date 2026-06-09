import express from "express";
import client from "prom-client";

const app = express();
const PORT = process.env.PORT || 8000;
const SLOW_DELAY_MS = Number(process.env.SLOW_DELAY_MS || 5000);
const register = new client.Registry();

client.collectDefaultMetrics({ register });

app.get("/", (req, res) => {
  res.json({
    message: "Monitoring app is running",
    endpoint: "simple"
  });
});

app.get("/slow", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, SLOW_DELAY_MS));

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