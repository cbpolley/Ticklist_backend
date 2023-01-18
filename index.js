const express = require('express')
const app = express()
const db = require('./db');
// const port = 3000
const cors = require('cors');
const dotenv = require('dotenv');
// const compression = require('compression');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({
  limit: '50mb'
});

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// set name space
const groupsNameSpace = io.of("/groups");

//Whenever someone connects this gets executed
groupsNameSpace.on('connection', (socket) => {

  socket.on('group', (group_uuid) => {
    socket.join(`groupRoom${group_uuid}`)
  })

  socket.on('group_change', (group_uuid) => {
    socket.to(`groupRoom${group_uuid}`).emit('group_update')
  })

});

dotenv.config();

// app.use(compression());
app.use(jsonParser);

// const http = require('http').Server(app);

app.use(cors());

app.options('*', function(req, res, next) {
  res.append('Access-Control-Allow-Origin', '*');

  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization, Referer');;
  next();
})

app.all('/*', function(req, res, next) {

  let query = 'SELECT origin FROM allowed_origins';

  db
    .query(query)
    .then(response => {

      const allowedOrigins = [];

      function pushOrgin(item, index) {
        allowedOrigins.push(item.origin)
      }
      response.rows.forEach(pushOrgin)
      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization, Referer');
      next();
    })
    .catch(err => {
      console.log(err)
    })
})

//ROUTES
const lists = require('./router/lists');
const users = require('./router/users');
const payment = require('./router/payment');
const groups = require('./router/groups');
const sharing = require('./router/sharing');

//ENDPOINTS
app.use('/lists', lists);
app.use('/users', users);
app.use('/payment', payment);
app.use('/groups', groups);
app.use('/sharing', sharing);

app.get('/', (req, res) => {
  res.status(200).send('server is running')
})

server.listen((process.env.PORT || 3000), function() {
  console.log('listening on', process.env.PORT);
});
