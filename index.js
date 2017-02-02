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

var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'pug');

//Paths

// /homepage

// app.get('/', function(request, response) {
//   var sort = request.query.sort;
//   if (sort === 'top') {

//   }
//   redditAPI.getAllPosts({
//     numPerPage: 25,
//     page: 0
//   }, function(err, result) {
//     if (err) {
//       return (err);
//     }
//     else {
//       response.render('post-list', {
//         posts: [result]
//       });
//     }
//   })
// })

//  /createContent

app.get('/createContent', function(request, response) {
  response.render('create-content');
});

app.post('/createContent', function(request, response) {
  redditAPI.createPost({
    userId: 1,
    title: request.body.title,
    url: request.body.url,
    subredditId: 1,
  }, function(err, post) {
    if (err) {
      console.log('Your post was not created ' + err);
    }
    else {
      response.redirect(303, `/posts/`);
    }
  });
});

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

// app.get('/login', function(request, response) {
//   response.render('login'); 
// });

// app.post('/login', function(request, response) {

// })

// /posts

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

// /homepage

app.get('/:sort', function(request, response) {
  redditAPI.getAllPosts(request.params.sort, {
    numPerPage: 25,
    page: 0,
  }, function(err, posts) {
    if (err) {
      console.log(err);
    }
    else {
      response.render('post-list', {
        posts: posts
      });
    }
  });
});

// /subreddits

app.get('/r/:subreddit', function(request, response) {
  redditAPI.getAllPostsForSubreddit('top', request.params.subreddit, {
    numPerPage: 25,
    page: 0,
  }, function(err, posts) {
    if (err) {
      console.log(err);
    }
    else {
      response.render('post-list', {
        posts: posts
      });
    }
  });
})
