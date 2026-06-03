import express from "express";

export function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get("/", (req, res) => {
    res.send("AI Telegram Assistant for Center Krasok is running");
  });

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "AI Telegram Assistant",
      company: "Center Krasok #1",
    });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}