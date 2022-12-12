var express = require('express');
var router = express.Router();

const groupController = require('../controllers/groupController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Groups Home')
})

router.get('/single/:id', groupController.getSingle);
router.get('/multiple/:id', groupController.getMultiple);
router.get('/all', groupController.getAll);
router.post('/add', groupController.add);
router.post('/edit', groupController.edit);
router.post('/delete', groupController.delete);

module.exports = router
