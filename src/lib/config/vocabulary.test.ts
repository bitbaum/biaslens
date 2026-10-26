import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { forbiddenLabelsIn, stripForbiddenSentences } from './vocabulary';

describe('forbidden label scan', () => {
  it('flags political labels in BiasLens’s own voice, in three languages', () => {
    expect(forbiddenLabelsIn('This is a right-wing outlet.')).toEqual(['right-wing']);
    expect(forbiddenLabelsIn('Ein rechtspopulistisches Blatt.')).toEqual(['rechtspopulistisches']);
    expect(forbiddenLabelsIn('Un journal de gauche.')).toEqual(['de gauche']);
    expect(forbiddenLabelsIn('The article is biased.')).toEqual(['biased']);
  });

  it('allows the same words inside reported quotation marks', () => {
    expect(forbiddenLabelsIn('Critics call it „rechtspopulistisch“ in the text.')).toEqual([]);
    expect(forbiddenLabelsIn('The minister spoke of «propagande».')).toEqual([]);
  });

  it('does not confuse ordinary words with labels', () => {
    expect(forbiddenLabelsIn('Biases to consider: the selection of sources.')).toEqual([]);
    expect(forbiddenLabelsIn('Liberal economic policy and conservative estimates.')).toEqual([]);
  });

  it('drops only the sentences that apply a label', () => {
    expect(
      stripForbiddenSentences(
        'The figures lack a base. It is a far-right paper. Ask for the sample.',
      ),
    ).toBe('The figures lack a base. Ask for the sample.');
  });
});

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

describe('interface copy', () => {
  it('never applies a forbidden label in a page or component', () => {
    for (const path of files(join(process.cwd(), 'src/app'))) {
      const text = readFileSync(path, 'utf8');
      expect(forbiddenLabelsIn(text), path).toEqual([]);
    }
  });
});
