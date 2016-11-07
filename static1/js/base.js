// Setting up global variables and page element event handlers.

// socket becomes a global variable (within the webpage) representing the
// WebSocket connection.
socket = io();

// set up event handlers.

/*$('#user_id_input').keypress(function(event) {    //TODO: modify this function for menu login (only necessary if we're doing usernames)
  // When 'enter' is pressed in the user ID box, it should be treated as
  // clicking on the 'log in' button.
  if (event.keyCode === 13) {
    login();
  }
});*/

/*$('#msg_input').keypress(function(event) {    //function is not necessary currently
  // When 'enter' is pressed in the message box, it should be treated as
  // clicking on the 'send message' button.
  if (event.keyCode === 13) {
    send();
  }
});*/

//$('#login_button').click(login);  //TODO: modify for our menu/login, this should start the game

//$('#send_button').click(send);    //TODO: modify for a submenu, EX: ship selection

