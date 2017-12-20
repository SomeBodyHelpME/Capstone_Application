var express = require('express');
var router = express.Router();
var async = require('async');
var pool = require('../config/dbPool');
var moment = require('moment');
//var admin = require("firebase-admin");
//var serviceAccount = require("somebodyhelpme-52033-firebase-adminsdk-9074j-246da2b765.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
// });

router.get('/client/check', function(req, res) {
  let user_id = req.query.user_id;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!user_id) {
        res.status(400).send({
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. search client's task
    function(connection, user_idx callback) {
      let findClientTaskQuery = 'SELECT * FROM curr_task WHERE client_user_user_idx = ?';
      connection.query(findClientTaskQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(200).send({
              status : "success",
              message : "There is No registered data"
            });
            connection.release();
            callback(null, "There is No registered data");
          } else {
            res.status(200).send({
              status : "success",
              message : "There is registered data"
            });
            connection.release();
            callback(null, "There is registered data");
          }
        }
      });//connection.query(findClientTaskQuery)
    }//function(connection, user_idx, callback)
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});

router.post('/client', function(req, res) {
  var user_id = req.body.user_id;
  var object = {
    task_type : req.body.task_type,
    cost : req.body.cost,
    details : req.body.details,
    registertime : moment().format("YYYYMMDDHHmmss"),       //register time
    deadline : req.body.deadline,
    requiredtime : req.body.requiredtime,                   //hour
    dest_lat : parseFloat(req.body.dest_lat),
    dest_long : parseFloat(req.body.dest_long),
    dest_name : req.body.dest_name,
    status : "w"
  };

  if(!(user_id && object.task_type && object.cost && object.details && object.dest_lat && object.dest_long && object.dest_name && object.requiredtime)) {
    res.status(400).send({
      status : "fail",
      message : "wrong input"
    });
    console.log("wrong input");
  } else {
    pool.getConnection(function(err, connection) {
      if(err) {
        res.status(500).send({
          status : "fail",
          message : "internal server error : " + err
        });
        console.log("internal server error : " + err);
      } else {
        let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
        connection.query(user_idxQuery, user_id, function(err, result) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });
            console.log("internal server error : " + err);
          } else {
            if(result.length === 0) {
              res.status(400).send({
                status : "fail",
                message : "wrong input"
              });
              console.log("wrong input");
            } else {
              let clientHistoryQuery = 'SELECT rating, count FROM client WHERE user_user_idx = ?';
              connection.query(clientHistoryQuery, result[0].user_idx, function(err, result2) {
                if(err) {
                  res.status(500).send({
                    status : "fail",
                    message : "internal server error : " + err
                  });
                  console.log("internal server error : " + err);
                } else {
                  let registerTaskQuery = 'INSERT INTO curr_task (task_type, cost, details, registertime, deadline, dest_lat, dest_long, dest_name, status, client_user_user_idx, client_rating, client_count, requiredtime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)';
                  connection.query(registerTaskQuery, [object.task_type, object.cost, object.details, object.registertime, object.deadline, object.dest_lat, object.dest_long, object.dest_name, object.status, result[0].user_idx, result2[0].rating, result2[0].count, object.requiredtime], function(err1) {
                    if(err1) {
                      res.status(500).send({
                        status : "fail",
                        message : "internal server error : " + err
                      });
                      console.log("internal server error : " + err);
                    } else {
                      let taskIndexQuery = 'SELECT task_idx FROM curr_task WHERE client_user_user_idx = ?';
                      connection.query(taskIndexQuery, result[0].user_idx, function(err2, result3) {
                        if(err2) {
                          res.status(500).send({
                            status : "fail",
                            message : "internal server error : " + err
                          });
                          console.log("internal server error : " + err);
                        } else {
                          res.status(201).send({
                            status : "success",
                            message : "successfully register current task",
                            data : result3[0].task_idx
                          });//res.status(201)
                          console.log("successfully register current task");
                        }
                      });
                    }
                  });//connection.query(registerTaskQuery)
                }
              });//connection.query(clientHistoryQuery)
            }
          }
        });//connection.query
      }
    });//pool.getConnection
  }
});//router.post('/client')

function radius_func(a, b, c, d) {
  return Math.sqrt((c - a) * (c - a) + (d - b) * (d - b)) / 2;
}

