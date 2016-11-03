// Deal with logging in.

function login() {    //TODO: Change for our menu/login
  var userId = $('#user_id_input').val();
  if (userId && userId != "") {
    socket.emit('login', {
      user_id: userId,
    });
  }
 
  socket.on('login_ok', function(msg) {   //TODO: replace with running the game
    $('#login_error').html("");
    startChat(userId);
  });

  socket.on('login_fail', function() {    //TODO: change to different element/console log/error
    $('#login_error').html("Login Failed.");
  });
}

