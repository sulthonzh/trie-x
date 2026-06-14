#!/usr/bin/env node
'use strict';
const { Trie } = require('./index.js');

function usage() {
  console.log(`trie-x — prefix tree CLI

Usage:
  trie-x insert <word> [word...]     Insert word(s), output JSON trie
  trie-x search <word>               Check if exact word exists
  trie-x prefix <prefix>             Check if any word starts with prefix
  trie-x complete <prefix> [-n N]    Autocomplete suggestions
  trie-x wildcard <pattern>          Wildcard search (? = single, * = sequence)
  trie-x longest <input>             Longest stored word that is prefix of input
  trie-x words [-n N]                List all words
  trie-x info                        Show trie stats
  trie-x demo                        Run interactive demo
  trie-x --help                      Show this help

Options:
  -n, --limit <N>   Max results (default: 50)
  --json            JSON output

Examples:
  echo '["cat","car","care"]' | trie-x complete ca --json
  trie-x insert apple app application | trie-x complete app -n 5
  trie-x demo`);
}

function parseArgs(argv) {
  const args = { _: [], limit: 50, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-n' || a === '--limit') { args.limit = parseInt(argv[++i], 10); }
    else if (a === '--json') { args.json = true; }
    else if (a === '-h' || a === '--help') { args.help = true; }
    else { args._.push(a); }
  }
  return args;
}

function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', d => data += d);
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    usage();
    process.exit(0);
  }
  const args = parseArgs(argv);
  const cmd = args._[0];

  // Build trie from stdin if available, or from insert command
  let trie = new Trie();

  if (cmd === 'demo') {
    const words = ['cat', 'car', 'care', 'careful', 'can', 'canvas', 'dog', 'do', 'door'];
    trie.insertAll(words);
    console.log('Trie demo with words:', words.join(', '));
    console.log('\nsearch("care"):', trie.search('care'));
    console.log('startsWith("ca"):', trie.startsWith('ca'));
    console.log('autocomplete("ca"):', trie.autocomplete('ca'));
    console.log('wildcard("ca?"):', trie.wildcard('ca?'));
    console.log('wildcard("c*"):', trie.wildcard('c*'));
    console.log('longestPrefixOf("carefully"):', trie.longestPrefixOf('carefully'));
    console.log('Nodes:', trie.countNodes(), '| Size:', trie.size());
    process.exit(0);
  }

  // Try reading from stdin (piped data)
  if (!process.stdin.isTTY) {
    const input = await readStdin();
    if (input) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) trie.insertAll(parsed);
        else if (parsed.root) trie.fromJSON(parsed);
      } catch {
        // Treat as newline-separated words
        trie.insertAll(input.split(/\n/).map(s => s.trim()).filter(Boolean));
      }
    }
  }

  switch (cmd) {
    case 'insert': {
      const words = args._.slice(1);
      trie.insertAll(words);
      if (args.json) console.log(JSON.stringify(trie.toJSON()));
      else console.log(`Inserted ${words.length} word(s). Size: ${trie.size()}`);
      break;
    }
    case 'search': {
      const word = args._[1];
      const found = trie.search(word);
      if (args.json) console.log(JSON.stringify({ word, found }));
      else console.log(found ? 'true' : 'false');
      break;
    }
    case 'prefix': {
      const prefix = args._[1];
      const found = trie.startsWith(prefix);
      if (args.json) console.log(JSON.stringify({ prefix, found }));
      else console.log(found ? 'true' : 'false');
      break;
    }
    case 'complete':
    case 'autocomplete': {
      const prefix = args._[1] || '';
      const results = trie.autocomplete(prefix, args.limit);
      if (args.json) console.log(JSON.stringify({ prefix, results }));
      else results.forEach(r => console.log(r));
      break;
    }
    case 'wildcard': {
      const pattern = args._[1];
      const results = trie.wildcard(pattern);
      if (args.json) console.log(JSON.stringify({ pattern, results }));
      else results.forEach(r => console.log(r));
      break;
    }
    case 'longest': {
      const input = args._[1];
      const result = trie.longestPrefixOf(input);
      if (args.json) console.log(JSON.stringify({ input, match: result }));
      else console.log(result ?? '(none)');
      break;
    }
    case 'words': {
      const results = trie.getAllWords(args.limit);
      if (args.json) console.log(JSON.stringify({ count: trie.size(), results }));
      else results.forEach(r => console.log(r));
      break;
    }
    case 'info': {
      const info = {
        size: trie.size(),
        nodes: trie.countNodes(),
        isEmpty: trie.isEmpty(),
      };
      if (args.json) console.log(JSON.stringify(info));
      else {
        console.log(`Words:  ${info.size}`);
        console.log(`Nodes:  ${info.nodes}`);
        console.log(`Empty:  ${info.isEmpty}`);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      usage();
      process.exit(1);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
