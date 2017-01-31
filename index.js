var mysql = require('mysql');
//
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'leblancbryan',
  password: '',
  database: 'reddit'
});
//
var reddit = require('./reddit');
var redditAPI = reddit(connection);
//
var express = require('express');
var app = express();

var server = app.listen(process.env.PORT, process.env.IP, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

// 1.

// app.get('/hello', function (req, res) {
//   res.send('<h1>Hello World!</h1>');
// });

// 2.

// app.get('/hello', function(request, response) {
//   var name = request.query.name;
//   response.end(`<h1> Hello ${name}!`);
// })


// 2b.

// app.get('/hello/:nameId', function(request, response) {
//   var name = request.params.nameId;
//   response.end(`<h1> Hello ${name}! <h1>`);
// })

// 3.

// app.get('/calculator/:operation', function(request, response) {
//   var num1 = request.query.num1;
//   var num2 = request.query.num2;
//   var op = request.params.operation;
//   var answer = 0;

//   if(op === 'add') {
//     answer = +num1 + +num2;
//   }
//   else if(op === 'sub') {
//     answer = +num1 - +num2;
//   }
//   else if(op === 'mult') {
//     answer = +num1 * +num2;
//   }
//   else if(op === 'div') {
//     answer = +num1 / +num2;
//   }
//   else {
//     answer = 'ERROR 400 Bad Request';
//   }

//   var obj = {
//     'operator': op,
//     'firstOperand': num1,
//     'secondOperand': num2,
//     'solution': answer
//   };

//   response.end(`<h1>${JSON.stringify(obj)}</h1>`);
// });

// 4.

// app.get('/posts', function(request, response) {
//   request.query.posts = redditAPI.getAllPosts({
//     numPerPage: 5,
//     page: 0
//   }, function(err, resp) {
//     if (err) {
//       return err;
//     }
//     else {
//       var postList = resp.map(function(currentPost) {
//         return (`<li class="content-item">
//         <H2>${currentPost.Post.title}</H2>
//         <H3><a href="${currentPost.Post.url}">${currentPost.Post.url}</a></H3>
//         <p>Created by: ${currentPost.User.username}</p>
//         <p>Created on: ${currentPost.Post.createdAt}</p>
//         <p>Updated on: ${currentPost.Post.updatedAt}</p>
//         </li>`);
//       });
//       var pageStr =
//         `<div id="contents">
//           <h1>Post Info</h1>
//             <ul class="contents-list">
//                 ${postList}   
//             </ul>
//         </div>`;
//       response.end(pageStr);
//     }
//   });
// });
