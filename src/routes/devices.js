/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import { customAlphabet } from 'nanoid/async';
import express from 'express';
import faker from 'faker';

import { decodeJwtSignature } from '../middlewares/authorization.js';
import { OGError } from '../lib/errors.js';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32);

const router = express.Router();

const MAX_DEVICES = 60;
const LIMIT = 20;

const BASE_TARGETS = [
  'cowboy-32-lmp-',
  'cowboy-64-lmp-',
  'og-32-lmp-',
  'og-64-lmp-',
  'raspberrypi3-64-lmp-',
  'raspberrypi4-64-lmp-',
];

const BASE_DEVICE_NAMES = ['cowboy-', 'og-'];

function generateTargetName() {
  return `${faker.random.arrayElement(BASE_TARGETS)}${faker.random.number({
    min: 1,
    max: 99,
  })}`;
}

function getWords(words = 2) {
  return faker.random
    .words(words)
    .toLowerCase()
    .split(' ')
    .slice(0, words)
    .join('-');
}

function generateName(words = 2) {
  return getWords(words);
}

function generateDeviceName(deviceName) {
  let base;

  if (deviceName) {
    base = `${deviceName}-${getWords(1)}`;
  } else {
    base = `${faker.random.arrayElement(BASE_DEVICE_NAMES)}${getWords(1)}`;
  }

  return `${base}-${faker.random.number({ min: 0, max: 100 })}`;
}

async function generateOstreeHash() {
  return (await Promise.all([nanoid(), nanoid()])).join('');
}

function generateDomainName() {
  return `${getWords(2)}-${faker.random.number({ min: 0, max: 99 })}`;
}

function generateArrayOfWords(words = 1, wordsLen = 1) {
  const arr = new Array(words);

  if (words >= 1) {
    for (let idx = 0; idx < words; idx++) {
      // eslint-disable-next-line security/detect-object-injection
      arr[idx] = getWords(wordsLen);
    }
  }

  return arr;
}

function generateDockerApps() {
  return generateArrayOfWords(faker.random.number({ min: 1, max: 6 }), 1);
}

function generateDeviceTags(deviceTag) {
  if (deviceTag) {
    return [deviceTag].concat(
      generateArrayOfWords(faker.random.number({ min: 2, max: 6 }), 1)
    );
  }

  return generateArrayOfWords(faker.random.number({ min: 1, max: 6 }), 1);
}

async function generateUserId() {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, () => ((Math.random() * 16) | 0).toString(16))
      .toLowerCase()
  );
}

async function generateDeviceList({
  limit,
  factory,
  user,
  deviceName,
  deviceTag,
}) {
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    // eslint-disable-next-line security/detect-object-injection
    arr[idx] = {
      uuid: faker.random.uuid(),
      owner: user || (await generateUserId()),
      factory: factory,
      name: generateDeviceName(deviceName),
      'created-at': faker.date.recent(
        faker.random.number({ min: 30, max: 120 })
      ),
      'last-seen': faker.date.recent(),
      'ostree-hash': await generateOstreeHash(),
      'target-name': generateTargetName(),
      'device-tags': generateDeviceTags(deviceTag),
      'docker-apps': generateDockerApps(),
      'network-info': {
        hostname: generateDomainName(),
        local_ipv4: faker.internet.ip(),
        mac: faker.internet.mac(),
      },
      'up-to-date': faker.random.boolean(),
    };
  }

  return arr;
}

router.get('/', [decodeJwtSignature], async (req, res) => {
  let deviceName;
  let deviceTag;
  let factory;
  let limit;
  let page;

  deviceName =
    req.query.name_ilike && req.query.name_ilike.trim().replace(/%/g, '');
  deviceTag = req.query.match_tag && req.query.match_tag.trim();
  factory = (req.query.factory && req.query.factory.trim()) || generateName();
  limit = (req.query.limit && parseInt(req.query.limit.trim(), 10)) || LIMIT;
  page = (req.query.page && parseInt(req.query.page.trim(), 10)) || 1;

  const params = {
    limit: limit,
    factory: factory,
    user: res.locals.user,
    deviceName: deviceName,
    deviceTag: deviceTag,
  };

  res.json({
    devices: await generateDeviceList(params),
    page: page || 1,
    limit: limit,
    pages: Math.ceil(MAX_DEVICES / limit),
    total:
      deviceName || deviceTag
        ? faker.random.number({ min: 1, max: 30 })
        : MAX_DEVICES,
  });
});

router.delete('/:device', [decodeJwtSignature], async (req, res, next) => {
  const status = faker.random.arrayElement([200, 204, 400, 404, 500, 204]);

  req.log.info(`Removing device named '${req.params.device}' with status ${status}`);

  if (status !== 200 && status !== 204) {
    const err = new OGError(`Error removing device '${req.params.device}'`);
    err.status = status;

    if (status === 400) {
      err.error = 'bad_request';
      err.error_description = 'The request made was not valid.';
    } else if (status === 404) {
      err.error = 'not_found';
      err.error_description = `Device '${req.params.device}' does not exist.`;
    } else {
      err.error = 'server_error';
      err.error_description = `There was a problem removing the device '${req.params.device}'.`;
    }

    setImmediate(next.bind(next), err);
    return;
  }

  res.status(status).json({ removed: 'ok' });
});

export default router;
