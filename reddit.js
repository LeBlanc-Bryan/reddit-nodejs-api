var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;
var secureRandom = require('secure-random');

function createSessionToken() {
  return secureRandom.randomArray(100).map(code => code.toString(36)).join('');
}

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO users (username,password, createdAt) VALUES (?, ?, ?)', [user.username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
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
        }
      });
    },
    createContent: function(post, callback) {
      console.log('the post object is ' + post);
      conn.query(`
      SELECT id from subreddits where name = ?`, [post.subredditName], function(err, sub) {
        if (err) {
          callback(err);
        }
        else {
          var subreddit = JSON.stringify(sub[0].id);
          conn.query(
            'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, new Date(), subreddit],
            function(err, post) {
              console.log('the modified post object is' + post);
              if (err) {
                callback(err);
              }
              else {
                conn.query(
                  'SELECT id, title, url, userId, createdAt, updatedAt, subredditId FROM posts WHERE id = ?', [post.insertId],
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
        }
      })

    },
    getAllPosts: function(subreddit, sort, options, callback) {
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      var sortBy = 'voteScore DESC, posts.createdAt DESC';
      var sub = `WHERE subreddits.name = '${subreddit}' `;
      
      if(subreddit === '*') {
      sub = '';
      }

      if (sort === 'top') {
        sortBy = 'voteScore DESC';
      }
      else if (sort === 'new') {
        sortBy = 'posts.createdAt DESC';
      }
      else if (sort === 'controversial') {
        sortBy = 'voteCount DESC, voteScore ASC';
      }
      conn.query(`
        SELECT SUM(votes.vote) AS voteScore, COUNT(votes.vote) AS voteCount, 
        posts.id, posts.title, posts.url, posts.createdAt, posts.updatedAt, 
        users.id as userId, users.username, users.createdAt as usercreatedAt, 
        users.updatedAt as userupdatedAt, subreddits.id as subredditId, 
        subreddits.name as subredditName, subreddits.description, 
        subreddits.createdAt as subredditcreatedAt, 
        subreddits.updatedAt as subredditupdatedAt
        FROM posts
        LEFT JOIN votes
        ON posts.id = votes.postId
        LEFT JOIN users
        ON posts.userId=users.id
        LEFT JOIN subreddits 
        ON posts.subredditId = subreddits.id
        ${sub}
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
              };
            }));
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
                };
              }));
          }
        }
      );
    },
    getSinglePost: function(postId, callback) {
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
                };
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
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25;
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
            callback(null, results);
            return results;
          }
        });
    },
    createOrUpdateVote: function(vote, callback) {
      var postId = vote.postId;
      var userId = vote.userId;
      var voteDir = +vote.voteDir;

      conn.query(`
        SELECT vote
        FROM votes 
        WHERE(voterId in (?) and  postId in (?))
        `, [(+userId), (+postId)],
        function(err, result) {
          console.log((+voteDir) + ' ' +(+JSON.stringify(result[0].vote)));
          if (err) {
            console.log(err);
          }
          else if ((+voteDir) === (+JSON.stringify(result[0].vote))) {
            console.log('started 0 query');
            conn.query(`
              UPDATE votes
              SET vote = 0
              WHERE(voterId in (?) and  postId in (?))
              `, [(+userId), (+postId)],
              function(err, results) {
                console.log(results);
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, results);
                  return results;
                }
              });
          }
          else {
            conn.query(`
              INSERT INTO votes 
              SET postId=?, voterId=?, vote=?, createdAt = NOW() 
              ON DUPLICATE 
              KEY UPDATE vote=?`, [postId, userId, voteDir, voteDir],
              function(err, results) {
                console.log(results);
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, results);
                  return results;
                }
              }
            );
          }
        }
      )
    },
    checkLogin: function(user, pass, callback) {
      conn.query(`
      SELECT *
      FROM users
      WHERE username = ?
      `, [user], function(err, result) {
        if (result.length === 0) {
          callback(new Error('username or password incorrect'));
        }
        else {
          var user = result[0];
          var actualHashedPassword = user.password;
          bcrypt.compare(pass, actualHashedPassword, function(err, result) {
            if (result === true) {
              callback(null, user);
            }
            else {
              callback(new Error('username or password incorrect'));
            }
          });
        }
      });
    },
    createSession: function(userId, callback) {
      var token = createSessionToken();
      conn.query(`
      INSERT INTO sessions
      SET userId = ?, token = ?`, [userId, token], function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, token);
        }
      });
    },
    getUserFromSession: function(cookie, callback) {
      conn.query(`
      SELECT userId 
      FROM sessions
      WHERE token = ?`, [cookie+''],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, result);
          }
        });
    }
  };
};
