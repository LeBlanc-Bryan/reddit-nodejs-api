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
