/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';

import appState from '../lib/state';

const router = express.Router();

router.get('/', (req, res) => {
  if (appState.isGood() && !appState.isShuttingDown()) {
    res.json({ status: 'ok' });
    return;
  }

  res.status(503).json({ status: 'ko' });
});

export default router;
