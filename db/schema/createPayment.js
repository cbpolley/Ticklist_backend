'use strict';

const db = require('../index.js');

exports.create = () => {

  let query = `
  CREATE TABLE IF NOT EXISTS users(
    payment_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    payment_period_start TIMESTAMP,
    payment_period_end TIMESTAMP,
    amount_paid INTEGER,
    vendor_id VARCHAR,
    receipt_id VARCHAR,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
        REFERENCES users(user_id)
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
