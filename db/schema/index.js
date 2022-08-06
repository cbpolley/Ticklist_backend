'use strict';

//Models
const users = require('./createUsers.js');
const lists = require('./createLists.js');
const payment = require('./createPayment.js');
// const allowedOrigins = require('./createAllowedOrigins.js');

//Create The Tables
async function createDB() {

  await lists.create();
  await payment.create();
  await users.create();
  // await allowedOrigins.create();
  return
}

createDB()
  .then(res => {
    console.log({'Success' : 'Schema created'})
    process.exit(0)
  })
  .catch(err => {
    console.error({'Error' : err})
    process.exit(1)
  })

