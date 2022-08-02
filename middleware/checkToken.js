const jwt = require('jsonwebtoken')
const db = require('../db/index.js');

function auth(req, res, next) {


  //check if token is not undefined
  if (typeof req.headers.authorization !== "undefined") {
    let token = req.headers.authorization;

    jwt.verify(token, process.env.TOKEN_SECRET, (err, authData) => {

      if (err) {
        res.status(403).send({
          "error": `1. Not a valid token, authentication failed: ${err}`,
          "code": 403
        });
      } else {
        //check in DB also
        let query = 'SELECT id, token FROM users WHERE token = $1 and id = $2 ';
        let values = [token, authData.id];

        db
          .query(query, values)
          .then(dbRes => {

            if (dbRes.rows.length > 0) {
              // TODO: use below as test that the user matches
              dbRes.rows[0].id = authData.id
              next()
            } else {
              res.status(403).send({
                "error": "2. Not a valid token, authentication failed",
                "code": 403
              });
            }

          })


      }
    })
  } else {
    res.status(403).send({
      "error": "3. Not a valid token, authentication failed",
      "code": 403
    });
  }
}

module.exports = {
  auth
}
