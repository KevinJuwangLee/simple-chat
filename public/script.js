const socket = io(); // create new instance
 // tell server that someone opened the page


let name = document.getElementById("name");
let room = document.getElementById("room");
let joinError = document.querySelector("#joinError")

let contentDiv = document.querySelector("#contentName")
let chatDiv = document.querySelector("#chat")

let usersList = document.getElementById("users");
//let text = document.createTextNode("New user has joined.");
let messages = document.getElementById("messages");
let text = document.getElementById("text")
let nameForm = document.getElementById("nameForm")
let messageForm = document.getElementById("messageForm")

let roomName = document.querySelector("#roomName")
let nameName = document.querySelector("#nameName")

let typingList = document.querySelector("#typing")
let typingTimeout;

let typing = false;
let currentlyTyping = [];

let pingedServer = false
let pingStart;
let pingUser;

socket.on("verified", () => {
  chatDiv.style.display = "inline";
  contentDiv.style.display = "none";
  roomName.innerHTML = room.value;
  nameName.innerHTML = name.value;
  text.focus()
})

socket.on("fail", (reason) =>  {
  if(reason === "existing"){
    joinError.innerHTML = `<br><p style="color:red;">There is already a user with that name in ${room.value}.</p>`;
  } else if(reason === "invalid"){
    joinError.innerHTML = `<br><p style="color:red;">Invalid name or room.</p>`;
  }
})




nameForm.onsubmit = function(e){
  e.preventDefault();
  socket.emit("join", name.value, room.value)
}


messageForm.onsubmit = function(e){
  e.preventDefault();
  if(text.value === "/help"){
    messages.innerHTML += `
    <br><li>
    This is the list of commands available:<br>
    /cc : Clear chat<br>
    /typing : Toggle typing notifications<br>
    /ping <i>user</i> : Ping another user (under construction)<br>
    /pingServer : Ping the server<br>
    /help : See this list. 
    </li><br>
    `
  }

  else if(text.value === "/cc"){
    messages.innerHTML = ""
  } else if(text.value === "/typing"){
    typing = !typing
  } else if(text.value === "/pingServer"){
      pingedServer = true;
      pingStart = new Date();
      //console.log(pingS)
      socket.emit("pingServer");
      socket.on("pingServerReply", () => {
        //console.log("hi")
        if(pingedServer){
          let pingEnd = new Date();
          messages.innerHTML +=  `<li>Ping time: ${pingEnd - pingStart} milliseconds.</li>`
          pingedServer = false;
          
        }
      
      })
    
  } else if(text.value.split(" ")[0] === "/ping"){
    pingedUser = true;
    pingStart = new Date();
    socket.emit("pingUser", text.value.slice(1, text.length))
    //console.log(pingS)
    socket.on("pingUserReturnSecond", () => {
      if(pingedUser){
        let pingEnd = new Date();
        messages.innerHTML +=  `<li>Ping time: ${pingEnd - pingStart} milliseconds.</li>`
        pingedUser = false;
        
      }
    
    })
  }
    else {
    socket.emit("message", text.value)
  }
  text.value = ""
  }

text.oninput = function(){
  socket.emit("typing")
}






socket.on("joined", (name, users) => {
  usersList.innerHTML = '';
  for(let i = 0; i < users.length; i++){
    usersList.innerHTML += `<li>${users[i]}</li>`
  }

  messages.innerHTML += `<li>${name} has joined</li>`
  
});
socket.on("leave", (name, users) => {
  usersList.innerHTML = '';
  for(let i = 0; i < users.length; i++){
    usersList.innerHTML += `<li>${users[i]}</li>`
  }

  messages.innerHTML += `<li>${name} has left</li>`
});

socket.on("message", (name, msg) => {
  messages.innerHTML += `<li>${name}: ${msg}</li>`
});

socket.on("typing", (name) => {
  if(typing){
    clearTimeout(typingTimeout);
    if(!currentlyTyping.includes(name) && typing){

      currentlyTyping.push(name)
      typingList.innerHTML += `<li id="${name}">${name} is typing...</li>`
    }
    typingTimeout = setTimeout(function(){
      typingList.removeChild(document.querySelector(`#${name}`));
      currentlyTyping.splice(currentlyTyping.indexOf(name), 1)
    }, 800)
  }
  
  
});
socket.on("pingUserAsk", () => {
  socket.emit("pingUserReturnFirst")
});



//socket.emit("joined", name);