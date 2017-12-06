var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var async = require('async');
var pool = require('../config/dbPool');

router.post('/login', function(req, res) {
  var user = {
    user_id : req.body.user_id,
    user_pw : req.body.user_pw
  };
  let taskArray = [
    //1. connection 가져오기
    function(callback) {
      if(!(user.user_id && user.user_pw)) {
        res.status(500).send({
          status : "fail",
          message : "wrong input"
        });
        callback("input error");
      } else {
        pool.getConnection(function(err, connection) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });
            callback("internal server error : " + err);
          }
          else callback(null, connection);
        });//pool.getConnection
      }
    },
    //2. connection으로 쿼리 실행
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user.user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(500).send({
              status : "fail",
              message : "failed login"
            });//res.status(500).send
            callback("failed login");
          } else {
            crypto.pbkdf2(user.user_pw, result[0].salt, 100000, 32, 'sha512', function(err, hashed) {
              if(err) {
                console.log(err);
                res.status(500).send({
                  status : "fail",
                  message : "internal server error : " + err
                });
                callback("internal server error : " + err);
              } else {
                if(hashed.toString('base64') === result[0].user_pw) {
                  console.log('matched!!');
                  res.status(201).send({
                    status : "success",
                    message : "success matched"
                  });//res.status(201)
                  callback(null, "success matched");
                } else {
                  console.log('not matched!!');
                  res.status(500).send({
                    status : "fail",
                    message : "failed login"
                  });//res.status(500)
                  callback(null, "failed login");
                }//fourth if
              }//third if
            });//crypto.pbkdf2
          }//second if
        }//first if
        connection.release();
      });//connection.query(user_idxQuery)
    }//function(connection, callback)
  ];
  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });
});//router.post('/login')

router.get('/register/check/:user_id', function(req, res) {
  let user_id = req.params.user_id;
  let taskArray = [
    //1. connection 가져오기
    function(callback) {
      if(!user_id) {
        res.status(500).send({
          status : "fail",
          message : "wrong input"
        });
        callback("wrong input");
      } else {
        pool.getConnection(function(err, connection) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });
            callback("internal server error : " + err);
          }
          else callback(null, connection);
        });//pool.getConnection
      }
    },
    //2. connection으로 쿼리 실행
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(500).send({
              status : "fail",
              message : "there is no id"
            });//res.status(500).send
            callback("no id : ");
          } else {
            res.status(200).send({
              status : "success",
              message : "there is id in DB"
            });//res.status(200).send
            callback(null, "there is id in DB");
          }//second if
        }//first if
        connection.release();
      });//connection.query(user_idxQuery)
    }//function(connection, callback)
  ];
  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });
});//router.get('/register/check')

