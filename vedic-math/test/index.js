/* Lets `node --test vedic-math/test/` run every *.test.mjs here (Node treats a directory
   argument as a module path, so this file loads the test files). */
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith('.test.mjs')).sort()) import(pathToFileURL(path.join(__dirname, f)).href);
