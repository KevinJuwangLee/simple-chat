const express = require("express"); // use express
const app = express(); // create instance of express
const server = require("http").Server(app); // create server
const io = require("socket.io")(server); // create instance of socketio
var filterProfanity = require('leo-profanity');
filterProfanity.loadDictionary();
app.use(express.static("public")); // use "public" directory for static files


app.get('/help', function(req, res) {
   res.sendfile('public/help.html');
});


let rooms = {}
let users = {}

let asker;
let replyer;



function filter(msg){
  if(msg.length > 200){
    msg = msg.substring(0, 199)
  }
  return msg.split("<").join("&lt;").split(">").join("&gt;")

}

function exists(id){
  return users[id] !== undefined
}

function valid(text){
  return text !== undefined && text !== null;
}



io.on("connection", socket => {;
  //console.log(socket.request.connection.remoteAddress)
  socket.on("join", (name, room) => {
    if(valid(room) && valid(name) && !exists(socket.id)){
      if((name.length < 200) && (name.length > 0) && (room.length < 50) && (room.length > 0) && (filterProfanity.check(name) == false) && (filterProfanity.check(room) == false)) {
        if(Object.keys(rooms).includes(room)){
          if((!Object.values(rooms[room]).includes(filter(name)))){
            rooms[room][socket.id] = filter(name)
            users[socket.id] = [room, filter(name)]
            socket.join(room)
            io.to(socket.id).emit("verified")
            io.to(room).emit("joined", name, Object.values(rooms[room]));
          } else{
            io.to(socket.id).emit("fail", "existing")
          }
        } else{
          rooms[room] = {};
          rooms[room][socket.id] = filter(name);
          users[socket.id] = [room, filter(name)]
          socket.join(room)
          io.to(socket.id).emit("verified")
          io.to(room).emit("joined", name, Object.values(rooms[room]));
        }
      } else{
        io.to(socket.id).emit("fail", "invalid")
      }
    }
      
  })
  socket.on("message", (msg) => { // when server recieves the "joined" message
  if(exists(socket.id) && valid(msg)){
    if(msg.length > 0 && filterProfanity.check(msg) == false){
      io.to(users[socket.id][0]).emit("message", users[socket.id][1], filter(msg));
    }
  }
     // send message to client
  });
  socket.on("disconnect", () => { // when someone closes the tab
    if(exists(socket.id)){
      delete rooms[users[socket.id][0]][socket.id]
      io.to(users[socket.id][0]).emit("leave", users[socket.id][1], Object.values(rooms[users[socket.id][0]]));
      delete users[socket.id]
      
    }

  });

  socket.on("typing", () =>{
    if(exists(socket.id)){
      socket.broadcast.to(users[socket.id][0]).emit("typing", users[socket.id][1])
    }
  })

  socket.on("pingServer", () =>{
    if(exists(socket.id)){
      io.to(socket.id).emit("pingServerReply")
    }
  })

  socket.on("pingUser", (user) =>{
    if(exists(socket.id) && valid(user)){
      if(Object.values(rooms[users[socket.id][0]]).includes(filter(user))){
        asker = socket.id;
        replyer = Object.keys(rooms[users[socket.id][0]])[Object.values(rooms[users[socket.id][0]]).indexOf(filter(user))]
        io.to(replyer).emit("pingUserAsk")
        /*socket.on("pingUserReturnFirst", () => {
          console.log("hi")
          if(replyer === socket.id){
            io.to(asker).emit("pingUserReturnSecond")
          }
        })*/

      }
      
    }
  })
  socket.on("pingUserReturnFirst", () => {
    if(replyer === socket.id){
      io.to(asker).emit("pingUserReturnSecond")
    }
})
});







server.listen(3000); // run server