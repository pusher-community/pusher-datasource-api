if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var express = require('express');
var http = require('http');
var streamer = require('./streamer');
var base64 = require('./base64');
var Pusher = require('pusher');

var app = express();

var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET
});

streamer.pusher = pusher;

// needed as Pusher lib requires a rawData parameter
app.use(function(req, res, next) {
  var data = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.rawBody = data;
    next();
  });
});

app.get('/ping', function(req, res) {
  res.json({ pong: true });
});

app.post('/webhook', function(req, res) {
  var webhook = pusher.webhook(req);
  if (!webhook.isValid()) {
    console.log('Webhook not valid, sending 403');
    res.sendStatus(403);
    return;
  }

  var events = webhook.getEvents();
  events.forEach(function(event) {
    if (event.name === 'channel_occupied') {
      streamer.subscribe(event.channel);
    } else {
      streamer.unsubscribe(event.channel);
    }
  });

  res.json({});
});

app.get('/subscribe/:channel', function(req, res) {
  if (req.params.channel) {
    streamer.subscribe(base64.encode(req.params.channel));
  }

  res.json({});
});

app.get('/unsubscribe/:channel', function(req, res) {
  if (req.params.channel) {
    streamer.unsubscribe(base64.encode(req.params.channel));
  }

  res.json({});
});

var server = http.createServer(app);

server.listen(process.env.PORT || '5000');

server.on('listening', function() {
  console.log('Server running on ', process.env.PORT || '5000');
});
