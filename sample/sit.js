'use strict';

const sit = require('../src/main/index');
const client = sit()

client.Sheet.fetch('origin', 'refs/remotes').then(result => {
  console.log(result);
});


client.Sheet.push('origin', 'develop').then(result => {
  console.log(result);
});

client.Repo.catFile('fcd37b4', { isType: true });
client.Repo.catFile('fcd37b4', { isSize: true });
client.Repo.catFile('fcd37b4', { isPrettyPrint: true });

let hash = client.Repo.hashObject('src/main/SitRepo.js', { type: 'blob', write: false });
console.log(hash);

client.Repo.commit({ message: 'initial commit' });
