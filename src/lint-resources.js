'use strict';

const glob = require('glob');
const fs = require('fs-extra');
const matchAll = require('string.prototype.matchall');
const _isEmpty = require('lodash.isempty');
const htmlResourcesRegex = /([^="\s{]+)\s+\|\s+skyAppResources/gm;
const tsResourcesServiceLookupRegex = /\S*(?=:\s?SkyAppResourcesService)/gms;

function lintResources(argv, config) {
    // Get all file paths
    const htmlFilePaths = glob.sync('./src/app/**/*component.html');
    const tsFilePaths = glob.sync('./src/app/**/!(*.spec|*.mock).ts')
    const resourceFilePaths = glob.sync('./src/assets/locales/*.json');
    // Get resource keys, files, and file resource references
    const keys = getResourceStringKeys(resourceFilePaths);
    const htmlFiles = getFiles(htmlFilePaths);
    const tsFiles = getFiles(tsFilePaths);
    const htmlRefs = getHtmlReferences(htmlFiles);
    const tsRefs = getTSReferences(tsFiles);
    // Get results
    const unusedKeys = findUnusedKeysInResourceFiles(keys, htmlFiles.concat(tsFiles));
    const missingKeys = findMissingKeysInResourceFiles(keys, htmlRefs.concat(tsRefs));
    // Log results
    console.log('Missing Keys:');
    console.table(missingKeys.missing);
    console.log('Non Standard Keys:');
    console.table(missingKeys.nonStandard);
    console.log('Unused Keys:');
    console.table(unusedKeys);
}

function getResourceStringKeys(filePaths) {
    if (_isEmpty(filePaths)) {
        return [];
    }
    const resourceStringKeys = filePaths.reduce((keys, filePath) => {
        try {
            const parsedResourceFile = fs.readJsonSync(filePath);
            const keyRef = {
                resourceFileName: filePath.split('/').pop(),
                keys: Object.keys(parsedResourceFile)
            };
            keys.push(keyRef);
            return keys;
        } catch (error)
        {
            console.error(`Unable to fetch resource file ${filePath}`, error);
            return keys;
        }
    }, []);
    return resourceStringKeys;
}

function getFiles(filePaths) {
    if (_isEmpty(filePaths)) {
        return [];
    }
    const results = filePaths.reduce((files, filePath) => {
        const file = {
            fileName: filePath.split('/').pop(),
            fileContents: ''
        };
        try {
            const fileString = fs.readFileSync(filePath, "utf8");
            file.fileContents = fileString;
        } catch (error) {
            console.error(`Problem fetching file at path ${filePath}`, error);
        }
        files.push(file);
        return files;
    }, []);
    return results;
}

function getHtmlReferences(files) {
    if (_isEmpty(files)) {
        return [];
    }
    const references = files.reduce((refs, file) => {
        const htmlFileReferences = {
            fileName: file.fileName,
            resources: []
        };
        try {
            const resources = [...matchAll(file.fileContents, htmlResourcesRegex)].map(r => r.pop());
            htmlFileReferences.resources = resources;
            refs.push(htmlFileReferences);
            return refs;
        } catch (error) {
            console.error(`Problem with html reference ${file.fileName}`, error);
            refs.push(htmlFileReferences);
            return refs;
        }
    }, []);
    return references;
}

function getTSReferences(files) {
    if (_isEmpty(files)) {
        return [];
    }
    const references = files.reduce((refs, file) => {
        const tsFileReferences = {
            fileName: file.fileName,
            resources: []
        };
        try {
            const serviceName = file.fileContents.match(tsResourcesServiceLookupRegex);
            if (serviceName) {
                const tsResourceStringLookupRegex = getTSResourcesStringLookupRegex(serviceName.shift());
                const resources = file.fileContents.match(tsResourceStringLookupRegex).map(r => {
                    if (r.includes(',')) {
                        r = r.split(',').shift();
                    }
                    return r;
                });
                tsFileReferences.resources = resources;
                refs.push(tsFileReferences);
            }
            return refs;

        } catch (error) {
            console.error(`Problem with ts reference ${file.fileName}`, error);
            refs.push(tsFileReferences);
            return refs;
        }
    }, []);
    return references;
}

function getTSResourcesStringLookupRegex(serviceName) {
    return new RegExp(`(?<=${serviceName}\\.getString\\()(.*?)(?=\\))`, 'gms');
}

function findUnusedKeysInResourceFiles(resourceFiles, files) {
    if (_isEmpty(resourceFiles) | _isEmpty(files)) {
        return [];
    }
    const results = resourceFiles.reduce((unusedKeys, file) => {
        file.keys.map(key => {
            const sanitizedKey = sanitizeKey(key);
            const found = files.some(f => f.fileContents.includes(sanitizedKey));
            if (!found) {
                unusedKeys.push({
                    resourceFileName: file.resourceFileName,
                    key: sanitizedKey
                });
            }
        });
        return unusedKeys;
    }, []);
    return results;
}

function findMissingKeysInResourceFiles(resourceFiles, references) {
    if (_isEmpty(resourceFiles) | _isEmpty(references)) {
        return {
            missing: [],
            nonStandard: []
        }
    }
    const results = resourceFiles.reduce((missingKeys, resourceFile) => {
        references.map(referenceFile => {
            const fileName = referenceFile.fileName;
            referenceFile.resources.map(key => {
                const sanitizedKey = sanitizeKey(key);
                const isMissing = !resourceFile.keys.includes(sanitizedKey);
                // Need to verify that the key is actually a string and not a variable ref of some kind.
                const isNonStandardKey = !(!!key.match(/'|\s|\\/gi)) || !!sanitizedKey.match(/[^a-z0-9_]/g);
                if (isMissing) {
                    const result = {
                        resourceFileName: resourceFile.resourceFileName,
                        fileName,
                        key: sanitizedKey
                    };
                    if (isNonStandardKey) {
                        missingKeys.nonStandard.push(result);
                    } else {
                        missingKeys.missing.push(result);
                    }
                }
            });
        });
        return missingKeys;
    }, {
        missing: [],
        nonStandard: []
    });
    return results;
}

function sanitizeKey(key) {
    return key.replace(/'|\s|\\/gi, '');
}

module.exports = lintResources;
