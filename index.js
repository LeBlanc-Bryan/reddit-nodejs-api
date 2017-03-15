var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'leblancbryan',
  password: '',
  database: 'reddit',
  multipleStatements: true
});

var reddit = require('./reddit');
var redditAPI = reddit(connection);

var express = require('express');
var app = express();


var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'pug');

var cookieParser = require('cookie-parser');
app.use(cookieParser());

var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

// Check cookie

function checkLoginToken(request, response, next) {
  if (request.cookies.SESSION) {
    redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
      if (err) {
        console.log(err);
      }
      if (user) {
        request.loggedInUser = JSON.stringify(user[0].userId);
        console.log('the logged in user is ' + request.loggedInUser);
      }
      next();
    });
  }
  else {
    next();
  }
}

app.use(checkLoginToken);

// /signup

app.get('/signup', function(request, response) {
  response.render('signup');
});

app.post('/signup', function(request, response) {
  redditAPI.createUser({
    username: request.body.username,
    password: request.body.password,
  }, function(err, user) {
    if (err) {
      console.log('User not created ' + err);
    }
    else {
      response.redirect(303, `/top`);
    }
  });
});

// /login

app.get('/login', function(request, response) {
  response.render('login');
});

app.post('/login', function(request, response) {
  redditAPI.checkLogin(request.body.username, request.body.password, function(err, user) {
    if (err) {
      response.status(401).send(err.message);
    }
    else(
      redditAPI.createSession(user.id, function(err, token) {
        if (err) {
          response.status(500).send('an error occured. please try again later!');
        }
        else {
          response.cookie('SESSION', token);
          response.redirect('/');
        }
      }));
  });
});


// /homepage sort by >>> /?sort='' >>> remove injection vulnerability

app.get('/', function(request, response) {
  var sort = request.query.sort;
  if (!sort) {
    sort = 'hot';
  }
  if(request.loggedInUser){
    redditAPI.getUsername(request.loggedInUser, function(err, username) {
    if (err) {
      console.log(err);
    }
    else {
      if (!request.loggedInUser) {
        var user = 'please login';
      }
      else{
        var user = username[0].username;
      }
        redditAPI.getAllPosts('*', request.query.sort, {
        numPerPage: 25,
        page: 0,
      }, function(err, posts) {

        if (err) {
          console.log(err);
        }
        else {
          response.render('post-list', {
            posts: posts,
            username: user,
          });
        }
      });
    }
  });
  }
  else {
      redditAPI.getAllPosts('*', request.query.sort, {
        numPerPage: 25,
        page: 0,
      }, function(err, posts) {
      var user = 'please login';
        if (err) {
          console.log(err);
        }
        else {
          response.render('post-list', {
            posts: posts,
            username: user,
          });
        }
      });
  }
});

// /subreddit sort by >>> /?sort=''

 app.get('/r/:subreddit', function(request, response) {
 var sort = request.query.sort;
  if (!sort) {
    sort = 'hot';
  }
  if(request.loggedInUser){
    redditAPI.getUsername(request.loggedInUser, function(err, username) {
    if (err) {
      console.log(err);
    }
    else {
      if (!request.loggedInUser) {
        var user =  'please login';
      }
      else{
        var user = username[0].username;
      }
        redditAPI.getAllPosts(request.params.subreddit, request.query.sort, {
        numPerPage: 25,
        page: 0,
      }, function(err, posts) {
          var subreddit = (posts[0].Subreddit.name);
        if (err) {
          console.log(err);
        }
        else {
          response.render('subreddit', {
            subreddit: subreddit,
            posts: posts,
            username: user,
          });
        }
      });
    }
  });
  }
  else {
      redditAPI.getAllPosts(request.params.subreddit, request.query.sort, {
        numPerPage: 25,
        page: 0,
      }, function(err, posts) {
        var subreddit = (posts[0].Subreddit.name);
        var user = 'please login';
        if (err) {
          console.log(err);
        }
        else {
          response.render('subreddit', {
            subreddit: subreddit,
            posts: posts,
            username: user,
          });
        }
      });
  }
});

// /createContent >> add redirect to post page!

app.get('/createContent', function(request, response) {
  response.render('create-content');
});

app.post('/createContent', function(request, response) {
  if (!request.loggedInUser) {
    response.status(401).send('You must be logged in to create content!');
  }
  else {
    redditAPI.createContent({
      userId: request.loggedInUser,
      title: request.body.title,
      url: request.body.url,
      subredditName: request.body.subreddit,
    }, function(err, post) {
      if (err) {
        console.log('Your post was not created ' + err);
      }
      else {
        response.redirect(303, `/r/${request.body.subreddit}`);
      }
    });
  }
});

// /user

app.get('/u/:user', function(request, response) {
  var sort = request.query.sort;
  if (!sort) {
    sort = 'hot';
  }
  redditAPI.getAllPostsForUser(request.params.user, sort, {
    numPerPage: 25,
    page: 0
  }, function(err, posts) {
    console.log(posts);
    var username = (posts[0].User.username);
    if (err) {
      console.log(err);
    }
    else {
      response.render('user-posts', {
        posts: posts,
        username: username
      });
    }
  });
});

app.post('/vote', function(request, response) {
  if (!request.loggedInUser) {
    response.status(401).send('You must be logged in to vote!');
  }
  else {
    console.log('vote check for userid = ' + request.loggedInUser);
    redditAPI.createOrUpdateVote({
        userId: request.loggedInUser,
        postId: request.body.postId,
        voteDir: request.body.vote,
      },
      function(err, results) {
        if (err) {
          console.log("Vote not cast " + err);
        }
        else {
          response.redirect(request.body.url);
        }
      }
    );
  }
});


// /posts >>> old code

// app.get('/posts', function(request, response) {
//   redditAPI.getAllPosts('controversial', {
//     numPerPage: 25,
//     page: 0
//   }, function(err, posts) {
//     if (err) {
//       return err;
//     }
//     else {
//       // console.log(posts);
//       response.render('post-list', {
//         posts: posts
//       });
//     }
//   });
// });
