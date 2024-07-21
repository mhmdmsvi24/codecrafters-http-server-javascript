const net = require("net");
const fs = require("fs");
const zlib = require("zlib");

console.log("Logs from your program will appear here!");

const parseRequest = (requestData) => {
  const [headers, body] = requestData.toString().split("\r\n\r\n");
  const [requestLine, ...headerLines] = headers.split("\r\n");
  const [method, path, protocol] = requestLine.split(" ");

  const parsedHeaders = {};
  headerLines.forEach((line) => {
    const [key, value] = line.split(": ");
    parsedHeaders[key] = value;
  });

  return { method, path, protocol, headers: parsedHeaders, body };
};

const OK_RESPONSE = "HTTP/1.1 200 OK\r\n\r\n";
const ERROR_RESPONSE = "HTTP/1.1 404 Not Found\r\n\r\n";

const sendResponse = (socket, statusCode, headers, body, acceptEncoding) => {
  const supportsGzip = acceptEncoding && acceptEncoding.includes("gzip");

  if (supportsGzip) {
    zlib.gzip(body, (err, compressedBody) => {
      if (err) {
        socket.write(ERROR_RESPONSE);
        socket.end();
      } else {
        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = compressedBody.length;
        const responseHeaders = Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\r\n");
        socket.write(`HTTP/1.1 ${statusCode}\r\n${responseHeaders}\r\n\r\n`);
        socket.write(compressedBody);
        socket.end();
      }
    });
  } else {
    headers["Content-Length"] = Buffer.byteLength(body);
    const responseHeaders = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\r\n");
    socket.write(`HTTP/1.1 ${statusCode}\r\n${responseHeaders}\r\n\r\n${body}`);
    socket.end();
  }
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const { method, path, protocol, headers, body } = parseRequest(data);
    const acceptEncoding = headers["Accept-Encoding"];

    if (path === "/") {
      sendResponse(socket, "200 OK", {}, "OK", acceptEncoding);
    } else if (path.startsWith("/echo")) {
      const randomString = path.substring(6);
      sendResponse(
        socket,
        "200 OK",
        { "Content-Type": "text/plain" },
        randomString,
        acceptEncoding
      );
    } else if (path.startsWith("/user-agent")) {
      const agent = headers["User-Agent"];
      sendResponse(
        socket,
        "200 OK",
        { "Content-Type": "text/plain" },
        agent,
        acceptEncoding
      );
    } else if (path.startsWith("/files/") && method === "GET") {
      const fileName = path.replace("/files/", "").trim();
      const filePath = process.argv[3] + "/" + fileName;

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        sendResponse(
          socket,
          "200 OK",
          { "Content-Type": "application/octet-stream" },
          content,
          acceptEncoding
        );
      } else {
        socket.write(ERROR_RESPONSE);
        socket.end();
      }
    } else if (path.startsWith("/files/") && method === "POST") {
      const filename = process.argv[3] + "/" + path.substring(7);
      fs.writeFileSync(filename, body);
      sendResponse(socket, "201 Created", {}, "", acceptEncoding);
    } else {
      socket.write(ERROR_RESPONSE);
      socket.end();
    }
  });
});

server.listen(4221, "localhost");
