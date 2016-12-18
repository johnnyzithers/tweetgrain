

var socket = io.connect("/"); 

// message from server
socket.on("message",function(message){  

    console.log("Message from the server arrived")
    message = JSON.parse(message); // convert to JS
    console.log(message); 
});
