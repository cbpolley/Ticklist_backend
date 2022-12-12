var express = require('express');
var router = express.Router();

const sharingController = require('../controllers/sharingController.js');

// define the home page route
router.get('/', function(req, res) {
  res.send('Sharing Home')
})

router.post('/confirmGroupMember', sharingController.confirmGroupMember);
router.post('/shareWithUsernames', sharingController.shareWithUsernames);
router.get('/single/:id', sharingController.getSharedGroups);
router.get('/groupMembers/:uuid', sharingController.getGroupMembers);

module.exports = router