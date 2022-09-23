const express = require("express");
const cors = require("cors");

const io = require("socket.io")({
  path: "/webrtc",
});

const app = express();

const port = 8080;

app.use(cors());
console.log();
app.use(express.static("../webrtc/build"));
app.get("/", (req, res) => {
  res.send("Standing successfully on the server side of the webrtc tool");
});

const server = app.listen(port, () => {
  console.log(`Listening to the port num ${port}`);
});

io.listen(server);

const peers = io.of("/webrtcPeer");

//Keep all the reference of all socket connections
let connectedPeers = new Map();

peers.on("connection", (socket) => {
  console.log(socket.id);

  socket.emit("connection-success", { success: socket.id });
  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("disconnected");
    connectedPeers.delete(socket.id);
  });

  socket.on("offerOrAnswer", (data) => {
    //send to the ohter peer(s) if any
    for (let [socketID, socket] of connectedPeers.entries()) {
      //don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type, data.payload);
        socket.emit("offerOrAnswer", data.payload);
      }
    }
  });

  socket.on("candidate", (data) => {
    //send to the ohter peer(s) if any
    for (let [socketID, socket] of connectedPeers.entries()) {
      //don't send to self
      if (socketID !== data.socketID) {
        console.log(socketID, data.payload.type);
        socket.emit("candidate", data.payload);
      }
    }
  });
});
