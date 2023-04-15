'use strict'

const db = require('../db/index.js')

exports.getSingle = async (req, res, next) => {

  let list_id = req.params.id

  const query = `
    SELECT 
      l.*,
      CASE WHEN 
        lc.list_contents_id IS NULL THEN "[]" ELSE
        json_group_array( 
          json_object(
            'list_contents_id', lc.list_contents_id,
            'list_id', lc.list_id,
            'value', lc.value,
            'is_checked', lc.is_checked,
            'color_toggle', lc.color_toggle,
            'color', lc.color,
            'dynamic_class', lc.dynamic_class
        )) END AS list_contents,
          json_object(
            'format_option_id', fo.format_option_id,
            'list_id', fo.list_id,
            'numbered_value', fo.numbered_value,
            'font_size_value', fo.font_size_value,
            'numbered_toggle', fo.numbered_toggle,
            'colors_toggle', fo.colors_toggle,
            'move_mode_toggle', fo.move_mode_toggle,
            'delete_mode_toggle', fo.delete_mode_toggle,
            'progress_bar_toggle', fo.progress_bar_toggle,
            'unticked_toggle', fo.unticked_toggle,
            'font_size_toggle', fo.font_size_toggle
        ) AS format_options
    FROM 
      lists l 
    LEFT JOIN list_contents lc on lc.list_id = l.list_id
    LEFT JOIN format_options fo on fo.list_id = l.list_id
    WHERE l.list_id = ${list_id}
    GROUP BY l.list_id, l.list_name, l.group_id, l.color, l.completed_percent, l.created_at, l.updated_at;`;


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

  const { v4: uuidv4 } = require('uuid');

  let share_list_uuid = uuidv4();

  const query = `
  INSERT INTO 
    lists (list_name, share_list_uuid, share_uuid, color, completed_percent, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, 0, NOW(), NOW())
  RETURNING list_id;`;


  const values = [list_name, share_list_uuid, share_uuid, color]

  db
    .query(query, values)
    .then((response) => {
      if (response.rows[0].list_id) {
        const fo_query = `
          INSERT INTO 
            format_options (
              list_id,
              numbered_value,
              color_value, 
              font_size_value,  
              numbered_toggle,
              colors_toggle, 
              move_mode_toggle,  
              delete_mode_toggle,  
              progress_bar_toggle,  
              unticked_toggle,  
              font_size_toggle,  
              created_at,
              updated_at
            ) 
            VALUES (
              ${response.rows[0].list_id},
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              now(),
              now()
          );`;
        db.query(fo_query)
          .then(() => {
            res.status(200).send('success')

          })
          .catch(err => {
            res.status(501).send('Error')
          })
      }
    })
    .catch(err => {
      res.status(501).send('Error')
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
    lists (list_name, uuid, color, completed_percent, updated_at, created_at)
  SELECT
    list_name, uuid, color, completed_percent, NOW(), NOW()
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
          (list_name, uuid, color, completed_percent, updated_at, created_at) = 
          ((select list_name, uuid, color, completed_percent, NOW(), NOW() from json_populate_record(NULL::lists,'${listsJSON}'))
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
  let completed_percent = req.body.packet.completed_percent;
  let list_name = req.body.packet.list_name;
  let color = req.body.packet.color;

  let query = `
    UPDATE
      lists
    SET
      completed_percent = $2, 
      list_name = $3, 
      color = $4, 
      updated_at = NOW()
    WHERE
      list_id = $1
    RETURNING *`
  let values = [list_id, completed_percent, list_name, color]

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
