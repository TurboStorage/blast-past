import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

export async function startStaticServer(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }

      const pathname = decodeURIComponent(
        new URL(request.url, "http://127.0.0.1").pathname,
      );
      const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
      const filePath = path.resolve(root, relativePath);

      if (filePath !== root && !filePath.startsWith(rootPrefix)) {
        response.writeHead(403).end();
        return;
      }

      const file = await stat(filePath);
      if (!file.isFile()) {
        response.writeHead(404).end();
        return;
      }

      response.writeHead(200, {
        "Content-Length": file.size,
        "Content-Type":
          contentTypes[path.extname(filePath)] ?? "application/octet-stream",
      });
      if (request.method === "HEAD") {
        response.end();
      } else {
        const stream = createReadStream(filePath);
        stream.on("error", () => response.destroy());
        response.on("close", () => stream.destroy());
        stream.pipe(response);
      }
    } catch (error) {
      response.writeHead(error?.code === "ENOENT" ? 404 : 500).end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