function middle_point_func(a, b) {
  return (a + b) / 2;
}

function compare_far_point_func(helper_lat, helper_long, client_start_lat, client_start_long, client_end_lat, client_end_long) {
  let start_point = radius_func(helper_lat, helper_long, client_start_lat, client_start_long);
  let end_point = radius_func(helper_lat, helper_long, client_end_lat, client_end_long);
  if(start_point >= end_point)    //start point가 더 멀거나 같을 경우
    return 1;
  else return 0;                  //end point가 더 멀거나 같을 경우
}

router.get('/helper', function(req, res) {
  var home_lat = parseFloat(req.query.home_lat);
  var home_long = parseFloat(req.query.home_long);
  var workplace_lat = parseFloat(req.query.workplace_lat);
  var workplace_long = parseFloat(req.query.workplace_long);
  var user_id = req.query.user_id;
  var task_type = req.query.task_type;
  var importantValue = req.query.imval; //price || distance || time
  var middle_lat = (home_lat + workplace_lat) / 2;
  var middle_long = (home_long + workplace_long) / 2;
  var radius = radius_func(home_lat, home_long, workplace_lat, workplace_long);

  if(!(user_id && home_lat && home_long && workplace_lat && workplace_long && task_type && importantValue)) {
    res.status(400).send({
      status : "fail",
      message : "wrong input"
    });
    console.log("wrong input");
  } else {
    pool.getConnection(function(err, connection) {
      if(err) {
        res.status(500).send({
          status : "fail",
          message : "internal server error : " + err
        });
        console.log("internal server error : " + err);
      } else {
        let distanceCheckQuery = 'SELECT * FROM curr_task WHERE (? * ?) > ((dest_lat - ?) * (dest_lat - ?)) + ((dest_long - ?) * (dest_long - ?)) AND status = ?';
        if(importantValue === "p") {                  //price 우선
          var additionalQuery = 'ORDER BY cost DESC';
          var obj = [radius, radius, middle_lat, middle_lat, middle_long, middle_long, "w"];
        } else if(importantValue === "d") {           //distance 우선
          var additionalQuery = 'ORDER BY ((dest_lat - ?) * (dest_lat - ?)) + ((dest_long - ?) * (dest_long - ?)) + ((dest_lat - ?) * (dest_lat - ?)) + ((dest_long - ?) * (dest_long - ?))';
          var obj = [radius, radius, middle_lat, middle_lat, middle_long, middle_long, home_lat, home_lat, home_long, home_long, workplace_lat, workplace_lat, workplace_long, workplace_long, "w"];
        } else if(importantValue === "t") {           //time 우선
          var additionalQuery = 'ORDER BY (cost / requiredtime) DESC';
          var obj = [radius, radius, middle_lat, middle_lat, middle_long, middle_long, "w"];
        } else {                                      //의뢰 등록 우선
          var additionalQuery = 'ORDER BY task_idx';
          var obj = [radius, radius, middle_lat, middle_lat, middle_long, middle_long, "w"];
        }
        var wholeQuery = distanceCheckQuery + additionalQuery;
        connection.query(wholeQuery, obj, function(err, result) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error" + err
            });
            connection.release();
            console.log("internal server error : " + err);
          } else {
            res.status(200).send({
              status : "success",
              message : "successfully search task",
              data : result
            });
            connection.release();
            console.log(null, "successfully search task");
          }
        });//connection.query(distanceCheckQuery)
      }
    });//pool.getConnection(function(err, connection))
  }
});//router.get('/helper')
// router.get('/helper', function(req, res) {
//   var home_lat = parseFloat(req.query.home_lat);
//   var home_long = parseFloat(req.query.home_long);
//   var workplace_lat = parseFloat(req.query.workplace_lat);
//   var workplace_long = parseFloat(req.query.workplace_long);
//   var user_id = req.query.user_id;
//   var middle_lat = (home_lat + workplace_lat) / 2;
//   var middle_long = (home_long + workplace_long) / 2;
//   var radius = radius_func(home_lat, home_long, workplace_lat, workplace_long);
//
//   if(!(user_id && home_lat && home_long && workplace_lat && workplace_long)) {
//     res.status(500).send({
//       status : "fail",
//       message : "wrong input"
//     });
//     console.log("wrong input");
//   } else {
//     pool.getConnection(function(err, connection) {
//       if(err) {
//         res.status(500).send({
//           status : "fail",
//           message : "internal server error : " + err
//         });
//         console.log("internal server error : " + err);
//       } else {
//         let distanceCheckQuery = 'SELECT * FROM curr_task WHERE (? * ?) > ((workplace_lat - ?) * (workplace_lat - ?)) + ((workplace_long - ?) * (workplace_long - ?)) '
//                                                      + 'AND (? * ?) > ((home_lat - ?) * (home_lat - ?)) + ((home_long - ?) * (home_long - ?)) AND status = ?';
//         let radius = radius_func(home_lat, home_long, workplace_lat, workplace_long);
//         connection.query(distanceCheckQuery, [radius, radius, middle_lat, middle_lat, middle_long, middle_long, radius, radius, middle_lat, middle_lat, middle_long, middle_long, "w"], function(err, result) {
//           if(err) {
//             res.status(500).send({
//               status : "fail",
//               message : "internal server error" + err
//             });
//             connection.release();
//             console.log("internal server error : " + err);
//           } else {
//             res.status(200).send({
//               status : "success",
//               message : "successfully search task",
//               data : result
//             });
//             connection.release();
//             console.log(null, "successfully search task");
//           }
//         });//connection.query(distanceCheckQuery)
//       }
//     });//pool.getConnection(function(err, connection))
//   }
// });//router.get('/helper')

