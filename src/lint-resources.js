'use strict';

const glob = require('glob');
const fs = require('fs-extra');
const matchAll = require('string.prototype.matchall');
const htmlResourcesRegex = /([^="\s{]+)\s+\|\s+skyAppResources/gm;
const tsResourcesServiceLookupRegex = /\S*(?=:\s?SkyAppResourcesService)/gms;

function lintResources(argv, config) {
    // Get all file paths
    const htmlFilePaths = glob.sync('./src/app/**/*component.html');
    const tsFilePaths = glob.sync('./src/app/**/!(*.spec).ts')
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
    console.log('missing')
    // Log results
    console.log('Missing Keys:');
    console.table(missingKeys.missing);
    console.log('Non Standard Keys:');
    console.table(missingKeys.nonStandard);
    console.log('Unused Keys:');
    console.table(unusedKeys);
}

function getResourceStringKeys(filePaths) {
    if (!filePaths) {
        return [];
    }
    const keys = filePaths.reduce((keys, filePath) => {
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
    return keys;
}

function getFiles(filePaths) {
    if (!filePaths) {
        return [];
    }
    const files = filePaths.reduce((fileContents, filePath) => {
        const file = {
            fileName: filePath.split('/').pop()
        };
        try {
            const fileString = fs.readFileSync(filePath, "utf8");
            file.fileContents = fileString;
        } catch (error) {
            console.error(`Problem fetching file at path ${filePath}`);
        }
        fileContents.push(file);
        return fileContents;
    }, []);
    return files;
}

function getHtmlReferences(files) {
    if (!files) {
        return [];
    }
    const references = files.reduce((refs, file) => {
        const htmlFileReferences = {
            fileName: file.fileName
        };
        try {
            const resources = [...matchAll(file.fileContents,htmlResourcesRegex)].map(r => r.pop().replace(/'|\s|\\/gi, ''));
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
    if (!files) {
        return [];
    }
    const references = files.reduce((refs, file) => {
        const tsFileReferences = {
            fileName: file.fileName
        };
        try {
            const serviceName = file.fileContents.match(tsResourcesServiceLookupRegex);
            if (serviceName) {
                const tsResourceStringLookupRegex = getTSResourcesStringLookupRegex(serviceName.shift());
                const resources = file.fileContents.match(tsResourceStringLookupRegex).map(r => {
                    if (r.includes(',')) {
                        r = r.split(',').shift();
                    }
                    return r.replace(/'|\s|\\/gi, '');
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
    const results = resourceFiles.reduce((unusedKeys, file) => {
        file.keys.map(key => {
            // console.log(files);
            const found = files.some(f => f.fileContents.includes(key));
            if (!found) {
                unusedKeys.push({
                    resourceFileName: file.resourceFileName,
                    key
                });
            }
        });
        return unusedKeys;
    }, []);
    return results;
}

function findMissingKeysInResourceFiles(resourceFiles, references) {
    const results = resourceFiles.reduce((missingKeys, resourceFile) => {
        references.map(referenceFile => {
            const fileName = referenceFile.fileName;
            referenceFile.resources.map(key => {
                const isMissing = !resourceFile.keys.includes(key);
                const isNonStandardKey = key.match(/[^a-z0-9_]/g);
                if (isMissing) {
                    const result = {
                        resourceFileName: resourceFile.resourceFileName,
                        fileName,
                        key
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

module.exports = lintResources;
