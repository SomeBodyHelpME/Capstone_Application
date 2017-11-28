var express = require('express');
var router = express.Router();
var async = require('async');
var pool = require('../config/dbPool');
var moment = require('moment');

router.post('/client', function(req, res) {
  var user_id = req.body.user_id;
  var object = {
    task_type : req.body.task_type,
    cost : req.body.cost,
    details : req.body.details,
    registertime : moment().format("YYYYMMDDHHmmss");       //register time
    deadline : req.body.deadline,
    workplace_lat : parseFloat(req.body.workplace_lat),
    workplace_long : parseFloat(req.body.workplace_long),
    workplace_name : parseFloat(req.body.workplace_name),
    home_lat : parseFloat(req.body.home_lat),
    home_long : parseFloat(req.body.home_long),
    home_name : parseFloat(req.body.home_name),
  };

  if(!(user_id && object.task_type && object.cost && object.details && object.deadline && object.workplace_lat && object.workplace_long && object.workplace_name && object.home_lat && object.home_long && object.home_name)) {
    res.status(500).send({
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
        let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
        connection.query(user_idxQuery, user_id, function(err, result) {
          if(err) {
            res.status(500).send({
              status : "fail",
              message : "internal server error : " + err
            });
            console.log("internal server error : " + err);
          } else {
            if(result.length === 0) {
              res.status(500).send({
                status : "fail",
                message : "wrong input"
              });
              console.log("wrong input");
            } else {
              let registerTaskQuery = 'INSERT INTO curr_task (task_type, cost, details, registertime, deadline, workplace_lat, workplace_long, workplace_name, home_lat, home_long, home_name) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
              connection.query(registerTaskQuery, [user.task_type, user.cost, user.details, user.registertime, user.deadline, user.workplace_lat, user.workplace_long, user.workplace_name, user.home_lat, user.home_long, user.home_name], function(err) {
                if(err) {
                  res.status(500).send({
                    status : "fail",
                    message : "internal server error : " + err
                  });
                  console.log("internal server error : " + err);
                } else {
                  res.status(201).send({
                    status : "success",
                    message : "successfully register current task"
                  });//res.status(201)
                  console.log("successfully register current task");
                }
              });//connection.query(registerTaskQuery)
            }
          }
        });//connection.query
      }
    });//pool.getConnection
  }
  //
  // var sql = 'SELECT from user WHERE user_id =: user_id';
  // db.query(sql, {
  //   params : {
  //     user_id : user_id
  //   }
  // }).then(function(results) {
  //   if(results.length === 0) {
  //     console.log('ERR');
  //   } else {
  //     object.user_idx = results[0].user_idx;
  //     var sql = 'INSERT INTO curr_task (task_type, cost, details, deadline, workplace_lat, workplace_long, workplace_name, home_lat, home_long, home_name, user_idx) VALUES (:task_type, :cost, :details, :deadline, :workplace_lat, :workplace_long, :workplace_name, :home_lat, :home_long, :home_name, :user_idx)';
  //     db.query(sql, {
  //       params : object
  //     }).then(function(results) {
  //       if(results.length === 0) {
  //         console.log('ERR');
  //       } else {
  //         res.writeHead(200, {"Content-Type" : "text/plain"});
  //         res.end(JSON.stringify({
  //           msg: "success",
  //           data: ""
  //         }));//res.end
  //       }
  //     });//db.query('INSERT')
  //   }
  // });//db.query('SELECT')
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
  var middle_lat = (home_lat + workplace_lat) / 2;
  var middle_long = (home_lat + workplace_long) / 2;
  var radius = radius_func(home_lat, home_long, workplace_lat, workplace_long);

  if(!(user_id && home_lat && home_long && workplace_lat && workplace_long)) {
    res.status(500).send({
      status : "fail",
      message : "input error"
    });
    console.log("input error");
  } else {
    // (***) db get connection 해야한다.
    let distanceCheckQuery = 'SELECT * FROM curr_task WHERE (? * ?) > ((workplace_lat - ?) * (workplace_lat - ?)) + ((workplace_long - ?) * (workplace_long - ?)) '
                                                 + 'AND ? > (? * ?) > ((home_lat - ?) * (home_lat - ?)) + ((home_long - ?) * (home_long - ?))';
    let radius = radius_func(home_lat, home_long, workplace_lat, workplace_long);
    connection.query(distanceCheckQuery, [radius, radius, middle_lat, middle_lat, middle_long, middle_long, radius, radius, middle_lat, middle_lat, middle_long, middle_long], function(err, result) {
      if(err) {
        res.status(500).send({
          status : "fail",
          message : "internal server error" + err
        });
        connection.release();
      } else {
        res.status(200).send({
          status : "success",
          message : "successfully search task",
          data : result
        });
        connection.release();
      }
    });//connection.query(distanceCheckQuery)

    // let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
    // connection.query(user_idxQuery, user_id, function(err, result) {
    //   if(err) {
    //     res.status(500).send({
    //       status : "fail",
    //       message : "internal server error : " + err
    //     });
    //     console.log("internal server error : " + err);
    //   } else {
    //     if(result.length === 0) {
    //       res.status(500).send({
    //         status : "fail",
    //         message : "there is no id"
    //       });
    //       console.log("no id : " + user_id);
    //     } else {
    //       let user_idx = result[0].user_idx;
    //       middle_x = middle_point_func(home_lat, workplace_lat);
    //       middle_y = middle_point_func(home_long, workplace_long);
    //       //거리 계산해야지
    //       //그 값을 디비에 넣어서 찾고(둘 다 범위 안에 있어야함)
    //       //둘 중에 먼 곳만 배열의 형태로 보내줌
    //
    //     }
    //   }
    // });//connection.query
  }
});//router.get('/helper')

