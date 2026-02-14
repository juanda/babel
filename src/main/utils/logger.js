const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let logStream = null;

function initialize() {
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  logStream = fs.createWriteStream(logFile, { flags: 'a' });
}

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  let line = `[${timestamp}] [${level}] ${message}`;
  if (data !== undefined) {
    line += ` ${JSON.stringify(data)}`;
  }
  return line;
}

function info(message, data) {
  const line = formatMessage('INFO', message, data);
  console.log(line);
  if (logStream) logStream.write(line + '\n');
}

function warn(message, data) {
  const line = formatMessage('WARN', message, data);
  console.warn(line);
  if (logStream) logStream.write(line + '\n');
}

function error(message, data) {
  const line = formatMessage('ERROR', message, data);
  console.error(line);
  if (logStream) logStream.write(line + '\n');
}

function close() {
  if (logStream) {
    logStream.end();
    logStream = null;
  }
}

module.exports = { initialize, info, warn, error, close };
