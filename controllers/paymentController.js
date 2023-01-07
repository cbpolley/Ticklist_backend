const db = require('../db/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.stripe_key);

exports.getPaymentIntent = async (req, res, next) => {

    const annual_cost = 199;

    let uuid = req.params.uuid;

    let query = 'SELECT email FROM users WHERE uuid = $1'
    let values = [uuid]
  
    db
    .query(query, values)
    .then( async (response) => {

        let user_details = response.rows[0];

        const customer = await stripe.customers.create(
            {
                email: user_details.email
            }
        ).catch((err) => {
          console.log('stripe1. ' + err)
          res.status(200).send({status: 'fail', reason: err})
        })

        const ephemeralKey = await stripe.ephemeralKeys.create(
            {customer: customer.id},
            {apiVersion: process.env.stripe_api_version}
            ).catch((err) => {
              console.log('stripe2. ' + err)
              res.status(200).send({status: 'fail', reason: err})
            })
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: annual_cost,
            currency: 'usd',
            customer: customer.id,
            automatic_payment_methods: {
                enabled: true,
              },
          })

        const setupIntent = await stripe.setupIntents.create({usage: 'on_session'});

        res.status(200).send({
            status: 'success', 
            paymentIntentClientSecret : paymentIntent.client_secret,
            customerEphemeralKeySecret : ephemeralKey.secret,
            setupIntent: setupIntent.client_secret,
            customerId : customer.id,
            annual_cost: annual_cost,
            publishableKey: 'pk_test_51LSn1pBFejqyot3loa9R5ZITFluOllEEcKdgqi6ltta8HEOK4qVEwzApo9Yjkq2vOE4UVzhKOFhnqaQy54vFKm0100cebHBV7M'
        })
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })

}

exports.updatePaymentRecords = async (req, res, next) => {

    let uuid = req.body.packet.uuid
    let payment_period_start = new Date(Date.now())
    let payment_period_end = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    let amount_paid = req.body.packet.amount_paid
    let vendor_id = req.body.packet.vendor_id
    const time = Date.now().toString();
    let receipt_id = "tl" + uuid + time.slice(time.length - 4)

    
    let query = `
    INSERT INTO
      payment (user_uuid, payment_period_start, payment_period_end, amount_paid, vendor_id, receipt_id, created_at, updated_at)
    VALUES 
      ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING 
      payment_period_end;`
    
    let values = [uuid, payment_period_start, payment_period_end, amount_paid, vendor_id, receipt_id]
  
    db
      .query(query, values)
      .then((response) => {
        res.status(200).send({status:'Success', payment_period_end: response.rows[0].payment_period_end})
      })
      .catch(() => {
        res.status(501).send({status:'Failed to update payment records'})
      })
  }
  
exports.getPrevious = async (req, res, next) => {

  let user_uuid = req.params.uuid
  
  let query = `
    SELECT
      payment_period_end    
    FROM
      payment
    WHERE user_uuid = ${user_uuid};`

  db
    .query(query)
    .then((dbRes) => {
      res.status(200).send(dbRes.rows)
    })
    .catch(() => {
      res.status(501).send({
        'Database Error': err
      })
    })
}
