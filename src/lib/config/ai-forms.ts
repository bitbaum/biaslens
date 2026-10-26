/**
 * Every form the AI assistant may fill or change (fleet standard: a form is
 * fillable from prose and changeable by talking to it, @fleet/ai-forms).
 * The route accepts these keys and no others.
 */
import { defineFields, type FormTarget } from '@fleet/ai-forms';

export const INQUIRY_FIELDS = defineFields([
  {
    name: 'question',
    label: 'Question',
    type: 'text',
    required: true,
    maxLength: 400,
    hint: 'One open question, as neutral as the person’s own words allow.',
  },
  {
    name: 'scope',
    label: 'Scope',
    type: 'text',
    maxLength: 400,
    hint: 'Place, period, population and what the key words mean.',
  },
  {
    name: 'notes',
    label: 'Explanations to keep open',
    type: 'textarea',
    maxLength: 4000,
    hint: 'Competing explanations, one per line, each starting "- ".',
  },
  {
    name: 'challenge',
    label: 'What would change your mind',
    type: 'textarea',
    maxLength: 4000,
    hint: 'The strongest challenge to the likeliest explanation, and the evidence that would settle it.',
  },
]);

export const INQUIRY_FORM: FormTarget = {
  key: 'inquiry',
  name: 'Research question',
  fields: INQUIRY_FIELDS,
  instructions: [
    'This is a research notebook, not an answer. Never state which explanation is true.',
    'Never invent facts, figures, studies, names, sources or links. Name the kind of evidence that would settle a point (a statistic, a register, a primary document), never a specific source you have not been given.',
    'Explanations are hypotheses to test: two to five, phrased neutrally, including at least one that runs against the framing of the question.',
    'Do not use the words left-wing, right-wing, biased, propaganda or fake news.',
    'Write in the language the person used.',
  ],
  maxTokens: 900,
  temperature: 0.3,
};

export const AI_FORMS: readonly FormTarget[] = [INQUIRY_FORM];
