#!/usr/bin/env node
/*
 * Bank health check.  Run after editing questions:
 *
 *     node mcat-tracker/check-bank.js
 *
 * Exits non-zero if the bank has a structural error or if the answer key has
 * drifted far enough to be guessable.  See "Writing questions" in the README.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');
global.window = {};
const src = fs.readFileSync(FILE, 'utf8');
const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
eval(scripts[0]);                                  // defines MCAT_PASSAGES + MCAT_BANK
const PASSAGES = window.MCAT_PASSAGES || {};
const BANK = window.MCAT_BANK || {};

const LETTERS = 'ABCD';
const problems = [];
const items = [];

Object.keys(BANK).forEach(subject => {
  BANK[subject].forEach((q, i) => {
    const id = subject + '#' + i;
    items.push({ id, subject, q });
    if (!Array.isArray(q.options) || q.options.length !== 4) problems.push(id + ': needs exactly 4 options');
    else {
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) problems.push(id + ': answer index ' + q.answer + ' is out of range');
      const seen = new Set(q.options.map(o => String(o).trim().toLowerCase()));
      if (seen.size !== q.options.length) problems.push(id + ': two options have the same text');
      if (q.whys && q.whys.length !== q.options.length) problems.push(id + ': whys does not line up with options');
    }
    if (!q.topic) problems.push(id + ': no topic tag');
    if (!q.why || q.why.length < 20) problems.push(id + ': explanation missing or too short');
    if (q.passage && !PASSAGES[q.passage]) problems.push(id + ': references passage "' + q.passage + '", which is not defined');
  });
});

const n = items.length;
const byLetter = [0, 0, 0, 0];
let longestIsAnswer = 0;
const skewed = [];

items.forEach(({ id, q }) => {
  byLetter[q.answer]++;
  const lengths = q.options.map(o => String(o).length);
  if (lengths.indexOf(Math.max(...lengths)) === q.answer) longestIsAnswer++;
  const others = lengths.filter((_, j) => j !== q.answer);
  const mean = others.reduce((a, b) => a + b, 0) / others.length;
  const gap = lengths[q.answer] - mean;
  if (lengths[q.answer] / mean > 1.5 && gap >= 15) {
    skewed.push('  ' + id + ' — answer is ' + Math.round(gap) + ' characters longer than the average distractor');
  }
});

const pct = x => Math.round(x / n * 100);
const evenShare = n / 4;

console.log('Bank: ' + n + ' questions across ' + Object.keys(BANK).length + ' subjects');
Object.keys(BANK).forEach(s => {
  const c = BANK[s].length;
  console.log('  ' + s.padEnd(10) + String(c).padStart(4) + (c < 50 ? '   (thin — 5 rounds will reshuffle the same items)' : ''));
});

console.log('\nAnswer key');
byLetter.forEach((c, i) => {
  const bar = '#'.repeat(Math.round(c / n * 60));
  console.log('  ' + LETTERS[i] + '  ' + String(c).padStart(3) + '  ' + String(pct(c) + '%').padStart(4) + '  ' + bar);
});
const worstLetter = Math.max(...byLetter);
const keyDrift = worstLetter / evenShare;
console.log('  most common letter scores ' + pct(worstLetter) + '% for a student who never reads (random guessing = 25%)');

console.log('\nOption length');
console.log('  longest option is the correct one in ' + longestIsAnswer + '/' + n + ' = ' + pct(longestIsAnswer) + '%  (chance = 25%, healthy = 25-35%)');
if (skewed.length) {
  console.log('  items where the answer is conspicuously longer:');
  skewed.forEach(l => console.log(l));
}

const failures = [];
if (problems.length) failures.push(problems.length + ' structural problem(s)');
if (keyDrift > 1.4) failures.push('answer key is skewed toward ' + LETTERS[byLetter.indexOf(worstLetter)]);
if (pct(longestIsAnswer) > 45) failures.push('the longest option is too often the answer');

console.log('');
if (problems.length) {
  console.log('Problems:');
  problems.forEach(p => console.log('  ' + p));
  console.log('');
}
if (failures.length) {
  console.log('FAIL — ' + failures.join('; '));
  process.exit(1);
}
console.log('OK — bank is structurally sound and the key is not guessable.');
