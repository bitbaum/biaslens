# Report rubric

Score every report 0, 1 or 2 on each line. Write the scores into the PR that
changes the method, next to the harness summary for the old and new prompt
version. A method change ships only if no line gets worse on average.

| Line | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Specific | Generic remarks that fit any article | Some points specific to this text | Every point names a passage, voice or figure of this text |
| Correct | A misattribution, a wrong figure or an invented passage | Minor imprecision | Nothing a careful reader would correct |
| Useful to someone who disagrees with the article | Nothing they could use | One point they could use | The strongest objection and a checkable question |
| Useful to someone who agrees with it | Reads as an attack | Neutral | States the strongest case fairly and shows where it needs support |
| Not repetitive | The same point in three or more sections | Some repetition | Each section adds something |

The harness (`pnpm run eval:reports`) measures what can be counted: passages
grounded, expected voices found, the author never listed as a voice, expected
techniques found, forbidden labels, time and model. The rubric covers what
cannot.
