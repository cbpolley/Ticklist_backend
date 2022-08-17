var express = require('express');
var router = express.Router();

const userController = require('../controllers/userController.js');
const userAuthController = require('../controllers/userAuthController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Users Home')
})

router.get('/single/:id', userController.getSingle);
router.get('/all', userController.getAll);
router.post('/add', userController.add);
router.post('/edit', userController.edit);
router.delete('/delete/:id', userController.delete);

router.get('/checkExistingEmail/:email', userController.checkExistingEmail);

router.get('/auth/checkUser/:token', userAuthController.checkUser);
router.post('/auth/login', userAuthController.login);
router.post('/auth/passwordReset', userAuthController.passwordReset);
router.post('/auth/pinReset', userAuthController.pinReset);

module.exports = router
