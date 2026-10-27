Readme for INF 133 Assignment 2 - Runkeeper Tweet Report

Student name: Zirui Deng
UCI email: dengz7@uci.edu

1. How many assignment points do you believe you completed?

10/10 required features implemented, plus two extensions for the single
optional bonus point (up to 11/10; self-assessment, not an instructor grade).
- 3/3 Summarizing tweets: dynamic earliest/latest dates, four categories,
  counts and percentages, and authored-text count among completed events.
- 4/4 Identifying the most popular activities: activity/distance parsing,
  kilometer-to-mile conversion, activity counts, individual-distance plot,
  daily mean-distance display, and a button that streams data into one view.
- 3/3 Adding a text search interface: case-insensitive live search of authored
  text, updated counts and rows on every input, empty-query clearing, and
  clickable links in the original tweet text.
- Bonus: dynamic updates of ONE distance chart with Vega View changesets.
- Bonus: lexicon-based sentiment analysis displayed in the search table.
  The assignment caps extra credit at one point even though both are implemented.

2. How long, in hours, did it take you to complete this assignment?

Student's own time: [PLEASE FILL IN YOUR ACTUAL TOTAL HOURS]
The initial AI-assisted implementation/verification session took about 0.25
hours, with additional bonus implementation and verification in later sessions.
The student must provide their actual total time above.

3. What online resources did you consult?

- Assignment requirements:
  https://canvas.eee.uci.edu/courses/85916/assignments/1904212
- Official starter code and its provided dataset:
  https://github.com/travislindenreid/a2-tweets
- Vega-Lite aggregation documentation:
  https://vega.github.io/vega-lite/docs/aggregate.html
- Vega-Lite point-mark documentation:
  https://vega.github.io/vega-lite/docs/point.html
- Vega-Lite streaming data tutorial:
  https://vega.github.io/vega-lite/tutorials/streaming.html
- Vega View API (view.change and runAsync):
  https://vega.github.io/vega/docs/api/view/
- Bing Liu's opinion-mining/lexicon resource, suggested by the assignment:
  https://www.cs.uic.edu/~liub/FBS/sentiment-analysis.html
  Used as a reference for the lexicon-based approach; the small English word
  lists in tweet.ts are manually curated, not the full research lexicon.
- OpenAI Codex / ChatGPT was used for AI assistance. The request was to
  complete the project according to the linked Canvas requirements. AI
  assistance included reading the requirements and starter, inspecting tweet
  patterns, implementing the Tweet class and page scripts, compiling
  TypeScript, writing/running verification checks, inspecting the pages in
  Chrome, implementing both bonus features, preparing this README and ZIP,
  and publishing changes in separate functional commits to the GitHub fork.

4. What classmates or other individuals did you consult? What did you discuss?

[PLEASE FILL IN ANY HUMAN COLLABORATION, OR WRITE "None" IF APPLICABLE.]
No human collaboration was reported during the AI-assisted session.
AI assistance is disclosed in question 3.

5. Is there anything special we need to know in order to run your code?

From the project root, compile the TypeScript class:
  npx --yes --package typescript@5.9.3 tsc --project tsconfig.json
Then serve this directory, for example:
  npx --yes live-server
Open index.html, activities.html, and descriptions.html using the navigation.
The submission ZIP also includes the generated js/tweet.js for convenience.
It is generated from ts/tweet.ts, never edited directly, and remains ignored
by Git as in the starter. Recompiling reproduces it.
The starter's CDN resources require an internet connection (Bootstrap and
Vega/Vega-Lite/Vega-Embed). No API key or Twitter login is required.

Implementation notes:
- The original CSS, dataset, loader, and tsconfig.json are unchanged.
  activities.html adds a chart-mode status and removes the second chart
  container; descriptions.html adds a sentiment column and explanation.
  All reported values are derived from the loaded tweets, including the
  activity-summary answers that the assignment permits hardcoding.
- Completed/posted summaries and "I just ran/completed an activity" are
  completed events. "Watch my ... right now" is live; personal-record and
  goal-setting templates are achievements; remaining text is miscellaneous.
- Authored text excludes generated summaries, URLs, Runkeeper boilerplate,
  and the recurring "TomTom MySports Watch" default. For standard summaries,
  custom text follows a spaced dash. These are pattern-based heuristics,
  so unusual free-form or translated tweets may be classified differently.
- Search matches only the extracted authored text and displays the full
  original matching tweet. It ignores case and surrounding query whitespace.
- Distances are miles; 1 mile = 1.609344 kilometers. Missing/duration-only
  distances return zero and are excluded from distance plots and means.
  All completed activity types, including timed workouts, appear in counts.
- Dates and day-of-week groupings use UTC for reproducibility. Weekday/weekend
  comparisons use the mean of individual positive-distance activities among
  the top three types, not sums. Original outlier distances are retained.
- Tweet content is HTML-escaped; only HTTP(S) URLs become clickable links.
- Empty datasets and searches produce zero counts instead of NaN percentages.

Bonus implementation details:
- activities.js embeds the distance chart once using a named distanceData
  source. The aggregate button calls view.change with a Vega changeset and
  runAsync to replace individual rows with activity/day means and back. The
  same view/canvas remains mounted; neither a second chart nor repeated
  vegaEmbed calls are used when toggling. Axes, colors, tooltips, and scales
  update from the new data. Each mean point's tooltip shows sample count.
- The mean is calculated as sum(distance)/number of valid activities in each
  activity/day group. Activity rankings and weekday summaries remain dynamic.
- Tweet.sentiment examines extracted authored text only. Positive/negative
  whole-word matches score +1/-1. Basic negation reverses matching words
  within the next three tokens; punctuation and contrast words end the scope.
  Positive/Negative labels follow the net score, Mixed is a nonempty tie,
  and Neutral means no matching words. No authored text is reported separately.
- Sentiment badges include text labels, signed scores, and matched-word
  explanations on hover. This is an English heuristic, not a trained model;
  sarcasm, emojis, non-English text, and domain-dependent meanings can be
  missed. Words such as tough/tired are negative even when a runner feels proud.

Verification:
- TypeScript 5.9.3 strict compilation passed using the original tsconfig.json.
- 17 automated verification groups passed: the original parsing, units,
  authored text, safe links, all 8,247 records, DOM statistics, and search;
  plus sentiment/negation, same-view streaming, repeated/rapid toggles,
  replacement/empty datasets, and actual Vega compilation/SVG rendering.
- All 21 activity/day means were checked against independently computed means.
- Chrome verified all three pages, both chart states, search edits/case,
  clickable-link markup, and clearing the search. No application errors
  were observed in the browser console.
- Current supplied data: 7,988 completed events, 141 live events, 61
  achievements, 57 miscellaneous tweets; 1,646 completed events contain
  authored text. Top activities: run, walk, bike. Values are not hardcoded.

Submission preparation:
Public fork: https://github.com/GAry-041123/a2-tweets
Fill in the remaining collaboration/time answers above before submitting,
then update the repository and regenerate the ZIP. Canvas submission is
not performed automatically.
