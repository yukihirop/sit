'use strict';

const sit = require('../src/main/index');
const client = sit()

client.Sheet.fetch('master').then(result => {
  console.log(result);
});


client.Sheet.push('master').then(result => {
  console.log(result);
});
