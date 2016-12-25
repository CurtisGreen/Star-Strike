
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

  
	setTimeout(function(){ 	//Timeout to make sure the game has been created so it can receive its ID
		conn.userId = Math.random();
		conn.emit('onconnected', { id: conn.userId } );
		console.log('\t socket.io:: player ' + conn.userId + ' connected');
	}, 1800);
  

  conn.on('update', function(msg) {   //Sends the client data to the server then to the opposing player
      io.emit('update', msg);
  });
  conn.on('double', function(msg) {   //Checks for invaders doubling
      io.emit('double', msg);
  });
  conn.on('invaders', function(msg) {   //Updates invader position 
      io.emit('invaders', msg);
  });
  conn.on('defeat', function(msg) {   //Updates win condition (0-2)
      io.emit('defeat', msg);
  });
  conn.on('health', function(msg) {   //Updates stars position 

      io.emit('health', msg);
  });
   conn.on('ammo', function(msg) {   //Updates ammo (0-10)
      io.emit('ammo', msg);
  })

   conn.on('bulletExplosion', function(msg) {  //bullete explosion 
      io.emit('bulletExplosion', msg);
  });

   conn.on('initialize', function(msg) {  //Tells the client both are ready
      io.emit('initialize', msg);
  })

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

