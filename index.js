'use strict';

const fs = require('fs-extra');
const path = require('path');

function getConfig() {
  let config = {};
  const configPath = path.join(process.cwd(), `skyuxconfig.json`);

  if (fs.existsSync(configPath)) {
    config = fs.readJsonSync(configPath);
  }

  return config;
}

module.exports = {
  runCommand: (command, argv) => {
    const config = getConfig();
    switch (command) {
      case 'lint-resources':
        require('./src/lint-resources')(argv, config);
        break;
      case 'version':
        require('./src/version')();
        break;
      default:
        return false;
    }
    return true;
  }
};
