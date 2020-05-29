/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';

import { decodeJwtSignature } from '../middlewares/authorization';

const parseJson = express.json();
const router = express.Router();

router.post('/', [ decodeJwtSignature, parseJson ], (req, res) => {
  req.log.info(`Creating factory '${req.body['org-name']}' with platform '${req.body.platform}' for user '${req.body['polis-id']}'`);
  res.status(202).json({ factory_state: 'queued' });
});

export default router;
