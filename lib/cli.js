var fs = require('fs');
var urlParse = require('url').parse;
var http = require('http');
var https = require('https');
var spawn = require('child_process').spawn;
var readline = require('readline');
var _ = require('underscore');
var WebSocketClient = require('websocket').client;

var logoText = fs.readFileSync(__dirname + '/../logo.txt', 'utf8');

var VERSION = 1;
var INACTIVITY_TIMEOUT = 60000;
var RETRY_DELAY = 2000;
var HOSTNAME_RE = /^[A-Za-z0-9\-._]+$/;
var TRACEROUTE = process.platform == 'win32' ? 'tracert' : 'traceroute';
var URL_RE = /^https?:\/\//;

function startTraceroute(hostname, postURL) {
  var options = urlParse(postURL);
  var protocol = (options.protocol == 'http:' ? http : https);
  var req = protocol.request(_.extend(options, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'X-Node-Platform': process.platform,
      'X-MYT-Protocol-Version': VERSION
    }
  }));
  var child = spawn(TRACEROUTE, [hostname]);

  console.log('Starting traceroute to', hostname + '.');
  req.on('error', function() {
    console.log('Disconnected from', postURL + '.');
    try { child.kill(); } catch (e) {}
  });
  child.stdout.pipe(req);
  child.on('exit', function(code) {
    console.log('Traceroute to', hostname, 'ended with code', code + '.');
  });
}

function start(url) {
  var ws = new WebSocketClient();
  var inactivityTimeout = null;
  var conn = null;
  var failed = false;
  var tryAgain = function(reason) {
    return function() {
      if (failed) return;
      failed = true;
      clearTimeout(inactivityTimeout);
      if (conn) {
        conn.close();
        conn = null;
      }
      console.log('Connection closed due to ' + reason +
                  ', retrying in ' + RETRY_DELAY + ' ms.');
      setTimeout(start.bind(null, url), RETRY_DELAY);
    }
  };
  var resetInactivityTimeout = function() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(tryAgain('timeout'), INACTIVITY_TIMEOUT);
  };

  ws.connect(url);
  ws.on('connectFailed', tryAgain('connect failure'));
  ws.on('connect', resetInactivityTimeout);
  ws.on('connect', function(c) {
    console.log('Connected to', url + '.');
    if (conn) throw new Error('Assertion failure, multiple connections');
    conn = c;
    conn.on('close', tryAgain('websocket closing'));
    conn.on('error', tryAgain('websocket error'));
    conn.on('message', resetInactivityTimeout);
    conn.on('message', function(data) {
      if (data.type != 'utf8') return;
      try {
        data = JSON.parse(data.utf8Data);
        if (data.version != VERSION)
          throw new Error('version mismatch, please upgrade client.');
        if (data.type == 'heartbeat') {
          console.log('Received heartbeat.');
          return;
        }
        if (!HOSTNAME_RE.test(data.hostname || ''))
          throw new Error('invalid hostname ' + data.hostname);
        if (!URL_RE.test(data.postURL || ''))
          throw new Error('invalid webhook ' + data.postURL);
        urlParse(data.postURL);
      } catch (e) {
        console.error(e.toString());
        return;
      }

      startTraceroute(data.hostname, data.postURL);
    });
  });
}

function askForUrl() {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Please enter the URL to connect to: ", function(url) {
    rl.close();

    if (!url) {
      console.log("Fine, be that way.");
      return process.exit(1);
    }
    start(url);
  });
}

exports.run = function() {
  console.log(logoText);
  if (!process.argv[2])
    askForUrl();
  else
    start(process.argv[2]);
};
