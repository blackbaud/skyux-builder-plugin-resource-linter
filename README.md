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

## Development

### Testing

```shell
npm install -g jasmine
jasmine --config=jasmine.json
```
