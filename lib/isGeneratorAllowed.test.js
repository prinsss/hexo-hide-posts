'use strict';

const isGeneratorAllowed = require('./isGeneratorAllowed');

const all = ['asset', 'page', 'post', 'excerpt', 'category', 'tag', 'archive', 'index'];

test('block all and allow nothing', () => {
  const config = {
    allowlist_generators: [],
    blocklist_generators: ['*']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual([]);
});

test('block all but allow two', () => {
  const config = {
    allowlist_generators: ['category', 'tag'],
    blocklist_generators: ['*']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(['category', 'tag']);
});

test('allow all but block two', () => {
  const config = {
    allowlist_generators: ['*'],
    blocklist_generators: ['category', 'tag']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(['asset', 'page', 'post', 'excerpt', 'archive', 'index']);
});

test('empty allowlist and blocklist', () => {
  const config = {
    allowlist_generators: [],
    blocklist_generators: []
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual([]);
});

test('allowlist has higher priority on wildcards', () => {
  const config = {
    allowlist_generators: ['*'],
    blocklist_generators: ['*']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(all);
});

test('allowlist has higher priority on exact match', () => {
  const config = {
    allowlist_generators: ['archive', 'index', '*'],
    blocklist_generators: ['archive', 'index']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(all);
});

test('allowlist exact match has higher priority than blocklist wildcards', () => {
  const config = {
    allowlist_generators: ['archive', 'index'],
    blocklist_generators: ['*']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(['archive', 'index']);
});

test('blocklist exact match has higher priority than allowlist wildcards', () => {
  const config = {
    allowlist_generators: ['*'],
    blocklist_generators: ['archive', 'index']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(['asset', 'page', 'post', 'excerpt', 'category', 'tag']);
});

// This could be done in userspace by writing a script
// that assigns value to `hexo.config.hide_posts.allowlist_function`.
// See: https://hexo.io/docs/plugins
test('custom allowlist function', () => {
  const config = {
    allowlist_function: name => name === 'category' || name === 'tag'
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(['category', 'tag']);
});

test('custom allowlist function has utmost priority', () => {
  const config = {
    allowlist_function: () => true,
    blocklist_generators: ['category', 'tag']
  };
  const allowed = all.filter(name => isGeneratorAllowed(config, name));
  expect(allowed).toEqual(all);
});
