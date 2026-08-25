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
const src = fs.readFileSync(FILE, 'utf8');
const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

/* Run the data blocks in their own scope and take what they define. `eval`
   would not work here: this file is strict, so the scripts' `var`s stay
   trapped inside the eval. */
const win = {};
new Function('window', scripts[0])(win);                       // MCAT_PASSAGES + MCAT_BANK
const { CONFIG, SUBJECTS } = new Function(scripts[1] + '\nreturn { CONFIG, SUBJECTS };')();
const PASSAGES = win.MCAT_PASSAGES || {};
const BANK = win.MCAT_BANK || {};

/* syllabus lookups, mirroring what the app builds at boot */
const TOPIC_NAME = {}, GROUP_OF = {}, SUBJ_OF = {};
SUBJECTS.forEach(s => {
  let n = 0;
  s.groups.forEach((g, gi) => {
    g.id = s.id + '-g' + gi;
    g.items = g.topics.map(t => ({ id: s.id + '-' + (n++), name: t }));
    g.items.forEach(t => { TOPIC_NAME[t.id] = t.name; GROUP_OF[t.id] = g.id; SUBJ_OF[t.id] = s.id; });
  });
  s.topicCount = n;
});
const ROUND_LEN = CONFIG.roundLength, MIN_ROUND = 3;
const roundsFor = n => n >= ROUND_LEN ? Math.min(5, Math.floor(n / ROUND_LEN)) : (n >= MIN_ROUND ? 1 : 0);

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
    if (!q.tid) problems.push(id + ': no tid (syllabus topic id)');
    else if (!TOPIC_NAME[q.tid]) problems.push(id + ': tid "' + q.tid + '" is not a syllabus topic');
    else if (SUBJ_OF[q.tid] !== subject) problems.push(id + ': tid "' + q.tid + '" belongs to ' + SUBJ_OF[q.tid] + ', not ' + subject);
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

const perTopic = {};
items.forEach(({ q }) => { if (q.tid) perTopic[q.tid] = (perTopic[q.tid] || 0) + 1; });

console.log('\nPractice the bank can actually support');
let grandRounds = 0;
SUBJECTS.filter(s => s.status === 'active').forEach(s => {
  const bank = BANK[s.id] || [];
  let topicRounds = 0, groupRounds = 0, ready = 0;
  s.groups.forEach(g => {
    g.items.forEach(t => { const r = roundsFor(perTopic[t.id] || 0); topicRounds += r; if (r) ready++; });
    groupRounds += roundsFor(bank.filter(q => GROUP_OF[q.tid] === g.id).length);
  });
  grandRounds += topicRounds + groupRounds;
  console.log('  ' + s.name.padEnd(22) + String(bank.length).padStart(4) + ' questions   ' +
    String(ready + '/' + s.topicCount).padStart(6) + ' topics practisable   ' +
    String(topicRounds + groupRounds).padStart(3) + ' rounds (' + topicRounds + ' topic + ' + groupRounds + ' mixed)');
});
console.log('  ' + 'TOTAL'.padEnd(22) + String(n).padStart(4) + ' questions' + ' '.repeat(33) + String(grandRounds).padStart(3) + ' rounds');

const emptiest = SUBJECTS.filter(s => s.status === 'active')
  .flatMap(s => s.groups.flatMap(g => g.items.map(t => ({ id: t.id, name: t.name, subj: s.name, n: perTopic[t.id] || 0 }))))
  .filter(t => t.n < MIN_ROUND)
  .sort((a, b) => a.n - b.n);
if (emptiest.length) {
  console.log('\n' + emptiest.length + ' topics cannot support a round yet. Shortest first:');
  emptiest.slice(0, 8).forEach(t => console.log('  ' + String(t.n).padStart(2) + '/' + MIN_ROUND + '  ' + t.subj + ' — ' + t.name));
  if (emptiest.length > 8) console.log('  ... and ' + (emptiest.length - 8) + ' more');
}

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
