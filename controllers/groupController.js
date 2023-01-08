'use strict'
const db = require('../db/index.js')

exports.getSingle = async (req, res, next) => {

  let share_uuid = req.params.share_uuid

  let query = `
  with group_lists as (
    select
        json_agg(
           json_build_object(
           'list_id', list_id,
            'created_at', created_at,
           'updated_at', updated_at,
           'list_name', list_name,
           'share_uuid', share_uuid,
           'format_options', format_options,
           'color', color,
           'completed_percent', completed_percent
           )
        ) as  agg_lists,
        share_uuid
    from 
        lists 
    where share_uuid = $1
    group by share_uuid
)

SELECT group_id,
       owner_id,
       group_name,
       group_options,
       groups.created_at,
       groups.share_uuid,
       owner_name,
       sharing_enabled,
       groups.format_options,
        group_lists.agg_lists as lists
FROM groups
left join group_lists on groups.share_uuid = group_lists.share_uuid
WHERE groups.share_uuid = $1
  `
  let values = [share_uuid]

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

  let share_uuid = uuidv4();

  let uuid_query = `SELECT * FROM groups where share_uuid = '${share_uuid}'`;

  let uuid_exists = true;

  do {
    await db
      .query(uuid_query)
      .then((response) => {
        if (response.rows.length < 1){
          uuid_exists = false;
        } else {
          share_uuid = uuidv4();
        }
      })
    
  } while (uuid_exists === true);
  
  let query = `
  INSERT INTO groups 
    (owner_id, share_uuid, group_name, group_options, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, $4, NOW(), NOW());`;

  let values = [owner_id, share_uuid, group_name, group_options]

  console.log(query)
  console.log(values)
  
  db
    .query(query, values)
    .then((response) => {
      const listsFiltered = lists.map(function(item){
      
        return {
          list_contents: item.list_contents,
          list_name : item.list_name,
          share_uuid: share_uuid,
          format_options: item.list_contents,
          color:item.color,
          completed_percent:item.completed_percent
        }
    
      })
      
      const listsJSON = JSON.stringify(listsFiltered.flat())

      let query = `
      INSERT INTO
        lists (list_contents, list_name, share_uuid, format_options, color, completed_percent, created_at, updated_at)
      SELECT
        list_contents, list_name, share_uuid, format_options, color, completed_percent, NOW(), NOW()
      FROM
        json_populate_recordset(null::lists, '${listsJSON}');
        
      INSERT INTO
        sharing (uuid, user_id, is_member, created_at, updated_at)
      VALUES
        ('${share_uuid}', '${owner_id}', true, NOW(), NOW());`;

      db
        .query(query)
        .then(() => {
          res.status(200).send({'share_uuid': share_uuid})
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

  let share_uuid = req.body.packet.share_uuid;
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
      share_uuid = $1
    RETURNING *`
  let values = [share_uuid, group_name, group_options, format_options, sharing_enabled]

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

  const share_uuid = req.params.share_uuid

  let query = 'DELETE FROM groups WHERE share_uuid = $1'
  let values = [share_uuid]

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
