const express = require('express');
const r = require('rethinkdb');
const bodyParser = require('body-parser');
const debug = require('debug')('app');
const responseDTO = require('../DTO/responseDTO');

debug.enabled = true;

debug('in the router.');
const routes = ({ connection, tableName, disablePost, disablePut, disablePatch, disableDelete }) => {
  const router = express.Router();
  router.route('/')
    .get((req, res) => {
      r.table(tableName).run(connection, (err, cursor) => {
        if (err) throw err;
        cursor.toArray((error, result) => {
          if (err) throw error;
          res.send(result);
        });
      });
    })
    .post((req, res) => {
      if (!!disablePost) {
        res.status(405).send(new responseDTO('method is not available'));
        return;
      }
      //  need to check that there is an id (token)
      //  and that it does not exist in the system already
      if (req.body.id) {
        r.table(tableName).get(req.body.id).run(connection, (err, result) => {
          if (err) {
            throw err;
          }
          if (result != null) {
            res.status(400).send(new responseDTO('id already exists. insert canceled!'));
            return;
          }
          r.table(tableName).insert(req.body).run(connection, (error, reslt) => {
            if (error) throw error;
            debug(JSON.stringify(reslt, null, 2));
            res.send(new responseDTO('insert succefull', reslt));
          });
        });
      } else {
        r.table(tableName).insert(req.body).run(connection, (error, reslt) => {
          if (error) throw error;
          debug(JSON.stringify(reslt, null, 2));
          res.send(new responseDTO('insert succefull', reslt));
        });
      }
    });

  //  a middleware to get the user based on its token, this will be used in the so called "byId" calls 
  router.use('/:id', (req, res, next) => {
    r.table(tableName).get(req.params.id).run(connection, (err, result) => {
      if (err) {
        throw err;
      }
      req.itemById = result;
      next();
    });
  });

  router.route('/:id')
    .get((req, res) => {
      if (req.itemById == null) {
        res.status(204).send({});
      } else {
        res.send(req.itemById);
      }
    })
    .patch((req, res) => {
      if (!!disablePatch) {
        res.status(405).send('method is not available');
        return;
      }
      if (req.itemById == null) {
        res.status(400).send(new responseDTO('no data available'));
      } else {
        res.send('pathing a part of the user element');
      }
    })
    .delete((req, res) => {
      if (!!disableDelete) {
        res.status(405).send(new responseDTO('method is not available'));
        return;
      }
      if (req.itemById == null) {
        res.status(400).send(new responseDTO('no data available'));
      } else {
        r.table(tableName).get(req.params.id)
          .delete()
          .run(connection, (err, result) => {
            if (err) throw err;
            debug(JSON.stringify(result, null, 2));
            res.status(204).send();
          });
      }
    });

  return router;
};
module.exports = routes;