// 의뢰인이 수락 버튼 눌렀을 때(12/7 수정)
// client가 들어오는 라우터
// helper로 부터 푸쉬메세지를 받아서 이 라우터로 들어올 때, res.direct('/matching/waiting/' + user_id + '/' + status)로 들어옴
router.get('/matching/waiting/:client_id/:helper_id', function(req, res) {
  let client_id = req.params.client_id;
  let helper_id = req.params.helper_id;
  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!(client_id && helper_id)) {
        res.status(400).send({
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },//function(callback)
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx, user_id FROM user WHERE user_id = ? OR user_id = ?';
      connection.query(user_idxQuery, [client_id, helper_id], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length != 2) {
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });
            connection.release();
            callback("wrong input");
          } else {
            for(let i = 0 ; i < result.length ; i++) {
              if(result[i].user_id === client_id) {
                var client_idx = result[i].user_idx;
              }
              if(result[i].user_id === helper_id) {
                var helper_idx = result[i].user_idx;
              }
            }
            callback(null, connection, client_idx, helper_idx);
          }

        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. change curr_task DB (Action or Waiting)
    function(connection, client_idx, helper_idx, callback) {
      let updateCurrTaskQuery = 'UPDATE curr_task SET status = ? AND helper_user_user_idx = ? WHERE client_user_user_idx = ?';
      connection.query(updateCurrTaskQuery, ["a", helper_idx, client_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          callback(null, connection, client_idx, helper_idx);
          // res.status(201).send({
          //   status : "success",
          //   message : "successfully change task status : Action"
          // });
          // connection.release();
          // callback(null, "successfully change task status : Action");
        }
      });//connection.query(updateCurrTaskQuery)
    },//function(connection, client_idx, helper_idx, callback)
    //4. update waiting table
    function(connection, client_idx, helper_idx, callback) {
      let updateWaitingQuery = 'UPDATE waiting SET status = ? WHERE client_user_user_idx = ? AND helper_user_user_idx = ?';
      connection.query(updateWaitingQuery, ["m", client_idx, helper_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          let deleteOthersQuery = 'UPDATE waiting SET status = ? WHERE client_user_user_idx = ? AND status = ?';
          connection.query(deleteOthersQuery, ["r", client_idx, "w"], function(err, result) {
            if(err) {
              res.status(500).send({
                status : "fail",
                message : "internal server error : " + err
              });
              connection.release();
              callback("internal server error : " + err);
            } else {
              res.status(201).send({
                status : "success",
                message : "successfully change task status : Action"
              });
              connection.release();
              callback(null, "successfully change task status : Action");
            }
          });//connection.query(deleteOthersQuery)
        }
      });//connection.query(updateWaitingQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//router.get('/matching/waiting/:user_id')

