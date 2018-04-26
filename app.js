const express = require('express');
const bodyParser = require('body-parser');
const debug = require('debug')('app');
const r = require('rethinkdb');
const h = require('./helpers/helper');
const sql = require('mssql');
const config = require('./config/sql');

debug.enabled = true;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

process.on('unhandledRejection', (err) => {
  debug('unhandledRejection ', err);
});

app.get(['/get', '/'], (req, res) => {
  res.send('test bed for sql and RethinkDB is here');
});
// const pool = new sql.ConnectionPool(config);
const pool = new sql.ConnectionPool(config, (err) => {
// pool.connect((err) => {
  if (err) { debug("error in getting the connection pool"); throw (err); }
  const departmentaFields = [new h.Field('Id', 'bigInt'), new h.Field('Name', 'string'), new h.Field('Type', 'string'), new h.Field('ParentId', 'bigint'), new h.Field('ModifiedOn', 'datetime')];
  const departmentsTbl = new h.SQLTable({ tableName: 'Departments', fields: departmentaFields, autoGeneratedPrimeryKey: true, connectionPool: pool });
  const usersFields = [new h.Field('Id', 'string'), new h.Field('Username', 'string'), new h.Field('Firstname', 'string'), new h.Field('Lastname', 'string'), new h.Field('ModifiedOn', 'datetime')];
  const usersTbl = new h.SQLTable({ tableName: 'Users', fields: usersFields, autoGeneratedPrimeryKey: false, connectionPool: pool });
  const rolesFields = [new h.Field('Id', 'bigInt'), new h.Field('Name', 'string'), new h.Field('ModifiedOn', 'datetime')];
  const rolesTbl = new h.SQLTable({ tableName: 'Roles', fields: rolesFields, autoGeneratedPrimeryKey: true, connectionPool: pool });

  const sqlDepartmentsApiRouter = require('./routes/sqlApiRouter')({
    tableName: 'Departments',
    disablePost: false,
    disablePatch: false,
    disablePut: false,
    disableDelete: false,
    autoGeneratedPrimeryKey: true,
    fields: departmentaFields,
    tbl: departmentsTbl,
  });
  const sqlUsersApiRouter = require('./routes/sqlApiRouter')({
    tableName: 'Users',
    autoGeneratedPrimeryKey: false,
    fields: usersFields,
    tbl: usersTbl,
  });
  const sqlRolesApiRouter = require('./routes/sqlApiRouter')({
    tableName: 'Roles',
    autoGeneratedPrimeryKey: true,
    fields: rolesFields,
    tbl: rolesTbl,
  });

  app.use('/SqlAPI/Departments', sqlDepartmentsApiRouter);
  app.use('/SqlAPI/Users', sqlUsersApiRouter);
  app.use('/SqlAPI/Roles', sqlRolesApiRouter);
});


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
