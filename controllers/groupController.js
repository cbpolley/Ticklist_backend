"use strict";
const db = require("../db/index.js");

exports.getSingle = async (req, res, next) => {
  let share_uuid = req.params.share_uuid;

  let query = `
  select
    g.group_id,
    g.share_uuid,
    g.group_name,
    l.*,
    CASE WHEN
    lc.list_contents_id IS NULL THEN '[]' ELSE
    json_build_array(
      json_build_object(
        'list_contents_id', lc.list_contents_id,
        'list_id', lc.list_id,
        'value', lc.value,
        'is_checked', lc.is_checked,
        'color_toggle', lc.color_toggle,
        'color', lc.color,
        'dynamic_class', lc.dynamic_class
    )) END AS list_contents,
    json_build_object(
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
    groups g
  LEFT JOIN lists l on l.group_id = g.group_id
  LEFT JOIN list_contents lc on lc.list_id = l.list_id
  LEFT JOIN format_options fo on fo.list_id = l.list_id
  WHERE 
    g.share_uuid = $1
  GROUP BY 
    g.group_id, l.list_id, l.share_list_uuid, l.list_name, l.group_id, l.color, l.completed_percent, l.created_at, l.updated_at, fo.format_option_id, lc.list_contents_id;`;

  let values = [share_uuid];

  db.query(query, values)
    .then((response) => {
      res.status(200).send(response.rows);
    })
    .catch((err) => {
      res.status(501).send({
        "Database Error": err,
      });
    });
};

exports.getMultiple = async (req, res, next) => {
  let group_ids = req.body.packet;

  let query = `
    SELECT * FROM groups WHERE group_id in (${group_ids.join()})`;

  console.log(query);

  db.query(query)
    .then((response) => {
      res.status(200).send(response.rows);
    })
    .catch((err) => {
      res.status(501).send({
        "Database Error": err,
      });
    });
};

exports.getAll = async (req, res, next) => {
  let query = `SELECT * FROM groups`;

  db.query(query)
    .then((response) => {
      res.status(200).send(response.rows);
    })
    .catch((err) => {
      res.status(501).send({
        "Database Error": err,
      });
    });
};

