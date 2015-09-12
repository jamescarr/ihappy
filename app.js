var express = require('express');
var path = require('path');
var fs = require('fs')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var io = require('socket.io')();

app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var avatars = fs.readdirSync("public/images/avatars").map(function(image) {
  return image.replace(".png", "");
});
var users = {};

io.on('connection', function(socket){
  var avatar = avatars.pop();
  var clientId = socket.id;
  users[socket.id] = avatar;
  socket.emit('/user/assign', users[socket.id]);
  io.emit('/user/join', avatar)

  socket.on('disconnect', function(){
    avatars.push(users[socket.id])
    delete users[socket.id];
  });

  socket.on('/chat/message', function(msg){
    console.log(msg)
    io.emit('/chat/message', msg);
  });

});

module.exports = app;
