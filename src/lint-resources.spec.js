'use strict';

const mock = require('mock-require');
const glob = require('glob');
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
                        break;
                    case './src/app/**/!(*.spec).ts':
                        return ['./src/app/test/test.ts'];
                        break;
                    case './src/assets/locales/*.json':
                        return ['./assets/locales/test.json'];
                        break;
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

    it('should log all missing and unused keys', () => {
        spyOn(console, 'table');
        lintResources([], undefined);
        expect(console.table).toHaveBeenCalled();
        expect(console.table).toHaveBeenCalledWith([ { resourceFileName: 'test.json', key: 'unused_key' } ]);
        expect(console.table).toHaveBeenCalledWith([ { resourceFileName: 'test.json', fileName: 'test.component.html', key: 'missing_key' } ])
        expect(console.table).toHaveBeenCalledWith([ 
            { 
                resourceFileName: 'test.json',
                fileName: 'test.component.html',
                key: 'methodKey()' 
            },
            { 
                resourceFileName: 'test.json',
                fileName: 'test.component.html',
                key: 'propertyKey' 
            } 
        ]);
    });
});