// helper가 들어오는 라우터
router.get('/matching/:user_id/:task_idx', function(req, res) {
  let task_idx = req.params.task_idx;
  let user_id = req.params.user_id;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!(task_idx && user_id)) {
        res.status(400).send({
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },//function(callback)
    //2. user_idx check
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';   //(***)다른 테이블 만들어야 할듯, 유저객체에 레이팅이나 총 횟수가 들어가진 않으니까
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {   //user_id 잘못 입력받았을 경우
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });//res.status(400).send
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(user_idxQuery)
    },//funcion(connection, callback)
    //3. search client_idx
    function(connection, helper_idx, callback) {
      let searchClientIdxQuery = 'SELECT client_user_user_idx FROM curr_task WHERE task_idx = ?';
      connection.query(searchClientIdxQuery, [task_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {   //task_idx 잘못 입력받았을 경우
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });//res.status(400).send
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, helper_idx, result[0].user_idx);
          }
        }
      });//connection.query(searchClientIdxQuery)
    },
    //4. waiting table insert
    function(connection, helper_idx, client_idx, callback) {
      let insertHelperQuery = 'INSERT INTO waiting (status, client_user_user_idx, helper_user_user_idx, curr_task_task_idx) VALUES (?, ?, ?, ?)';
      connection.query(insertHelperQuery, ["w", client_idx, helper_idx, task_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });//res.status(500).send
          connection.release();
          callback("internal server error : " + err);
        } else {
          res.status(201).send({
            status : "success",
            message : "successfully add"
          });
          connection.release();
          callback(null, "successfully add");
        }
      });//connection.query(insertHelperQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});

router.get('/helper/waiting', function(req, res) {
  let user_id = req.query.user_id;
  let task_idx = req.query.task_idx;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!(user_id && task_idx)) {
        res.status(400).send({
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. 무한 loop
    function(connection, user_idx, callback) {
      var repeat = setInterval(function() {
        let checkWaitingQuery = 'SELECT status FROM waiting WHERE helper_user_user_idx = ? AND curr_task_task_idx = ?';
        connection.query(checkWaitingQuery, [user_idx, task_idx], function(err, result) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });
            connection.release();
            clearInterval(repeat);
            callback("internal server error : " + err);
          } else {
            if(result.length === 0) {
              res.status(400).send({
                status : "fail",
                message : "wrong input"
              });
              connection.release();
              clearInterval(repeat);
              callback("wrong input");
            } else {
              if(result[0].status === "r") {
                res.status(200).send({
                  status : "success",
                  message : "match rejected"
                });
                connection.release();
                clearInterval(repeat);
                callback(null, "match rejected");
              } else if(result[0].status === "m") {
                res.status(200).send({
                  status : "success",
                  message : "match complete"
                });
                connection.release();
                clearInterval(repeat);
                callback(null, "match complete");

              }
            }
          }
        });//connection.query(checkWaitingQuery)
      }, 3000);//setInterval    //3초로 세팅
    }

  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});

router.get('/comments', function(req, res) {
  let user_id = req.query.user_id;
  let status = req.query.status;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!user_id || !status || !(status === "client" || status === "helper")) {
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },//function(callback)
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {     //user_id가 잘못 입력되었을 경우
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. opponent's user_idx
    function(connection, user_idx, callback) {
      if(status === "client") {
        var findOpponentIndexQuery = 'SELECT helper_user_user_idx FROM curr_task WHERE client_user_user_idx = ?';
      } else {
        var findOpponentIndexQuery = 'SELECT client_user_user_idx FROM curr_task WHERE helper_user_user_idx = ?';
      }
      connection.query(findOpponentIndexQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          callback(null, connection, user_idx, result[0]);
        }
      });//conection.query(findOpponentIndexQuery)
    },
    //4. get detail opponent's history
    function(connection, user_idx, opponent, callback) {
      if(status === "client") {
        var opponent_index = opponent.helper_user_user_idx;
        var selectRatingCommentQuery = 'SELECT rating_h, comment_h FROM past_task WHERE helper_user_user_idx = ?';
      } else {
        var opponent_index = opponent.client_user_user_idx;
        var selectRatingCommentQuery = 'SELECT rating_c, comment_c FROM past_task WHERE client_user_user_idx = ?';
      }
      connection.query(selectRatingCommentQuery, opponent_index, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error* : " + err
          });
          callback("internal server error : " + err);
        } else {
          let object = [];
          if(status === "client") {
            for(let i = 0 ; i < result.length ; i++) {
              let data = {
                rating : result[i].rating_h,
                comment : result[i].comment_h
              };
              object.push(data);
            }
          } else {
            for(let i = 0 ; i < result.length ; i++) {
              let data = {
                rating : result[i].rating_c,
                comment : result[i].comment_c
              };
              object.push(data);
            }
          }
          res.status(200).send({
            status : "success",
            message : "successfully get data",
            data : object
          });
          connection.release();
          callback(null, "successfully get data");
        }
      });//connection.query(selectClientCommentQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//router.get('/comment')

