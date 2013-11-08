/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

// all environments
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
var io = require('socket.io').listen(server, { log: false });

server.listen(app.get('port'), ipaddress, function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var clients = [];
var robot = null;

io.sockets.on('connection', function (socket) {
  clients = clients.concat(socket);
  socket.emit('robotStatus', robot ? "connected" : "disconnected");
  socket.on('action', function (data) {
    if (robot) {
      robot.write(data.requestId + ":" + data.action.toUpperCase() + "\r\n");
    }
  });
});

io.sockets.on('disconnect', function (socket) {
  var index = clients.indexOf(socket);
  if (index > -1) {
    clients.splice(index);
  }
});

var net = require('net');
var robotServer = net.createServer(function (socket) {
  socket.setEncoding("utf-8");
  socket.on('data', function (data) {
    data = data.split("\n");
    data.forEach(function (requestId) {
      if (requestId) {
        clients.forEach(function (socket) {
          socket.emit('actionResult', {
            requestId: requestId,
            status: "OK"
          });
        });
      }
    })
  });
  socket.on('end', function () {
    robot = null;
    clients.forEach(function (socket) {
      socket.emit('robotStatus', "disconnected");
    });
  });
  robot = socket;
  clients.forEach(function (socket) {
    socket.emit('robotStatus', "connected");
  });
});

var robotServerPort = 465;
robotServer.listen(robotServerPort, ipaddress, function () {
  console.log('Robot server listening on port ' + robotServerPort);
});
