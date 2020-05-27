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

const randomAnnotation = () => {
  const name = faker.random.word();
  const sha = Array(64)
    .fill(null)
    .map(() => Math.floor(Math.random() * 17).toString(16))
    .join('');
  const url = faker.internet.url();
  const content = () =>
    faker.lorem.lines(faker.random.number({ min: 0, max: 5 }));
  return faker.random.arrayElement([
    `{"name": "${name}", "sha": "${sha}", "url": "${url}", "details": "## Highlights\\n ${content()}\\n"}`,
    `###Random Markdown\\n${content()}\\n${content()}`,
    faker.random.alphaNumeric(faker.random.number({ min: 50, max: 500 })),
    null,
  ]);
};

const randomBuildStatus = () => faker.random.arrayElement(BUILD_STATUS_CHOICES);

const randomRunStatus = () => faker.random.arrayElement(RUN_STATUS_CHOICES);

const randomHostTag = () => faker.random.arrayElement(HOST_CHOICES);

const randomDate = () =>
  faker.date.recent(faker.random.number({ min: 30, max: 120 }));

const randomDatePassed = () => faker.date.past(1);

const generateOptionallRunFields = (buildId, runName) => {
  const fields = {};
  if (faker.random.boolean()) {
    fields.created = randomDatePassed();
    fields.completed = randomDate();
    fields.host_tag = randomHostTag();
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

const generateOptionalBuildFields = (statusEvents) => {
  const fields = {};
  if (statusEvents) {
    fields.created = randomDatePassed();
  }
  if (faker.random.boolean()) {
    fields.trigger_name = 'merge-request';
    fields.completed = randomDate();
    fields.name = faker.random.word();
  }
  return fields;
};

const generateStatusEvents = () => {
  const limit = faker.random.number({ min: 0, max: 10 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    arr[idx] = {
      time: randomDate(),
      status: randomRunStatus(),
    };
  }
  return arr;
};

const generateAnnotation = (status) => {
  return status === 'PROMOTED' ? randomAnnotation() : null;
};

const generateDetailBuildFields = ({ bid, url, statusEvents, status }) => {
  return {
    status_events: statusEvents,
    runs_url: `${url}/${bid}/runs`,
    reason: `GitHub PR(${faker.random.number()}): pull_request`,
    annotation: generateAnnotation(status),
  };
};

const generateBuildItem = ({ isDetailed, url, bid }) => {
  const status = randomBuildStatus();
  const statusEvents = generateStatusEvents();
  const detailedFields = isDetailed
    ? generateDetailBuildFields({ bid, url, statusEvents, status })
    : {};
  return {
    build_id: bid,
    url: `${url}/${bid}`,
    status,
    runs: generateRuns(bid, url),
    ...generateOptionalBuildFields(statusEvents),
    ...detailedFields,
  };
};

const generateBuildList = (url) => {
  const limit = faker.random.number({ min: 0, max: 60 });
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
  res.type('text/yaml').send(`\
scripts:
  flake8: '#!/bin/sh -ex

    pip3 install flake8

    flake8 --ignore=E722 --exclude=migrations/ ./

    '
  unit-test: '#!/bin/sh -ex

    apk --no-cache add git python3-dev musl-dev gcc openssl libffi-dev openssl-dev

    git config --global user.email "cibot@example.com"

    git config --global user.name "cibot"

    ./unit-test.sh

    '
timeout: 5
triggers:
- name: merge-request
  runs:
  - container: python:3.5-alpine
    host-tag: amd64
    name: unit-test
    script: unit-test
    test-grepping:
      fixupdict:
        ERROR: FAILED
        ok: PASSED
      result-pattern: ^(?P<name>test_.*) \.\.\. (?P<result>(ok|ERROR))$
  - container: python:3.5-alpine
    host-tag: amd64
    name: flake8
    script: flake8
  type: github_pr
- name: post-merge
  params:
    GIT_POLL_REFS: refs/heads/master
    GIT_URL: https://github.com/linaro-technologies/jobserv.git
  runs:
  - container: python:3.5-alpine
    host-tag: amd64
    name: flake8
    script: flake8
  type: git_poller`);
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
