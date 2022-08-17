const db = require('../db/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.stripe_key);

exports.getPaymentIntent = async (req, res, next) => {

    console.log(req)

    const annual_cost = 199;

    let user_id = req.params.id;

    let query = 'SELECT email FROM users WHERE user_id = $1'
    let values = [user_id]
  
    db
    .query(query, values)
    .then( async (response) => {

        console.log(response)

        let user_details = response.rows[0];

        const customer = await stripe.customers.create(
            {
                email: user_details.email
            }
        ).catch((err) => {console.log('stripe1. ' + err)})

        console.log('customer')
        console.log(customer)

        const ephemeralKey = await stripe.ephemeralKeys.create(
            {customer: customer.id},
            {apiVersion: process.env.stripe_api_version}
            ).catch((err) => {console.log('stripe2. ' + err)})

        console.log('ephemeralKey')
        console.log(ephemeralKey)
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: annual_cost,
            currency: 'usd',
            customer: customer.id,
            automatic_payment_methods: {
                enabled: true,
              },
          })

          console.log('paymentIntent')
          console.log(paymentIntent)
    
        const setupIntent = await stripe.setupIntents.create({usage: 'on_session'});

        console.log('setupIntent')
        console.log(setupIntent)

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

    let user_id = req.body.packet.user_id
    let payment_period_start = new Date(Date.now())
    let payment_period_end = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    let amount_paid = req.body.packet.amount_paid
    let vendor_id = req.body.packet.vendor_id
    const time = Date.now().toString();
    let receipt_id = "tl" + user_id + time.slice(time.length - 4)
    
    let query = `
      INSERT INTO
        payment (user_id, payment_period_start, payment_period_end, amount_paid, vendor_id, receipt_id, created_at, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING payment_id`

    let values = [user_id, payment_period_start, payment_period_end, amount_paid, vendor_id, receipt_id]
  
    db
      .query(query, values)
      .then(() => {
        res.status(200).send({status:'Success'})
      })
      .catch(() => {
        res.status(501).send({status:'Failed to update payment records'})
      })
  }
  
exports.getPrevious = async (req, res, next) => {

  let user_id = req.params.id
  
  let query = `
    SELECT
      payment_period_end,
      case when now() >= payment.payment_period_start and now() <= payment_period_end then true else false end as payment_valid
    FROM
      payment
    WHERE user_id = ${user_id}`

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
