import test from 'node:test';
import assert from 'node:assert/strict';
import { plainText } from './assistantText.mjs';

test('markdown from the assistant becomes plain readable text', () => {
  const input = '## Εμβόλια\n\nΤο **επόμενο** εμβόλιο είναι:\n- Λύσσα\n* Πολυδύναμο\n\nΔες [το ιατρείο](https://vetly.gr/vets/x).';
  assert.equal(plainText(input), 'Εμβόλια\n\nΤο επόμενο εμβόλιο είναι:\n• Λύσσα\n• Πολυδύναμο\n\nΔες το ιατρείο (https://vetly.gr/vets/x).');
});

test('italics and inline code lose their markers', () => {
  assert.equal(plainText('Δώσε *λίγο* νερό και `ηρεμία`.'), 'Δώσε λίγο νερό και ηρεμία.');
});
