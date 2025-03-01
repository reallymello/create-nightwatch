const path = require('path');
const mockery = require('mockery');
const assert = require('assert');
const nock = require('nock');
const {extend} = require('axios/lib/utils');


describe('test run function', () => {
  beforeEach(() => {
    this.originalProcessArgv = process.argv;
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
    if (!nock.isActive()) {
      nock.activate();
    }
    nock('https://registry.npmjs.org')
      .get('/create-nightwatch')
      .reply(200, {
        'dist-tags': {
          latest: '1.0.2'
        }
      });
    
  });

  afterEach(() => {
    process.argv = this.originalProcessArgv;
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
    nock.cleanAll();
    nock.restore();
  });

  test('works with no argument and package.json present', async () => {
    process.argv = ['node', 'filename.js'];

    mockery.registerMock(
      './logger',
      class {
        static error() {}
      }
    );


    mockery.registerMock('./utils', {
      isNodeProject() {
        return true;
      },
      extend
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, process.cwd());
    assert.deepEqual(optionsPassed, {
      'generate-config': false
    });
  });

  test('works with no argument, package.json not present, and root dir empty', async () => {
    process.argv = ['node', 'filename.js'];

    const consoleOutput = [];
    mockery.registerMock(
      './logger',
      class {
        static error(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    mockery.registerMock('./utils', {
      isNodeProject() {
        return false;
      },
      extend
    });

    mockery.registerMock('node:fs', {
      readdirSync() {
        return [];
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');

    let newNodeProjectInitialized = false;
    let newNodeProjectRootDir;
    index.initializeNodeProject = (rootDir) => {
      newNodeProjectInitialized = true;
      newNodeProjectRootDir = rootDir;
    };

    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, process.cwd());
    assert.deepEqual(optionsPassed, {
      'generate-config': false
    });

    // Check if new node project initialized in correct dir
    assert.strictEqual(newNodeProjectInitialized, true);
    assert.strictEqual(newNodeProjectRootDir, process.cwd());
  });

  test('works with no argument, package.json not present, and root dir not empty', async () => {
    process.argv = ['node', 'filename.js'];

    const consoleOutput = [];
    mockery.registerMock(
      './logger',
      class {
        static error(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    mockery.registerMock('./utils', {
      isNodeProject() {
        return false;
      },
      extend
    });

    mockery.registerMock('node:fs', {
      readdirSync() {
        return ['sample.txt'];
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');

    let rootDirConfirmationPrompted = false;
    index.confirmRootDir = (rootDir) => {
      rootDirConfirmationPrompted = true;

      return rootDir;
    };

    let newNodeProjectInitialized = false;
    let newNodeProjectRootDir;
    index.initializeNodeProject = (rootDir) => {
      newNodeProjectInitialized = true;
      newNodeProjectRootDir = rootDir;
    };

    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, process.cwd());
    assert.deepEqual(optionsPassed, {
      'generate-config': false
    });

    // Check if root dir confirmation prompted
    assert.strictEqual(rootDirConfirmationPrompted, true);

    // Check if new node project initialized in correct dir
    assert.strictEqual(newNodeProjectInitialized, true);
    assert.strictEqual(newNodeProjectRootDir, process.cwd());
  });

  test('works with many arguments, no options, and package.json present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', 'some', 'random', 'args'];
    const expectedRootDir = path.join(process.cwd(), 'new-project');

    mockery.registerMock(
      './logger',
      class {
        static error() {}
      }
    );

    mockery.registerMock('node:fs', {
      existsSync() {
        return true;
      },
      extend
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, expectedRootDir);
    assert.deepEqual(optionsPassed, {
      'generate-config': false
    });
  });

  test('works with many argument, no options, and package.json not present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', 'some', 'random', 'args'];
    const expectedRootDir = path.join(process.cwd(), 'new-project');

    const consoleOutput = [];
    mockery.registerMock(
      './logger',
      class {
        static error(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    let newDirCreatedRecursively = false;
    mockery.registerMock('node:fs', {
      existsSync() {
        return false;
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');

    let newNodeProjectInitialized = false;
    let newNodeProjectRootDir;
    index.initializeNodeProject = (rootDir) => {
      newNodeProjectInitialized = true;
      newNodeProjectRootDir = rootDir;
    };

    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, expectedRootDir);
    assert.deepEqual(optionsPassed, {
      'generate-config': false
    });

    // Check if new node project initialized in correct dir
    assert.strictEqual(newNodeProjectInitialized, true);
    assert.strictEqual(newNodeProjectRootDir, expectedRootDir);
  });

  test('works with many arguments, generate-config options, and package.json present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', 'random', '--generate-config', 'args'];
    const expectedRootDir = path.join(process.cwd(), 'new-project');

    mockery.registerMock(
      './logger',
      class {
        static error() {}
      }
    );

    mockery.registerMock('node:fs', {
      existsSync() {
        return true;
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, expectedRootDir);
    assert.deepEqual(optionsPassed, {
      'generate-config': true
    });
  });

  test('works with many arguments, generate-config options, and package.json not present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', 'random', '--generate-config', 'args'];

    const origProcessExit = process.exit;

    let processExitCode;
    process.exit = (code) => {
      processExitCode = code;
    };

    const consoleOutput = [];
    mockery.registerMock(
      './logger',
      class {
        static error(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    mockery.registerMock('node:fs', {
      existsSync() {
        return false;
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit (it won't be run due to error)
    assert.strictEqual(rootDirPassed, undefined);
    assert.deepEqual(optionsPassed, undefined);

    // Check if process exited with code 1
    assert.strictEqual(processExitCode, 1);

    // Check console output (error)
    const output = consoleOutput.toString();
    assert.strictEqual(
      output.includes('package.json not found. Please run this command from your existing Nightwatch project.'),
      true
    );
    assert.strictEqual(
      output.includes('use `npm init nightwatch new-project` to initialize a new Nightwatch project instead.'),
      true
    );

    process.exit = origProcessExit;
  });

  test('works with many arguments, browsers options, and package.json present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', 'random', '--browser=chrome', '--browser=safari', 'args'];
    const expectedRootDir = path.join(process.cwd(), 'new-project');

    mockery.registerMock(
      './logger',
      class {
        static error() {}
      }
    );

    mockery.registerMock('node:fs', {
      existsSync() {
        return true;
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, expectedRootDir);
    assert.deepEqual(optionsPassed, {
      'generate-config': false,
      b: ['chrome', 'safari'],
      browser: ['chrome', 'safari']
    });
  });

  test('works with no arguments, browser options without =, and package.json not present', async () => {
    process.argv = ['node', 'filename.js', '--browser', 'chrome', '--browser', 'safari'];

    const consoleOutput = [];
    mockery.registerMock(
      './logger',
      class {
        static error(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    mockery.registerMock('./utils', {
      isNodeProject() {
        return false;
      },
      extend
    });

    mockery.registerMock('node:fs', {
      readdirSync() {
        return [];
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');

    let newNodeProjectInitialized = false;
    let newNodeProjectRootDir;
    index.initializeNodeProject = (rootDir) => {
      newNodeProjectInitialized = true;
      newNodeProjectRootDir = rootDir;
    };

    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, process.cwd());
    assert.deepEqual(optionsPassed, {
      'generate-config': false,
      b: ['chrome', 'safari'],
      browser: ['chrome', 'safari']
    });

    // Check if new node project initialized in correct dir
    assert.strictEqual(newNodeProjectInitialized, true);
    assert.strictEqual(newNodeProjectRootDir, process.cwd());
  });

  test('works with many arguments, many options, and package.json present', async () => {
    process.argv = ['node', 'filename.js', 'new-project', '-y', '--hello', '--there=hi', '-d', '--generate-config'];
    const expectedRootDir = path.join(process.cwd(), 'new-project');

    mockery.registerMock(
      './logger',
      class {
        static error() {}
      }
    );

    mockery.registerMock('node:fs', {
      existsSync() {
        return true;
      }
    });

    let rootDirPassed;
    let optionsPassed;
    mockery.registerMock('./init', {
      NightwatchInit: class {
        constructor(rootDir, options) {
          rootDirPassed = rootDir;
          optionsPassed = options;
        }
        run() {}
      }
    });

    const index = require('../../lib/index');
    await index.run();

    // Check the arguments passed to NightwatchInit
    assert.strictEqual(rootDirPassed, expectedRootDir);
    assert.deepEqual(optionsPassed, {
      'generate-config': true,
      d: true,
      hello: true,
      there: 'hi',
      y: true,
      yes: true
    });
  });

});
