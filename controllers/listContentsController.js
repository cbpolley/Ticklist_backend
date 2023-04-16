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
  const value = req.body.packet.value;
  const is_checked = req.body.packet.is_checked;
  const color = req.body.packet.color;
  const color_toggle = req.body.packet.color_toggle;
  const dynamic_class = req.body.packet.dynamic_class;

  const query = `
  INSERT INTO 
    list_contents (list_id, value, is_checked, color, color_toggle, dynamic_class, created_at, updated_at) 
  VALUES 
    ($1, $2, $3, $4, $5, $6, NOW(), NOW());`;


  const values = [list_id, value, is_checked, color, color_toggle, dynamic_class]

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

  const list_contents_id = req.body.packet.list_id;
  const list_id = req.body.packet.list_id;
  const value = req.body.packet.value;
  const is_checked = req.body.packet.is_checked;
  const color = req.body.packet.color;
  const color_toggle = req.body.packet.color_toggle;
  const dynamic_class = req.body.packet.dynamic_class;

  const query = `
    UPDATE
      list_contents
    SET
      list_id = $2, 
      value = $3, 
      is_checked = $4, 
      color = $5, 
      color_toggle = $6, 
      dynamic_class = $7,
      updated_at = NOW()
    WHERE
      list_contents_id = $1
    RETURNING *`;

  const values = [list_contents_id, list_id, value, is_checked, color, color_toggle, dynamic_class]

  await db
    .query(query, values)
    .then((response) =>{
      res.status(200).send(response.rows)
    })
    .catch((err) => {
      res.status(501).send('Database Error')
    })


  db
    .query(query)    
    .then(response => {
      res.status(200).send(response.rows)
    })
    .catch(err => {
      res.status(501).send("Error")
    })

}


exports.delete = async (req, res, next) => {

  const list_contents_id = req.params.id

  let query = 'DELETE FROM list_contents WHERE list_contents_id = $1'
  let values = [list_contents_id]

  db
    .query(query, values)
    .then(response => {
      res.status(200).send('success')
    })
    .catch(err => {
      res.status(501).send("Error")
    })
}
