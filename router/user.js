var express = require('express');
var router = express.Router();

const userController = require('../controllers/userController.js');
const userAuthController = require('../controllers/userAuthController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('User Home')
})

router.get('/getSingle/:id', userController.getSingle);
router.get('/getAll', userController.getAll);
router.post('/add', userController.add);
router.post('/edit', userController.edit);
router.delete('/delete/:id', userController.delete);

router.post('/auth/login', userAuthController.login);
router.post('/auth/passwordReset', userAuthController.passwordReset);
router.post('/auth/pinReset', userAuthController.pinReset);

module.exports = router
