var fs = require('fs');
var check = require('syntax-error')

var file = __dirname + '/../app.js';
var src = fs.readFileSync(file);

var err = check(src, file);

if (err) {
    console.error("Error detected: " + err);
    process.exit(1);
}
