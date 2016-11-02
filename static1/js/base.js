// Setting up global variables and page element event handlers.

// socket becomes a global variable (within the webpage) representing the
// WebSocket connection.
socket = io();

// set up event handlers.

$('#user_id_input').keypress(function(event) {
  // When 'enter' is pressed in the user ID box, it should be treated as
  // clicking on the 'log in' button.
  if (event.keyCode === 13) {
    login();
  }
});

$('#msg_input').keypress(function(event) {
  // When 'enter' is pressed in the message box, it should be treated as
  // clicking on the 'send message' button.
  if (event.keyCode === 13) {
    send();
  }
});

$('#login_button').click(login);

$('#send_button').click(send);

