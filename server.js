// Create a web server using Express.
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// Add WebSocket support to the web server, using socket.io.
var io = require('socket.io')(server);

// Serve static files on the root path.
app.use('/', express.static('source'));

// Utility function for computing a digest.
var crypto = require('crypto');
function digest(input) {
    var d = crypto.createHash('md5').update(input).digest('base64').substr(0, 12);
    return d.replace(/\+/g, '-').replace(/\//g, '_');
}

// Tells socket.io to listen to a built-in event 'connection'. This event is
// triggered when a client connects to the server.
io.sockets.on('connection', function (conn) {
    // Timeout to make sure the game has been created so it can receive its ID
    setTimeout(function () {
        conn.userId = Math.random();
        conn.emit('onconnected', { id: conn.userId });
        console.log('\t socket.io:: player ' + conn.userId + ' connected');
    }, 1800);

    // Sends the client data to the server then to the opposing player
    conn.on('update', function (msg) {
        io.emit('update', msg);
    });
    // Checks for invaders doubling
    conn.on('double', function (msg) {
        io.emit('double', msg);
    });
    // Updates invader position
    conn.on('invaders', function (msg) {
        io.emit('invaders', msg);
    });
    // Updates win condition (0-2)
    conn.on('defeat', function (msg) {
        io.emit('defeat', msg);
    });
    // Updates stars position
    conn.on('health', function (msg) {
        io.emit('health', msg);
    });
    // Updates ammo (0-10)
    conn.on('ammo', function (msg) {
        io.emit('ammo', msg);
    });

    // Bullet explosion
    conn.on('bulletExplosion', function (msg) {
        io.emit('bulletExplosion', msg);
    });

    // Tells the client both are ready
    conn.on('initialize', function (msg) {
        io.emit('initialize', msg);
    });

    // Useful to know when someone disconnects
    conn.on('disconnect', function () {
        console.log('\t socket.io:: client disconnected ' + conn.userId);
    });
});

// Listen on a high port.
const port = 12134;
server.listen(port, function () {
    console.log('Listening on port ' + port);
});
