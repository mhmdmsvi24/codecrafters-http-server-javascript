const net = require("net");
const fs = require("fs");

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

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const { method, path, protocol, headers, body } = parseRequest(data);

    if (path === "/") {
      socket.write(OK_RESPONSE);
    } else if (path.startsWith("/echo")) {
      const randomString = path.substring(6);
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${randomString.length}\r\n\r\n${randomString}`
      );
    } else if (path.startsWith("/user-agent")) {
      const agent = headers["User-Agent"];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${agent.length}\r\n\r\n${agent}`
      );
    } else if (path.startsWith("/files/") && method === "GET") {
      const fileName = path.replace("/files/", "").trim();
      const filePath = process.argv[3] + "/" + fileName;

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else {
        socket.write(ERROR_RESPONSE);
      }
    } else if (path.startsWith("/files/") && method === "POST") {
      const filename = process.argv[3] + "/" + path.substring(7);
      fs.writeFileSync(filename, body);
      socket.write("HTTP/1.1 201 Created\r\n\r\n");
    } else {
      socket.write(ERROR_RESPONSE);
    }

    socket.end();
  });
});

server.listen(4221, "localhost");
