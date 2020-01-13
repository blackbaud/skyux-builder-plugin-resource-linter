# Skyux Resource Linter

This command lints the resource files in a SKYUX spa. It determines if there are any unused resource files and if there are any resource keys referenced that don't exist in a resource file.

## Installation

```shell
npm install --save-dev @blackbaud/skyux-builder-resource-linter
```

## Use

```shell
skyux lint-resources
```

## Glossary

- **Missing keys** - Keys that were determined to be used somewhere in the application but that don't have a matching entry in a resource file.
- **Potentially Unused Keys** - Keys whose use could not be determined but that might still be required by the application. Manually verify that the keys are not used before removal.
- **Non-standard Keys** - Keys present in a method that consumes a resource key but that appear to be a reference to the key rather than the key itself.

## Development

### Testing

```shell
npm install -g jasmine
jasmine --config=jasmine.json
```
