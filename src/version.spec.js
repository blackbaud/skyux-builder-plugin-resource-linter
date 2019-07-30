const mock = require('mock-require');

describe('version', () => {
  let version;

  beforeEach(() => {
    mock('fs-extra', {
      readJsonSync: function () {
        return {
          name: 'test',
          version: '1.0.0'
        };
      }
    });
    version = mock.reRequire('./version');
  });

  it('should log the version of the package', () => {
    spyOn(console, 'log');
    version();
    expect(console.log).toHaveBeenCalledWith('test 1.0.0');
  });

  afterAll(() => {
    mock.stopAll();
  });
});