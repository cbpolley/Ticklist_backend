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

  let list_ids = req.body.packet

  let query = `
    SELECT 
      list_id,
      list_contents,
      list_owner 
    FROM lists WHERE list_id in (${list_ids.join()})`

  console.log(query)

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

  const share_uuid = req.body.packet.share_uuid;
  const list_name = req.body.packet.list.list_name;
  const color = req.body.packet.list.color;

  const query = `
  INSERT INTO 
    lists (list_name, share_uuid, color, list_contents, format_options, completed_percent, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, "[]", "[]", 0, NOW(), NOW())`

    const values = [list_name, share_uuid, color]

  db
    .query(query, values)
    .then(() => {
      res.status(200).send('success')
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}

exports.groupUpdate = async (req, res, next) => {

  const share_uuid = req.body.packet.share_uuid

  const lists = req.body.packet.lists

  const listsJSON = JSON.stringify(lists.flat())

  console.log('listsJSON')
  console.log(listsJSON)

  let query = `
  INSERT INTO
    lists (list_contents, list_name, uuid, format_options, color, completed_percent, updated_at, created_at)
  SELECT
    list_contents, list_name, uuid, format_options, color, completed_percent, NOW(), NOW()
  FROM
    json_populate_recordset(null::lists, '${listsJSON}')`;

  await db
    .query(`select * from lists where share_uuid = ${share_uuid}`)
    .then((response) =>{
      if (response.rows > 1){
        query = `
        UPDATE 
          lists 
        SET 
          (list_contents, list_name, uuid, format_options, color, completed_percent, updated_at, created_at) = 
          ((select list_contents, list_name, uuid, format_options, color, completed_percent, NOW(), NOW() from json_populate_record(NULL::lists,'${listsJSON}'))
          `
      } 
    })
    .catch((err) => {
      console.log(err)
    })

  console.log('query')
  console.log(query)

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
exports.edit = async (req, res, next) => {

  let list_id = req.body.packet.list_id;
  let list_contents = req.body.packet.list_contents;
  let format_options = req.body.packet.format_options;
  let completed_percent = req.body.packet.completed_percent;
  let list_name = req.body.packet.list_name;
  let color = req.body.packet.color;

  let query = `
    UPDATE
      lists
    SET
      list_contents = $2, 
      format_options = $3, 
      completed_percent = $4, 
      list_name = $5, 
      color = $6, 
      updated_at = NOW()
    WHERE
      list_id = $1
    RETURNING *`
  let values = [list_id, list_contents, format_options, completed_percent, list_name, color]

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
