let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
    if (!Array.isArray(runkeeper_tweets)) {
        window.alert('No tweets returned');
        return;
    }
    // Cache normalized authored text instead of reparsing it on every keystroke.
    writtenTweets = runkeeper_tweets.map(tweet => new Tweet(tweet.text, tweet.created_at))
        .filter(tweet => tweet.written)
        .map(tweet => ({ tweet, searchable: tweet.writtenText.toLowerCase() }));
    updateSearch();
}

function updateSearch() {
    const text = document.getElementById('textFilter').value;
    const query = text.trim().toLowerCase();
    const matches = query ? writtenTweets.filter(entry => entry.searchable.includes(query)) : [];
    document.getElementById('searchText').textContent = text;
    document.getElementById('searchCount').textContent = matches.length;
    document.getElementById('tweetTable').innerHTML = matches.map((entry, index) => entry.tweet.getHTMLTableRow(index + 1)).join('');
}

function addEventHandlerForSearch() {
    const input = document.getElementById('textFilter');
    input.setAttribute('aria-label', 'Search user-written tweet text');
    document.getElementById('searchCount').setAttribute('aria-live', 'polite');
    input.addEventListener('input', updateSearch);
    updateSearch();
}

document.addEventListener('DOMContentLoaded', function () {
    addEventHandlerForSearch();
    loadSavedRunkeeperTweets().then(parseTweets).catch(error => {
        console.error(error);
        window.alert('Unable to load tweets. Please reload the page.');
    });
});
