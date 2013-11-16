(function () {
  var requestId = 0;
  var requestsTimestamps = {};
  var socket = null;

  this.main = function () {
    connectToServer();
    // todo html buttons
    /*var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      button.addEventListener('click',
        function (event) {
          sendCommand('action', [event.target.id]);
        })
    }*/
  };

  function connectToServer() {
    socket = io.connect(window.location.origin);
    socket.on('robotStatus', function (data) {
      document.getElementById('robotStatus').innerHTML = data;
    });
    socket.on('actionResult', function (data) {
      console.log("Time: " + (new Date().getTime() - requestsTimestamps[data.requestId]) + "ms, response:", data);
      delete requestsTimestamps[data.requestId]
    });
  }

  var actions = {
    "Up": 1,
    "Down": 2,
    "Left": 4,
    "Right": 8
  };

  function sendCommand(cmdName, cmdData) {
    var rId = requestId++;
    requestsTimestamps[rId] = new Date().getTime();
    socket.emit(cmdName, {data: cmdData, requestId: rId})
  }

  var pressedKeys = {};
  var timer = null;

  function arrowsOnly(cb) {
    return function (e) {
      if (Object.keys(actions).indexOf(e.keyIdentifier) != -1) {
        cb(e);
      }
    }
  }

  function onPressedKeysChange(msg, pressedKeys) {
    console.log(msg, pressedKeys);
    sendCommand('action', pressedKeys.reduce(function (res, item) {
      return res + actions[item];
    }, 0));
  }

  window.addEventListener('keydown', arrowsOnly(function (e) {
    if (pressedKeys.hasOwnProperty(e.keyIdentifier)) {
      return
    }
    pressedKeys[e.keyIdentifier] = null;
    onPressedKeysChange(">>>", Object.keys(pressedKeys));
    if (!timer) {
      timer = setInterval(function () {
        onPressedKeysChange("!!!", Object.keys(pressedKeys));
      }, 200)
    }
  }));

  window.addEventListener('keyup', arrowsOnly(function (e) {
    delete pressedKeys[e.keyIdentifier];
    var keys = Object.keys(pressedKeys);
    onPressedKeysChange("<<<", keys);
    if (keys.length == 0) {
      timer = clearInterval(timer);
    }
  }));
})();