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
function generateTargets(latestVersion, totalDevices) {
  const totalTargets = faker.random.number({ min: 1, max: 10 });
  const targets = new Array(totalTargets);

  for (let i = 0; i < totalTargets; i++) {
    // eslint-disable-next-line security/detect-object-injection
    targets[i] = {
      devices: faker.random.number({ min: 0, max: totalDevices }),
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
    faker.random.words(1).split(' ')[0].toLowerCase(),
  ]);
}

/**
 * @returns {Array}
 */
function generateTags() {
  const totalTags = faker.random.number({ min: 1, max: 7 });
  const tags = new Array(totalTags);

  for (let i = 0; i < totalTags; i++) {
    const devicesTotal = faker.random.number({ min: 1, max: 10 });
    const devicesOnline = faker.random.number({ min: 0, max: devicesTotal });
    const devicesOnLatest = faker.random.number({ min: 0, max: devicesTotal });
    const latestVersion = faker.random.number();

    // eslint-disable-next-line security/detect-object-injection
    tags[i] = {
      name: generateTagName(),
      'devices-total': devicesTotal,
      'devices-online': devicesOnline,
      'devices-on-latest': devicesOnLatest,
      'latest-target': latestVersion,
      targets: generateTargets(latestVersion, devicesTotal),
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

router.delete('/:factory', (req, res) => {
  req.log.info(`Removing factory '${req.params.factory}'`);
  res.status(202).json({});
});

export default router;
