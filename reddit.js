var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {

      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO users (username,password, createdAt) VALUES (?, ?, ?)', [user.username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                      callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    createPost: function(post, callback) {
      conn.query(
        'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, new Date(), post.subredditId],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id, title, url, userId, createdAt, updatedAt, subredditId FROM posts WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getAllPosts: function(sortingMethod, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var sortBy ='posts.createdAt DESC';
      
      if(sortingMethod === 'top') {
        sortBy = 'voteScore DESC';
      }
      else if(sortingMethod === 'hot') {
        sortBy = 'voteScore DESC, posts.createdAt DESC';
      }
      else if(sortingMethod === 'controversial') {
        sortBy = 'voteCount DESC, voteScore ASC';
      }
      
      conn.query(`
        SELECT SUM(votes.vote) AS voteScore, COUNT(votes.vote) AS voteCount, posts.id, posts.title, posts.url, posts.createdAt, posts.updatedAt, users.id as userId, users.username, users.createdAt as usercreatedAt, users.updatedAt as userupdatedAt, subreddits.id as subredditId, subreddits.name as subredditName, subreddits.description, subreddits.createdAt as subredditcreatedAt, subreddits.updatedAt as subredditupdatedAt
        FROM posts
        LEFT JOIN votes
        ON posts.id = votes.postId
        LEFT JOIN users
        ON posts.userId=users.id
        LEFT JOIN subreddits 
        ON posts.subredditId = subreddits.id
        GROUP BY posts.id
        ORDER BY ${sortBy}
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, results.map(function(res) {
              return {
                User: {
                  id: res.userId,
                  username: res.username,
                  createdAt: res.usercreatedAt,
                  updatedAt: res.userupdatedAt,
                },
                Subreddit: {
                  id: res.subredditId,
                  name: res.subredditName,
                  description: res.description,
                  createdAt: res.subredditcreatedAt,
                  updatedAt: res.subredditcreatedAt,
                },
                Post: {
                  id: res.id,
                  title: res.title,
                  url: res.url,
                  createdAt: res.createdAt,
                  updatedAt: res.updatedAt,
                  voteScore: res.voteScore,
                  voteCount: res.voteCount,
                }
              }
            }))
          }
        }
      );
    },
    getAllPostsForUser: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var user = userId;

      conn.query(`
        SELECT SUM(votes.vote) AS voteScore, COUNT(votes.vote) AS voteCount, posts.id, posts.title, posts.url, posts.createdAt, posts.updatedAt, users.id as userId, users.username, users.createdAt as usercreatedAt, users.updatedAt as userupdatedAt, subreddits.id as subredditId, subreddits.name as subredditName, subreddits.description, subreddits.createdAt as subredditcreatedAt, subreddits.updatedAt as subredditupdatedAt
        FROM posts
        JOIN votes
        ON votes.postId = posts.id 
        JOIN users
        ON posts.userId=users.id
        JOIN subreddits 
        ON posts.subredditId = subreddits.id
        WHERE posts.userId = ?
        ORDER BY posts.createdAt DESC
        LIMIT ? OFFSET ?`, [user, limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null,

              results.map(function(res, index, array) {

                return {
                  User: {
                    id: res.userId,
                    username: res.username,
                    createdAt: res.usercreatedAt,
                    updatedAt: res.userupdatedAt,
                  },
                  Subreddit: {
                    id: res.subredditId,
                    name: res.subredditName,
                    description: res.description,
                    createdAt: res.subredditcreatedAt,
                    updatedAt: res.subredditcreatedAt,
                  },
                  Post: {
                    id: res.id,
                    title: res.title,
                    url: res.url,
                    createdAt: res.createdAt,
                    updatedAt: res.updatedAt,
                    voteScore: res.voteScore,
                    voteCount: res.voteCount,
                  }
                }
              }))
          }
        }
      );
    },
    getSinglePost: function(postId, callback) {
      // In case we are called without an options parameter, shift all the parameters manually

      var post = postId;

      conn.query(`
        SELECT posts.id, posts.title, posts.url, posts.createdAt, posts.updatedAt, users.id as userId, users.username, users.createdAt as usercreatedAt, users.updatedAt as userupdatedAt
        FROM posts
        JOIN users
        ON posts.userId=users.id
        WHERE posts.id = ?
        `, [post],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null,

              results.map(function(res, index, array) {
                return {
                  id: res.id,
                  title: res.title,
                  url: res.url,
                  createdAt: res.createdAt,
                  updatedAt: res.updatedAt,
                  User: {
                    id: res.userId,
                    username: res.username,
                    createdAt: res.usercreatedAt,
                    updatedAt: res.userupdatedAt,
                  }
                }
              })
              .pop()
            );
          }
        }
      );
    },
    createSubreddit: function(subreddit, callback) {
      conn.query(
        'INSERT INTO subreddits(name, description, createdAt) VALUES (?, ?, ?)', [subreddit.name, subreddit.description, new Date()],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id, name, description, createdAt, updatedAt FROM subreddits WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getAllSubreddits: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      conn.query(`
        SELECT * 
        FROM subreddits
        ORDER BY subreddits.createdAt DESC
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, results)
            return results;
          }
        })
    },
    createOrUpdateVote: function(vote, callback) {
      var postId = vote.postId;
      var userId = vote.userId;
      var voteDir = vote.voteDir;
      if (voteDir !== 0 && voteDir !== 1 && voteDir !== -1) {
        console.log("Vote did not equal 1, 0 or -1.");
      }
      else {
        conn.query(`
    INSERT INTO votes 
    SET postId=?, voterId=?, vote=?, createdAt = NOW() 
    ON DUPLICATE 
    KEY UPDATE vote=?`, [postId, userId, voteDir, voteDir],

          function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, results);
              return results;
            }
          })
      }
    },
