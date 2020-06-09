/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';
import faker from 'faker';

const MAX_DEVICES = 60;

const router = express.Router();

/**
 * @param {Number} latestVersion
 * @returns {Array}
 */
function generateTargets(latestVersion) {
  const totalTargets = faker.random.number({ min: 1, max: 10 });
  const targets = new Array(totalTargets);

  for (let i = 0; i < totalTargets; i++) {
    // eslint-disable-next-line security/detect-object-injection
    targets[i] = {
      devices: faker.random.number({ min: 1, max: 10 }),
      version: faker.random.number({ min: 1, max: latestVersion }),
    };
  }

  return targets;
}

/**
 * @returns {String}
 */
function generateTagName() {
  return faker.random.arrayElement([
    '',
    'promoted',
    'postmerge',
    faker.random.word().toLowerCase(),
  ]);
}

/**
 * @returns {Array}
 */
function generateTags() {
  const totalTags = faker.random.number({ min: 1, max: 10 });
  const tags = new Array(totalTags);

  for (let i = 0; i < totalTags; i++) {
    // eslint-disable-next-line security/detect-object-injection
    tags[i] = {
      name: generateTagName(),
      'devices-total': faker.random.number({ min: 1, max: 20 }),
      'devices-online': faker.random.number({ min: 1, max: 20 }),
      'devices-on-latest': faker.random.number({ min: 1, max: 10 }),
      'latest-target': faker.random.number(),
      targets: generateTargets(),
    };
  }

  return tags;
}

router.get('/:factory/status', (req, res) => {
  req.log.info(`Retrieving status for factory '${req.params.factory}'`);
  res.json({
    'total-devices': MAX_DEVICES,
    tags: generateTags(),
  });
});

export default router;
