'use strict'

const db = require('../db/index.js')
const bcrypt = require('bcrypt');

exports.getSingle = async (req, res, next) => {

  let user_id = req.params.id

  let query = 'SELECT user_id, email, first_name, last_name, user_type, shared_lists FROM users WHERE user_id = $1'
  let values = [user_id]

  db
  .query(query, values)
  .then(response => {
    res.status(200).send(response.rows)
  })
  .catch(err => {
    res.status(501).send({
      'Database Error': err
    })
  })

}

exports.checkExistingName = async (req, res, next) => {

  let email = req.params.email

  let query = 'SELECT email FROM users WHERE email = $1'
  let values = [email]

  db
  .query(query, values)
  .then(response => {
    if (response.rows.length > 0) {
      res.status(200).send({'existing_email':'true'})
    } else {
      res.status(200).send({'existing_email':'false'})
    }
  })
  .catch(err => {
    res.status(501).send({
      'Database Error': err
    })
  })

}

exports.getAll = async (req, res, next) => {

  let query = `
  SELECT
    user_id, email, first_name, last_name, user_type, shared_lists 
  FROM
    users`

  db
    .query(query)
    .then(response => {
      res.status(200).send(response.rows)
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}

exports.add = async (req, res, next) => {

  // first check to see if user exists

  let email = req.body.packet.email;
  let first_name = req.body.packet.first_name;
  let last_name = req.body.packet.last_name;
  let user_type = req.body.packet.user_type;
  let plain_password = req.body.packet.password;

  let query = 'SELECT email FROM users WHERE email = $1'
  let values = [email]

  db
  .query(query, values)
  .then(response => {
    if (response.rows.length > 0) {
      // email account already exists on the database, cancel the user add process and inform user
      res.status(500).send({
        'status':'forbidden',
        'existing_email':'true'})
    } else {
      // email account does not already exist, proceed with user add process
      const hashPassword = async (password, saltRounds = 10) => {
        try {
          const salt = await bcrypt.genSalt(saltRounds);
          return await bcrypt.hash(plain_password, salt);
        } catch (error) {
          console.error('Hashing Error: ', error);
        }
        return null;
      };

      // don't store plaintext passwords in the database
      let hash = await hashPassword(plain_password);

      let query = `
      INSERT INTO 
        users (email, first_name, last_name, password, user_type, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING user_id
      `
      let values = [email, first_name, last_name, hash, user_type]

      db
        .query(query, values)
        .then(response => {
          res.status(200).send({
            'status':'success',
            'user_id': response.rows[0].user_id
          })
        })
        .catch(err => {
          res.status(501).send({
            'Database Error': err
          })
        })
      }
  })
  .catch(err => {
    res.status(501).send({
      'Database Error': err
    })
  })



}

exports.edit = async (req, res, next) => {

  let email = req.body.packet.email
  let first_name = req.body.packet.first_name
  let last_name = req.body.packet.last_name
  let user_id = req.body.packet.user_id

  let query = `
    UPDATE
      users
    SET
      email = $1, first_name = $2, last_name = $3, updated_at = NOW()
    WHERE
      user_id = $4
    RETURNING user_id, first_name, last_name, email, created_at`
  let values = [email, first_name, last_name, user_id]

  db
    .query(query, values)
    .then(response => {
      res.status(200).send(response.rows)
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}

exports.delete = async (req, res, next) => {

  const user_id = req.params.id

  let query = 'DELETE FROM users WHERE user_id = $1'
  let values = [user_id]

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
