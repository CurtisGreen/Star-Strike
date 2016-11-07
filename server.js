// This node.js program implements a simple chat room service.

// Create a web server using Express.
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// Add WebSocket support to the web server, using socket.io.
var io = require('socket.io')(server);

// Serve static files on the root path.
app.use('/', express.static('static1'));

// Utility function for computing a digest.
var crypto = require('crypto');
function digest(input) {
  var d = crypto.createHash('md5').update(input).digest('base64').substr(0, 12);
  return d.replace(/\+/g, '-').replace(/\//g, '_');
}

// Tells socket.io to listen to a built-in event 'connection'. This event is
// triggered when a client connects to the server. At that time, the callback
// function (the 2nd argument) will be called with an object (named as 'conn')
// representing the connection.
io.sockets.on('connection', function(conn) {
  // JavaScript functions are 'closures', which means they keep references to
  // local variables in the scope they were created.
  //
  // That means, for each connected client, the JavaScript engine will create
  // the callback functions given to conn.on() below, each of which keeps a
  // reference to that connection (represented by 'conn'). That's why we can
  // refer to 'conn' in these callback functions to get the correct connection.

  
	setTimeout(function(){ 
		conn.userId = Math.random();
		conn.emit('onconnected', { id: conn.userId } );
		console.log('\t socket.io:: player ' + conn.userId + ' connected');
	}, 900);
  

  conn.on('update', function(msg) {   //TODO: modify this function by updating the game for the second screen
      io.emit('update', msg);
  });

   conn.on('disconnect', function () {
            //Useful to know when someone disconnects
        console.log('\t socket.io:: client disconnected ' + conn.userId );

    });
});

// Listen on a high port.

var port = 12134;


server.listen(port, function() {
  console.log("Listening on port " + port);
});

