import type { IncomingMessage, ServerResponse } from "node:http";
import { extractArticleFromUrl, parseJsonBody } from "../lib/newsService.ts";

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

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, {
      code: "METHOD_NOT_ALLOWED",
      error: "Method not allowed. Send a POST request to /api/extract-url.",
    });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Invalid JSON body";
    sendJson(res, 400, {
      code: "INVALID_JSON",
      error: `Invalid JSON request body: ${detail}`,
    });
    return;
  }

  const result = await extractArticleFromUrl(body.url);
  sendJson(res, result.status, result.body);
}
