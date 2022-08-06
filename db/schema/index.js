'use strict';

//Models
const users = require('./createUsers.js');
const lists = require('./createLists.js');
const payment = require('./createPayment.js');

//Create The Tables
async function createDB() {

  await lists.create();
  await payment.create();
  await users.create();
  return
}

createDB()
  .then(res => {
    console.log({'Success' : 'Schema created'})
  })
  .catch(err => {
    console.error({'Error' : err})
  })

module.exports.createDB = createDB;
