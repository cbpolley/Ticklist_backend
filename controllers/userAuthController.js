'use strict';

const db = require('../db/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {

  let email = req.body.email;
  let plainPassword = req.body.password;

  let query = `
  with user_details as (
    SELECT user_id, password FROM users WHERE email = '${email}'
  )

  select
      user_details.user_id,
      user_details.password,
      payment_period_end,
      case when now() >= payment.payment_period_start and now() <= payment_period_end then true else false end as payment_valid
  from
      payment
  join user_details on user_details.user_id = payment.user_id`;

  db
    .query(query)
    .then(dbRes => {

      if (dbRes.rows.length == 0) {
        res.status(401).send('Error - No User With That email')
      } else if (dbRes.rows[0].payment_valid === false) {
        res.status(401).send('Error - Payment out of date')
      } else {
        let hash = dbRes.rows[0].password;
        let payment_period_end = dbRes.rows[0].payment_period_end
        let payment_valid = dbRes.rows[0].payment_valid

        bcrypt.compare(plainPassword, hash, function(err, result) {

          if (result == true) {
            var token = jwt.sign(dbRes.rows[0], process.env.token_secret);

            let queryTwo = `UPDATE
                              users
                            SET
                              token = $1, updated_at = NOW()
                            WHERE
                              user_id = $2
                            RETURNING user_id, email, username, user_type;`
            let valuesTwo = [token, dbRes.rows[0].user_id]

            db
              .query(queryTwo, valuesTwo)
              .then(dbResTwo => {

                res.status(200).send({
                  user: dbResTwo.rows[0],
                  token: token,
                  payment_period_end: payment_period_end,
                  payment_valid: payment_valid
                });
              })
              .catch(err => {
                res.status(500).send({
                  'Error Setting Token': err
                })
                console.error(err)
              })
          } else {
            res.status(402).send('Error - Incorrect Password')
          }

        });
      }
    })
    .catch(err => {
      res.status(500).send({
        'Error Getting User': err
      })
      console.error(err)
    })

}

exports.checkUser = async (req, res, next) => {

  let token = req.params.token

  try{
    var decoded = jwt.verify(token, process.env.token_secret);
    res.status(200).send({
      payment_period_end: decoded.payment_period_end,
      payment_valid: decoded.payment_valid
    })
  }
  catch{
    res.status(500).send({
      'user_details': 'invalid_token'
    })
  }

}

exports.logout = async (req, res, next) => {}


exports.passwordReset = async (req, res, next) => {

  const email = req.body.email;
  const titleMsg = 'Reset your password';
  const templateId = '';
  const sgMail = require('@sendgrid/mail');
  const resetPin = Math.random().toString().substr(2, 6);
  // TODO: add apikey for sendgrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: "info@grandintel.com",
    templateId: templateId,
    dynamicTemplateData: {
      "pin": resetPin,
      "link": "https://http://localhost:8081/auth/reset?resetPin=" + resetPin,
      "titleMsg": titleMsg
    }
  }

  // TODO: add pw exiry column to users table?
  let query = `UPDATE users SET reset_code = $2, updated_at = NOW() WHERE email = $1`
  let values = [email, resetPin]

  db
    .query(query, values)
    .then(() => {

      console.log(msg)
      //ES6
      sgMail
        .send(msg)
        .then(() => {
          res.status(200).send('success')
        })
        .catch(err => {
          res.status(500).send({
            'error': err.response.body
          })
        })

    })
}

exports.pinReset = async (req, res, next) => {

  let provided_pin = req.body.pin.toString()
  // TODO: add pw exiry column to users table?
  let query = `SELECT id, email FROM users WHERE reset_code = $1`
  let values = [provided_pin]

  db
    .query(query, values)
    .then(async dbRes => {

      if (dbRes.rows.length === 0) {
        res.status(201).send('Reset pin invalid.')
      } else {

        let userId = dbRes.rows[0].id
        let password = req.body.password

        const hashPassword = async (password, saltRounds = 10) => {
          try {
            const salt = await bcrypt.genSalt(saltRounds)
            return await bcrypt.hash(password, salt)
          } catch (error) {
            console.error('Hashing Error: ', error)
          }
          return null
        }

        let hash = await hashPassword(password)

        let query = 'UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1'
        let values = [userId, hash]

        db
          .query(query, values)
          .then(response => {
            res.status(200).send('success')
          })
          .catch(err => {
            res.status(501).send({
              'Database Error': err
            })
          })
      }
    })
}
