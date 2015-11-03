if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

var express = require('express');
var http = require('http');
var streamer = require('./streamer');
var base64 = require('./base64');
var bodyParser = require('body-parser');
var Pusher = require('pusher');

var app = express();

var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET
});

streamer.pusher = pusher;

app.use(bodyParser.json());
app.post('/webhook', function(req, res) {
  console.log('webhook request', req.body);
  var webhook = pusher.webhook(req);
  if (!webhook.isValid()) {
    res.json({ error: 'Webhook was not valid' });
    return;
  }

  var events = req.body.events;
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
