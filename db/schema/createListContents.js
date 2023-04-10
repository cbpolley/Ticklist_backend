'use strict';

const db = require('../index.js');

exports.create = () => {

  let query = `
CREATE TABLE IF NOT EXISTS list_contents(
  list_contents_id SERIAL PRIMARY KEY,
  list_id             integer,
  value                 text,
  is_checked             integer,
  color_toggle         integer,
  color               integer,
  dynamic_class          text,
  created_at           text not null,
  updated_at           text not null
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
