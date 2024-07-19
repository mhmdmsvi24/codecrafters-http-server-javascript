const net = require("net");

// Creates a TCP client/server model server
const server = net.createServer((socket) => {
  // adds an event handler (the callback) for the specified event (data here)
  socket.on("data", (data) => {
    const request = data.toString();
    const path = request.split(" ")[1];

    const response = path === "/" ? "200 OK" : "404 Not Found";

    socket.write(`HTTP/1.1 ${response}\r\n\r\n`);

    socket.end();
  });
});

server.listen(4221, "localhost", () => {
  process.stdout.write("Listening on localhost:4221\n");
});
