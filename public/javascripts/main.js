
function message_template() {
  var templates = {
    true: Handlebars.compile("<div class='row'><div class='col-md-2'><img src='images/avatars/{{ user }}.png' class='avatar'></div><div class='col-md-8 message'>{{{ msg }}}</div></div>"),
    false: Handlebars.compile("<div class='row'><div class='message col-md-8'>{{{ msg }}}</div><div class='col-md-2'><img src='images/avatars/{{ user }}.png' class='avatar'></div></div>"),
  }
  var current_user = null;
  var current_template = false;

  return function(user) {
    if (current_user != user) {
      current_user = user;
      current_template = !current_template;
    }
    return templates[current_template];
  }
}

function adjust_scroll() {
  var height = $('#messages').height();
  $('#messages').animate({scrollTop: height});
}

function ChatStream() {
  this.msg_template = message_template()
};

ChatStream.prototype.append = function(message) {
  var block = this.msg_template(message.user)(message);

  $('#messages').append($(block));
  adjust_scroll();
}

$(function() {
  var socket = io();
  var buffer = [];
  var user   = null;
  var stream = new ChatStream();

  $(".convert-emoji").each(function() {
    var original = $(this).html();
    // use .shortnameToImage if only converting shortnames (for slightly better performance)
    var converted = emojione.toImage(original);
    $(this).html(converted);
  });

  $('form').submit(function(){
    var text = buffer.join(' ');
    buffer = [];
    socket.emit('/chat/message', {msg: text, user: user});
    return false;
  });
  
  socket.on('/user/assign', function(avatar) {
    user = avatar;
  });

  socket.on('/user/join', function(avatar) {
    if (user === avatar) return;
    var msg = {user: avatar, msg: 'joined' }
    stream.append(msg);
  });

  socket.on('/chat/message', function(msg){
    msg.msg = emojione.toImage(msg.msg);
    stream.append(msg);
  });

  $('.convert-emoji a').click(function(e) {
    buffer.push($(this).attr('data-emoji'));
    return false;
  });
});
