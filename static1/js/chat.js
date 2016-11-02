// Chat using socket.io.

function createMessageDiv(msg) {
  // A <div> for displaying the content.
  var msgDiv = $('<div/>').addClass('msg_box');
  msgDiv.append($('<span/>').addClass('sender').text(msg.sender));
  msgDiv.append($('<span/>').addClass('said').text(' said: '));
  msgDiv.append($('<span/>').addClass('msg_content').text(msg.content));

  return msgDiv;
}

function createNotificationDiv(notif) {
  var notificationDiv = $('<div/>').addClass('msg_box');
  notificationDiv.append($('<span/>').addClass('notification').text(notif.content));
  return notificationDiv;
}

function startChat(userId) {
  $('#login_section').hide();
  $('#room_section').show();

  var loginStatus = $('#login_status').text("logged in as " + userId);

  // If a chat message is received, display it.
  socket.on('chat', function(msg) {
    if (msg
        && msg.sender && msg.sender != ""
        && msg.content && msg.content != "") {
      var msgDiv = createMessageDiv(msg);
      $('#msg_list').append(msgDiv);
    } else {
      console.error("Malformed msg: " + msg);
    }
  });

  // If a notification is received, display it.
  socket.on('notification', function(notif) {
    if (notif && notif.content && notif.content != "") {
      var notificationDiv = createNotificationDiv(notif);
      $('#msg_list').append(notificationDiv);
    }
    // If the notification content is empty, it is ignored.
  });
}

function send() {
  var msgBox = $('#msg_input');
  var content = msgBox.val();
  if (content && content != "") {
    socket.emit('chat', {
      content: content,
    });
  }
  msgBox.val(""); // clear the input field.
}

