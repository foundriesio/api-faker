/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';
import faker from 'faker';

import appState from '../lib/state';

const BUILD_STATUS_CHOICES = [
  'FAILED',
  'QUEUED',
  'PASSED',
  'PROMOTED',
  'RUNNING_WITH_FAILURES',
  'RUNNING',
  'RUNNING',
];
const RUN_STATUS_CHOICES = [...BUILD_STATUS_CHOICES, 'CANCELLING'];
const HOST_CHOICES = ['arm32', 'arm64', 'amd64'];
const randomBuildStatus = () => faker.random.arrayElement(BUILD_STATUS_CHOICES);
const randomRunStatus = () => faker.random.arrayElement(RUN_STATUS_CHOICES);
const randomHostTag = () => faker.random.arrayElement(HOST_CHOICES);
const randomDate = () =>
  faker.date.recent(faker.random.number({ min: 30, max: 120 }));
const generateOptionallRunFields = (buildId, runName) => {
  const fields = {};
  if (faker.random.boolean()) {
    fields.created = randomDate();
  }
  if (faker.random.boolean()) {
    fields.completed = randomDate();
  }
  if (faker.random.boolean()) {
    fields.host_tag = randomHostTag();
  }
  if (faker.random.boolean()) {
    fields.tests = `https://example.net/${buildId}/${runName}`;
  }
  return fields;
};
const generateRuns = (bid, url) => {
  const limit = faker.random.number({ min: 2, max: 6 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    const name = faker.random.word();
    arr[idx] = {
      name,
      url: `${url}/${bid}/${name}`,
      status: randomRunStatus(),
      log_url: `${url}/${bid}/${name}`,
      ...generateOptionallRunFields(bid, name),
    };
  }
  return arr;
};
const generateOptionalBuildFields = () => {
  const fields = {};
  if (faker.random.boolean()) {
    fields.name = faker.random.word();
  }
  if (faker.random.boolean()) {
    fields.trigger_name = 'merge-request';
  }
  if (faker.random.boolean()) {
    fields.created = randomDate();
  }
  if (faker.random.boolean()) {
    fields.completed = randomDate();
  }
  return fields;
};
const generateStatusEvents = () => {
  const limit = faker.random.number({ min: 3, max: 10 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    arr[idx] = {
      time: randomDate(),
      status: randomRunStatus(),
    };
  }
  return arr;
};
const generateDetailBuildFields = (bid, url) => {
  return {
    status_events: generateStatusEvents(),
    runs_url: `${url}/${bid}/runs`,
    reason: `GitHub PR(${faker.random.number()}): pull_request`,
    annotation: null,
  };
};

const generateBuildItem = ({ isDetailed, url, bid }) => {
  const detailedFields = isDetailed ? generateDetailBuildFields(bid, url) : {};
  return {
    build_id: bid,
    url: `${url}/${bid}`,
    status: randomBuildStatus(),
    runs: generateRuns(bid, url),
    ...generateOptionalBuildFields(),
    ...detailedFields,
  };
};

const generateBuildList = (url) => {
  const limit = faker.random.number({ min: 30, max: 120 });
  const arr = new Array(limit);
  const buildUrl = `${url}/builds`;
  for (let idx = 0; idx < limit; idx++) {
    const bid = faker.random.number();
    arr[idx] = generateBuildItem({ url: buildUrl, bid });
  }
  return arr;
};

const router = express.Router();
router.get('/:project/builds/', (req, res) => {
  const project = req.params.project;
  const url = `https://example.net/projects/${project}`;
  const builds = generateBuildList(url);
  res.json({
    status: 'success',
    data: {
      builds: builds,
      total: builds.length,
      next: `${url}/builds/?page=1&limit=10`,
    },
  });
  return;
});
router.get('/:project/builds/:build/', (req, res) => {
  const project = req.params.project;
  const url = `https://example.net/projects/${project}`;
  res.json({
    status: 'success',
    data: {
      build: generateBuildItem({
        bid: req.params.build,
        isDetailed: true,
        url,
      }),
    },
  });
  return;
});
router.get('/:project/builds/:build/project.yml', (req, res) => {
  const bid = req.params.build;
  const project = req.params.project;
  res
    .type('text/yaml')
    .send(`some: "yaml for project ${project} build ${bid}"`);
  return;
});
router.get('/:project/builds/latest', (req, res) => {
  const project = req.params.project;
  const url = `https://example.net/projects/${project}`;
  const bid = faker.random.number();
  res.json({
    status: 'success',
    data: {
      build: generateBuildItem({
        isDetailed: true,
        url,
        bid,
      }),
    },
  });
  return;
});

export default router;
