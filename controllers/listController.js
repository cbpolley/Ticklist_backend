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

  let list_contents = req.body.packet.list_contents;
  let list_owner = req.body.packet.list_owner;

  let query = 'INSERT INTO lists (list_contents, list_owner, created_at, updated_at) VALUES ($1, NOW(), NOW())'
  let values = [list_contents]

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

exports.edit = async (req, res, next) => {

  let list_id = req.body.packet.list_id;
  let list_contents = req.body.packet.list_contents;
  let list_owner = req.body.packet.list_owner;

  let query = `
    UPDATE
      lists
    SET
      list_contents = $2, 
      list_owner = $3, 
      updated_at = NOW()
    WHERE
      list_id = $1
    RETURNING *`
  let values = [list_id, list_contents, list_owner]

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

exports.share = async (req, res, next) => {

  let list_id = req.body.packet.list_id;
  let destination_user_id = req.body.packet.destination_user_id

  let query = `
    UPDATE
      users
    SET
      SET shared_lists = COALESCE(shared_lists, '[]'::JSONB) || '["${list_id}"]'::JSONB
      updated_at = NOW()
    WHERE
      user_id = $1
    RETURNING *`
  let values = [destination_user_id]

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

exports.getSharedLists = async (req, res, next) => {

  let list_ids = req.body.packet.list_ids;

  let query = `
    SELECT
      *
    FROM
      lists
    WHERE
      list_id in unnest($1)
    RETURNING *`
  let values = [list_ids]

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
