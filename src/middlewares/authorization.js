/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import Future from 'bluebird';
import jwt from 'jsonwebtoken';

import config from '../config';

Future.promisifyAll(jwt);

const cfg = config();
const secret = cfg.get('faker');

export async function decodeJwtSignature(req, res, next) {
  const authorizationHeader = req.headers['authorization'];

  if (!authorizationHeader) {
    return next();
  }

  const [authType, authValue] = authorizationHeader.split(' ');

  if (authType.toLowerCase() !== 'jwt-bearer') {
    return next();
  }

  try {
    const payload = await jwt.verifyAsync(authValue, secret);
    res.locals.user = payload.id;
  } catch (ex) {
    req.log.error('Error decoding JWT payload');
    req.log.error(ex);
  }

  next();
}
