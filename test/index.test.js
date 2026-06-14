'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Trie } = require('../src/index.js');

test('insert and search basic words', () => {
  const t = new Trie();
  t.insert('hello').insert('world');
  assert.equal(t.search('hello'), true);
  assert.equal(t.search('world'), true);
  assert.equal(t.search('hell'), false);
  assert.equal(t.search('helloo'), false);
});

test('insertAll', () => {
  const t = new Trie();
  t.insertAll(['cat', 'car', 'care', 'careful', 'can']);
  assert.equal(t.search('cat'), true);
  assert.equal(t.search('careful'), true);
  assert.equal(t.size(), 5);
});

test('startsWith', () => {
  const t = Trie.from(['cat', 'car', 'dog', 'do']);
  assert.equal(t.startsWith('ca'), true);
  assert.equal(t.startsWith('do'), true);
  assert.equal(t.startsWith('da'), false);
  assert.equal(t.startsWith(''), true);
});

test('search empty or non-string', () => {
  const t = new Trie();
  t.insert('a');
  assert.equal(t.search(''), false);
  assert.equal(t.search(null), false);
  assert.equal(t.search(undefined), false);
});

test('insert empty string is no-op', () => {
  const t = new Trie();
  t.insert('');
  assert.equal(t.size(), 0);
  assert.equal(t.isEmpty(), true);
});

test('insert duplicate does not increase size', () => {
  const t = new Trie();
  t.insert('apple');
  t.insert('apple');
  t.insert('apple');
  assert.equal(t.size(), 1);
});

test('remove existing word', () => {
  const t = Trie.from(['cat', 'car', 'care']);
  assert.equal(t.remove('car'), true);
  assert.equal(t.search('car'), false);
  assert.equal(t.search('care'), true);
  assert.equal(t.search('cat'), true);
  assert.equal(t.size(), 2);
});

test('remove non-existent word returns false', () => {
  const t = Trie.from(['cat', 'car']);
  assert.equal(t.remove('dog'), false);
  assert.equal(t.remove('ca'), false);
  assert.equal(t.remove(''), false);
  assert.equal(t.size(), 2);
});

test('remove cleans up dead nodes', () => {
  const t = Trie.from(['cat']);
  const nodesBefore = t.countNodes();
  t.remove('cat');
  const nodesAfter = t.countNodes();
  assert.equal(nodesAfter, 1); // just root
  assert.equal(t.size(), 0);
});

test('remove keeps shared prefix nodes', () => {
  const t = Trie.from(['car', 'cat']);
  t.remove('car');
  assert.equal(t.search('cat'), true);
  assert.equal(t.startsWith('ca'), true);
  assert.equal(t.startsWith('car'), false);
});

test('autocomplete with prefix', () => {
  const t = Trie.from(['cat', 'car', 'care', 'careful', 'can', 'dog']);
  const results = t.autocomplete('ca');
  assert.deepEqual(results, ['can', 'car', 'care', 'careful', 'cat']);
});

test('autocomplete with limit', () => {
  const t = Trie.from(['cat', 'car', 'care', 'can']);
  const results = t.autocomplete('ca', 2);
  assert.equal(results.length, 2);
  assert.equal(results[0], 'can'); // sorted
});

test('autocomplete empty prefix returns all', () => {
  const t = Trie.from(['b', 'a', 'c']);
  const results = t.autocomplete('');
  assert.deepEqual(results, ['a', 'b', 'c']);
});

test('autocomplete non-existent prefix', () => {
  const t = Trie.from(['cat', 'dog']);
  assert.deepEqual(t.autocomplete('x'), []);
});

test('wildcard ? matches single char', () => {
  const t = Trie.from(['cat', 'car', 'care', 'dog']);
  const results = t.wildcard('ca?');
  assert.deepEqual(results.sort(), ['car', 'cat']);
});

test('wildcard * matches sequence', () => {
  const t = Trie.from(['cat', 'car', 'care', 'careful', 'dog']);
  const results = t.wildcard('ca*');
  assert.deepEqual(results.sort(), ['car', 'care', 'careful', 'cat']);
});

test('wildcard * matches zero chars', () => {
  const t = Trie.from(['cat', 'ca']);
  const results = t.wildcard('ca*');
  assert.ok(results.includes('ca'));
  assert.ok(results.includes('cat'));
});

test('wildcard exact match (no wildcards)', () => {
  const t = Trie.from(['cat', 'car']);
  assert.deepEqual(t.wildcard('cat'), ['cat']);
});

test('wildcard full pattern *', () => {
  const t = Trie.from(['a', 'bb', 'ccc']);
  const results = t.wildcard('*');
  assert.deepEqual(results.sort(), ['a', 'bb', 'ccc']);
});

test('wildcard combined ? and *', () => {
  const t = Trie.from(['cat', 'car', 'care', 'coat', 'dog']);
  const results = t.wildcard('c*a*');
  assert.deepEqual(results.sort(), ['car', 'care', 'cat', 'coat']);
});

