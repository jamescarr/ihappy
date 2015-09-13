var emojis = [
  ':grinning:', ':joy:', ':innocent:', ':yum:', ':smile_cat:', ':heart_eyes_cat:', ':scream_cat:', ':ghost:', ':rose:', ':cow2:', ':horse:', ':dog:', ':whale:', ':monkey_face:', ':star2:', ':pizza:', ':pineapple:', ':cake:'
];
function message_template() {
  var templates = {
    true: Handlebars.compile("<div class='row contained-message'><div class='col-md-3 col-xs-3'><img src='images/avatars/{{ user }}.png' class='avatar'></div><div class='col-md-8 col-xs-8 message even'>{{{ msg }}}</div></div>"),
    false: Handlebars.compile("<div class='row contained-message'><div class='odd message col-md-8 col-xs-8'>{{{ msg }}}</div><div class='col-md-3 col-xs-3'><img src='images/avatars/{{ user }}.png' class='avatar'></div></div>"),
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

function inflight_template() {
  var template = "<div class='message'>{{{ msg }}}</div>";
  return Handlebars.compile(template)
}

function adjust_scroll() {
  var height = 0;
  $('#messages div').each(function() {
    height += $(this).height();

  });
  console.log(height);
  $('#messages').animate({scrollTop: height});
}

function ChatStream() {
  this.msg_template = message_template()
};

ChatStream.prototype.append = function(message) {
  message.msg = message.msg.replace('"//cdn.jsdelivr.net', '"https://cdn.jsdelivr.net')
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
    var self = this;
    emojis.forEach(function(emoji) {
      var fragment = $(' <a href="#" data-emoji="'+emoji+'">'+emoji+'</a>\n');
      $(self).append(fragment);
    });

    var original = $(this).html();
    // use .shortnameToImage if only converting shortnames (for slightly better performance)
    var converted = emojione.toImage(original).replace('"//cdn.jsdelivr.net', '"https://cdn.jsdelivr.net');
    $(this).html(converted);
  });

  $('form').submit(function(){
    var text = buffer.join(' ');
    buffer = [];
    $('#curm span').html('')
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
    var inflightText = buffer.join(' ')
    $('#curm span').html(emojione.toImage(inflightText).replace('"//cdn.jsdelivr.net', '"https://cdn.jsdelivr.net'))
    return false;
  });
})
