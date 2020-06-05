/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import express from 'express';
import faker from 'faker';

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
const ROOT_URL = 'https://example.net/projects';
const PROJECT_ROUTE = ':project([0-9A-z_-]{1,}/lmp|[0-9A-z_-]{1,})';
const MAX_BUILDS = 60;
const DEFAULT_LIMIT = 25;

const randomAnnotation = () => {
  const name = randomWord();
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

const randomWordNullable = () =>
  faker.random.arrayElement([null, randomWord()]);

const randomRunStatus = () => faker.random.arrayElement(RUN_STATUS_CHOICES);

const randomHostTag = () => faker.random.arrayElement(HOST_CHOICES);

const randomDate = () =>
  faker.date.recent(faker.random.number({ min: 30, max: 120 }));

const randomWord = () => faker.random.word().split(' ')[0].toLowerCase();

const randomDatePassed = () => faker.date.past(1);

const generateOptionalRunFields = ({ url, statusEvents }) => {
  const fields = {};
  if (faker.random.boolean()) {
    fields.host_tag = randomHostTag();
    fields.tests = `${url}/tests/`;
  }
  if (statusEvents) {
    fields.created = randomDatePassed();
    fields.completed = randomDate();
  }
  return fields;
};

const generateRuns = ({ url, statusEvents }) => {
  const limit = faker.random.number({ min: 2, max: 6 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    const name = randomWord();
    const runUrl = `${url}/runs/${name}`;
    arr[idx] = {
      name,
      url: runUrl,
      status: randomRunStatus(),
      log_url: `${runUrl}/console.log`,
      ...generateOptionalRunFields({ url: runUrl, statusEvents }),
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
    fields.name = randomWord();
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

const generateDetailBuildFields = ({ url, statusEvents, status }) => {
  return {
    status_events: statusEvents,
    runs_url: `${url}/runs`,
    reason: `GitHub PR(${faker.random.number()}): pull_request`,
    annotation: generateAnnotation(status),
  };
};

const generateBuildItem = ({ isDetailed, url, bid }) => {
  const itemUrl = `${url}/${bid}`;
  const status = randomBuildStatus();
  const statusEvents = generateStatusEvents();
  const detailedFields = isDetailed
    ? generateDetailBuildFields({ url: itemUrl, statusEvents, status })
    : {};
  return {
    build_id: bid,
    url: itemUrl,
    status,
    runs: generateRuns({ url: itemUrl, statusEvents }),
    ...generateOptionalBuildFields(statusEvents),
    ...detailedFields,
  };
};

const generateBuildList = ({ limit, url }) => {
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    const bid = faker.random.number();
    arr[idx] = generateBuildItem({ url, bid });
  }
  return arr;
};

const generateDetailRunFields = ({ url, statusEvents }) => ({
  artifacts: generateRunArtifacts(url),
  status_events: statusEvents,
  worker_name: randomWord(),
});

const generateRunList = (url) => {
  const limit = faker.random.number({ min: 0, max: 60 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    const name = randomWord();
    arr[idx] = generateRunItem({ url, name });
  }
  return arr;
};

const generateRunItem = ({ name, url, isDetailed = false }) => {
  const itemUrl = `${url}/${name}`;
  const statusEvents = generateStatusEvents();
  const detailFields = isDetailed
    ? generateDetailRunFields({ url: itemUrl, statusEvents })
    : {};
  return {
    name,
    status: randomRunStatus(),
    url: itemUrl,
    log_url: `${itemUrl}/console.log`,
    ...generateOptionalRunFields({ url: itemUrl, statusEvents }),
    ...detailFields,
  };
};

const generateRunArtifacts = (url) =>
  Array(faker.random.number({ min: 0, max: 15 }))
    .fill(null)
    .map(() => `${url}/${randomWord()}`);

const generateDetailTestFields = () => {
  const results = Array(faker.random.number({ min: 0, max: 10 }))
    .fill(null)
    .map(() => ({
      name: randomWord(),
      context: randomWordNullable(),
      status: randomRunStatus(),
      output: randomWordNullable(),
    }));
  return { results };
};

const generateTestItem = ({ name, url, isDetailed = false }) => {
  const itemUrl = `${url}/${name}`;
  const detailFields = isDetailed ? generateDetailTestFields() : {};
  return {
    name,
    url: itemUrl,
    status: randomRunStatus(),
    context: randomWordNullable(),
    created: randomDate(),
    ...detailFields,
  };
};

const generateTestList = (url) => {
  const limit = faker.random.number({ min: 0, max: 15 });
  const arr = new Array(limit);
  for (let idx = 0; idx < limit; idx++) {
    const name = randomWord();
    arr[idx] = generateTestItem({ url, name });
  }
  return arr;
};

const router = express.Router();

router.get(`/${PROJECT_ROUTE}/builds/`, (req, res) => {
  const project = req.params.project;
  const url = `${ROOT_URL}/${project}/builds`;
  const page = (req.query.page && parseInt(req.query.page.trim(), 10)) || 1;
  const limit = (req.query.limit && parseInt(req.query.limit.trim(), 10)) || DEFAULT_LIMIT;

  res.json({
    status: 'success',
    data: {
      builds: generateBuildList({ limit, url }),
      page: page || 1,
      limit: limit, 
      pages: Math.ceil(MAX_BUILDS / limit),
      total: MAX_BUILDS,
      next: `${url}/builds/?page=1&limit=10`,
    },
  });
  return;
});

router.get(`/${PROJECT_ROUTE}/builds/:build/`, (req, res) => {
  const { project, build } = req.params;
  const url = `${ROOT_URL}/${project}/builds`;
  res.json({
    status: 'success',
    data: {
      build: generateBuildItem({
        bid: build,
        isDetailed: true,
        url,
      }),
    },
  });
  return;
});

router.get(`/${PROJECT_ROUTE}/builds/:build/project.yml`, (req, res) => {
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

router.get(`/${PROJECT_ROUTE}/builds/latest`, (req, res) => {
  const project = req.params.project;
  const url = `${ROOT_URL}/${project}`;
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

router.get(`/${PROJECT_ROUTE}/builds/:build/runs/`, (req, res) => {
  const { project, build } = req.params;
  const url = `${ROOT_URL}/${project}/builds/${build}/runs`;
  res.json({
    status: 'success',
    data: {
      runs: generateRunList(url),
    },
  });
});

router.get(`/${PROJECT_ROUTE}/builds/:build/runs/:run/`, (req, res) => {
  const { project, build, run } = req.params;
  const url = `${ROOT_URL}/${project}/builds/${build}/runs`;
  res.json({
    status: 'success',
    data: {
      run: generateRunItem({ name: run, url, isDetailed: true }),
    },
  });
});

router.get(
  `/${PROJECT_ROUTE}/builds/:build/runs/:run/tests/:test`,
  (req, res) => {
    const { project, build, run, test } = req.params;
    const url = `${ROOT_URL}/${project}/builds/${build}/runs/${run}/tests`;
    res.json({
      status: 'success',
      data: {
        test: generateTestItem({ name: test, url, isDetailed: true }),
      },
    });
  }
);

router.get(`/${PROJECT_ROUTE}/builds/:build/runs/:run/tests`, (req, res) => {
  const { project, build, run } = req.params;
  const url = `${ROOT_URL}/${project}/builds/${build}/runs/${run}/tests`;
  res.json({
    status: 'success',
    data: {
      tests: generateTestList(url),
    },
  });
});

router.get(
  `/${PROJECT_ROUTE}/builds/:build/runs/:run/:artifact`,
  (req, res) => {
    const content = faker.lorem.sentences(
      faker.random.number({ min: 1, max: 30 })
    );
    res.type('text/plain').send(content);
  }
);

export default router;
