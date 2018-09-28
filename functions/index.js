const functions = require('firebase-functions');
var express = require('express');
var cors = require('cors');
var axios = require('axios');
var Twit = require('twit');
var twitterConfig = require('./twitter-config'); // containts twitter app api keys 

const app = express();
app.use(cors());

var config = twitterConfig.mobileads;
var twitterPageId = '853113165210460160'; // client's twitter page. In order for this app to send direct message, the twitter user(audience) has to follow this first.

app.get('/', (req, res) => {
  res.send('Hello World');
});

var mobileadsTwit = new Twit(config);
var clientTwit = new Twit(twitterConfig.client);

app.post('/sendMessage', function(req, res) {
  clientTwit.post('direct_messages/events/new', {
    "event": {
      "type": "message_create",
      "message_create": {
        "target": {
          "recipient_id": req.body.recipientId
        },
        // "sender_id": "2166166477", 
        "sender_id": twitterPageId,
        "message_data": {
          "text": req.body.text
        }
      }
    }
  }, function(err, data, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      res.send(data);
    }
  });
});

app.post('/followUs', function(req, res) {
  var T = new Twit({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token: req.body.token,
    access_token_secret: req.body.tokenSecret
  });
  T.post('friendships/create', {
    user_id: twitterPageId
  }, function(err, data, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      if (response.statusCode == 200) {
        res.send('followed!');
      }
    }
  });
});

app.post('/getUser', function(req, res) {
  mobileadsTwit.get('followers/list', {
    user_id: twitterPageId
  }, function(err, data, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      var isFollowing = false;
      for (var u = 0; u < data.users.length; u++) {
        if (data.users[u].id_str == req.body.id) {
          isFollowing = true;
        }
      }

      if (isFollowing) {
        res.send('following');
      }
      else {
        res.send('not following');
      }
    }
  });
});

app.post('/checkFriendship', function(req, res) {
  mobileadsTwit.get('friendships/show', {
    source_id: req.body.id,
    target_id: twitterPageId
  }, function(err, data, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
     if (data.relationship.source.following) {
      res.send('following');
     }
     else {
      res.send('not following');
     }
    }
  });
});
/* /listenFollow not used anymore */
/*app.post('/listenFollow', function(req, res) {
  var S = new Twit(config);
  var stream = S.stream('user');
  stream.on('follow', function(eventMsg) {
    if (eventMsg.source.id_str == req.body.id) {
      stream.stop();
      res.send('followed!');
    }
  });
});*/

exports.twitter = functions.https.onRequest(app);