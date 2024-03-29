'use strict'
const db = require('../db/index.js')

exports.confirmGroupMember = async (req, res, next) => {

  let user_uuid = req.body.packet.user_uuid;
  let access_pin = req.body.packet.access_pin

  let query = `
  UPDATE
    sharing
  SET
    is_member = true,
    access_pin = null,
    access_pin_expire = null,
    updated_at = NOW()
  WHERE 
    access_pin = ${access_pin} and 
    user_id = '${user_uuid}' 
  RETURNING 
    user_id,
    uuid;`;

  db 
    .query(query)
    .then(response => {
      console.log('-- response ')
      console.log(response)
      if (response.rows.length > 0){

        const share_uuid = response.rows[0].uuid
        const user_id = response.rows[0].user_id

        let groupQuery = `
          SELECT 
            owner_id,
            share_uuid,
            (select sharing_enabled from groups where share_uuid = '${share_uuid}') as sharing_enabled,
            (select username from users where uuid = '${user_id}') as username,
            group_name,
            owner_name,
            group_options
          FROM 
            groups
          WHERE
            share_uuid = '${share_uuid}';`;
          
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
      res.status(501).send("Error")
    })
}

exports.getSharingStatus = async (req, res, next) => {
  const share_uuid = req.params.share_uuid

  const query = `
    SELECT * from GROUPS where share_uuid = '${share_uuid}'`

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
    if (obj.value && obj.value.length > 0 ){
      filter.push(obj.value.toLowerCase().replace(/[^a-z0-9\d\s:]/gi, '').trim())
    }
    return filter  
  }, [])

  console.log('userArray')
  console.log(userArray)

  let usernames = "(" + userArray.map((k) => `'${k}'`).join(",") + ")"
  let share_uuid = req.body.packet.share_uuid

  const id_query = `select uuid, username from users where LOWER(username) in ${usernames};`

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
        let values = [share_uuid, response.rows[i].uuid, response.rows[i].username, pin]

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

  let user_uuid = req.params.uuid;

  let query = `
    SELECT
      uuid
    FROM
      sharing
    WHERE
      user_id = $1`
  let values = [user_uuid]

  db
    .query(query, values)
    .then(response => {
      res.status(200).send({
        shared_lists: response.rows
      })
    })
    .catch(err => {
      res.status(501).send("Error")
    })
}


exports.getGroupMembers = async (req, res, next) => {

  let uuid = req.params.uuid;

  const query = `
  SELECT
    g.group_name,
    (select avg(l.completed_percent) from lists l where l.group_id = $1) as completed_percent,
    json_agg(
      json_build_object(
        'user_id', s.user_id,
        'is_member',  s.is_member,
        'username', u.username
      )
    ) as members
  FROM
    groups g
  LEFT JOIN sharing s on g.share_uuid = s.uuid
  LEFT JOIN users u on u.uuid = s.user_id
  WHERE
    g.share_uuid  = $1
  GROUP BY g.group_name`;

  const values = [uuid]

  db
    .query(query, values)
    .then((response) => {
      res.status(200).send(response.rows)
    })
    .catch((err) => {
      console.log(err)
      res.status(501).send("Error")
    })
}

