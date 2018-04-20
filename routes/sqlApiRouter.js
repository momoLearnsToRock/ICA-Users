const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const debug = require('debug')('app');
const ResponseDTO = require('../DTO/responseDTO');
const config = require('../config/sql');
const r = require('rethinkdb');
const h = require('../helpers/helper');

debug.enabled = true;

// const fields = [new h.Field('Id', 'bigInt'), new h.Field('Name', 'string'), new h.Field('Type', 'string'), new h.Field('ParentId', 'bigint'), new h.Field('ModiefiedOn', 'datetime')];
// const tbl1 = new h.SQLTable('departments', fields, true);
// debug('test: ', tbl1.getins(true));

const routes = ({ connection, disablePost, disablePut, disablePatch, disableDelete, tbl }) => {
  const router = express.Router();
  router.route('/')
    .get((req, res) => {
      (async function query() {
        let result = null;
        try {
          await sql.connect(config);
          const requ = new sql.Request();
          result = await requ.query(`select * from ${tbl.tableName}`);// where id = ${value}`
          debug(result);
          sql.close();
          res.send(result);
        } catch (err) {
          debug(err);
          res.status(400).send(new ResponseDTO('error', result));
        }
      }());
    })
    .post((req, res) => {
      if (!!disablePost) {
        res.status(405).send(new ResponseDTO('method is not available'));
        return;
      }
      //  need to check that there is an id (token)
      //  and that it does not exist in the system already
      if (req.body.Id && !!autoGeneratedPrimeryKey) {
        res.status(400).send(new ResponseDTO('id should not be passed, it will be generated by the system'));
        return;
      }
      (async function query() {
        let result = null;
        try {
          await sql.connect(config);
          const requ = new sql.Request();
          if (req.body.Id) {
            requ.input('Id', req.body.Id);
            result = await requ.query(`select * from ${tbl.tableName} where Id= @Id`);
            if (!!result.recordset && result.recordset.length !== 0) {
              res.status(400).send(new ResponseDTO('id already exists. insert canceled!'));
              sql.close();
              return;
            }
          }
          result = await requ.query(tbl.createInsertIntoStatement(!autoGeneratedPrimeryKey, req.body, requ));
          debug('return of insert (replace into)', result);
          sql.close();
          res.send(result);
        } catch (err) {
          debug(err);
          res.status(400).send(new ResponseDTO('error', result));
          sql.close();
        }
      }());
    });

  //  a middleware to get the user based on its token, this will be used in the so called "byId" calls 
  router.use('/:id', (req, res, next) => {
    if (req.body.Id && req.body.Id !== req.params.id) {
      res.status(400).send(new ResponseDTO('Wrong id was passed as part o request body.'));
    }
    else {
      (async function query() {
        let result = null;
        try {
          await sql.connect(config);
          const requ = new sql.Request();
          debug('select by id: ', `select * from ${tbl.tableName} where Id= @id`);
          requ.input('id', req.params.id);
          result = await requ.query(`select * from ${tbl.tableName} where Id= @id`);
          debug('return of check for the same id', result);
          req.itemById = null;
          if (!!result.recordset && result.recordset.length === 1) {
            req.itemById = result.recordset[0];
          }
          sql.close();
          next();
        } catch (err) {
          debug(err);
          res.status(400).send(new ResponseDTO('error', result));
          sql.close();
        }
      }());
    }
  });

  router.route('/:id')
    .get((req, res) => {
      if (req.itemById == null) {
        res.status(204).send({});
      } else {
        res.send(req.itemById);
      }
    })
    .put((req, res) => {
      if (!!disablePut) {
        res.status(405).send(new ResponseDTO('method is not available'));
        return;
      }
      if (req.itemById == null) {
        res.status(400).send(new ResponseDTO('no data available'));
      } else {
        (async function query() {
          let result = null;
          try {
            await sql.connect(config);
            let requ = new sql.Request();
            debug('update query');
            requ = new sql.Request();
            result = await requ.query(tbl.createUpdateStatement(!autoGeneratedPrimeryKey, req.body, req.params.id, requ));// where id = ${value}`
            debug('result of put ', result);
            sql.close();
            res.send(result);
          } catch (err) {
            debug(err);
            res.status(400).send(new ResponseDTO('error', typeof result !== 'undefined' ? result : null));
            sql.close();
          }
        }());
      }
    })
    .patch((req, res) => {
      if (!!disablePut) {
        res.status(405).send(new ResponseDTO('method is not available'));
        return;
      }
      if (req.itemById == null) {
        res.status(400).send(new ResponseDTO('no data available'));
      } else {
        (async function query() {
          let result = null;
          try {
            await sql.connect(config);
            let requ = new sql.Request();
            debug('update query');
            requ = new sql.Request();
            result = await requ.query(tbl.createUpdateStatement(!autoGeneratedPrimeryKey, req.body, req.params.id, requ));// where id = ${value}`
            debug('result of put ', result);
            sql.close();
            res.send(result);
          } catch (err) {
            debug(err);
            res.status(400).send(new ResponseDTO('error', typeof result !== 'undefined' ? result : null));
            sql.close();
          }
        }());
      }
    })
    .delete((req, res) => {
      if (!!disableDelete) {
        res.status(405).send(new ResponseDTO('method is not available'));
        return;
      }
      if (req.itemById == null) {
        res.status(400).send(new ResponseDTO('no data available'));
      } else {
        (async function query() {
          let result = null;
          try {
            await sql.connect(config);
            const requ = new sql.Request();
            result = await requ.query(tbl.createDeleteStatement(req.params.id, requ));
            debug('return of check for the delete statement', result);
            req.itemById = null;
            // error handling based on the result from server remaining
            sql.close();
            res.status(204).send();
          } catch (err) {
            debug(err);
            res.status(400).send(new ResponseDTO('error', result));
            sql.close();
          }
        }());
      }
    });

  return router;
};
module.exports = routes;
