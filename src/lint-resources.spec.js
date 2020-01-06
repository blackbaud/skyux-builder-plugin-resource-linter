'use strict';

const mock = require('mock-require');
const fs = require('fs-extra');
const testTS = fs.readFileSync('./src/fixtures/test.ts', 'utf8');
const testHTML = fs.readFileSync('./src/fixtures/test.html', 'utf8');
const testJSON = require('./fixtures/test.json');

describe('Lint Resources', () => {
    let lintResources;
    beforeEach(() => {
        mock('glob', {
            sync: (path) => {
                switch (path) {
                    case './src/app/**/*component.html':
                        return ['./src/app/test/test.component.html'];
                    case './src/app/**/!(*.spec|*.mock).ts':
                        return ['./src/app/test/test.ts'];
                    case './src/assets/locales/*.json':
                        return ['./assets/locales/test.json'];
                    default:
                        break;
                }
            }
        });
        mock('fs-extra', {
            readJsonSync: () => {
                return testJSON;
            },
            readFileSync: (path) => {
                if (path === './src/app/test/test.component.html') {
                    return testHTML;
                } else {
                    return testTS;
                }
            }
        });
        lintResources = mock.reRequire('./lint-resources');
    });

    it('should log all missing, unused, and non-standard keys', () => {
        let numCalls = 0;
        let results = [];
        spyOn(console, 'table').and.callFake((args) => {
            results[numCalls] = args;
            numCalls++;
        });
        lintResources([], undefined);
        console.log(results);
        expect(numCalls).toEqual(3);

        // Missing keys
        expect(results[0]).toEqual([
            { resourceFileName: 'test.json', fileName: 'test.component.html', key: 'missing_key' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'test_key_missing' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'test_key_with_params_missing' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'lib_key_missing' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'lib_key_with_params_missing' }
        ]);

        // Non-standard keys
        expect(results[1]).toEqual([
            { resourceFileName: 'test.json', fileName: 'test.component.html', key: 'methodKey()' },
            { resourceFileName: 'test.json', fileName: 'test.component.html', key: 'propertyKey' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'nonStandardKey' },
            { resourceFileName: 'test.json', fileName: 'test.ts', key: 'nonStandardKey,param1' }
        ]);

        // Unused keys
        expect(results[2]).toEqual([{ resourceFileName: 'test.json', key: 'unused_key' }]);
    });

    it('should handle errors with fetching resource files', () => {
        const err = new Error('whoops!');
        mock('fs-extra', {
            readJsonSync: () => { throw err; }
        });
        lintResources = mock.reRequire('./lint-resources');
        spyOn(console, 'error');
        lintResources([], undefined);
        expect(console.error).toHaveBeenCalledWith('Unable to fetch resource file ./assets/locales/test.json', err);
    });

    it('should handle errors with fetching files', () => {
        const err = new Error('whoops!');
        mock('fs-extra', {
            readJsonSync: () => {
                return testJSON;
            },
            readFileSync: (path) => {
                if (path === './src/app/test/test.component.html') {
                    throw err;
                } else {
                    return testTS;
                }
            }
        });
        lintResources = mock.reRequire('./lint-resources');
        spyOn(console, 'error');
        lintResources([], undefined);
        expect(console.error).toHaveBeenCalledWith('Problem fetching file at path ./src/app/test/test.component.html', err);
    });

    it('should handle empty parameters', () => {
        mock('glob', { sync: () => { } });
        mock('fs-extra', {
            readJsonSync: () => { },
            readFileSync: () => { }
        });
        lintResources = mock.reRequire('./lint-resources');
        spyOn(console, 'table');
        lintResources([], undefined);
        expect(console.table).toHaveBeenCalledTimes(3);
        expect(console.table).toHaveBeenCalledWith([]);
    });

    afterAll(() => {
        mock.stopAll();
    });
});
