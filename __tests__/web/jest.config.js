console.log('************ jest.config.js ************')

console.log(``)

module.exports = {
  displayName: "web",
  testMatch: ["**/*.test.tsx", "**/*.test.ts"],
  // transform: {
  //   "^.+\\.[t|j]sx?$": "babel-jest"
  // },
  transform: {
    "^.+\\.(js|ts)x?$": [
      "esbuild-jest",
      {
        "define": {
          "import.meta.env": "{}"
        }
      }
    ]
  },
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/reactTestingLibrarySetup.js'],
};
