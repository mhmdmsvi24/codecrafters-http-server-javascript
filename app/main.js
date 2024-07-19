const net = require("net");

const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("data", (data) => {
    const requestString = data.toString();
    const [requestLine, ...headers] = requestString.split("\r\n");
    const [method, url] = requestLine.split(" ");

    // endpoint /
    if (url === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
      // endpoint /echo/
    } else if (url.startsWith("/echo/")) {
      const content = url.slice(6); // Remove '/echo/' from the beginning
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
      // endpoint /user-agent
    } else if (url === "/user-agent") {
      const userAgent = headers.find((h) =>
        h.toLowerCase().startsWith("user-agent:")
      );
      const content = userAgent ? userAgent.split(": ")[1] : "";
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end();
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

const PORT = 4221;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
