'use strict';

/**
 * TrieNode — internal node structure.
 * Each node holds child references and a terminal flag marking end-of-word.
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
  }
}

/**
 * Trie — zero-dependency prefix tree.
 *
 * Supports insert, search, delete, autocomplete, wildcard pattern matching,
 * longest common prefix, and serialization (toJSON / fromJSON).
 *
 * @example
 * const trie = new Trie();
 * trie.insert('hello');
 * trie.search('hello');        // true
 * trie.startsWith('hel');      // true
 * trie.autocomplete('hel');    // ['hello']
 */
class Trie {
  constructor() {
    this.root = new TrieNode();
    this._size = 0;
  }

  /**
   * Insert a word into the trie. O(L) where L = word length.
   * @param {string} word
   * @returns {Trie} this (for chaining)
   */
  insert(word) {
    if (typeof word !== 'string') throw new TypeError('word must be a string');
    if (word.length === 0) return this;
    let node = this.root;
    for (const ch of word) {
      let child = node.children.get(ch);
      if (!child) {
        child = new TrieNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    if (!node.isEnd) {
      node.isEnd = true;
      this._size++;
    }
    return this;
  }

  /**
   * Insert multiple words at once.
   * @param {string[]} words
   * @returns {Trie} this
   */
  insertAll(words) {
    for (const w of words) this.insert(w);
    return this;
  }

  /**
   * Search for exact word. O(L).
   * @param {string} word
   * @returns {boolean}
   */
  search(word) {
    if (typeof word !== 'string' || word.length === 0) return false;
    let node = this.root;
    for (const ch of word) {
      node = node.children.get(ch);
      if (!node) return false;
    }
    return node.isEnd;
  }

  /**
   * Check if any stored word starts with the given prefix. O(L).
   * @param {string} prefix
   * @returns {boolean}
   */
  startsWith(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) return true;
    let node = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return false;
    }
    return true;
  }

  /**
   * Remove a word from the trie. Cleans up dead nodes.
   * Returns true if the word was found and removed.
   * @param {string} word
   * @returns {boolean}
   */
  remove(word) {
    if (typeof word !== 'string' || word.length === 0) return false;
    return this._remove(this.root, word, 0);
  }

  _remove(node, word, depth) {
    if (depth === word.length) {
      if (!node.isEnd) return false;
      node.isEnd = false;
      this._size--;
      return true;
    }
    const ch = word[depth];
    const child = node.children.get(ch);
    if (!child) return false;
    const found = this._remove(child, word, depth + 1);
    if (!found) return false;
    // Prune dead leaf nodes
    if (child.children.size === 0 && !child.isEnd) {
      node.children.delete(ch);
    }
    return true;
  }

  /**
   * Return all words that start with the given prefix, sorted lexicographically.
   * @param {string} prefix
   * @param {number} [limit] — optional max results
   * @returns {string[]}
   */
  autocomplete(prefix, limit) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      return this.getAllWords(limit);
    }
    let node = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    const results = [];
    this._collect(node, prefix, results, limit);
    return results;
  }

  /**
   * Get all words in the trie, optionally limited.
   * @param {number} [limit]
   * @returns {string[]}
   */
  getAllWords(limit) {
    const results = [];
    this._collect(this.root, '', results, limit);
    return results;
  }

  _collect(node, prefix, results, limit) {
    if (results.length === limit) return;
    if (node.isEnd) results.push(prefix);
    // Sorted iteration for deterministic output
    const keys = [...node.children.keys()].sort();
    for (const ch of keys) {
      this._collect(node.children.get(ch), prefix + ch, results, limit);
      if (results.length === limit) return;
    }
  }

  /**
   * Wildcard search. `?` matches any single character, `*` matches any sequence
   * (including empty). Uses iterative DFS.
   * @param {string} pattern
   * @returns {string[]} matching words
   *
   * @example
   * trie.insert('cat'); trie.insert('car'); trie.insert('care');
   * trie.wildcard('ca?');  // ['car', 'cat']
   * trie.wildcard('c*');   // ['can', 'car', 'care', 'cat', ...]
   */
  wildcard(pattern) {
    if (typeof pattern !== 'string' || pattern.length === 0) return [];
    const results = [];
    this._wildcardDFS(this.root, '', pattern, 0, results);
    return results.sort();
  }

  _wildcardDFS(node, current, pattern, idx, results) {
    if (idx === pattern.length) {
      if (node.isEnd) results.push(current);
      return;
    }
    const ch = pattern[idx];
    if (ch === '*') {
      // Match zero characters (skip *)
      this._wildcardDFS(node, current, pattern, idx + 1, results);
      // Match one+ characters
      for (const [c, child] of node.children) {
        this._wildcardDFS(child, current + c, pattern, idx, results);
      }
    } else if (ch === '?') {
      for (const [c, child] of node.children) {
        this._wildcardDFS(child, current + c, pattern, idx + 1, results);
      }
    } else {
      const child = node.children.get(ch);
      if (child) {
        this._wildcardDFS(child, current + ch, pattern, idx + 1, results);
      }
    }
  }

  /**
   * Find the longest stored word that is a prefix of the input string.
   * Useful for tokenizers, routing, autocomplete "match-as-you-type".
   * @param {string} input
   * @returns {string|null}
   */
  longestPrefixOf(input) {
    if (typeof input !== 'string' || input.length === 0) return null;
    let node = this.root;
    let lastEnd = -1;
    for (let i = 0; i < input.length; i++) {
      node = node.children.get(input[i]);
      if (!node) break;
      if (node.isEnd) lastEnd = i;
    }
    return lastEnd >= 0 ? input.slice(0, lastEnd + 1) : null;
  }

  /**
   * Count total nodes (including root).
   * @returns {number}
   */
  countNodes() {
    let count = 0;
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop();
      count++;
      for (const child of node.children.values()) stack.push(child);
    }
    return count;
  }

  /**
   * Number of stored words.
   * @returns {number}
   */
  size() {
    return this._size;
  }

  /**
   * Check if trie is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this._size === 0;
  }

  /**
   * Remove all words.
   * @returns {Trie} this
   */
  clear() {
    this.root = new TrieNode();
    this._size = 0;
    return this;
  }

  /**
   * Serialize to plain object.
   * @returns {object}
   */
  toJSON() {
    return {
      root: this._nodeToJSON(this.root),
      size: this._size,
    };
  }

  _nodeToJSON(node) {
    const children = {};
    for (const [ch, child] of node.children) {
      children[ch] = this._nodeToJSON(child);
    }
    return { e: node.isEnd ? 1 : 0, c: children };
  }

  /**
   * Deserialize from object produced by toJSON().
   * @param {object} json
   * @returns {Trie} this
   */
  fromJSON(json) {
    if (!json || typeof json.root !== 'object') throw new TypeError('Invalid trie JSON');
    this.root = this._nodeFromJSON(json.root);
    this._size = json.size ?? 0;
    return this;
  }

  _nodeFromJSON(obj) {
    const node = new TrieNode();
    node.isEnd = obj.e === 1;
    if (obj.c) {
      for (const [ch, child] of Object.entries(obj.c)) {
        node.children.set(ch, this._nodeFromJSON(child));
      }
    }
    return node;
  }

  /**
   * Create a Trie from an iterable of words.
   * @param {Iterable<string>} words
   * @returns {Trie}
   */
  static from(words) {
    const trie = new Trie();
    for (const w of words) trie.insert(w);
    return trie;
  }
}

module.exports = { Trie, TrieNode };
