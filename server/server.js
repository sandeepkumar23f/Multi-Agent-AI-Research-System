import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

// Automatically works on both Windows (.venv/Scripts/python.exe) and Linux/Render (.venv/bin/python)
const isWin = process.platform === "win32";
const PYTHON_PATH = process.env.PYTHON_PATH || path.resolve(
  __dirname,
  isWin ? "../.venv/Scripts/python.exe" : "../.venv/bin/python"
);
const RUNNER_PATH = path.resolve(__dirname, "../api_runner.py");

// Cache completed queries so demoing in interviews is instant
const reportCache = new Map();

app.get("/api/research", (req, res) => {
  const topic = (req.query.topic || "").trim();
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const cacheKey = topic.toLowerCase();
  if (reportCache.has(cacheKey)) {
    res.write(`data: ${JSON.stringify({ type: "done", data: reportCache.get(cacheKey) })}\n\n`);
    return res.end();
  }

  const py = spawn(PYTHON_PATH, ["-u", RUNNER_PATH, topic], {
    cwd: path.resolve(__dirname, ".."),
  });

  let fullOutput = "";

  py.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    fullOutput += text;

    // Detect your existing print() statements in pipeline.py to stream live step updates
    const lower = text.toLowerCase();
    if (lower.includes("step 1")) {
      res.write(`data: ${JSON.stringify({ type: "step", step: 1, label: "Search Agent querying Tavily..." })}\n\n`);
    } else if (lower.includes("step 2")) {
      res.write(`data: ${JSON.stringify({ type: "step", step: 2, label: "Reader Agent scraping primary URL..." })}\n\n`);
    } else if (lower.includes("step 3")) {
      res.write(`data: ${JSON.stringify({ type: "step", step: 3, label: "Writer Chain drafting structured report..." })}\n\n`);
    } else if (lower.includes("step 4")) {
      res.write(`data: ${JSON.stringify({ type: "step", step: 4, label: "Critic Chain evaluating report quality..." })}\n\n`);
    }
  });

  py.stderr.on("data", (err) => {
    console.error("[Python Error]:", err.toString());
  });

  py.on("close", (code) => {
    const marker = "__FINAL_STATE_JSON__";
    const markerIdx = fullOutput.indexOf(marker);

    if (markerIdx !== -1) {
      const jsonStr = fullOutput.slice(markerIdx + marker.length).trim();
      try {
        const parsedState = JSON.parse(jsonStr);
        reportCache.set(cacheKey, parsedState);
        res.write(`data: ${JSON.stringify({ type: "done", data: parsedState })}\n\n`);
      } catch (e) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Failed to parse pipeline output." })}\n\n`);
      }
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: `Pipeline exited with code ${code}` })}\n\n`);
    }
    res.end();
  });

  req.on("close", () => py.kill());
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));