getAllPostsForSubreddit: function(sortingMethod, subreddit, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var sortBy ='posts.createdAt DESC';
      
      if(sortingMethod === 'top') {
        sortBy = 'voteScore DESC';
      }
      else if(sortingMethod === 'hot') {
        sortBy = 'voteScore DESC, posts.createdAt DESC';
      }
      else if(sortingMethod === 'controversial') {
        sortBy = 'voteCount DESC, voteScore ASC';
      }
      
      conn.query(`
        SELECT SUM(votes.vote) AS voteScore, COUNT(votes.vote) AS voteCount, posts.id, posts.title, posts.url, posts.createdAt, posts.updatedAt, users.id as userId, users.username, users.createdAt as usercreatedAt, users.updatedAt as userupdatedAt, subreddits.id as subredditId, subreddits.name as subredditName, subreddits.description, subreddits.createdAt as subredditcreatedAt, subreddits.updatedAt as subredditupdatedAt
        FROM posts
        LEFT JOIN votes
        ON posts.id = votes.postId
        LEFT JOIN users
        ON posts.userId=users.id
        LEFT JOIN subreddits 
        ON posts.subredditId = subreddits.id
        WHERE subreddits.name = '${subreddit}''
        GROUP BY posts.id
        ORDER BY ${sortBy}
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, results.map(function(res) {
              return {
                User: {
                  id: res.userId,
                  username: res.username,
                  createdAt: res.usercreatedAt,
                  updatedAt: res.userupdatedAt,
                },
                Subreddit: {
                  id: res.subredditId,
                  name: res.subredditName,
                  description: res.description,
                  createdAt: res.subredditcreatedAt,
                  updatedAt: res.subredditcreatedAt,
                },
                Post: {
                  id: res.id,
                  title: res.title,
                  url: res.url,
                  createdAt: res.createdAt,
                  updatedAt: res.updatedAt,
                  voteScore: res.voteScore,
                  voteCount: res.voteCount,
                }
              }
            }))
          }
        }
      );
    }
    }
}