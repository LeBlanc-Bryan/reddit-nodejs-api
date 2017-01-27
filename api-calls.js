var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'leblancbryan',
  password: '',
  database: 'reddit'
});

var reddit = require('./reddit');
var redditAPI = reddit(connection);

// redditAPI.getAllPostsForUser(1, function(err, res) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     console.log(res);
//     return res;
//   }
// });

// redditAPI.createPost({
//                     userId: 1,
//                     title: 'Huzzah!',
//                     url: 'https://reddit.com'
//                 }, function(err, post) {
//                   if(err) {
//                     console.log('Your post was not created ' + err);
//                   }
//                   else{
//                     console.log(post);
//                   }
//                 })

// redditAPI.getAllPostsForUser(1, function(err, response){
//   if (err) {
//     console.log(err);
//   }
//   else{
//     console.log(response);
//   }
// })

redditAPI.getSinglePost(1, function(err, response) {
  if(err) {
    console.log(err);
  }
  else {
    console.log(response);
  }
})