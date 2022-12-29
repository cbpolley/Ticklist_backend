'use strict'
const db = require('../db/index.js')

exports.confirmGroupMember = async (req, res, next) => {

  let user_id = req.body.packet.user_id;
  let access_pin = req.body.packet.access_pin

  let query = `
  UPDATE
    sharing
  SET
    is_member = true,
    updated_at = NOW()
  WHERE 
    access_pin = ${access_pin} and 
    user_id = ${user_id} and 
    NOW() < access_pin_expire
  RETURNING 
    uuid;`;

  db
    .query(query)
    .then(response => {
      if (response.rows.length > 0){
        const uuid = response.rows[0].uuid
        let groupQuery = `
          SELECT 
            owner_name,
            group_name,
            group_options,
            uuid as group_id
          FROM 
            groups
          WHERE
            uuid = ${uuid};`;
          
          db
            .query(groupQuery)
            .then(response => {
              res.status(200).send(response.rows)
            })
            .catch(err => {
              res.status(501).send({
                'Database Error': err
              })
            })
      } else {
        res.status(200).send("Not found or pin expired")
      }
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}

exports.getSharingStatus = async (req, res, next) => {
  const uuid = req.body.uuid

  const query = `
    SELECT * from GROUPS where uuid = '${uuid}'`

    db
  .query(query)
  .then((response) => {
    res.status(200).send(response.rows)
  })
  .catch((err) => {
    res.status(501).send({
      'Database Error': err
    })
  })
}

exports.shareWithUsernames = async (req, res, next) => {

  let userArray = req.body.packet.usernames.reduce((filter, obj) => { 
    if (obj.value && obj.value.length > 0){
      filter.push(obj.value)
    }
    return filter  
  }, [])

  let usernames = "(" + userArray.map((k) => `'${k}'`).join(",") + ")"
  let uuid = req.body.packet.uuid
  

  const id_query = `select user_id, username from users where username in ${usernames}`

  db
  .query(id_query)
  .then((response) => {
    // check if username exists
    if(response.rows.length > 0){
      const pin = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
      for (let i = 0; i < response.rows.length; i++) {
        const pin_query = `
        INSERT INTO
          sharing (uuid, user_id, username, access_pin, is_member, access_pin_expire, created_at, updated_at)
          VALUES ($1, $2, $3, $4, false, NOW() + (10 * interval '1 minute'), NOW(), NOW());`
        let values = [uuid, response.rows[i].user_id, response.rows[i].username, pin]

        db
        .query(pin_query, values)
        .then(() => {  
          res.status(200).send({access_pin: pin})
        })
        .catch(err => {
          console.log(err)
          res.status(501).send({
            'Database Error': err
          })
        })
      }
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


exports.getSharedGroups = async (req, res, next) => {

  let user_id = req.params.id;

  let query = `
    SELECT
      uuid
    FROM
      sharing
    WHERE
      user_id = $1`
  let values = [user_id]

  db
    .query(query, values)
    .then(response => {
      res.status(200).send({
        shared_lists: response.rows
      })
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}


exports.getGroupMembers = async (req, res, next) => {

  let uuid = req.params.uuid;

  console.log(req.params)

  let query = `
  with first as (
    SELECT
       user_id,
       is_member
    FROM
        sharing
    WHERE
        uuid = '${uuid}'
  )

  SELECT
      first.*, users.username
  FROM
      users
  JOIN first on first.user_id = users.uuid`

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

