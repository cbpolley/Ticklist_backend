'use strict';

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

        const ephermalKey = stripe.ephermalKeys.create({
            customer: customer.id,
            api_version: process.env.stripe_api_version
        }).catch((err) => {console.log('stripe2. ' + err)})

        console.log('ephermalKey')
        console.log(ephermalKey)
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 0.59,
            currency: 'gbp',
            payment_method_types: ['card'],
            customer: customer.id
          }).catch((err) => {console.log('stripe3. ' + err)})

        console.log('paymentIntent')
        console.log(paymentIntent)
    
    
        if (paymentIntent) {
            res.status(200).send({
                status: 'success', 
                paymentIntentClientSecret : paymentIntent.client_secret,
                customerEphemeralKeySecret : ephermalKey.secret,
                customerId : customer.id
            })
        } else {
            res.status(500).send({
                'status': 'failure', 
            })
        }
    })
    .catch(err => {
      res.status(501).send({
        'Database Error': err
      })
    })



}