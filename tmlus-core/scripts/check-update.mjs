import assert from 'node:assert/strict';
import {
  compareSemverVersions,
  runTmlusUpdate
} from '../dist/app/update-flow.js';

function adapter(responses, calls = []) {
  return {
    calls,
    async latestVersion(packageName) {
      calls.push(['latestVersion', packageName]);
      return responses.latestVersion;
    },
    async installLatest(packageName) {
      calls.push(['installLatest', packageName]);
      return responses.installLatest;
    },
    async installedVersion() {
      calls.push(['installedVersion']);
      return responses.installedVersion;
    }
  };
}

assert.equal(compareSemverVersions('1.0.0', '1.0.0'), 0);
assert.equal(compareSemverVersions('1.0.1', '1.0.0'), 1);
assert.equal(compareSemverVersions('1.0.0', '1.0.1'), -1);
assert.equal(compareSemverVersions('1.10.0', '1.2.0'), 1);
assert.equal(compareSemverVersions('1.0.0-beta.1', '1.0.0'), -1);

{
  const calls = [];
  const result = await runTmlusUpdate({
    currentVersion: '1.0.0',
    env: {},
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' }
    }, calls)
  });

  assert.equal(result.status, 'already-current');
  assert.deepEqual(calls, [['latestVersion', '@time-machine-lab/tmlus']]);
}

{
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: {},
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' },
      installLatest: { ok: true, stdout: 'installed\n', stderr: '' },
      installedVersion: { ok: true, stdout: '1.0.0\n', stderr: '' }
    })
  });

  assert.equal(result.status, 'updated');
  assert.equal(result.latestVersion, '1.0.0');
  assert.equal(result.verifiedVersion, '1.0.0');
}

{
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: {},
    adapter: adapter({
      latestVersion: { ok: false, stdout: '', stderr: '', message: 'registry unavailable' }
    })
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.failureStage, 'latest-version');
  assert.match(result.message, /registry unavailable/);
}

{
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: {},
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' },
      installLatest: { ok: false, stdout: '', stderr: '', message: 'permission denied' }
    })
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.failureStage, 'install');
  assert.match(result.manualCommand, /npm install -g @time-machine-lab\/tmlus@latest/);
}

{
  const calls = [];
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: { npm_command: 'exec' },
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' }
    }, calls)
  });

  assert.equal(result.status, 'unsupported-invocation');
  assert.deepEqual(calls, [['latestVersion', '@time-machine-lab/tmlus']]);
}

{
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: { npm_lifecycle_event: 'start' },
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' }
    })
  });

  assert.equal(result.status, 'unsupported-invocation');
}

{
  const result = await runTmlusUpdate({
    currentVersion: '0.1.0',
    env: {},
    adapter: adapter({
      latestVersion: { ok: true, stdout: '1.0.0\n', stderr: '' },
      installLatest: { ok: true, stdout: 'installed\n', stderr: '' },
      installedVersion: { ok: true, stdout: '0.1.0\n', stderr: '' }
    })
  });

  assert.equal(result.status, 'verification-failed');
  assert.equal(result.failureStage, 'verification');
  assert.match(result.message, /Restart the terminal/);
}

console.log('update checks passed');
