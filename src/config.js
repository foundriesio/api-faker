/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

import convict from 'convict';
import convict_format_with_validator from 'convict-format-with-validator';
import json5 from 'json5';

convict.addFormats(convict_format_with_validator);
convict.addParser({ extension: 'json', parse: json5.parse });

const { NODE_ENV } = process.env;

if (NODE_ENV !== 'production') {
  require('dotenv').config();
}

let cfg;

export function config() {
  if (!cfg) {
    cfg = convict({
      faker: {
        doc:
          'The secret key to sign JWT for the faker api service, never use in production',
        format: String,
        sensitive: true,
        default: '',
        env: 'FIO_FAKER_JWT_SECRET_KEY',
      },
      app: {
        port: {
          format: 'port',
          default: 3040,
          env: 'FIO_FAKER_APP_PORT',
        },
      },
    });
  }

  return cfg;
}

export default config;
