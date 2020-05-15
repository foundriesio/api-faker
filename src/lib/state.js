/*
Copyright 2020 Foundries.IO Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

class State {
  constructor() {
    this.good = false;
    this.shutDown = false;
  }
}

State.prototype.isGood = function () {
  return this.good;
};

State.prototype.isShuttingDown = function () {
  return this.shutDown;
};

State.prototype.setGood = function () {
  this.good = true;
};

State.prototype.setBad = function () {
  this.good = false;
};

State.prototype.shuttingDown = function () {
  this.shutDown = true;
};

const state = new State();

Object.seal(state);

export default state;
