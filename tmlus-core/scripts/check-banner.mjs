import assert from 'node:assert/strict';
import { renderStaticBanner, selectBannerMode } from '../dist/cli/banner.js';

const base = {
  args: [],
  columns: 100,
  env: { TERM: 'xterm-256color' },
  isTTY: true,
  platform: process.platform
};

function mode(overrides = {}) {
  return selectBannerMode({
    ...base,
    ...overrides,
    env: {
      ...base.env,
      ...(overrides.env ?? {})
    }
  });
}

assert.equal(mode(), 'animated');
assert.equal(mode({ args: ['version'] }), 'suppressed');
assert.equal(mode({ args: ['--no-banner'] }), 'suppressed');
assert.equal(mode({ args: ['--quiet'] }), 'suppressed');
assert.equal(mode({ env: { TMLUS_NO_BANNER: '1' } }), 'suppressed');
assert.equal(mode({ env: { CI: 'true' } }), 'suppressed');
assert.equal(mode({ isTTY: false }), 'suppressed');
assert.equal(mode({ columns: 60 }), 'static-compact');
assert.equal(mode({ env: { NO_COLOR: '1' } }), 'monochrome');
assert.equal(mode({ env: { TMLUS_BANNER_STATIC: '1' } }), 'static-full');
assert.equal(mode({ columns: 30 }), 'suppressed');

const monochrome = renderStaticBanner('monochrome');
assert.match(monochrome, /TML AI DEV ATELIER/);
assert.doesNotMatch(monochrome, /\u001B\[/);

const compact = renderStaticBanner('static-compact');
assert.match(compact, /TmlUs AI Dev Workspace/);

console.log('banner checks passed');
