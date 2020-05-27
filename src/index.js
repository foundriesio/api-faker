/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import 'v8-compile-cache';

import cuid from 'cuid';
import express from 'express';
import log from '@foundriesio/log';

import { OGError } from './lib/errors';
import appState from './lib/state';
import config from './config';

import BuildsRoutes from './routes/builds';
import DevicesRoutes from './routes/devices';
import FactoriesRoutes from './routes/factories';
import HealthRoutes from './routes/health';
import ResourcesRoutes from './routes/devices';

const cfg = config();

const { NODE_ENV } = process.env;
const port = cfg.get('app').port;
const isProd = NODE_ENV === 'production';

const connections = {};

const app = express();

if (isProd) {
  app.set('trust proxy', true);
}

app.set('case sensitive routing', true);
app.set('strict routing', false);
app.set('x-powered-by', false);

app.use((req, res, next) => {
  req.log = log.child({ reqId: cuid() });
  next();
});

app.use('/builds', BuildsRoutes);
app.use('/healthz', HealthRoutes);
app.use('/factories', FactoriesRoutes);
app.use('/devices', DevicesRoutes);
app.use('/loops', ResourcesRoutes);

// eslint-disable-next-line no-unused-vars
app.use('*', (req, res, _next) => {
  req.log.error('Requested non existing page', req.originalUrl);
  res.status(404).json({
    error: 'not_found',
    error_description: 'The requested resource was not found',
  });
  return;
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  let status;

  if (err instanceof OGError) {
    status = err.status;
  } else {
    status = err.statusCode || err.status || 500;
  }

  if (status !== 404) {
    req.log.error(err);
  }

  res.status(status).json({
    error: 'server_error',
    error_description: 'There was a problem processing the request',
  });
  return;
});

/**
 * Close all sockets and the server instance.
 * @param srv {http.Server} The server to close.
 */
function closeSocketsAndServer(srv) {
  try {
    Object.keys(connections).forEach((key) => {
      connections[`${key}`].end();
    });

    if (srv) {
      srv.close();
    }

    return 0;
  } catch (ex) {
    log.error(ex);
    return 1;
  }
}

function onSignal(srv) {
  appState.shuttingDown();

  setTimeout(
    () => {
      // eslint-disable-next-line no-process-exit
      process.exit(closeSocketsAndServer(srv));
    },
    isProd ? 3000 : 0
  );
}

function onError(err, port) {
  if (err.syscall !== 'listen') {
    throw err;
  }

  switch (err.code) {
    case 'EACCES':
      log.error(`Port ${port} cannot be used: not enough priviledges?`);
      break;
    case 'EADDRINUSE':
      log.error(`Port ${port} is already in use`);
      break;
    default:
      log.error(err);
      break;
  }
}

// Start the server
const server = app.listen(port, (err) => {
  if (err) {
    appState.setBad();
    throw err;
  }

  appState.setGood();

  if (port !== '0') {
    log.info(`Listening on port ${port}`);
  }
});

server.on('error', (err) => {
  appState.setBad();

  onError(err, port);
  // eslint-disable-next-line no-process-exit
  process.exit(closeSocketsAndServer(server));
});

server.on('connection', (socket) => {
  const key = `${socket.remoteAddress}:${socket.remotePort}:${socket.localAddress}:${socket.localPort}`;

  connections[`${key}`] = socket;
  ((k) => {
    socket.on('end', () => delete connections[`${k}`]);
    socket.on('close', () => delete connections[`${k}`]);
  })(key);
});

process.on('SIGINT', () => {
  log.warn('Received SIGINT signal, shutting down');
  onSignal(server);
});

process.on('SIGTERM', () => {
  log.warn('Received SIGTERM signal, shutting down');
  onSignal(server);
});
