/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';
import faker from 'faker';

const MAX_DEVICES = 60;

const parseJson = express.json();
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

/**
 * @returns {Array}
 */
function generateDeviceGroups() {
  const totalGroups = faker.random.number({ min: 1, max: 7 });
  const groups = new Array(totalGroups);

  for (let i = 0; i < totalGroups; i++) {
    // eslint-disable-next-line security/detect-object-injection
    groups[i] = {
      id: faker.random.number(),
      name: faker.random.word().toLowerCase(),
      description: faker.random.words().toLowerCase(),
      'created-at': faker.date.past()
    };
  }

  return groups;
}

/**
 * @returns {Array}
 */
function generateWave(wave, status) {
  return {
    name: wave,
    version: faker.random.number(),
    tag: faker.random.word().toLowerCase(),
    'created-at': faker.date.past(),
    'finished-at': faker.date.future(),
    status: status.toLowerCase()
  };
}

function generateActiveWave(wave) {
  return generateWave(wave, 'active');
}

function generateCompleteWave(wave) {
  return generateWave(wave, 'complete');
}

function generateCanceledWave(wave) {
  return generateWave(wave, 'canceled');
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

router.post('/:factory/device-groups', [parseJson], (req, res) => {
  req.log.info(`Creating new device groups for factory '${req.params.factory}'`);

  const { body } = req;

  res.json({
    id: faker.random.number(),
    name: body.name,
    description: body.description,
    'created-at': new Date()
  });
});

router.delete('/:factory/device-groups/:group', (req, res) => {
  const { params } = req;
  req.log.info(`Deleting device group ${params.group} for factory '${params.factory}'`);

  res.status(204).send();
});

router.get('/:factory/device-groups', (req, res) => {
  req.log.info(`Retrieving device groups for factory '${req.params.factory}'`);
  res.json({
    groups: generateDeviceGroups()
  });
});

router.post('/:factory/waves/:wave/rollout', [parseJson], (req, res) => {
  const { params, body } = req;
  const { factory, wave } = params;
  const { group } = body;

  req.log.info(`Rollingout factory '${factory}' wave '${wave}' to group '${group}'`);
  res.json(generateActiveWave(wave));
});

router.post('/:factory/waves/:wave/cancel', (req, res) => {
  const { params } = req;
  const { factory, wave } = params;

  req.log.info(`Canceling factory '${factory}' wave '${wave}'`);
  res.json(generateCanceledWave(wave));
});

router.post('/:factory/waves/:wave/complete', (req, res) => {
  const { params } = req;
  const { factory, wave } = params;

  req.log.info(`Completing factory '${factory}' wave '${wave}'`);
  res.json(generateCompleteWave(wave));
});

export default router;
