const db = require('../db/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.stripe_key);

exports.getPaymentIntent = async (req, res, next) => {

    console.log(req)

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
            amount: 149,
            currency: 'gbp',
            payment_method_types: ['card'],
            customer: customer.id
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
            customerId : customer.id
        })
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })



}