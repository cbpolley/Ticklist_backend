'use strict'
const db = require('../db/index.js')

exports.getSingle = async (req, res, next) => {

  let uuid = req.params.uuid

  let query = 'SELECT * FROM groups WHERE uuid = $1'
  let values = [uuid]

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

  let group_ids = req.body.packet

  let query = `
    SELECT * FROM groups WHERE group_id in (${group_ids.join()})`

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

  let query = `SELECT * FROM groups`

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

  let owner_id = req.body.packet.owner_id;
  let group_name = req.body.packet.group_name;
  let group_options = req.body.packet.group_options
  let lists = req.body.packet.lists;

  const { v4: uuidv4 } = require('uuid');

  let uuid = uuidv4();

  let uuid_query = `SELECT * FROM groups where uuid = '${uuid}'`;

  let uuid_exists = true;

  do {
    await db
      .query(uuid_query)
      .then((response) => {
        console.log('uuid res')
        console.log(response)
        if (response.rows.length < 1){
          uuid_exists = false;
        } else {
          uuid = uuidv4();
        }
      })
    
  } while (uuid_exists === true);
  
  let query = `
  INSERT INTO groups 
    (owner_id, uuid, group_name, group_options, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, $4, NOW(), NOW());`;

  let values = [owner_id, uuid, group_name, group_options]

  console.log(query)
  console.log(values)
  
  db
    .query(query, values)
    .then((response) => {
      console.log('response')
      console.log(response)
      const listsFiltered = lists.map(function(item){
      
        return {
          list_contents: item.list_contents,
          list_name : item.list_name,
          uuid: uuid,
          format_options: item.list_contents,
          color:item.color,
          completed_percent:item.completed_percent
        }
    
      })
      
      const listsJSON = JSON.stringify(listsFiltered.flat())

      let query = `
      INSERT INTO
        lists (list_contents, list_name, uuid, format_options, color, completed_percent, created_at, updated_at)
      SELECT
        list_contents, list_name, uuid, format_options, color, completed_percent, NOW(), NOW()
      FROM
        json_populate_recordset(null::lists, '${listsJSON}');
        
      INSERT INTO
        sharing (uuid, user_id, is_member, created_at, updated_at)
      VALUES
        ('${uuid}', '${owner_id}', true, NOW(), NOW());`;

      db
        .query(query)
        .then(() => {
          res.status(200).send({'uuid': uuid})
        })
        .catch(err => {
          res.status(501).send({
            'Database Error lists': err
          })
        })

    })
    .catch(err => {
      res.status(501).send({
        'Database Error groups': err
      })
    })
}

exports.edit = async (req, res, next) => {

  let uuid = req.body.packet.share_uuid;
  let group_name = req.body.packet.group_name;
  let group_options = req.body.packet.group_options;
  let format_options = req.body.packet.format_options;
  let sharing_enabled = req.body.packet.sharing_enabled;

  let query = `
    UPDATE
      groups
    SET
      group_name = $2, 
      group_options = $3,
      format_options = $4,
      sharing_enabled = $5, 
      updated_at = NOW()
    WHERE
      uuid = $1
    RETURNING *`
  let values = [uuid, group_name, group_options, format_options, sharing_enabled]

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

  const group_id = req.params.id

  let query = 'DELETE FROM groups WHERE group_id = $1'
  let values = [group_id]

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
