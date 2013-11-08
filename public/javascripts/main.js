(function () {
  var requestId = 0;
  var requestsTimestamps = {};
  var socket = null;

  this.main = function () {
    connectToServer();
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.addEventListener('click', action)
    }
  };

  function connectToServer() {
    socket = io.connect("http://robot-duborenko.rhcloud.com:8000/");
    socket.on('robotStatus', function (data) {
      document.getElementById('robotStatus').innerHTML = data;
    });
    socket.on('actionResult', function (data) {
      console.log("Time: " + (new Date().getTime() - requestsTimestamps[data.requestId]) + "ms, response:", data);
      delete requestsTimestamps[data.requestId]
    });
  }

  function action(event) {
    var element = event.target;
    var rId = requestId++;
    requestsTimestamps[rId] = new Date().getTime();
    socket.emit('action', {action: element.id, requestId: rId})
  }

  var actions = {
    w: "forward",
    s: "backward",
    a: "left",
    d: "right"
  };

  window.addEventListener('keypress', function (e) {
    var action = actions[String.fromCharCode(e.charCode)];
    if (action) {
      var el = document.getElementById(action);
      var evObj = document.createEvent('Events');
      evObj.initEvent('click', true, false);
      el.dispatchEvent(evObj);
    }
  });
})();