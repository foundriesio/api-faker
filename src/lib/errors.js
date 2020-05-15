/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

class OGError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

class UnauthorizedError extends OGError {
  constructor() {
    super('You are not authorized to view this page');
    this.status = 401;
  }
}

class NotFoundError extends OGError {
  constructor() {
    super('Requested resource not found');
    this.status = 404;
  }
}

export { OGError, UnauthorizedError, NotFoundError };