router.get('/refresh', function(req, res) {
  let user_id = req.query.user_id;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
      if(!user_id) {
        res.status(400).send({
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },
    //2. search user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(400).send({
              status : "fail",
              message : "wrong input"
            });
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. finding idx
    function(connection, user_idx, callback) {
      let searchHelperQuery = 'SELECT * FROM waiting WHERE client_user_user_idx = ?';
      connection.query(searchHelperQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          var object = [];
          for(let i = 0 ; i < result.length ; i++) {
            let data = {
              helper_idx : result[i].helper_user_user_idx,
              client_idx : result[i].client_user_user_idx,
              task_idx : result[i].curr_task_task_idx,
              waiting_idx : result[i].waiting_idx
            };
            object.push(data);
          }
          res.status(200).send({
            status : "success",
            message : "successfully get data",
            data : object
          });
          connection.release();
          callback(null, "successfully get data");
        }
      });//connection.query(searchHelperQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall
});

router.delete('/cancel', function(req, res) {
  let user_id = req.query.id;

  let taskArray = [
    //1. connection 만들기 함수
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
            });//res.status(500).send
            callback("internal server error : " + err);
          } else {
            callback(null, connection);
          }
        });//pool.getConnection
      }
    },//function(callback)
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          if(result.length === 0) {
            res.status(500).send({
              status : "fail",
              message : "wrong input"
            });
            connection.release();
            callback("wrong input");
          } else {
            callback(null, connection, result[0].user_idx);
          }
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. delete specific data with user_idx
    function(connection, user_idx, callback) {
      var deleteTaskQuery = 'UPDATE curr_task SET task_type = ? WHERE client_user_user_idx = ?';
      connection.query(deleteTaskQuery, ["d", user_idx], function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          res.status(201).send({
            status : "success",
            message : "successfully delete data"
          });
          connection.release();
          callback(null, "successfully delete data");
        }
      });//connection.query(deleteTaskQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//rouer.get('/cancel')
// router.delete('/cancel', function(req, res) {
//   let user_id = req.query.id;
//   let status = req.query.status;
//
//   let taskArray = [
//     //1. connection 만들기 함수
//     function(callback) {
//       if(!(user_id && status) || !(status === "client" || status === "helper")) {
//         res.status(500).send({
//           status : "fail",
//           message : "wrong input"
//         });
//         callback("wrong input");
//       } else {
//         pool.getConnection(function(err, connection) {
//           if(err) {
//             res.status(500).send({
//               status : "fail",
//               message : "internal server error : " + err
//             });//res.status(500).send
//             callback("internal server error : " + err);
//           } else {
//             callback(null, connection);
//           }
//         });//pool.getConnection
//       }
//     },//function(callback)
//     //2. select user_idx
//     function(connection, callback) {
//       let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
//       connection.query(user_idxQuery, user_id, function(err, result) {
//         if(err) {
//           res.status(500).send({
//             status : "fail",
//             message : "internal server error : " + err
//           });
//           connection.release();
//           callback("internal server error : " + err);
//         } else {
//           callback(null, connection, result[0].user_idx);
//         }
//       });//connection.query(selectCommentQuery)
//     },//function(connection, callback)
//     //3. delete specific data with user_idx
//     function(connection, user_idx, callback) {
//       if(status === "client") {
//         var deleteTaskQuery = 'DELETE FROM curr_task WHERE client_user_user_idx = ?';
//       } else {
//         var deleteTaskQuery = 'DELETE FROM curr_Task WHERE helper_user_user_idx = ?';
//       }
//       connection.query(deleteTaskQuery, user_idx, function(err, result) {
//         if(err) {
//           res.status(500).send({
//             status : "fail",
//             message : "internal server error : " + err
//           });
//           connection.release();
//           callback("internal server error : " + err);
//         } else {
//           res.status(201).send({
//             status : "success",
//             message : "successfully delete data"
//           });
//           connection.release();
//           callback(null, "successfully delete data");
//         }
//       });//connection.query(deleteTaskQuery)
//     }
//   ];
//
//   async.waterfall(taskArray, (err, result) => {
//     if(err) console.log(err);
//     else console.log(result);
//   });//async.waterfall
//
// });//rouer.get('/cancel')

