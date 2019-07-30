'use strict';

const mock = require('mock-require');

describe('Index', () => {
  let index;

  beforeAll(() => {
    mock('path', {
      join: function () {
        return './src/fixtures/mock-config.json';
      }
    });
  });

  beforeEach(() => {
    index = mock.reRequire('../index');
  });

  it('should export a runCommand', () => {
    expect(index.runCommand).toBeDefined();
    expect(typeof index.runCommand).toBe('function');
  });

  it('should handle known commands', () => {
    const cmds = {
      'lint-resources': {
        cmd: 'lint-resources',
        lib: 'lint-resources'
      },
      'version': {
        cmd: 'version',
        lib: 'version'
      }
    };

    Object.keys(cmds).forEach((key) => {
      if (cmds[key].lib) {
        mock('./' + cmds[key].lib, () => {
          cmds[key].called = true;
        });
      }
      index.runCommand(cmds[key].cmd, {});
        expect(cmds[key].called).toEqual(true);
    });
  });

  it('should return false for unknown command', () => {
    const cmd = 'junk-command-that-does-not-exist';
    const lib = require('../index');
    expect(lib.runCommand(cmd, {})).toBe(false);
  });

  it('should return true for known command', () => {
    const cmd = 'lint-resources';
    const lib = require('../index');
    expect(lib.runCommand(cmd, {})).toBe(true);
  });

  it('should pass in an empty config if none is found', () => {
    mock('path', {
      join: function () {
        return './src/fixtures/mock-config-nope.json';
      }
    });
    mock('./lint-resources', (argv, config) => {
      console.log(config);
    });
    
    spyOn(console, 'log');
    index = mock.reRequire('../index');
    index.runCommand('lint-resources', {});
    expect(console.log).toHaveBeenCalledWith({});
  });  

  afterAll(() => {
    mock.stopAll();
  });
});