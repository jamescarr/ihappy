function message_template() {
  var template = "<img src='images/avatars/{{ user }}.png' class='avatar'><div class='message'>{{{ msg }}}</div>";
  return Handlebars.compile(template)
}

function adjust_scroll() {
  var height = $('#messages').height();

  $('#messages').animate({scrollTop: height});
  console.log('adjust scroll to ' + height);
}

$(function() {
  var socket = io();
  var buffer = [];
  var user   = null;
  var msg_template = message_template()

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
    $('#messages').append($('<li>')).append($(msg_template(msg)));
    adjust_scroll();
  });

  socket.on('/chat/message', function(msg){
    msg.msg = emojione.toImage(msg.msg);
    $('#messages').append($('<li>')).append($(msg_template(msg)));
    adjust_scroll();
  });

  $('.convert-emoji a').click(function(e) {
    buffer.push($(this).attr('data-emoji'));

    return false;
  });
});
