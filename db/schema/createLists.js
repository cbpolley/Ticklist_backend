'use strict';

const db = require('../index.js');

exports.create = () => {

  let query = `
CREATE TABLE IF NOT EXISTS lists(
  list_id SERIAL PRIMARY KEY,
  list_contents JSON,
  list_owner INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);`;

  let promise = new Promise(function(resolve, reject) {
    db
      .query(query)
      .then(res => {
        console.log(res)
        resolve()
      })
      .catch(err => {
        console.error(err)
        reject()
      })
  })

  return promise

}
