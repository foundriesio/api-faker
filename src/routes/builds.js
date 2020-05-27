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


router.get('/builds/', (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            builds: [
                {
                    // required
                    build_id: 1,
                    url: 'http://fakebuildid/1',
                    status: 'FAILED',
                    runs: [
                        {
                            // required
                            name: 'run-foo',
                            url: 'http://fakerunurl/1/foo',
                            status: 'FAILED',
                            log_url: 'http://fakelogurl/1/foo',
                            // optional
                            created: '2019-10-28T11:01:27+00:00',
                            completed: '2019-10-28T11:01:31+00:00',
                            host_tag: 'amd64',
                            tests: 'http://faketestsurl/1/foo',
                        },
                        {
                            name: 'run-bar',
                            url: 'http://fakerunurl/1/bar',
                            status: 'PASSED',
                            log_url: 'http://fakelogurl/1/bar',
                        },
                        {
                            name: 'run-bar',
                            url: 'http://fakerunurl/1/baz',
                            status: 'CANCELLING',
                            log_url: 'http://fakelogurl/1/baz',
                        },
                    ],
                    // optional
                    name: 'build name foo',
                    trigger_name: 'merge-request',
                    created: '2018-08-10T11:11:26+00:00',
                    completed: '2019-10-28T11:01:31+00:00',
                },
                {
                    build_id: 2,
                    runs: [],
                    status: "QUEUED",
                    url: "http://fakerunurl/2/foo"
                },
                {
                    build_id: 3,
                    url: 'http://fakebuildid/3',
                    status: 'PASSED',
                    runs: [
                        {
                            name: 'run-foo',
                            url: 'http://fakerunurl/3/foo',
                            status: 'PASSED',
                            log_url: 'http://fakelogurl/3/foo',

                        },
                    ],
                },
                {
                    build_id: 4,
                    url: 'http://fakebuildid/4',
                    status: 'PROMOTED',
                    runs: [
                        {
                            name: 'run-foo',
                            url: 'http://fakerunurl/4/foo',
                            status: 'PASSED',
                            log_url: 'http://fakelogurl/4/foo',

                        },
                    ],
                },
                {
                    build_id: 5,
                    url: 'http://fakebuildid/5',
                    status: 'RUNNING_WITH_FAILURES',
                    runs: [
                        {
                            name: 'run-foo',
                            url: 'http://fakerunurl/5/foo',
                            status: 'FAILED',
                            log_url: 'http://fakelogurl/5/foo',
                        },
                        {
                            name: 'run-bar',
                            url: 'http://fakerunurl/5/bar',
                            status: 'RUNNING',
                            log_url: 'http://fakelogurl/5/bar',
                        },
                    ],
                },
                {
                    build_id: 6,
                    url: 'http://fakebuildid/6',
                    status: 'RUNNING',
                    runs: [
                        {
                            name: 'run-foo',
                            url: 'http://fakerunurl/6/foo',
                            status: 'RUNNING',
                            log_url: 'http://fakelogurl/6/foo',
                        },
                        {
                            name: 'run-bar',
                            url: 'http://fakerunurl/6/bar',
                            status: 'RUNNING',
                            log_url: 'http://fakelogurl/6/bar',
                        },
                    ],
                },
                {
                    build_id: 7,
                    url: 'http://fakebuildid/7',
                    status: 'RUNNING',
                    runs: [
                        {
                            name: 'run-foo',
                            url: 'http://fakerunurl/7/foo',
                            status: 'RUNNING',
                            log_url: 'http://fakelogurl/7/foo',
                        },
                        {
                            name: 'run-bar',
                            url: 'http://fakerunurl/7/bar',
                            status: 'CANCELLING',
                            log_url: 'http://fakelogurl/7/bar',
                        },
                    ],
                },
            ],
            total: 7,
            next: 'https://fake/projects/jobserv/builds/?page=1&limit=10',
        }
    });
    return;
});
router.get('/builds/:build/', (req, res) => {
    let status = {
        '1': 'FAILED',
        '2': 'QUEUED',
        '3': 'PASSED',
        '4': 'PROMOTED',
        '5': 'RUNNING_WITH_FAILURES',
        '6': 'RUNNING',
        '7': 'RUNNING',
    }[req.param.build];
    res.status(200).json({
        status: 'success',
        data: {
            build: {
                // required
                build_id: req.param.build,
                url: 'http://fakebuildid/1',
                status,
                runs: [
                    {
                        name: 'run-foo',
                        url: 'http://fakerunurl/1/foo',
                        status: 'FAILED',
                        log_url: 'http://fakelogurl/1/foo',
                        created: '2019-10-28T11:01:27+00:00',
                        completed: '2019-10-28T11:01:31+00:00',
                        host_tag: 'amd64',
                        tests: 'http://faketestsurl/1/foo',
                    },
                    {
                        name: 'run-bar',
                        url: 'http://fakerunurl/1/bar',
                        status: 'PASSED',
                        log_url: 'http://fakelogurl/1/bar',
                    },
                    {
                        name: 'run-bar',
                        url: 'http://fakerunurl/1/baz',
                        status: 'CANCELLING',
                        log_url: 'http://fakelogurl/1/baz',
                    },
                ],
                status_events: [
                    {
                        time: '2019-10-28T11:01:27+00:00',
                        status: 'QUEUED',
                    },
                    {
                        time: '2019-10-28T11:01:30+00:00',
                        status: 'RUNNING_WITH_FAILURES',
                    },
                    {
                        time: '2019-10-28T11:01:30+00:00',
                        status: 'FAILED',
                    },
                    {
                        time: '2019-10-28T11:01:30+01:00',
                        status: 'RUNNING',
                    },
                    {
                        time: '2019-10-28T11:01:30+24:00',
                        status: 'PASSED',
                    },
                    {
                        time: '2019-10-28T11:01:30+34:00',
                        status: 'RUNNING',
                    },
                    {
                        time: '2019-10-28T11:01:30+54:00',
                        status: 'CANCELLING',
                    },
                ],
                runs_url: `http://fakerunsurl/${req.param.build}`,
                reason: 'GitHub PR(89): pull_request',
                annotation: null,
                // optional
                name: 'build name foo',
                trigger_name: 'merge-request',
                created: '2018-08-10T11:11:26+00:00',
                completed: '2019-10-28T11:01:31+00:00',
            }
        }
    });
    return;
});
router.get('/builds/:build/project.yml', (req, res) => {
    res.status(200).type('text/yaml').send('some: yaml');
    return;
});
router.get('/builds/latest/', (req, res) => {
    return;
});

export default router;