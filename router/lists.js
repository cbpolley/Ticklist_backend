var express = require('express');
var router = express.Router();

const listController = require('../controllers/listController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Lists Home')
})

router.get('/single/:id', listController.getSingle);
router.get('/all', listController.getAll);
router.post('/add', listController.add);
router.post('/edit', listController.edit);
router.post('/sharedLists/add', listController.addToSharedLists);
router.get('/single/userLists/:id', listController.getSingleUserSharedLists);
router.get('/shareWithUsername', listController.shareWithUsername);
router.delete('/delete/:id', listController.delete);

module.exports = router
