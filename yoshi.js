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

function checkLoginToken(request, response, next) {
  if(request.cookies.SESSION) {
      console.log("EH3");
    redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
     console.log("EH4");
      if(user) {
          console.log("EH5");
        request.loggedInUser = user;
      }
      console.log("BOOM");
      next();
    });
  }
  else{
    next();
  }
}
app.use(checkLoginToken);

console.log("EH");
app.get('/', function(request, response) {
  var sort = request.query.sort;
  if(!sort) {
    sort = 'hot';
  }
  redditAPI.getAllPosts(('*'), request.query.sort, {
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
console.log("OH");
var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});


