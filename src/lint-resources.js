const glob = require('glob');
const fs = require('fs-extra');
const htmlResourcesRegex = /(?<=\{\{\s*?\n*?).*?(?=[\s|\n]+\|[\s|\n]+skyAppResources)/gm;
const tsResourcesServiceLookupRegex = /\S*(?=:\s?SkyAppResourcesService)/gms;

function lintResources(argv, config) {
    const htmlFiles = glob.sync('./src/app/**/*component.html');
    const tsFiles = glob.sync('./src/app/**/*component.ts')
    const resourceFiles = glob.sync('./src/assets/locales/*.json');

    const keys = getUniqueResourceStringKeys(resourceFiles);
    const refs = getHtmlReferences(htmlFiles);
    const tsRefs = getTSReferences(tsFiles);
    console.log(tsRefs);

}

function getUniqueResourceStringKeys(filePaths) {
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
            console.error(`Unable to fetch resource file ${filePath}`);
            return keys;
        }
    }, []);
    return keys;
}

function getHtmlReferences(filePaths) {
    if (!filePaths) {
        return [];
    }
    const references = filePaths.reduce((refs, filePath) => {
        const htmlFileReferences = {
            fileName: filePath.split('/').pop()
        };
        try {
            const fileString = fs.readFileSync(filePath, "utf8");
            const resources = fileString.match(htmlResourcesRegex).map(r => r.replace(/'|\s|\\/gi, ''));
            htmlFileReferences.resources = resources;
            refs.push(htmlFileReferences);
            return refs;
        } catch (error) {
            console.error(error);
            // console.error(`Problem with html reference ${filePath}`);
            refs.push(htmlFileReferences);
            return refs;
        }
    }, []);
    return references;
}

function getTSReferences(filePaths) {
    if (!filePaths) {
        return [];
    }
    const references = filePaths.reduce((refs, filePath) => {
        const tsFileReferences = {
            fileName: filePath.split('/').pop()
        };
        try {
            const fileString = fs.readFileSync(filePath, "utf8");
            const serviceName = fileString.match(tsResourcesServiceLookupRegex);
            if (serviceName) {
                const tsResourceStringLookupRegex = getTSResourcesStringLookupRegex(serviceName.shift());
                const resources = fileString.match(tsResourceStringLookupRegex).map(r => r.replace(/'|\s|\\/gi, ''));
                tsFileReferences.resources = resources;
                refs.push(tsFileReferences);
            }
            return refs;

        } catch (error) {
            console.error(`Problem with ts reference ${filePath}`);
            refs.push(tsFileReferences);
            return refs;
        }
    }, []);
}

function getTSResourcesStringLookupRegex(serviceName) {
    return new RegExp(`(?<=${serviceName}\\.getString\\()(.*?)(?=\\))`, 'gms');
}

module.exports = lintResources;
