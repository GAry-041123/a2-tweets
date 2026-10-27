--Readme document for Zirui Deng, dengz7@uci.edu--

1. How many assignment points do you believe you completed (replace the *'s with your numbers)?

10/10
- 3/3 Summarizing tweets
- 4/4 Identifying the most popular activities
- 3/3 Adding a text search interface
- Bonus: dynamic updates of ONE distance chart with Vega View changesets.
- Bonus: lexicon-based sentiment analysis displayed in the search table.
  The assignment caps extra credit at one point even though both are implemented.

2. How long, in hours, did it take you to complete this assignment?

Around 8 hours


3. What online resources did you consult when completing this assignment? (list sites like StackOverflow or specific URLs for tutorials; describe queries to Generative AI or use of AI-based code completion)

- Starter: https://github.com/travislindenreid/a2-tweets
- Vega-Lite:
  https://vega.github.io/vega-lite/docs/aggregate.html
  https://vega.github.io/vega-lite/docs/point.html
  https://vega.github.io/vega-lite/tutorials/streaming.html
- Vega View API: https://vega.github.io/vega/docs/api/view/
- Sentiment approach: https://www.cs.uic.edu/~liub/FBS/sentiment-analysis.html
  The word lists are manually curated, not the full research lexicon.


4. What classmates or other individuals did you consult as part of this assignment? What did you discuss?

N/A


5. Is there anything special we need to know in order to run your code?

From the project folder:
  npx --yes --package typescript@5.9.3 tsc --project tsconfig.json
  npx --yes live-server

Open index.html and use the navigation. Internet access is required for the
CDN libraries. js/tweet.js is generated from ts/tweet.ts and included in the
ZIP, but ignored by Git. Dates use UTC; distances are converted to miles.

Validation: TypeScript compilation, 17 automated check groups, and Chrome
interaction tests passed.

Two extra extensions are implemented
- The aggregate button updates one Vega chart using streaming changesets.
- Search results show sentiment labels and scores with basic negation handling.
  Sentiment uses a small English word list and may miss context or sarcasm.
