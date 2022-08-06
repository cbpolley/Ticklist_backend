'use strict';

const db = require('../db/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.stripe_key);

exports.getPaymentIntent = async (req, res, next) => {

    let user_id = req.params.user_id;

    let query = 'SELECT email FROM users WHERE user_id = $1'
    let values = [user_id]
  
    db
    .query(query, values)
    .then(async (response) => {
        let user_details = response.data.rows[0];

        const customer = await stripe.customer.create(
            {
                email: user_details.email
            }
        )

        const ephermalKey = stripe.ephermalKey.create({
            customer: customer.id,
            api_version: process.env.stripe_api_version
        })
    
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 0.59,
            currency: 'gbp',
            payment_method_types: ['card'],
            customer: customer.id
          })
    
    
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