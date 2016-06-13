/*
 *
 */
angular.module("angular-realtime-change", [])

.run(['$realtime', function ($realtime) {
  console.log("$realtime", $realtime);
}])

.provider("$realtime", [function () {

  var _config = {
    socket: {
      server: 'http://localhost:5000',
      options: {
        'pingInterval': 5000,
        'pingTimeout': 15000,
        'reconnectionDelay': 5000,
        'reconnectionDelayMax' : 15000
      }
    }
  };

  return {
    setSocketServer: function(server){
      _config.socket.server = server;
    },
    setSocketOptions: function (options) {
      _config.socket.options = options;
    },
    $get: ['$rootScope', function ($rootScope) {

      var _socket = null;

      var _connect = function(authorizationParams){
        if(_socket) _disconnect();

        _config.socket.options.query = 'authorization=' + JSON.stringify(authorizationParams);
        _socket = io(_config.socket.server, _config.socket.options);
        _defineListeners();
      };

      var _disconnect = function(){
        try{
          if(_socket){
            _socket.close();
            _socket = null;
          }
        }catch(e){ console.log(e); }
      };

      var _request = function(params){
        if(_socket && _socket.connected) _socket.emit('request-server', params);
      };

      var _defineListeners = function(){
        _socket.on('connect', function() {
          $rootScope.$broadcast('realtime:connected');
        });
        _socket.on('server-message', function(message) {
          var broadcast;
          if(message.resource){
            broadcast = message.type.toLowerCase() + ':' + message.resource.toLowerCase() + ':' + message.action.toLowerCase();
          }else{
            broadcast = message.type.toLowerCase() + ':' + message.action.toLowerCase();
          }

          $rootScope.$broadcast(broadcast, message);
        });
        _socket.on('reconnecting', function(attempts) {
          $rootScope.$broadcast('realtime:reconnecting', attempts);
        });
        _socket.on('reconnect', function() {
          $rootScope.$broadcast('realtime:reconnected');
        });
        _socket.on('disconnect', function(error) {
          $rootScope.$broadcast('realtime:disconnected', error);
        });
      };

      return {
        connect: function(authorizationParams){
          return _connect(authorizationParams);
        },
        disconnect: function(){
          return _disconnect();
        },
        request: function(params){
          return _request(params);
        },
        isConnected: function(){
          return _socket && _socket.connected;
        }
      };
    }]
  };
}]);