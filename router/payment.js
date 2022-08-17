var express = require('express');
var router = express.Router();

const paymentController = require('../controllers/paymentController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Payment Home')
})

router.get('/intent/single/:id', paymentController.getPaymentIntent);
router.get('/previous/single/:id', paymentController.getPrevious);
router.post('/edit', paymentController.updatePaymentRecords);

module.exports = router
