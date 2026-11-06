import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';

// Exercise the actual Expo consumers when changing its transitive Zod major.
// Revisit the scoped override and these contracts whenever Expo CLI changes.
const require = createRequire(import.meta.url);
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliPackage = expoRequire.resolve('@expo/cli/package.json');
const cliRequire = createRequire(cliPackage);
const serverPath = join(dirname(cliPackage), 'build/src/start/server');
const { PluginSchema, DevToolsPluginOutputSchema } = require(join(serverPath, 'DevToolsPlugin.schema.js'));
const { createMCPDevToolsExtensionSchema } = require(join(serverPath, 'createMCPDevToolsExtensionSchema.js'));
const { DevToolsPluginCliExtensionResults } = require(join(serverPath, 'DevToolsPluginCliExtensionResults.js'));

const plugin = {
  packageName: 'vetly-test-plugin',
  packageRoot: process.cwd(),
  cliExtensions: {
    description: 'Dependency compatibility fixture',
    entryPoint: 'fixture.js',
    commands: [{
      name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'],
      parameters: [
        { name: 'label', type: 'text' },
        { name: 'count', type: 'number' },
        { name: 'confirmed', type: 'confirm' },
      ],
    }],
  },
};

test('Expo resolves the reviewed, patched Zod version', () => {
  assert.equal(require(cliPackage).version, '58.1.15');
  assert.equal(cliRequire('zod/package.json').version, '4.6.7');
});

test('Expo validates plugin configuration and rejects malformed commands', () => {
  assert.equal(PluginSchema.safeParse(plugin).success, true);
  assert.equal(PluginSchema.safeParse({ ...plugin, packageName: '' }).success, false);
  assert.equal(PluginSchema.safeParse({ ...plugin, cliExtensions: {
    ...plugin.cliExtensions, commands: [{ name: 'bad', title: 'Bad', environments: ['unknown'] }],
  } }).success, false);
});

test('Expo command schemas preserve strict typed parameters with Zod 4', () => {
  const schema = createMCPDevToolsExtensionSchema(plugin);
  const valid = { command: 'inspect', label: 'pet', count: 2, confirmed: true };
  assert.deepEqual(schema.parse(valid), valid);
  assert.equal(schema.safeParse({ command: 'inspect' }).success, true);
  for (const invalid of [
    { ...valid, command: 'unknown' }, { ...valid, count: '2' },
    { ...valid, confirmed: 'true' }, { ...valid, extra: 'unexpected' },
  ]) assert.equal(schema.safeParse(invalid).success, false);
});

test('Expo output parsing preserves text/media and handles invalid JSON data', () => {
  const output = [
    { type: 'text', text: 'Ready', level: 'info' },
    { type: 'image', url: 'https://example.com/pet.png' },
    { type: 'audio', url: 'https://example.com/clip.mp3', text: 'Clip' },
  ];
  assert.deepEqual(DevToolsPluginOutputSchema.parse(output), output);
  const parser = new DevToolsPluginCliExtensionResults();
  assert.deepEqual(parser.parseOutputText(JSON.stringify(output)), output);
  assert.equal(parser.parseOutputText('[{"type":"unknown"}]')[0].level, 'error');
  assert.deepEqual(parser.parseOutputText('Plain text'), [{ type: 'text', text: 'Plain text', level: 'info' }]);
});

test('Patched Zod rejects oversized constrained arrays before visiting elements', () => {
  const { z } = cliRequire('zod');
  let visited = 0;
  const schema = z.array(z.string().superRefine(() => { visited += 1; })).max(2);
  assert.equal(schema.safeParse(Array(1000).fill('item')).success, false);
  assert.equal(visited, 0);
});

test('Updated XML parsers preserve Expo and Xcode plist round trips', () => {
  const sample = { CFBundleName: 'Vetly & pets', Enabled: true, Count: 2, Values: ['α', 'β'] };
  for (const name of ['@expo/plist', 'plist']) {
    const module = cliRequire(name);
    const plist = module.default ?? module;
    // Expo intentionally parses dictionaries with a null prototype.
    assert.deepEqual({ ...plist.parse(plist.build(sample)) }, sample);
  }
});
