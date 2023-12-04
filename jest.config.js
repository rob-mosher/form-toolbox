module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/__tests__/**"
  ],
  projects: [
    // '<rootDir>/__tests__/api/jest.config.js',
    '<rootDir>/__tests__/web/jest.config.js',
  ],
};
