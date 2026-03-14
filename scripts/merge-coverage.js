const fs = require('fs');
const path = require('path');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const coverageDir = path.resolve(__dirname, '..', 'coverage');
const combinedDir = path.join(coverageDir, 'combined');

const coverageMap = libCoverage.createCoverageMap({});

// Collect coverage files from all test directories
const sources = ['unit', 'usecase', 'state-transition', 'combinatorial'];

for (const source of sources) {
  const coverageFile = path.join(coverageDir, source, 'coverage-final.json');
  if (fs.existsSync(coverageFile)) {
    const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    coverageMap.merge(data);
    console.log(`Merged coverage from: ${source}`);
  } else {
    console.warn(`Coverage file not found: ${coverageFile}`);
  }
}

// Ensure output directory exists
if (!fs.existsSync(combinedDir)) {
  fs.mkdirSync(combinedDir, { recursive: true });
}

// Generate reports
const context = libReport.createContext({
  dir: combinedDir,
  coverageMap,
});

const reportTypes = ['json', 'lcov', 'text', 'text-summary'];

for (const type of reportTypes) {
  const report = reports.create(type, {});
  report.execute(context);
}

// Write coverage-final.json for combined
fs.writeFileSync(
  path.join(combinedDir, 'coverage-final.json'),
  JSON.stringify(coverageMap.toJSON(), null, 2)
);

console.log('\nCombined coverage report generated at: coverage/combined/');
