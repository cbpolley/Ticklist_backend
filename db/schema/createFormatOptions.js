'use strict';

const db = require('../index.js');

exports.create = () => {

  let query = `
CREATE TABLE IF NOT EXISTS format_options(
  format_option_id SERIAL PRIMARY KEY,
  list_id             integer,
  numbered_value             integer,
  color_value             integer,
  font_size_value             integer,  
  numbered_toggle             integer,
  colors_toggle             integer,
  move_mode_toggle             integer,
  delete_mode_toggle             integer,
  progress_bar_toggle             integer,
  unticked_toggle             integer,
  font_size_toggle             integer,
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