test('longestPrefixOf', () => {
  const t = Trie.from(['app', 'apple', 'application']);
  assert.equal(t.longestPrefixOf('appstore'), 'app');
  assert.equal(t.longestPrefixOf('applications'), 'application');
  assert.equal(t.longestPrefixOf('ap'), null);
  assert.equal(t.longestPrefixOf(''), null);
});

test('longestPrefixOf partial match not terminal', () => {
  const t = Trie.from(['car']);
  assert.equal(t.longestPrefixOf('care'), 'car');
  assert.equal(t.longestPrefixOf('ca'), null);
});

test('countNodes', () => {
  const t = new Trie();
  assert.equal(t.countNodes(), 1); // just root
  t.insert('ab');
  // root -> a -> b
  assert.equal(t.countNodes(), 3);
  t.insert('ac');
  // root -> a -> b, a -> c
  assert.equal(t.countNodes(), 4);
});

test('size and isEmpty', () => {
  const t = new Trie();
  assert.equal(t.isEmpty(), true);
  assert.equal(t.size(), 0);
  t.insert('hi');
  assert.equal(t.isEmpty(), false);
  assert.equal(t.size(), 1);
});

test('clear', () => {
  const t = Trie.from(['a', 'b', 'c']);
  t.clear();
  assert.equal(t.isEmpty(), true);
  assert.equal(t.size(), 0);
  assert.equal(t.countNodes(), 1);
  assert.equal(t.search('a'), false);
});

test('toJSON and fromJSON round-trip', () => {
  const t = Trie.from(['cat', 'car', 'care', 'dog']);
  const json = t.toJSON();
  const t2 = new Trie().fromJSON(json);
  assert.equal(t2.search('cat'), true);
  assert.equal(t2.search('care'), true);
  assert.equal(t2.search('dog'), true);
  assert.equal(t2.search('ca'), false);
  assert.equal(t2.size(), 4);
});

test('fromJSON invalid input throws', () => {
  const t = new Trie();
  assert.throws(() => t.fromJSON(null), TypeError);
  assert.throws(() => t.fromJSON({}), TypeError);
});

test('Trie.from static factory', () => {
  const t = Trie.from(['x', 'xy', 'xyz']);
  assert.equal(t.size(), 3);
  assert.equal(t.search('x'), true);
  assert.equal(t.search('xy'), true);
  assert.equal(t.search('xyz'), true);
});

test('getAllWords', () => {
  const t = Trie.from(['dog', 'apple', 'cat']);
  assert.deepEqual(t.getAllWords(), ['apple', 'cat', 'dog']);
});

test('getAllWords with limit', () => {
  const t = Trie.from(['a', 'b', 'c', 'd']);
  assert.equal(t.getAllWords(2).length, 2);
});

test('chaining insert', () => {
  const t = new Trie();
  t.insert('a').insert('b').insert('c');
  assert.equal(t.size(), 3);
});

test('insert throws on non-string', () => {
  const t = new Trie();
  assert.throws(() => t.insert(42), TypeError);
  assert.throws(() => t.insert(null), TypeError);
  assert.throws(() => t.insert({}), TypeError);
});

test('large trie stress test', () => {
  const t = new Trie();
  const words = [];
  for (let i = 0; i < 1000; i++) {
    words.push('word' + i);
  }
  t.insertAll(words);
  assert.equal(t.size(), 1000);
  // All should be found
  for (const w of words) assert.equal(t.search(w), true);
  // Autocomplete
  assert.equal(t.autocomplete('word1', 100).length, 100); // word1, word10-19, word100-199... actually word1 + word10..word19 + word100..word199+word1000... hmm
  // wildcard
  const star = t.wildcard('word*');
  assert.equal(star.length, 1000);
});

test('remove all words one by one', () => {
  const t = Trie.from(['a', 'ab', 'abc']);
  assert.equal(t.remove('abc'), true);
  assert.equal(t.search('abc'), false);
  assert.equal(t.search('ab'), true);
  assert.equal(t.remove('ab'), true);
  assert.equal(t.search('ab'), false);
  assert.equal(t.search('a'), true);
  assert.equal(t.remove('a'), true);
  assert.equal(t.isEmpty(), true);
  assert.equal(t.countNodes(), 1);
});

test('autocomplete returns sorted results', () => {
  const t = Trie.from(['zebra', 'apple', 'banana', 'apricot', 'avocado']);
  const results = t.autocomplete('a');
  assert.deepEqual(results, ['apple', 'apricot', 'avocado']);
});

test('wildcard with no matches', () => {
  const t = Trie.from(['cat', 'dog']);
  assert.deepEqual(t.wildcard('x?'), []);
  assert.deepEqual(t.wildcard('xyz'), []);
});

test('longestPrefixOf with exact word', () => {
  const t = Trie.from(['test']);
  assert.equal(t.longestPrefixOf('test'), 'test');
});
