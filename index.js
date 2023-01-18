const express = require('express')
const app = express()
const http = require('http').Server(app);
const db = require('./db');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({
  limit: '50mb'
});

dotenv.config();

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


const io = require("socket.io")(http, {
  pingTimeout:12000,
  pingInterval:5000,
  // cors: {
  //   origin: "http:/localhost:8100",
  //   allowedHeaders: ["my-custom-header"],
  //   credentials: true
  // }
  cors:true,
  origins: ['http://localhost', 'http://localhost:8080',  'http://localhost:8080', '//localhost']
});
// set name space
const groupsNameSpace = io.of("/groups");

const emitToGroup = (group_uuid) => {
  groupsNameSpace.to(`groupRoom${group_uuid}`).emit('group_update')
}

//Whenever someone connects this gets executed
groupsNameSpace.on('connection', (socket) => {

  console.log('connected socket')

  socket.on('group', (group_uuid) => {
    socket.join(`groupRoom${group_uuid}`)
  })

  socket.on('group_change', (group_uuid) => {
    console.log('group_change')
    console.log(group_uuid)
    emitToGroup(group_uuid)
  })

});

// app.use(compression());
app.use(jsonParser);

// const http = require('http').Server(app);

app.use(cors());

//ROUTES
const lists = require('./router/lists');
const users = require('./router/users');
const payment = require('./router/payment');
const groups = require('./router/groups');
const sharing = require('./router/sharing');
const { group } = require('console');

//ENDPOINTS
app.use('/lists', lists);
app.use('/users', users);
app.use('/payment', payment);
app.use('/groups', groups);
app.use('/sharing', sharing);

app.get('/', (req, res) => {
  res.status(200).send('server is running')
})

http.listen((process.env.PORT || 3000), function() {
  console.log('listening on', process.env.PORT);
});
