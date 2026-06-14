# trie-x

Zero-dependency [trie](https://en.wikipedia.org/wiki/Trie) (prefix tree) for JavaScript.

Fast autocomplete, prefix search, wildcard matching, and longest-prefix lookup — all in a single file with **zero npm dependencies**.

## Install

```bash
npm install trie-x
```

## Why?

Tries solve problems hash maps can't:

- **Autocomplete** — find all words starting with a prefix in O(L + results)
- **Prefix queries** — "does any word start with X?" without scanning everything
- **Longest match** — tokenizers, routers, input completion
- **Wildcard search** — `?` for single char, `*` for sequences

All with O(L) per operation where L is the word length.

## Quick Start

```js
const { Trie } = require('trie-x');

const trie = new Trie();
trie.insertAll(['cat', 'car', 'care', 'careful', 'can', 'dog']);

// Exact search
trie.search('cat');        // true
trie.search('car');        // true
trie.search('ca');         // false

// Prefix check
trie.startsWith('ca');     // true

// Autocomplete (sorted)
trie.autocomplete('ca');   // ['can', 'car', 'care', 'careful', 'cat']

// With limit
trie.autocomplete('ca', 3); // ['can', 'car', 'care']

// Wildcard: ? = single char, * = any sequence
trie.wildcard('ca?');      // ['car', 'cat']
trie.wildcard('c*');       // ['can', 'car', 'care', 'careful', 'cat']

// Longest stored word that is a prefix of input
trie.longestPrefixOf('carefully');  // 'careful'

// Remove
trie.remove('car');
trie.search('car');        // false
trie.search('care');       // true (shared prefix preserved)
```

## API

### `new Trie()`

Create an empty trie.

### `trie.insert(word)` → `this`

Insert a word. Chainable. Throws on non-string input. Empty strings are no-ops.

### `trie.insertAll(words)` → `this`

Insert multiple words from an array.

### `trie.search(word)` → `boolean`

Exact match lookup.

### `trie.startsWith(prefix)` → `boolean`

True if any stored word begins with `prefix`. Empty prefix → `true`.

### `trie.autocomplete(prefix, limit?)` → `string[]`

All stored words starting with `prefix`, sorted lexicographically. Optional `limit` caps results.

### `trie.wildcard(pattern)` → `string[]`

Pattern matching where `?` matches any single character and `*` matches any sequence (including empty). Both can be combined.

### `trie.longestPrefixOf(input)` → `string | null`

The longest stored word that is a prefix of `input`. Returns `null` if no match.

### `trie.remove(word)` → `boolean`

Remove a word. Returns `true` if found and removed. Dead nodes are pruned automatically.

### `trie.getAllWords(limit?)` → `string[]`

All stored words, sorted.

### `trie.size()` → `number`

Number of stored words.

### `trie.countNodes()` → `number`

Total internal nodes (including root). Useful for memory analysis.

### `trie.isEmpty()` → `boolean`

### `trie.clear()` → `this`

Remove all words.

### `trie.toJSON()` → `object`

Serialize to a compact plain object.

### `trie.fromJSON(json)` → `this`

Restore from `toJSON()` output.

### `Trie.from(iterable)` → `Trie`

Static factory — build a trie from any iterable of strings.

## CLI

```bash
# Autocomplete from piped JSON array
echo '["cat","car","care"]' | trie-x complete ca
# car
# care

# Wildcard search
trie-x insert cat car care dog | trie-x wildcard "ca?"

# Stats
echo '["apple","app","application"]' | trie-x info
# Words:  3
# Nodes:  12

# Interactive demo
trie-x demo
```

## Performance

| Operation | Time Complexity |
|-----------|----------------|
| insert    | O(L)           |
| search    | O(L)           |
| startsWith| O(L)           |
| autocomplete | O(L + R)    |
| wildcard  | O(N) worst case |
| longestPrefixOf | O(L)     |
| remove    | O(L)           |

Where L = word length, R = results count, N = total nodes.

## License

MIT © [sulthonzh](https://github.com/sulthonzh)