exports.add = async (req, res, next) => {
  let owner_uuid = req.body.packet.owner_uuid;
  let group_name = req.body.packet.group_name;
  let lists = req.body.packet.lists;

  const { v4: uuidv4 } = require("uuid");

  let share_uuid = uuidv4();

  let uuid_query = `SELECT * FROM groups where share_uuid = '${share_uuid}'`;

  let uuid_exists = true;

  do {
    await db.query(uuid_query).then((response) => {
      if (response.rows.length < 1) {
        uuid_exists = false;
      } else {
        share_uuid = uuidv4();
      }
    });
  } while (uuid_exists === true);

  let query = `
  INSERT INTO groups 
    (owner_uuid, share_uuid, group_name, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, NOW(), NOW())
  RETURNING group_id;`;

  let values = [owner_uuid, share_uuid, group_name];

  db.query(query, values)
    .then(async (response) => {
      console.log('response')
      console.log(response)
      console.log(lists)

      const share_query = `  
      INSERT INTO
        sharing (user_id, uuid, is_member, created_at, updated_at)
      VALUES
        ($1, $2, true, NOW(), NOW());`;
      const share_values = [owner_uuid, share_uuid];

      await db.query(share_query, share_values).catch(err => console.log(err))

      let contents_query = ``;

      for (let index = 0; index < lists.length; index++) {
        let share_list_uuid = uuidv4();

        let list_uuid_query = `SELECT * FROM lists where share_list_uuid = '${share_list_uuid}'`;

        let list_uuid_exists = true;

        do {
          await db.query(list_uuid_query)
          .then((check_response) => {
            if (check_response.rows.length < 1) {
              list_uuid_exists = false;
            } else {
              share_list_uuid = uuidv4();
            }
          })
          .catch(err => console.log(err))
        } while (list_uuid_exists === true);



        const insert_list_query = `
          INSERT INTO
            lists (list_name, share_list_uuid, group_id, color, completed_percent, created_at, updated_at)
          VALUES (
            $1, $2, $3, $4, 0, NOW(), NOW()
          )
          RETURNING list_id;`;

        const insert_list_values = [
          lists[index].list_name,
          share_list_uuid,
          response.rows[0].group_id,
          lists[index].color,
        ];

        console.log('insert_list_values')
        console.log(insert_list_values)

        await db.query(insert_list_query, insert_list_values)
          .then(async (insertListResponse) => {

            console.log('insertListResponse')
            console.log(insertListResponse)

            const listContentsFiltered = lists.map(function (list) {
              let item = typeof list === "string" ? JSON.parse(list) : list;

              if (item.list_contents.length > 0) {
                return {
                  list_id: insertListResponse.rows[0].list_id,
                  share_list_uuid: share_list_uuid,
                  value: item.list_contents.value,
                  is_checked: item.list_contents.is_checked,
                  color_toggle: item.list_contents.color_toggle,
                  color: item.list_contents.color,
                  dynamic_class: item.list_contents.dynamic_class,
                };
              }
            });

            if (listContentsFiltered.length > 0) {
              console.log('listContentsFiltered');
              console.log(listContentsFiltered);

              const listsContentsJSON = JSON.stringify(
                listContentsFiltered.flat()
              );

              contents_query = contents_query + 
                `INSERT INTO
                    list_contents (list_id, value, is_checked, color_toggle, color, dynamic_class, created_at, updated_at)
                  SELECT
                    list_id, value, is_checked, color_toggle, color, dynamic_class,  NOW(), NOW()
                  FROM
                    json_populate_recordset(null::list_contents, '${listsContentsJSON}'); `;
            }

            const formatOptionsFiltered = lists.map(function (list) {
              let item = JSON.parse(list.format_options);

              return {
                list_id: insertListResponse.rows[0].list_id,
                numbered_value: item.numbered_value,
                color_value: item.color_value,
                font_size_value: item.font_size_value,
                numbered_toggle: item.numbered_toggle,
                colors_toggle: item.colors_toggle,
                move_mode_toggle: item.move_mode_toggle,
                delete_mode_toggle: item.delete_mode_toggle,
                progress_bar_toggle: item.progress_bar_toggle,
                unticked_toggle: item.unticked_toggle,
                font_size_toggle: item.font_size_toggle,
              };
            });

            const formatOptionsJSON = JSON.stringify(
              formatOptionsFiltered.flat()
            );

            contents_query =
            contents_query +
              `INSERT INTO
                format_options (list_id, numbered_value, color_value, font_size_value, numbered_toggle, colors_toggle, move_mode_toggle, delete_mode_toggle, progress_bar_toggle, unticked_toggle, font_size_toggle, created_at, updated_at)
              SELECT
                list_id, numbered_value, color_value, font_size_value, numbered_toggle, colors_toggle, move_mode_toggle, delete_mode_toggle, progress_bar_toggle, unticked_toggle, font_size_toggle, NOW(), NOW()
              FROM
                json_populate_recordset(null::format_options, '${formatOptionsJSON}'); `;

          console.log('contents_query');
          console.log(contents_query);

          await db.query(contents_query)
            .catch((err) => {
              console.log(err);
              res.status(501).send("Database Error");
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(501).send("Database Error");
          });
        }
        res.status(200).send({ share_uuid: share_uuid });
      
    })
    .catch((err) => {
      console.log(err);
      res.status(501).send("Database Error");
    });
};

exports.edit = async (req, res, next) => {
  let share_uuid = req.body.packet.share_uuid;
  let group_name = req.body.packet.group_name;

  console.log(req.body.packet);

  let query = `
    UPDATE
      groups
    SET
      group_name = $2, 
      updated_at = NOW()
    WHERE
      share_uuid = $1
    RETURNING *`;
  let values = [share_uuid, group_name];

  db.query(query, values)
    .then((response) => {
      res.status(200).send(response.rows);
    })
    .catch((err) => {
      console.log(err)
      res.status(501).send("Error");
    });
};

exports.delete = async (req, res, next) => {
  const share_uuid = req.params.share_uuid;

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
    `;
  let values = [share_uuid];

  db.query(query, values)
    .then((response) => {
      res.status(200).send("success");
    })
    .catch((err) => {
      console.log(err)
      res.status(501).send("Error");
    });
};
