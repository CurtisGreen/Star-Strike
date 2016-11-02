// Deal with logging in.

function login() {
  var userId = $('#user_id_input').val();
  if (userId && userId != "") {
    socket.emit('login', {
      user_id: userId,
    });
  }

  socket.on('login_ok', function(msg) {
    $('#login_error').html("");
    startChat(userId);
  });

  socket.on('login_fail', function() {
    $('#login_error').html("Login Failed.");
  });
}

