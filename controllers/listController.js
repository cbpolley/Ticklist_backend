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

  const format_options = [
    {id:1, isChecked:false, icon:'fa6-solid:list-ol', label: 'Numbered lists. Click on the numbered list icon to cycle through different list bullet points or numbers.'},
    {id:2, isChecked:false, icon:'fluent:paint-bucket-16-filled', label: 'Colours. When active, click the paint bucket and you will be provided with a range of colours to choose from. You can give the whole Ticklist a colour, and you can colour individual items in the Ticklist.'},
    {id:3, isChecked:false, icon:'charm:grab-horizontal', label: 'Allow list items to be moved. Do this by grabbing this icon and dragging the list item.'},
    {id:4, isChecked:false, icon:'fluent:delete-12-regular', label: 'Delete mode. Click the delete icon to either delete the whole Ticklist or delete individual list items. Deleting is permanent.'},
    {id:5, isChecked:false, icon:'carbon:progress-bar', label: 'Progress bar. Gives you a running completion percentage of your Ticklist.'},
    {id:6, isChecked:false, icon:'ci:filter-outline', label: 'Filter between Ticklist items that are ticked and un-ticked.'},
    {id:7, isChecked:false, icon:'bx:font-size', label: 'Change the size of the font for each Ticklist item.'},
  ]

  const json_format_options = JSON.stringify(format_options)
  const color = req.body.packet.list.color;

  const query = `
  INSERT INTO 
    lists (list_name, share_uuid, color, format_options, list_contents, completed_percent, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, $4, '[]', 0, NOW(), NOW())`

  console.log(query)

    const values = [list_name, share_uuid, color, json_format_options]

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

  console.log(req.body)

  let list_id = req.body.packet.list_id;
  let list_contents = JSON.stringify(req.body.packet.list_contents);
  let format_options = JSON.stringify(req.body.packet.format_options);
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
      console.log(response)
      res.status(200).send(response.rows)
    })
    .catch(err => {
      console.log(err)
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
