const express = require('express');
const bodyParser = require('body-parser');
const debug = require('debug')('app');
const r = require('rethinkdb');

debug.enabled = true;
const sqlApiRouter = require('./routes/sqlApiRouter');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

process.on('unhandledRejection', (err) => {
  debug('unhandledRejection ', err);
});

app.get(['/get', '/'], (req, res) => {
  res.send('test bed for sql and RethinkDB');
});

app.use('/SqlAPI/Users', sqlApiRouter);

let connection = null;

r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
  if (err) {
    // throw err;
    debug('error connecting');
    return;
  }
  conn.use('UsersService');
  connection = conn;
  const rethinkDbUsersRouter = require('./routes/rethinkDbApiRouter')({ connection, tableName: 'Users', disablePost: false, disablePatch: false, disablePut: false, disableDelete: false });
  app.use('/rethinkDbAPI/Users', rethinkDbUsersRouter);
  const rethinkDbLikesRouter = require('./routes/rethinkDbApiRouter')({ connection, tableName: 'Likes', disablePost: false, disablePatch: false, disablePut: false, disableDelete: false });
  app.use('/rethinkDbAPI/Likes', rethinkDbLikesRouter);
  const rethinkDbDepartmentsRouter = require('./routes/rethinkDbApiRouter')({ connection, tableName: 'Departments', disablePost: false, disablePatch: false, disablePut: false, disableDelete: false });
  app.use('/rethinkDbAPI/Departments', rethinkDbDepartmentsRouter);
});

const port = 3003;
app.listen(port, () => {
  debug('listening on port ', port);
});