router.get('/matching/waiting', function(req, res) {

});

router.get('/matching/:task_idx', function(req, res) {

});

router.get('/comments', function(req, res) {
  var user_id = req.query.user_id;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
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
    },
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          callback(null, connection, result[0].user_idx);
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. client comment
    function(connection, user_idx, callback) {
      let selectClientCommentQuery = 'SELECT * FROM past_task WHERE client_user_user_idx = ?';
      connection.query(selectClientCommentQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          callback(null, connection, user_idx, result);
        }
      });//connection.query(selectClientCommentQuery)
    },
    //4. helper comment
    function(connection, user_idx, client_comment, callback) {
      let selectHelperCommentQuery = 'SELECT * FROM past_task WHERE helper_user_user_idx = ?';
      connection.query(selectHelperCommentQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("internal server error : " + err);
        } else {
          res.status(200).send({
            status : "success",
            message : "successfully get data",
            data : {
              client : client_comment,
              helper : result
            }
          });
          callback(null, "successfully get data");
        }
        connection.release();
      });//connection.query(selectClientCommentQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//router.get('/comment')

router.get('/cancel', function(req, res) {
  let user_id = req.query.id;

  let taskArray = [
    //1. connection 만들기 함수
    function(callback) {
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
    },
    //2. select user_idx
    function(connection, callback) {
      let user_idxQuery = 'SELECT * FROM user WHERE user_id = ?';
      connection.query(user_idxQuery, user_id, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          connection.release();
          callback("internal server error : " + err);
        } else {
          callback(null, connection, result[0].user_idx);
        }
      });//connection.query(selectCommentQuery)
    },//function(connection, callback)
    //3. delete specific data with user_idx
    function(connection, user_idx, callback) {
      let deleteTaskQuery = 'DELETE FROM curr_task WHERE user_idx = ?';
      connection.query(deleteTaskQuery, user_idx, function(err, result) {
        if(err) {
          res.status(500).send({
            status : "fail",
            message : "internal server error : " + err
          });
          callback("internal server error : " + err);
        } else {
          res.status(201).send({
            status : "success",
            message : "successfully delete data"
          });
          callback("successfully delete data");
        }
        connection.release();
      });//connection.query(deleteTaskQuery)
    }
  ];

  async.waterfall(taskArray, (err, result) => {
    if(err) console.log(err);
    else console.log(result);
  });//async.waterfall

});//rouer.get('/cancel')

