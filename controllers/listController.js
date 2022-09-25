'use strict'

const db = require('../db/index.js')

exports.getSingle = async (req, res, next) => {

  let list_id = req.params.id

  let query = 'SELECT * FROM lists WHERE list_id = $1'
  let values = [list_id]

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

exports.getMultiple = async (req, res, next) => {

  let list_ids = req.body.packet.shared_lists

  let query = `
    SELECT 
      list_id,
      list_contents,
      list_owner 
    FROM lists WHERE list_id in ("${list_ids.join('", "')}")`

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

exports.getAll = async (req, res, next) => {

  let query = `SELECT * FROM lists`

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

  let list_contents = req.body.packet.list_contents;
  let list_owner = req.body.packet.list_owner;

  let query = 'INSERT INTO lists (list_contents, list_owner, created_at, updated_at) VALUES ($1, NOW(), NOW())'
  let values = [list_contents]

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

exports.edit = async (req, res, next) => {

  let list_id = req.body.packet.list_id;
  let list_contents = req.body.packet.list_contents;
  let list_owner = req.body.packet.list_owner;

  let query = `
    UPDATE
      lists
    SET
      list_contents = $2, 
      list_owner = $3, 
      updated_at = NOW()
    WHERE
      list_id = $1
    RETURNING *`
  let values = [list_id, list_contents, list_owner]

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

exports.addToSharedLists = async (req, res, next) => {

  let user_id = req.body.packet.user_id;
  let access_pin = parseInt(req.body.packet.access_pin)

  let query = `
    select 
      * 
    from lists 
    where access_pin = ${access_pin} and 
    user_awaiting_access = ${user_id} and
    NOW() < access_pin_expire`;

  db
    .query(query)
    .then(response => {
      if (response.rows.length > 0){
        let list_id = response.rows[0].list_id
        let queryTwo = `
        UPDATE
          users
        SET
          shared_lists = COALESCE(shared_lists, '[]'::JSONB) || '[${list_id}]'::JSONB,
          updated_at = NOW()
        WHERE
          user_id = $1
        RETURNING *`
      let valuesTwo = [user_id]
    
      db
        .query(queryTwo, valuesTwo)
        .then(response => {

          // remove user awaiting access so the app doesn't keep trying to add the same list
          let queryThree = `UPDATE lists SET user_awaiting_access = null WHERE access_pin = ${access_pin}`
          db
            .query(queryThree)
            .then(() => {
              res.status(200).send(response.rows)
            })
          
        })
        .catch(err => {
          res.status(501).send({
            'Database Error': err
          })
        })
      } else {
        res.status(400).send({'Error': 'Access pin invalid'})
      }
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })


}

exports.shareWithUsername = async (req, res, next) => {

  let username = req.body.packet.username
  let user_id = req.body.packet.user_id
  let ticklist = JSON.stringify(req.body.packet.ticklist)

  let query = `select user_id from users where username = '${username}'`

  db
  .query(query)
  .then(response => {
    // check if username exists
    if(response.rows.length > 0){
      let pin = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
      let queryTwo = `
      INSERT INTO
        lists (list_contents, list_owner, access_pin, user_awaiting_access, access_pin_expire, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW() + (10 * interval '1 minute'), NOW(), NOW())
      RETURNING access_pin`
      let valuesTwo = [ticklist, user_id, pin, response.rows[0].user_id]

      db
      .query(queryTwo, valuesTwo)
      .then(response => {
        res.status(200).send({access_pin: pin})
      })
      .catch(err => {
        res.status(501).send({
          'Database Error': err
        })
      })

    } else {
      res.status(401).send('Username does not exist!')
    }

  })
  .catch(err => {
    res.status(501).send({
      'Database Error': err
    })
  })
}


exports.getSingleUserSharedLists = async (req, res, next) => {

  let user_id = req.params.id;

  let query = `
    SELECT
      shared_lists
    FROM
      users
    WHERE
      user_id = $1`
  let values = [user_id]

  db
    .query(query, values)
    .then(response => {
      let query = `SELECT user_awaiting_access FROM lists WHERE user_awaiting_access = ${user_id}`
      db
        .query(query)
        .then(pending_response => {
          console.log(pending_response)
          if (pending_response.rows.length > 0){
            res.status(200).send({
              shared_lists: response.rows[0].shared_lists,
              pending_lists: pending_response.rows[0].shared_lists
            })
          } else { 
            res.status(200).send({
              shared_lists: response.rows
            })
          }
        }) 
        .catch(err => {
          console.log(err)
        })
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}

exports.delete = async (req, res, next) => {

  const list_id = req.params.id

  let query = 'DELETE FROM lists WHERE list_id = $1'
  let values = [list_id]

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
