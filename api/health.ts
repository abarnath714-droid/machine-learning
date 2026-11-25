import type { IncomingMessage, ServerResponse } from "node:http";
import { getHealthStatus } from "../lib/newsService.ts";

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => void;
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  const maybeVercel = res as Partial<VercelResponse>;
  if (typeof maybeVercel.status === "function" && typeof maybeVercel.json === "function") {
    maybeVercel.status(statusCode).json(data);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    sendJson(res, 405, { error: "Method not allowed. Use GET." });
    return;
  }

  const result = getHealthStatus();
  sendJson(res, result.status, result.body);
}
