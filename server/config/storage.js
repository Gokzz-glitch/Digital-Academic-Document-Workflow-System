const fs = require('fs');
const os = require('os');
const path = require('path');

const storageRoot = process.env.APP_DATA_DIR || path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'DigitalAcademicDocumentWorkflowSystem'
);

const getStoragePath = (...segments) => {
  const resolvedPath = path.join(storageRoot, ...segments);
  fs.mkdirSync(resolvedPath, { recursive: true });
  return resolvedPath;
};

module.exports = { getStoragePath };
