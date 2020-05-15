/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import jws from 'jws';

export function decodeJwtSignature(req, res, next) {
  const authorizationHeader = req.headers['authorization'];

  if (!authorizationHeader) {
    return;
  }

  const [authType, authValue] = authorizationHeader.split(' ');

  if (authType.toLowerCase() !== 'jwt-bearer') {
    return;
  }

  try {
    const payload = JSON.parse(jws.decode(authValue).payload);
    res.locals.user = payload.id;
  } catch (ex) {
    req.log.error('Error decoding JWT payload');
    req.log.error(ex);
  }

  next();
}
