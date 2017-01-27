var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'leblancbryan',
  password : '',
  database: 'reddit'
});

var reddit = require('./reddit');
var redditAPI = reddit(connection);

redditAPI.getAllPosts(function(err, res) {
  if(err) {
    console.log("Why must I cry?");
  }
  else{
    console.log(res);
    return res;
  }
  
});
