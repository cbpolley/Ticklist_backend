var express = require('express');
var router = express.Router();

const listController = require('../controllers/listController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Lists Home')
})

router.get('/getSingle/:id', listController.getSingle);
router.get('/getAll', listController.getAll);
router.post('/add', listController.add);
router.post('/edit', listController.edit);
router.delete('/delete/:id', listController.delete);

module.exports = router