router.post('/star', function(req, res) {
  let status = req.body.status; // client or helper
  let task_idx = req.body.task_idx;
  var object = {
    rating : req.body.rating,
    comments : req.body.comments
  };

  let taskArray = [
   //1. connection 만들기 함수
   function(callback) {
     if(!(status && object.rating)) {
       res.status(500).send({
         status : "fail",
         message : "fail"
       });
     } else {
       pool.getConnection(function(err, connection) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "fail"
           });//res.status(500).send
           callback(err);
         } else {
           callback(null, connection);
         }
       });//pool.getConnection
     }
   },//function(callback)
   //2. mysql query(task_idx로 helper_idx, client_idx 가져와야함)
   function(connection, callback) {
     let searchPastTaskQuery = 'SELECT client_user_user_idx, helper_user_user_idx FROM past_task WHERE task_idx = ?';
     connection.query(searchPastTaskQuery, task_idx, function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "fail"
         });
         connection.release();
         callback("fail");
       } else {
         if(result.length === 0) {
           res.status(500).send({
             status : "fail",
             message : "wrong task_idx"
           });
           connection.release();
           callback("wrong task_idx");
         } else { //successfully search task_idx in past_task
           let client_idx = result[0].client_user_user_idx;
           let helper_idx = result[0].helper_user_user_idx;
           callback(null, connection, client_idx, helper_idx);
         }
       }
     });//connection.query(searchPastTaskQuery)
   },
   //3. past_task에서 별점과 코멘트 입력
   function(connection, client_idx, helper_idx, callback) {
     if(status === "client") {
       let updateTaskQuery = 'UPDATE past_task SET rating_h = ?, comment_h = ? WHERE task_idx = ?';
       connection.query(updateTaskQuery, [object.rating, object.comments, task_idx], function(err, result) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "fail"
           });
           connection.release();
           callback("fail");
         } else {
           callback(null, connection, helper_idx)
         }
       });//connection.query(updateTaskQuery)
     } else {
       let updateTaskQuery = 'UPDATE past_task SET rating_c = ?, comment_c = ? WHERE task_idx = ?';
       connection.query(updateTaskQuery, [object.rating, object.comments, task_idx], function(err, result) {
         if(err) {
           res.status(500).send({
             status : "fail",
             message : "fail"
           });
           connection.release();
           callback("fail");
         } else {
           callback(null, connection, client_idx);
         }
       });//connection.query(updateTaskQuery)
     }

   },
   //4. 상대방의 별점횟수와 별점 select
   function(connection, idx, callback) {
     if(status === "client") {
       let selectOpponentQuery = 'SELECT rating, count FROM helper WHERE user_user_idx = ?';
     } else {
       let selectOpponentQuery = 'SELECT rating, count FROM client WHERE user_user_idx = ?';
     }

     connection.query(selectOpponentQuery, idx, function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "fail"
         });
         connection.release();
         callback("fail");
       } else {
         var rating = result[0].rating;
         var count = result[0].count;
         callback(null, connection, idx, rating, count);
       }
     });//connection.query(selectOpponentQuery)
   },//function(connection, idx, callback)
   //5. 별점과 횟수 추가해서 update
   function(connection, idx, rating, count, callback) {
     if(status === "client") {
       let updateOpponentQuery = 'UPDATE helper SET rating = ?, count = ? WHERE user_user_idx = ?';
     } else {
       let updateOpponentQuery = 'UPDATE client SET rating = ?, count = ? WHERE user_user_idx = ?';
     }
     connection.query(updateOpponentQuery, [((rating * count) + object.rating) / (count + 1), count + 1, idx], function(err, result) {
       if(err) {
         res.status(500).send({
           status : "fail",
           message : "fail"
         });
         callback("error");
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
             message : "successfully update topic"
           });
           callback(null, "successfully update topic");
         }
       }
       connection.release();      //(***) 한번만 써도 되겠지?
     });//connection.query(updateOpponentQuery)
   }//function(connection, idx, rating, count, callback)
 ];

 async.waterfall(taskArray, (err, result) => {
   if(err) console.log(err);
   else console.log(result);
 });//async.waterfall
});

module.exports = router;