router.post('/star', function(req, res) {
  let status = req.body.status; // client or helper
  let user_id = req.body.user_id;
  var object = {
    rating : req.body.rating,
    comments : req.body.comments
  };
  let task_idx = req.body.task_idx;

  let taskArray = [
   //1. connection 만들기 함수
   function(callback) {
     if(!(status && object.rating && task_idx)) {
       res.status(400).send({
         status : "fail",
         message : "wrong input"
       });
       callback("wrong input")
     } else if(!(status === "client" || status === "helper")) {
       res.status(400).send({
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
           });//res.status(500).send
           callback("internal server error : " + err);
         } else {
           callback(null, connection);
         }
       });//pool.getConnection
     }
   },//function(callback)
   //2.1 mysql 로 user_idx 가져오기
   function(connection, callback) {
     let user_idxQuery = 'SELECT user_idx FROM user WHERE user_id = ?';
     connection.query(user_idxQuery, user_id, function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "internal server error : " + err
         });
         connection.release();
         callback("internal server error : " + err);
       } else {
         if(result.length === 0) {
           res.status(400).send({             //user_id가 잘못 되었을 경우
             status : "fail",
             message : "wrong input"
           });
           connection.release();
           callback("wrong input");
         } else { //successfully search all in curr_task
           callback(null, connection, result[0].user_idx);
         }
       }
     });//connection.query(selectCommentQuery)
   },//function(connection, callback)
   //2-2. mysql query(user_idx로 current task table 가져와야함)
   function(connection, user_idx, callback) {
     if(status === "client") {
       var searchCurrTaskQuery = 'SELECT * FROM curr_task WHERE client_user_user_idx = ?';
     } else {
       var searchCurrTaskQuery = 'SELECT * FROM curr_task WHERE helper_user_user_idx = ?';
     }

     connection.query(searchCurrTaskQuery, task_idx, function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "internal server error : " + err
         });
         connection.release();
         callback("internal server error : " + err);
       } else {
         callback(null, connection, result[0]);
       }
     });//connection.query(searchPastTaskQuery)
   },
   //3. curr_task 별점과 코멘트 입력
   function(connection, data, callback) {
     if(data.status === "a") {
       var flagstatus = "s";
     } else {
       var flagstatus = "f";
     }
     if(status === "client") {
       var updateTaskQuery = 'UPDATE curr_task SET rating_h = ?, comment_h = ?, status = ? WHERE task_idx = ?';
       connection.query(updateTaskQuery, [object.rating, object.comments, flagstatus, data.task_idx], function(err, result) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "internal server error : " + err
           });
           connection.release();
           callback("internal server error : " + err);
         } else {
           callback(null, connection, helper_idx, status, flagstatus);
         }
       });//connection.query(updateTaskQuery)
     } else {
       var updateTaskQuery = 'UPDATE curr_task SET rating_c = ?, comment_c = ?, status = ? WHERE task_idx = ?';
       connection.query(updateTaskQuery, [object.rating, object.comments, flagstatus, data.task_idx], function(err, result) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "internal server error : " + err
           });
           connection.release();
           callback("internal server error : " + err);
         } else {
           callback(null, connection, client_idx, status, flagstatus);
         }
       });//connection.query(updateTaskQuery)
     }
   },
   //4. 상대방의 별점횟수와 별점 select
   function(connection, idx, status, flagstatus, callback) {
     if(status === "client") {
       var selectOpponentQuery = 'SELECT rating, count FROM helper WHERE user_user_idx = ?';
     } else {
       var selectOpponentQuery = 'SELECT rating, count FROM client WHERE user_user_idx = ?';
     }

     connection.query(selectOpponentQuery, idx, function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "internal server error : " + err
         });
         connection.release();
         callback("internal server error : " + err);
       } else {
         var rating = result[0].rating;
         var count = result[0].count;
         callback(null, connection, idx, rating, count, status, flagstatus);
       }
     });//connection.query(selectOpponentQuery)
   },//function(connection, idx, callback)
   //5. 별점과 횟수 추가해서 update
   function(connection, idx, rating, count, status, flagstatus, callback) {
     if(status === "client") {
       var updateOpponentQuery = 'UPDATE helper SET rating = ?, count = ? WHERE user_user_idx = ?';
     } else {
       var updateOpponentQuery = 'UPDATE client SET rating = ?, count = ? WHERE user_user_idx = ?';
     }
     connection.query(updateOpponentQuery, [((rating * count) + object.rating) / (count + 1), count + 1, idx], function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "internal server error : " + err
         });
         connection.release();      //(***) 한번만 써도 되겠지?
         callback("internal server error : " + err);
       } else {
         if(result.changedRows != 1) {
           res.status(400).send({         // 잘못된 값이 넘어와서 제대로 수정이 되지 않은 경우
             status : "fail",
             message : "there is no change"
           });
           connection.release();      //(***) 한번만 써도 되겠지?
           callback("there is no change");
         } else {
           callback(null, connection, status, flagstatus);
         }
       }
     });//connection.query(updateOpponentQuery)
   },//function(connection, idx, rating, count, callback)
   function(connection, status, flagstatus, callback) {         //만약 두 사람이 다 별점을 입력하였을 경우 past task로 옮김
     if(flagstatus != "f") {
       res.status(201).send({
         status : "success",
         message : "successfully update topic"
       });
       connection.release();
       callback(null, "successfully update topic");
     } else {
       let allDoneQuery = 'SELECT * FROM curr_task WHERE task_idx = ?';
       connection.query(allDoneQuery, task_idx, function(err, result) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "internal server error : " + err
           });
           connection.release();      //(***) 한번만 써도 되겠지?
           callback("internal server error : " + err);
         } else {
           let object = {
             task_idx : result[0].task_idx,
             task_type : result[0].task_type,
             cost : result[0].cost,
             details : result[0].details,
             workplace_lat : result[0].workplace_lat,
             workplace_long : result[0].workplace_long,
             workplace_name : result[0].workplace_name,
             home_lat : result[0].home_lat,
             home_long : result[0].home_long,
             home_name : result[0].home_name,
             client_user_user_idx : result[0].client_user_user_idx,
             helper_user_user_idx : result[0].helper_user_user_idx,
             comment_h : result[0].comment_h,
             comment_c : result[0].comment_c,
             rating_h : result[0].rating_h,
             rating_c : result[0].rating_c,
           }
           let insertPastTaskQuery = 'INSERT INTO curr_task (task_idx, task_type, cost, details, workplace_lat, workplace_long, workplace_name, home_lat, home_long, home_name, client_user_user_idx, helper_user_user_idx, comment_h, comment_c, rating_h, rating_c) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
           connection.query(insertPastTaskQuery, [object.task_idx, object.task_type, object.cost, object.details, object.workplace_lat, object.workplace_long, object.workplace_name, object.home_lat, object.home_long, object.home_name, object.client_user_user_idx, object.helper_user_user_idx, object.comment_h, object.comment_c, object.rating_h, object.rating_c], function(err, result) {
             if(err) {
               res.status(500).send({
                 status : "fail",
                 message : "internal server error : " + err
               });
               connection.release();      //(***) 한번만 써도 되겠지?
               callback("internal server error : " + err);
             } else {
               let deleteQuery = 'DELETE FROM curr_task WHERE task_idx = ?';
               connection.query(deleteQuery, task_idx, function(err, result) {
                 if(err) {
                   res.status(500).send({
                     status : "fail",
                     message : "internal server error : " + err
                   });
                   connection.release();
                   callback("internal server error : " + err);
                 } else {
                   res.status(201).send({
                     status : "success",
                     message : "successfully update topic & delete curr_task"
                   });
                   connection.release();
                   callback(null, "successfully update topic & delete curr_task");
                 }
               });//connection.query(deleteQuery)
             }
           });//connection.query(insertPastTaskQuery)
         }
       });//connection.query(allDoneQuery)
     }
   }//function(connection, status, callback)
 ];

 async.waterfall(taskArray, (err, result) => {
   if(err) console.log(err);
   else console.log(result);
 });//async.waterfall
});

module.exports = router;
