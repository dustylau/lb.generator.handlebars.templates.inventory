// post-install.js

/**
 * Script to run after npm install
 *
 * Copy selected files to user's directory
 */

'use strict';

var gentlyCopy = require('gently-copy');

// User's local directory
var userPath = process.env.INIT_CWD;

var filesToCopy = ['generate-inventory.js', 'models'];
// Moving files to user's local directory
gentlyCopy(filesToCopy, userPath);


var filesToCopy = ['templates'];
// Moving files to user's local directory
gentlyCopy(filesToCopy, userPath, { overwrite: true});