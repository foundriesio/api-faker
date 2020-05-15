/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

export function logError(log, err) {
  let logger;
  if (log) {
    logger = log;
  }

  if (err.name === 'HTTP Error' && err.body) {
    logger.error(
      `${err.statusCode} - ${Buffer.from(err.body).toString('utf-8')}`
    );
    return;
  }

  if (err.body) {
    const status = err.status ? err.status : '999';

    if (Buffer.isBuffer(err.body)) {
      const body = Buffer.from(err.body).toString('utf-8');
      logger.error(`${status} - ${body}`);
    } else {
      logger.error(`${status} - ${err.body}`);
    }
  } else {
    if (Buffer.isBuffer(err)) {
      logger.error(Buffer.from(err).toString('utf-8'));
    } else {
      logger.error(err);
    }
  }
}

export default logError;
