const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit max workers on Windows to prevent EMFILE (too many open files)
config.maxWorkers = 2;

module.exports = config;