router.post('/register', function(req, res) {
  var user = {
//    user_idx : req.body.user_idx,
    user_id : req.body.user_id,
    user_name : req.body.user_name,
//    user_pw : req.body.user_pw,
    phone : req.body.phone,
    image : req.body.image,
    about : req.body.about
  };
  let taskArray = [
    function(callback) {
      if(!(user.user_id && user.user_name && req.body.user_pw)) {
        res.status(500).send({
          status : "fail",
          message : "input error"
        });
        callback("input error");
      } else {
        callback(null);
      }
    },
    function(callback) {
      crypto.randomBytes(32,function(err, buffer) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "fail to crypto"
          });
          callback("fail : " + err);
        } else {
          user.salt = buffer.toString('base64');
          console.log(user.salt);
          callback(null);
        }
      });//crypto.randomBytes
    }, //function(callback)
    function(callback) {
      crypto.pbkdf2(req.body.user_pw, user.salt, 100000, 32, 'sha512', function(err, hashed) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "fail to crypto"
          });
          callback("fail : " + err);
        } else {
          console.log('Successful change password!');
          user.user_pw = hashed.toString('base64');
          callback(null);
        }
      });//crypto.pbkdf2
    },
    function(callback) {
      pool.getConnection(function(err, connection) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("get connection err : " + err);
        }
        else {
          var insertJoinQuery = 'INSERT INTO user (user_name, user_idx, salt, user_id, user_pw, phone, money, about) VALUES (?,?,?,?,?,?,?,?)';
          connection.query(insertJoinQuery, [user.user_name, null, user.salt, user.user_id, user.user_pw, user.phone, 0, user.about], function(err) {
            console.log(user);
            if(err) {
              res.status(500).send({
                status : "fail",
                message : "failed register"
              });//res.status(500).send
              connection.release();
              callback("failed register : " + err);
            } else {
              let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
              connection.query(user_idxQuery, user.user_id, function(err, result) {
                if(err) {
                  res.status(500).send({
                    status : "fail",
                    message : "internal server error : " + err
                  });
                  connection.release();
                  console.log("internal server error : " + err);
                } else {
                  let insertClientQuery = 'INSERT INTO client (rating, count, user_user_idx) VALUES (?,?,?)';
                  connection.query(insertClientQuery, [0, 0, result[0].user_idx], function(err2) {
                    if(err2) {
                      res.status(500).send({
                        status : "fail",
                        message : "internal server error : " + err
                      });
                      connection.release();
                      console.log("internal server error : " + err);
                    } else {
                      let insertHelperQuery = 'INSERT INTO helper (rating, count, user_user_idx) VALUES (?,?,?)';
                      connection.query(insertHelperQuery, [0, 0, result[0].user_idx], function(err3) {
                        if(err3) {
                          res.status(500).send({
                            status : "fail",
                            message : "internal server error : " + err
                          });
                          connection.release();
                          console.log("internal server error : " + err);
                        } else {
                          let insertBookMarkQuery = 'INSERT INTO bookmark (user_user_idx) VALUES (?)';
                          connection.query(insertBookMarkQuery, result[0].user_idx, function(err4) {
                            if(err4) {
                              res.status(500).send({
                                status : "fail",
                                message : "internal server error : " + err
                              });
                              connection.release();
                              console.log("internal server error : " + err);
                            } else {
                              res.status(201).send({
                                status : "success",
                                message : "successful registration"
                              });//res.status(201).send
                              connection.release();
                              callback(null, "successful registration");
                            }
                          });//connection.query(insertBookMarkQuery)
                        }
                      });//connection.query(insertHelperQuery)
                    }
                  });//connection.query(insertClientQuery)
                }
              });//connection.query(user_idxQuery)
            }
          });//connection.query(insertJoinQuery)
        }
      });//pool.getConnection

    }//function(callback)
  ];//taskArray

  async.series(taskArray, function (err, result) {
      if(err) console.log(err);
      else console.log(result);
  });//async.series
});//router.post('/register')

router.get('/find/id', function(req, res) {
  var user_name = req.query.user_name;
  if(!user_name) {
    res.status(500).send({
      status : "fail",
      message : "wrong input"
    });
  } else {
    pool.getConnection(function(err, connection) {
      if(err) {
        res.status(500).send({
          status : "fail",
          message : "internal server error : " + err
        });
        console.log("internal server error : " + err);
      }
      else {
        var findUserNameQuery = 'SELECT * FROM user WHERE user_name = ?';
        connection.query(findUserNameQuery, user_name, function(err, result) {
          console.log(result);
          if(err) {                     //first if
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });//res.status(500).send
            console.log("internal server error : " + err);
          } else {
            if(result.length === 0) {   //second if
              res.status(500).send({
                status : "fail",
                message : "there is no name"
              });//res.status(500).send
              console.log("there is no name");
            } else {
              res.status(200).send({
                status : "success",
                message : "successfully get data",
                data : result[0].user_id
              });//res.status(200).send
              console.log("successfully get data");
            }//second if
          }//first if
          connection.release();
        });//connection.query(insertJoinQuery)
      }
    });//pool.getConnection()
  }
});//router.post('/find/id')

router.get('/find/pw', function(req, res) {
  var user_id = req.query.user_id;
  if(!user_id) {
    res.status(500).send({
      status : "fail",
      message : "wrong input"
    });
  } else {
    pool.getConnection(function(err, connection) {
      if(err) {
        res.status(500).send({
          status : "fail",
          message : "internal server error : " + err
        });
        console.log("internal server error : " + err);
      }
      else {
        var findUserIdQuery = 'SELECT * FROM user WHERE user_id = ?';
        connection.query(findUserIdQuery, user_id, function(err, result) {
          if(err) {                     //first if
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });//res.status(500).send
            console.log("internal server error : " + err);
          } else {
            if(result.length === 0) {   //second if
              res.status(500).send({
                status : "fail",
                message : "There is no id"
              });//res.status(500).send
              console.log("There is no id");
            } else {
              res.status(200).send({
                status : "success",
                message : "successfully get data",
                data : result[0].user_pw        //(***) pbfdk변환된 pw값이 넘어옴 이거 해결해야 함
              });//res.status(200).send
              console.log("successfully get data");
            }//second if
          }//first if
          connection.release();
        });//connection.query(insertJoinQuery)
      }
    });//pool.getConnection()
  }
});

module.exports = router;
