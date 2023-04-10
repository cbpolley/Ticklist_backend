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

  let owner_uuid = req.body.packet.owner_uuid;
  let group_name = req.body.packet.group_name;
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
    (owner_uuid, share_uuid, group_name, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, NOW(), NOW())
  RETURNING group_id;`;

  let values = [owner_uuid, share_uuid, group_name]
  
  db
    .query(query, values)
    .then((response) => {
      console.log(response)
      const listsFiltered = lists.map(function(item){
      
        return {
          list_name : item.list_name,
          group_id: response.rows[0].group_id,
          color: item.color,
          completed_percent: item.completed_percent
        }
    
      })

      console.log(listsFiltered)
      
      const listsJSON = JSON.stringify(listsFiltered.flat())

      const listContentsFiltered = lists.map(function(item){
      
        return {
          list_id : item.list_contents.list_id,
          value: item.list_contents.value,
          is_checked: item.list_contents.is_checked,
          color_toggle: item.list_contents.color_toggle,
          color: item.list_contents.color, 
          dynamic_class: item.list_contents.dynamic_class        
        }
      })

      console.log(listContentsFiltered)
      
      const listsContentsJSON = JSON.stringify(listContentsFiltered.flat())

      const formatOptionsFiltered = lists.map(function(item){
      
        return {
          list_id: item.format_options.list_id, 
          numbered_value: item.format_options.numbered_value, 
          color_value: item.format_options.color_value, 
          font_size_value: item.format_options.font_size_value, 
          numbered_toggle: item.format_options.numbered_toggle, 
          color_toggle: item.format_options.color_toggle, 
          move_mode_toggle: item.format_options.move_mode_toggle, 
          delete_mode_toggle: item.format_options.delete_mode_toggle, 
          progress_bar_toggle: item.format_options.progress_bar_toggle,
          unticked_toggle: item.format_options.unticked_toggle, 
          font_size_toggle: item.format_options.font_size_toggle   
        }
      })

      console.log(formatOptionsFiltered)
      
      const formatOptionsJSON = JSON.stringify(formatOptionsFiltered.flat())

      console.log(listsJSON)
      console.log(listsContentsJSON)
      console.log(formatOptionsJSON)

      let query = `
        INSERT INTO
          lists (list_name, group_id, color, completed_percent, created_at, updated_at)
        SELECT
          list_name, group_id, color, completed_percent, NOW(), NOW()
        FROM
          json_populate_recordset(null::lists, '${listsJSON}');

        INSERT INTO
          list_contents (list_id, value, is_checked, color_toggle, color, dynamic_class, created_at, updated_at)
        SELECT
          list_id, value, is_checked, color_toggle, color, dynamic_class,  NOW(), NOW()
        FROM
          json_populate_recordset(null::lists, '${listsContentsJSON}');

        INSERT INTO
          format_options (list_id, numbered_value, color_value, font_size_value, numbered_toggle, color_toggle, move_mode_toggle, delete_mode_toggle, progress_bar_toggle, unticked_toggle, font_size_toggle, created_at, updated_at)
        SELECT
          list_id, numbered_value, color_value, font_size_value, numbered_toggle, color_toggle, move_mode_toggle, delete_mode_toggle, progress_bar_toggle, unticked_toggle, font_size_toggle, NOW(), NOW()
        FROM
          json_populate_recordset(null::lists, '${formatOptionsJSON}');

          
        INSERT INTO
          sharing (uuid, user_id, is_member, created_at, updated_at)
        VALUES
          ('${share_uuid}', '${owner_uuid}', true, NOW(), NOW());`;

      console.log(query)

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
  let group_options = req.body.packet.group_options??{};
  let sharing_enabled = req.body.packet.sharing_enabled;

  console.log(req.body.packet)

  let query = `
    UPDATE
      groups
    SET
      group_name = $2, 
      group_options = $3,
      sharing_enabled = $4, 
      updated_at = NOW()
    WHERE
      share_uuid = $1
    RETURNING *`
  let values = [share_uuid, group_name, JSON.stringify(group_options), sharing_enabled, JSON.stringify(format_options)]


  console.log(query)
  console.log(values)

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

  let query = ` 
    DELETE FROM 
      format_options 
    WHERE 
      list_id in (
        SELECT list_id from lists where group_id = (
          SELECT group_id from groups where share_uuid = $1
        )
      );

    DELETE FROM 
      lists 
    WHERE 
      group_id in (
        SELECT group_id from groups where share_uuid = $1
      );

    DELETE FROM groups WHERE share_uuid = $1;
    `
  let values = [share_uuid]

  db
    .query(query, values)
    .then((response) => {
      res.status(200).send('success')
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })
}
