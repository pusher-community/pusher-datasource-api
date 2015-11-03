# Pusher Data Stream

A service that lets users search the Twitter stream for search terms using [Pusher](http://www.pusher.com).

# How it Works

Using the [Pusher JS](https://github.com/pusher/pusher-js) library, the client should subscribe to a channel name, where the channel name is the search term. Because of restrictions on Pusher channel names, this name should be Base64 encoded:

```js
// Client
var pusher = new Pusher(YOUR_APP_KEY);
var channelName = 'javascript';
var channel = pusher.subscribe(btoa(channelName));

channel.bind('new_tweet', function(data) {
  console.log('got tweet', data.tweet);
  console.log('matched search term', data.searchTerm);
});
```

You'll need to configure your Pusher app to send [channel existence webhooks](https://pusher.com/docs/webhooks#channel-existence) to this server, which accepts `POST /webhook`. The server will then start the Twitter stream and trigger events when new tweets are found.

The server supports searching for multiple keywords at once and will stop searching once all users vacate a given channel.


