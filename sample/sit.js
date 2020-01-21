'use strict';

const sit = require('../src/main/index');
const client = sit()

client.Sheet.fetch('master').then(result => {
  console.log(result);
});


client.Sheet.push('master').then(result => {
  console.log(result);
});

client.Repo.catFile('fcd37b4', { isType: true });
client.Repo.catFile('fcd37b4', { isSize: true });
client.Repo.catFile('fcd37b4', { isPrettyPrint: true });
