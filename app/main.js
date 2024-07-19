const net = require("net");

const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("data", (data) => {
    const requestString = data.toString();
    console.log("Request received:\n", requestString);

    // Parse the request
    const [requestLine] = requestString.split("\r\n");
    const url = requestLine.split(" ")[1];

    // Check if it's a GET request to /echo/
    if (url == "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (url.includes("/echo/")) {
      const content = url.split("/echo/")[1];
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end(); // Close the connection
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
