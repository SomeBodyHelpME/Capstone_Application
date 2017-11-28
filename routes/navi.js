var express = require('express');
var router = express.Router();
var pool = require('../config/dbPool');
var async = require('async');

router.get('/info', function(req, res) {
  var status = req.query.status;
  var user_id = req.query.user_id;

  let taskArray = [
    function(callback) {
      if(!(status && user_id)) {
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
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
              message : "there is no data in DB"
            });//res.status(500).send
            connection.release();
            callback("no id : ");
          } else {
            callback(null, connection, result[0]);
          }
        }
      });//connection.query(user_idxQuery)
    },//funcion(connection, callback)
    function(connection, user, callback) {      //(****) async waterfall방식에서 다음 함수로의 파라미터 이름 달라도 될까?
      if(status === 'client') {
        let infoQuery = 'SELECT rating, count from client WHERE user_idx = ?';
      } else {
        let infoQuery = 'SELECT rating, count from helper WHERE user_idx = ?';
      }

      connection.query(infoQuery, user.user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {             //사실상 여기 들어올 가능성 0, 위에서 걸러질듯?
            res.status(500).send({
              status : "fail",
              message : "there is no data in DB"
            });//res.status(500).send
            callback("no id : ");
          } else {
            res.status(200).send({
              status : "success",
              message : "successfully find data",
              data : result[0]
            })
            callback(null, "successfully find data");
          }
        }
        connection.release();
      });//connection.query(infoQuery)
    }//function(connection, user, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.get('/info')

router.get('/money', function(req, res) {
  var user_id = req.query.user_id;

  let taskArray = [
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
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
              message : "wrong input"
            });//res.status(500).send
            callback("wrong input");
          } else {
            res.status(200).send({
              status : "success",
              message : "successfully get money",
              data : result[0].money
            });
            callback(null, "successfully get money");
          }
        }
        connection.release();
      });//connection.query(user_idxQuery)
    }//funcion(connection, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.get('/money')

router.get('/mypage/set', function(req, res) {
  var user_id = req.query.user_id;

  let taskArray = [
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
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
              message : "successfully get data",
              data : {
                user_name : results[0].user_name,
                phone : results[0].phone,
                about : results[0].about
              }
            });
            callback(null, "successfully get data");
          }
        }
        connection.release();
      });//connection.query(user_idxQuery)
    }//funcion(connection, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.get('/mypage/set')

router.post('/mypage/set', function(req, res) {
  var user_id = req.body.user_id;
  var object = {
    user_name : req.body.user_name,
    phone : req.body.phone,
    about : req.body.about
  };

  let taskArray = [
    function(callback) {
      if(!(user_id)) {
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
    function(connection, callback) {
      let updateUserQuery = 'UPDATE user SET user_name = ?, phone = ?, about = ? WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
      connection.query(updateUserQuery, [object.user_name, object.phone, object.about, user_id], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          callback("internal server error : " + err);
        } else {
          if(result.changedRows != 1) {
            res.status(400).send({         // 잘못된 값이 넘어와서 제대로 수정이 되지 않은 경우
              status : "fail",
              message : "there is no change"
            });
            callback("there is no change");
          } else {
            res.status(201).send({
              status : "success",
              message : "successfully change information"
            });
            callback(null, "successfully change information");
          }
        }
        connection.release();
      });//connection.query(user_idxQuery)
    }//funcion(connection, callback)

  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.post('/mypage/post')

//(***) User Image get
router.get('/mypage', function(req, res) {

});//router.get('/mypage')

router.get('/bookmark', function(req, res) {
  var user_id = req.query.user_id;

  let taskArray = [
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
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
            callback(null, connection, result[0]);
          }
        }
      });//connection.query(user_idxQuery)
    },//funcion(connection, callback)
    function(connection, user, callback) {
      let userBookmarkQuery = 'SELECT * FROM bookmark WHERE user_idx = ?';
      connection.query(userBookmarkQuery, user.user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("internal server error : " + err);
        } else {
          res.status(200).send({
            status : "success",
            message : "successfully get user bookmark",
            data : result[0]
          });
          callback(null, "successfully get user bookmark");
        }
        connection.release();
      });//connection.query(userBookmarkQuery)
    }//function(connection, user, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.get('/bookmark')

router.post('/bookmark', function(req, res) {
  var user_id = req.body.user_id;
  var object = {
    home_lat : req.body.home_lat,
    home_long : req.body.home_long,
    home_name : req.body.home_name,
    school_lat : req.body.school_lat,
    school_long : req.body.school_long,
    school_name : req.body.school_name,
    company_lat : req.body.company_lat,
    company_long : req.body.company_long,
    company_name : req.body.company_name
  };

  let taskArray = [
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(500).send({
              status : "fail",
              message : "there is no id"
            });//res.status(500).send
            connection.release();
            callback("no id : ");
          } else {
            callback(null, connection, result[0]);
          }
        }
      });//connection.query(user_idxQuery)
    },//funcion(connection, callback)
    function(connection, user, callback) {
      let updateUserBookmarkQuery = 'UPDATE bookmark SET home_lat = ?, home_long = ?, home_name = ?, school_lat = ?, school_long = ?, school_name = ?, company_lat = ?, company_long = ?, company_name = ? WHERE user_idx = ?';
      connection.query(updateUserBookmarkQuery, [object.home_lat, object.home_long, object.home_name, object.school_lat, object.school_long, object.school_name, object.company_lat, object.company_long, object.company_name, user.user_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("internal server error : " + err);
        } else {
          res.status(201).send({
            status : "success",
            message : "successfully change bookmark"
          });
          callback(null, "successfully change user bookmark");
        }
        connection.release();
      });//connection.query(userBookmarkQuery)
    }//function(connection, user, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});//router.post('/bookmark')

router.get('/log', function(req, res) {
  var user_id = req.query.user_id;

  let taskArray = [
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
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(500).send({
              status : "fail",
              message : "there is no id"
            });//res.status(500).send
            connection.release();
            callback("no id : ");
          } else {
            callback(null, connection, result[0]);
          }
        }
      });//connection.query(user_idxQuery)
    },//funcion(connection, callback)
    function(connection, user, callback) {
      let pastTaskQuery = 'SELECT * FROM past_task WHERE user_idx = ?';
      connection.query(pastTaskQuery, user.user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("internal server error : " + err);
        } else {
          res.status(200).send({
            status : "success",
            message : "successfully get user past task",
            data : result
          });
          callback(null, "successfully get user past task");
        }
        connection.release();
      });//connection.query(userBookmarkQuery)
    }//function(connection, user, callback)
  ];

  async.waterfall(taskArray, function(err, result) {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//router.get('/log')

module.exports = router;
