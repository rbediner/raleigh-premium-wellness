import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const previewPort = Number(process.env.PORT || 4173);
const siteOutputRoot = join(process.cwd(), process.env.SITE_OUTPUT_DIR || "site");

const mimeTypesByExtension = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
};

function resolveRequestPath(urlPathname) {
  if (urlPathname === "/") {
    return join(siteOutputRoot, "index.html");
  }

  return join(siteOutputRoot, normalize(urlPathname));
}

const previewServer = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = resolveRequestPath(requestUrl.pathname);

  if (!existsSync(requestedPath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const fileStats = await stat(requestedPath);
  const filePath = fileStats.isDirectory()
    ? join(requestedPath, "index.html")
    : requestedPath;
  const contentType =
    mimeTypesByExtension[extname(filePath)] || "application/octet-stream";

  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(response);
});

previewServer.listen(previewPort, () => {
  console.log(`Site preview server running at http://127.0.0.1:${previewPort}`);
});
