'use strict'

const db = require('../db/index.js')

exports.getSingle = async (req, res, next) => {

  let list_id = req.params.id

  let query = 'SELECT * FROM list_contents WHERE list_id = $1'
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

exports.add = async (req, res, next) => {

  const list_id = req.body.packet.list_id;

  const query = `
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
    ${list_id},
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

  db
    .query(query, values)
    .then(() => {
      res.status(200).send('success')
    })
    .catch(err => {
      res.status(501).send("Error")
    })
}

exports.edit = async (req, res, next) => {

  const query = `
    update 
      format_options 
    set 
      format_option_id = ${req.body.packet.format_option_id},
      list_id = ${req.body.packet.list_id},
      numbered_value = ${req.body.packet.numbered_value},
      font_size_value = ${req.body.packet.font_size_value},
      numbered_toggle = ${req.body.packet.numbered_toggle},
      colors_toggle = ${req.body.packet.colors_toggle},
      move_mode_toggle = ${req.body.packet.move_mode_toggle},
      delete_mode_toggle = ${req.body.packet.delete_mode_toggle},
      progress_bar_toggle = ${req.body.packet.progress_bar_toggle},
      unticked_toggle = ${req.body.packet.unticked_toggle},
      font_size_toggle = ${req.body.packet.font_size_toggle},  
      updated_at = now()
    where 
      list_id = ${req.body.packet.list_id};`;

  db
    .query(query)    
    .then(response => {
      res.status(200).send(response.rows)
    })
    .catch(err => {
      res.status(501).send("Error")
    })

}