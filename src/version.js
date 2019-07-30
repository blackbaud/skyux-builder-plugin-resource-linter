const fs = require('fs-extra');
const path = require('path');

function version() {
  const packageJson = fs.readJsonSync(path.resolve(__dirname, '..', 'package.json'));
  console.log(packageJson.name + ' ' + packageJson.version);
}

module.exports = version;