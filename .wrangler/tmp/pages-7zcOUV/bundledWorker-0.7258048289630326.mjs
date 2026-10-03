var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e2) => e2.name !== markName) : this._entries.filter((e2) => e2.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e2) => e2.name !== measureName) : this._entries.filter((e2) => e2.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e2) => e2.entryType !== "resource" || e2.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e2) => e2.name === name && (!type || e2.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e2) => e2.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/.pnpm/@cloudflare+unenv-preset@2._8ffa6b00e451de60ae6ebd78be18ea58/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/.pnpm/@cloudflare+unenv-preset@2._8ffa6b00e451de60ae6ebd78be18ea58/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/.pnpm/wrangler@4.141.0_@types+node@22.20.4/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x2, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/.pnpm/unenv@2.0.0-rc.24/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/.pnpm/@cloudflare+unenv-preset@2._8ffa6b00e451de60ae6ebd78be18ea58/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/.pnpm/wrangler@4.141.0_@types+node@22.20.4/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js/index.js
import { Buffer as t } from "node:buffer";
import { m as e, r as s, u as a } from "./chunks/_/nitro.mjs";
import { setImmediate as i, clearImmediate as n } from "node:timers";
import "node:events";
import "cloudflare:workers";
import "node:path";
globalThis._importMeta_ = { url: "file:///_entry.js", env: {} };
"global" in globalThis || (globalThis.global = globalThis);
var c = globalThis.process;
globalThis.process = c ? new Proxy(c, { get: /* @__PURE__ */ __name((t2, s2, a2) => Reflect.has(t2, s2) ? Reflect.get(t2, s2, a2) : Reflect.get(e, s2, a2), "get") }) : e, globalThis.Buffer || (globalThis.Buffer = t), globalThis.setImmediate || (globalThis.setImmediate = i), globalThis.clearImmediate || (globalThis.clearImmediate = n);
var p = { "/nitro.json": { type: "application/json", etag: '"12c-UrdiYwrPSb4q3VFBN8HgfahcuiM"', mtime: "2026-09-30T18:52:04.433Z", size: 300, path: "../nitro.json" }, "/about/index.html": { type: "text/html;charset=utf-8", etag: '"4119-IPSdjaIt7N/rmHN+fje/j9tMcl8"', mtime: "2026-09-30T18:52:04.924Z", size: 16665, path: "../about/index.html" }, "/about/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-bni1Oyp/HKhAT9dSY3GDCtKIfhg"', mtime: "2026-09-30T18:52:04.926Z", size: 111, path: "../about/_payload.json" }, "/contact/index.html": { type: "text/html;charset=utf-8", etag: '"3e3d-rXLSXkG5KBpGg2jXz48ah+USWyU"', mtime: "2026-09-30T18:52:04.851Z", size: 15933, path: "../contact/index.html" }, "/contact/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-o1Y42HhdLenLVZ8geDl5YscNaIA"', mtime: "2026-09-30T18:52:04.926Z", size: 111, path: "../contact/_payload.json" }, "/robots.txt": { type: "text/plain; charset=utf-8", etag: '"76-LvRsjmqLCj2dmybQoIWYEpNXFDA"', mtime: "2026-09-27T18:59:12.397Z", size: 118, path: "../robots.txt" }, "/_headers": { type: "text/plain; charset=utf-8", etag: '"307-YkLm6CEkMfjrxvR94tMZfJhVB7Y"', mtime: "2026-09-27T18:59:12.399Z", size: 775, path: "../_headers" }, "/fonts/DMSerifDisplay-Regular.woff2": { type: "font/woff2", etag: '"7684-+oa+CU09WPGoMq8zmYdlOvjz+CI"', mtime: "2026-09-27T14:48:56.062Z", size: 30340, path: "../fonts/DMSerifDisplay-Regular.woff2" }, "/fonts/DMSerifDisplay-Italic.woff2": { type: "font/woff2", etag: '"7660-sZ9WzhpoXjpArlsx9P4LIqT9J/g"', mtime: "2026-09-27T14:51:46.041Z", size: 30304, path: "../fonts/DMSerifDisplay-Italic.woff2" }, "/fonts/Unbounded-VariableFont_wght.woff2": { type: "font/woff2", etag: '"3f450-0cNjb0UoT4T3wGG1+7u1qNw0aBw"', mtime: "2026-09-27T14:50:50.500Z", size: 259152, path: "../fonts/Unbounded-VariableFont_wght.woff2" }, "/fonts/JetBrainsMono-Italic-VariableFont_wght.woff2": { type: "font/woff2", etag: '"12f0c-+B4kc/R+5r72qfTJKPf/8FWsw9U"', mtime: "2026-09-27T14:50:31.597Z", size: 77580, path: "../fonts/JetBrainsMono-Italic-VariableFont_wght.woff2" }, "/fonts/JetBrainsMono-VariableFont_wght.woff2": { type: "font/woff2", etag: '"11d08-WwW1QqOePwanfN5Mw4EmVX+vhgQ"', mtime: "2026-09-27T14:49:37.677Z", size: 72968, path: "../fonts/JetBrainsMono-VariableFont_wght.woff2" }, "/_nuxt/about.BQd5kFiO.css": { type: "text/css; charset=utf-8", etag: '"134-QvtFDZZCLYZqE7huDeogIPAlQ+M"', mtime: "2026-09-30T18:52:00.033Z", size: 308, path: "../_nuxt/about.BQd5kFiO.css" }, "/_nuxt/admin.B5pdRqyk.css": { type: "text/css; charset=utf-8", etag: '"759-w0kVLNqG2R0glutbKoKfyjUNMwM"', mtime: "2026-09-30T18:52:00.033Z", size: 1881, path: "../_nuxt/admin.B5pdRqyk.css" }, "/_nuxt/admin.CGqC_NdH.css": { type: "text/css; charset=utf-8", etag: '"14de-Ev0RWmR3Nf5mxK51NTiA3oTn250"', mtime: "2026-09-30T18:52:00.038Z", size: 5342, path: "../_nuxt/admin.CGqC_NdH.css" }, "/_nuxt/7RON4MQr.js": { type: "text/javascript; charset=utf-8", etag: '"1317-CFRRf7/6zlRTa4zW1rLwoG3B1lY"', mtime: "2026-09-30T18:51:59.981Z", size: 4887, path: "../_nuxt/7RON4MQr.js" }, "/_nuxt/8r_D5S2q.js": { type: "text/javascript; charset=utf-8", etag: '"f87-Id7HoKzVAwE+DqZxWIOOwW7XJac"', mtime: "2026-09-30T18:51:59.982Z", size: 3975, path: "../_nuxt/8r_D5S2q.js" }, "/_nuxt/B0HptCSm.js": { type: "text/javascript; charset=utf-8", etag: '"10f3-jfojuG+DGU0nsa4nopyyHtngKbE"', mtime: "2026-09-30T18:51:59.982Z", size: 4339, path: "../_nuxt/B0HptCSm.js" }, "/_nuxt/B1RKIpr8.js": { type: "text/javascript; charset=utf-8", etag: '"e2f-gMCM9rpygMmJfyoqX3wz/JYFU6o"', mtime: "2026-09-30T18:51:59.982Z", size: 3631, path: "../_nuxt/B1RKIpr8.js" }, "/_nuxt/B1sCDpXb.js": { type: "text/javascript; charset=utf-8", etag: '"1006-/IsJ31FUy8yijTmDfMYXUDepfco"', mtime: "2026-09-30T18:51:59.983Z", size: 4102, path: "../_nuxt/B1sCDpXb.js" }, "/_nuxt/BF9TsP8K.js": { type: "text/javascript; charset=utf-8", etag: '"20cd-LUu6Wg1Vkhp4DzMGDP6fTfOxEKw"', mtime: "2026-09-30T18:51:59.984Z", size: 8397, path: "../_nuxt/BF9TsP8K.js" }, "/_nuxt/B7eeoFZn.js": { type: "text/javascript; charset=utf-8", etag: '"14388-QVaRoHkCq35qZGYKoi6Y54Xi9rA"', mtime: "2026-09-30T18:51:59.981Z", size: 82824, path: "../_nuxt/B7eeoFZn.js" }, "/_nuxt/BGWTqq9o.js": { type: "text/javascript; charset=utf-8", etag: '"dfd-iZBQSUvL1DgnNpcETmO/Q/X/Ulw"', mtime: "2026-09-30T18:51:59.984Z", size: 3581, path: "../_nuxt/BGWTqq9o.js" }, "/_nuxt/BH0Gv24-.js": { type: "text/javascript; charset=utf-8", etag: '"ee3-+Vz2q79Z9QP1B0giYP23z8HWma4"', mtime: "2026-09-30T18:51:59.984Z", size: 3811, path: "../_nuxt/BH0Gv24-.js" }, "/_nuxt/BjgPOGtx.js": { type: "text/javascript; charset=utf-8", etag: '"bcf-MW7e7bUBp1gP0cSDafcVKFnWciY"', mtime: "2026-09-30T18:51:59.987Z", size: 3023, path: "../_nuxt/BjgPOGtx.js" }, "/_nuxt/browse.Db6Vz35W.css": { type: "text/css; charset=utf-8", etag: '"e2d-DDsHD6js0A80Qn2v5EY2nUOnSSM"', mtime: "2026-09-30T18:52:00.039Z", size: 3629, path: "../_nuxt/browse.Db6Vz35W.css" }, "/_nuxt/BK1-NNfc.js": { type: "text/javascript; charset=utf-8", etag: '"8c0-UfrzCcJikZJsY20gdAJRO1WfIbo"', mtime: "2026-09-30T18:51:59.985Z", size: 2240, path: "../_nuxt/BK1-NNfc.js" }, "/_nuxt/BSEZXn2t.js": { type: "text/javascript; charset=utf-8", etag: '"1d8-hS2JjBdMsi6y0vdegLV+syQvtmM"', mtime: "2026-09-30T18:51:59.986Z", size: 472, path: "../_nuxt/BSEZXn2t.js" }, "/_nuxt/BLvgV99A.js": { type: "text/javascript; charset=utf-8", etag: '"2170-LRywFx0vzDmRcGk0ETYmRxPLeMY"', mtime: "2026-09-30T18:51:59.985Z", size: 8560, path: "../_nuxt/BLvgV99A.js" }, "/_nuxt/Bx9qBg1P.js": { type: "text/javascript; charset=utf-8", etag: '"8ee-zynOCpUh+/T1XiEbb4uzAowZ/1E"', mtime: "2026-09-30T18:51:59.988Z", size: 2286, path: "../_nuxt/Bx9qBg1P.js" }, "/_nuxt/CategoryIcon.DuegK9sE.css": { type: "text/css; charset=utf-8", etag: '"46-iWebuJVl7ElRtwoyWjXvDT94ZkE"', mtime: "2026-09-30T18:52:00.007Z", size: 70, path: "../_nuxt/CategoryIcon.DuegK9sE.css" }, "/_nuxt/BXCbIEcR.js": { type: "text/javascript; charset=utf-8", etag: '"112d-TaXHxbjDbNB27b1gIjT1/oogEwc"', mtime: "2026-09-30T18:51:59.986Z", size: 4397, path: "../_nuxt/BXCbIEcR.js" }, "/_nuxt/CFJA5iUD.js": { type: "text/javascript; charset=utf-8", etag: '"b8e-mx+bsPFc0LWp7OlBCxT9iYm23eA"', mtime: "2026-09-30T18:51:59.989Z", size: 2958, path: "../_nuxt/CFJA5iUD.js" }, "/_nuxt/By0q6_e3.js": { type: "text/javascript; charset=utf-8", etag: '"36c5-ig7AdMXJScHb/BaUCDq+vUGFvrg"', mtime: "2026-09-30T18:51:59.988Z", size: 14021, path: "../_nuxt/By0q6_e3.js" }, "/_nuxt/Cjrx9aqi.js": { type: "text/javascript; charset=utf-8", etag: '"116e-RS8+u4nUkgyyRMbSVaNDpK7kldQ"', mtime: "2026-09-30T18:51:59.991Z", size: 4462, path: "../_nuxt/Cjrx9aqi.js" }, "/_nuxt/CKDqHj6q.js": { type: "text/javascript; charset=utf-8", etag: '"30f4-8Aw2hn+9vFe09B4YtECoa5VBsL4"', mtime: "2026-09-30T18:51:59.989Z", size: 12532, path: "../_nuxt/CKDqHj6q.js" }, "/_nuxt/CNs_Ozdc.js": { type: "text/javascript; charset=utf-8", etag: '"1b-1MHUJYdBtOvbvPMaiQxDXp3lHyw"', mtime: "2026-09-30T18:51:59.989Z", size: 27, path: "../_nuxt/CNs_Ozdc.js" }, "/_nuxt/contact.BWU9vFWs.css": { type: "text/css; charset=utf-8", etag: '"4d8-lEFUWtUrWTUztcAgbDuMH5tEEqg"', mtime: "2026-09-30T18:52:00.039Z", size: 1240, path: "../_nuxt/contact.BWU9vFWs.css" }, "/_nuxt/CSMBfSHg.js": { type: "text/javascript; charset=utf-8", etag: '"10b-r5ziEzdOYEGJXvkMntJVtfEyddQ"', mtime: "2026-09-30T18:51:59.990Z", size: 267, path: "../_nuxt/CSMBfSHg.js" }, "/_nuxt/CsLHHObY.js": { type: "text/javascript; charset=utf-8", etag: '"79c-0M5QECii9MC+gTSB310JHLEmF2U"', mtime: "2026-09-30T18:51:59.992Z", size: 1948, path: "../_nuxt/CsLHHObY.js" }, "/_nuxt/C_gAeaKg.js": { type: "text/javascript; charset=utf-8", etag: '"1d10-XdYUUcjWYMWrfvB5FHqVgJL2Kns"', mtime: "2026-09-30T18:51:59.991Z", size: 7440, path: "../_nuxt/C_gAeaKg.js" }, "/_nuxt/DaoW4FIz.js": { type: "text/javascript; charset=utf-8", etag: '"ab4-0FY8/2Foodha17+C1e4rIFnpCWA"', mtime: "2026-09-30T18:51:59.994Z", size: 2740, path: "../_nuxt/DaoW4FIz.js" }, "/_nuxt/D3DFZ2Mt.js": { type: "text/javascript; charset=utf-8", etag: '"2494-LAMcZZ24zaZNjDG9up14M1Vrtjc"', mtime: "2026-09-30T18:51:59.993Z", size: 9364, path: "../_nuxt/D3DFZ2Mt.js" }, "/_nuxt/C_THsv0Q.js": { type: "text/javascript; charset=utf-8", etag: '"19a8-KHlZhQrd3JboPcWbxYeNld3NbMU"', mtime: "2026-09-30T18:51:59.990Z", size: 6568, path: "../_nuxt/C_THsv0Q.js" }, "/_nuxt/default.Duex7zFV.css": { type: "text/css; charset=utf-8", etag: '"10d7-VFz/0HX0jAh8ix4UtJYYSesB0ug"', mtime: "2026-09-30T18:52:00.040Z", size: 4311, path: "../_nuxt/default.Duex7zFV.css" }, "/_nuxt/dmca.CiOVMLat.css": { type: "text/css; charset=utf-8", etag: '"315-6t0vZ9zCzhSrMrCtF2n89QdBW6c"', mtime: "2026-09-30T18:52:00.041Z", size: 789, path: "../_nuxt/dmca.CiOVMLat.css" }, "/_nuxt/Ctxm3HmW.js": { type: "text/javascript; charset=utf-8", etag: '"14be8-otD8PUew+AgEk9py4Nb4IkjcUZE"', mtime: "2026-09-30T18:51:59.992Z", size: 84968, path: "../_nuxt/Ctxm3HmW.js" }, "/_nuxt/DeSpNXUb.js": { type: "text/javascript; charset=utf-8", etag: '"1870-99auPfgUEL6c8bvIK90X9UNnRUs"', mtime: "2026-09-30T18:51:59.994Z", size: 6256, path: "../_nuxt/DeSpNXUb.js" }, "/_nuxt/DeYNRyUt.js": { type: "text/javascript; charset=utf-8", etag: '"278-EnUbPp7xNshtoBvgOacGk90SxQM"', mtime: "2026-09-30T18:51:59.995Z", size: 632, path: "../_nuxt/DeYNRyUt.js" }, "/_nuxt/DOnpfcCN.js": { type: "text/javascript; charset=utf-8", etag: '"11f1-BdujIJen3KBTB6tNG2lY56YT7pE"', mtime: "2026-09-30T18:51:59.993Z", size: 4593, path: "../_nuxt/DOnpfcCN.js" }, "/_nuxt/DyrQKSnp.js": { type: "text/javascript; charset=utf-8", etag: '"14ac-KVD6V+LftKcU6Rd3uvS6nasQK5c"', mtime: "2026-09-30T18:51:59.995Z", size: 5292, path: "../_nuxt/DyrQKSnp.js" }, "/_nuxt/DYWY6LHZ.js": { type: "text/javascript; charset=utf-8", etag: '"b29-JRNvd48QbBxASnAEUM0Yfor7AOQ"', mtime: "2026-09-30T18:51:59.994Z", size: 2857, path: "../_nuxt/DYWY6LHZ.js" }, "/_nuxt/Dyod6e3z.js": { type: "text/javascript; charset=utf-8", etag: '"30a8-YVW5hgxQe0kwBEArCVW897LvkLs"', mtime: "2026-09-30T18:51:59.995Z", size: 12456, path: "../_nuxt/Dyod6e3z.js" }, "/_nuxt/entry.DAiX2vZf.css": { type: "text/css; charset=utf-8", etag: '"1471-JUiadBtieUpf0fztL1bF3E5ZIcY"', mtime: "2026-09-30T18:52:00.041Z", size: 5233, path: "../_nuxt/entry.DAiX2vZf.css" }, "/_nuxt/invites.Bx8FlO0Q.css": { type: "text/css; charset=utf-8", etag: '"1b16-x2WO4DPzdKzST/AqnO6LWR/tz7M"', mtime: "2026-09-30T18:52:00.042Z", size: 6934, path: "../_nuxt/invites.Bx8FlO0Q.css" }, "/_nuxt/DyyPB7NA.js": { type: "text/javascript; charset=utf-8", etag: '"18b-wFAJddOsLOI+0t5GPiPmf4JYp78"', mtime: "2026-09-30T18:51:59.996Z", size: 395, path: "../_nuxt/DyyPB7NA.js" }, "/_nuxt/Dzgssr30.js": { type: "text/javascript; charset=utf-8", etag: '"194f-2SY7C7YpXv7rbxPD/hWKD1meNto"', mtime: "2026-09-30T18:51:59.996Z", size: 6479, path: "../_nuxt/Dzgssr30.js" }, "/_nuxt/license.B9wqtbtx.css": { type: "text/css; charset=utf-8", etag: '"315-3F6sFWBy0OBoYY6/pbiYb9F9YnA"', mtime: "2026-09-30T18:52:00.042Z", size: 789, path: "../_nuxt/license.B9wqtbtx.css" }, "/_nuxt/login.Cx-1NhHT.css": { type: "text/css; charset=utf-8", etag: '"d2e-AkRU5un/fnpj3ZYVlSdLtmeKxhY"', mtime: "2026-09-30T18:52:00.043Z", size: 3374, path: "../_nuxt/login.Cx-1NhHT.css" }, "/_nuxt/members.Clkhgmxs.css": { type: "text/css; charset=utf-8", etag: '"124f-VXeeY18GvE0HmiCLWsYKKFHQMWs"', mtime: "2026-09-30T18:52:00.043Z", size: 4687, path: "../_nuxt/members.Clkhgmxs.css" }, "/_nuxt/PageHeader.CqcIavds.css": { type: "text/css; charset=utf-8", etag: '"277-yYObClYKc6+5nrunD0wVyDJlCi8"', mtime: "2026-09-30T18:52:00.007Z", size: 631, path: "../_nuxt/PageHeader.CqcIavds.css" }, "/_nuxt/pages.Byz6EhEe.css": { type: "text/css; charset=utf-8", etag: '"b3d-tfvfEh4siMXu1EcnbMymM2+yka8"', mtime: "2026-09-30T18:52:00.043Z", size: 2877, path: "../_nuxt/pages.Byz6EhEe.css" }, "/_nuxt/privacy.DDIA9Wpa.css": { type: "text/css; charset=utf-8", etag: '"315-xROw3mXYDNgEBz8spJigju7IbHs"', mtime: "2026-09-30T18:52:00.044Z", size: 789, path: "../_nuxt/privacy.DDIA9Wpa.css" }, "/_nuxt/L5VZnhjZ.js": { type: "text/javascript; charset=utf-8", etag: '"2e94-Z4r6LBoZWSOBDFS0uarQ76KZGQk"', mtime: "2026-09-30T18:51:59.997Z", size: 11924, path: "../_nuxt/L5VZnhjZ.js" }, "/_nuxt/ResourceCard.B5ryoPLd.css": { type: "text/css; charset=utf-8", etag: '"d72-1WRsguvhXzRuaqyaJ9HMqVwfSHk"', mtime: "2026-09-30T18:52:00.007Z", size: 3442, path: "../_nuxt/ResourceCard.B5ryoPLd.css" }, "/_nuxt/ixpjVjHx.js": { type: "text/javascript; charset=utf-8", etag: '"1126-V7Kwxu6EivEOojl7pE9fV7yPZ9s"', mtime: "2026-09-30T18:51:59.998Z", size: 4390, path: "../_nuxt/ixpjVjHx.js" }, "/_nuxt/ResourceFields.CdUqoNdL.css": { type: "text/css; charset=utf-8", etag: '"3e0-vDgrJ9q4hQNZnAqpPqaySBu/gIA"', mtime: "2026-09-30T18:52:00.008Z", size: 992, path: "../_nuxt/ResourceFields.CdUqoNdL.css" }, "/_nuxt/signup.M_yKUr_2.css": { type: "text/css; charset=utf-8", etag: '"b24-ZNqRItcx5yLNfOMxgO95hRS35KQ"', mtime: "2026-09-30T18:52:00.045Z", size: 2852, path: "../_nuxt/signup.M_yKUr_2.css" }, "/_nuxt/settings.CE4LEgvQ.css": { type: "text/css; charset=utf-8", etag: '"15bf-Zr/s8D065A6dmrV8PB9n2gJYdDA"', mtime: "2026-09-30T18:52:00.044Z", size: 5567, path: "../_nuxt/settings.CE4LEgvQ.css" }, "/_nuxt/terms.DFKAlgAn.css": { type: "text/css; charset=utf-8", etag: '"315-aD+XeMTo3Qa9mSVtwKWOdQZsO5k"', mtime: "2026-09-30T18:52:00.045Z", size: 789, path: "../_nuxt/terms.DFKAlgAn.css" }, "/_nuxt/upload.DUnD1ojM.css": { type: "text/css; charset=utf-8", etag: '"216e-ipuidHbdf5S//FK3hOuJ6H1MziY"', mtime: "2026-09-30T18:52:00.055Z", size: 8558, path: "../_nuxt/upload.DUnD1ojM.css" }, "/_nuxt/_category_.CoPRyQJz.css": { type: "text/css; charset=utf-8", etag: '"47a-BxRioL3lzgEK3GmEJTR5CaalcZA"', mtime: "2026-09-30T18:52:00.008Z", size: 1146, path: "../_nuxt/_category_.CoPRyQJz.css" }, "/_nuxt/_id_.GIx7hkV1.css": { type: "text/css; charset=utf-8", etag: '"18ce-bcZN8BW4Uk7byVu16vl4aRl+5ZM"', mtime: "2026-09-30T18:52:00.009Z", size: 6350, path: "../_nuxt/_id_.GIx7hkV1.css" }, "/legal/dmca/index.html": { type: "text/html;charset=utf-8", etag: '"414c-03MhGjY9/GYHsX4FTyeBmheYhxs"', mtime: "2026-09-30T18:52:04.934Z", size: 16716, path: "../legal/dmca/index.html" }, "/legal/dmca/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-XBzH3gQ8hhEA5BryYFuvcKf7k5Q"', mtime: "2026-09-30T18:52:04.939Z", size: 111, path: "../legal/dmca/_payload.json" }, "/legal/privacy/index.html": { type: "text/html;charset=utf-8", etag: '"3ddd-/pB0NR6biRojChQV6vkL1V+veg0"', mtime: "2026-09-30T18:52:04.937Z", size: 15837, path: "../legal/privacy/index.html" }, "/legal/privacy/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-XBzH3gQ8hhEA5BryYFuvcKf7k5Q"', mtime: "2026-09-30T18:52:04.942Z", size: 111, path: "../legal/privacy/_payload.json" }, "/legal/license/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-XBzH3gQ8hhEA5BryYFuvcKf7k5Q"', mtime: "2026-09-30T18:52:04.942Z", size: 111, path: "../legal/license/_payload.json" }, "/legal/license/index.html": { type: "text/html;charset=utf-8", etag: '"3df7-zUvxHzA4WywKMbGVFIJtoM6vACA"', mtime: "2026-09-30T18:52:04.937Z", size: 15863, path: "../legal/license/index.html" }, "/legal/terms/_payload.json": { type: "application/json;charset=utf-8", etag: '"6f-XBzH3gQ8hhEA5BryYFuvcKf7k5Q"', mtime: "2026-09-30T18:52:04.941Z", size: 111, path: "../legal/terms/_payload.json" }, "/legal/terms/index.html": { type: "text/html;charset=utf-8", etag: '"407d-SVZeDRbeyrjxWnEf1/7aYEe0ZBU"', mtime: "2026-09-30T18:52:04.936Z", size: 16509, path: "../legal/terms/index.html" }, "/_nuxt/_slug_.BgkW8_u5.css": { type: "text/css; charset=utf-8", etag: '"1ead-Y0uCW0JvbUgSLn3pEb8Zusmu2kc"', mtime: "2026-09-30T18:52:00.009Z", size: 7853, path: "../_nuxt/_slug_.BgkW8_u5.css" }, "/_nuxt/_username_.DpJVkUDu.css": { type: "text/css; charset=utf-8", etag: '"cd5-bZDYf79fEGC8oo9me7Xw0nneuUg"', mtime: "2026-09-30T18:52:00.010Z", size: 3285, path: "../_nuxt/_username_.DpJVkUDu.css" }, "/_nuxt/builds/latest.json": { type: "application/json", etag: '"47-5OxqnOSgJG5503MaTbBVtudiV/U"', mtime: "2026-09-30T18:52:05.929Z", size: 71, path: "../_nuxt/builds/latest.json" }, "/assets/images/logo/logo.png": { type: "image/png", etag: '"26e9-C72skNREDJO/0SxuUgnFkOGKmBE"', mtime: "2026-09-27T21:09:53.392Z", size: 9961, path: "../assets/images/logo/logo.png" }, "/_nuxt/builds/meta/e9a759d5-2527-42ea-94fa-09236fee1c12.json": { type: "application/json", etag: '"aa-20RcFam9M867o3A9HnichZN8Ulk"', mtime: "2026-09-30T18:52:05.929Z", size: 170, path: "../_nuxt/builds/meta/e9a759d5-2527-42ea-94fa-09236fee1c12.json" } };
var u = { "/_nuxt/builds/meta/": { maxAge: 31536e3 }, "/_nuxt/builds/": { maxAge: 1 }, "/_nuxt/": { maxAge: 31536e3 } };
var m = a();
var x = { async fetch(e2, a2, i2) {
  const n2 = new URL(e2.url);
  if (a2.ASSETS && (function(t2 = "") {
    if (p[t2]) return true;
    for (const e3 in u) if (t2.startsWith(e3)) return true;
    return false;
  })(n2.pathname)) return a2.ASSETS.fetch(e2);
  let c2;
  return s(e2) && (c2 = t.from(await e2.arrayBuffer())), globalThis.__env__ = a2, m.localFetch(n2.pathname + n2.search, { context: { waitUntil: /* @__PURE__ */ __name((t2) => i2.waitUntil(t2), "waitUntil"), _platform: { cf: e2.cf, cloudflare: { request: e2, env: a2, context: i2 } } }, host: n2.hostname, protocol: n2.protocol, method: e2.method, headers: e2.headers, body: c2 });
}, scheduled(t2, e2, s2) {
} };
export {
  x as default
};
//# sourceMappingURL=bundledWorker-0.7258048289630326.mjs.map
