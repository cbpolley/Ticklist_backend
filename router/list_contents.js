var express = require('express');
var router = express.Router();

const listContentsController = require('../controllers/listContentsController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('List Contents')
})

router.get('/single/:id', listContentsController.getSingle);
router.post('/add', listContentsController.add);
router.post('/edit', listContentsController.edit);
router.delete('/delete/:id', listContentsController.delete);

module.exports = router
