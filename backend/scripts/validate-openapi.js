/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const openApiPath = path.join(rootDir, 'openapi-atspaces.yaml');
  const raw = fs.readFileSync(openApiPath, 'utf8');
  const document = yaml.load(raw);

  assert(document && typeof document === 'object', 'OpenAPI must be a YAML object');
  assert(document.openapi, 'OpenAPI field is missing');
  assert(document.paths && typeof document.paths === 'object', 'paths section is missing');

  const pathCount = Object.keys(document.paths).length;
  assert(pathCount > 0, 'OpenAPI paths section is empty');

  console.log(`OpenAPI validation passed (${pathCount} paths).`);
}

main();

