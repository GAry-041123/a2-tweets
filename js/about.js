function parseTweets(runkeeper_tweets) {
    if (!Array.isArray(runkeeper_tweets)) {
        window.alert('No tweets returned');
        return;
    }
    const tweets = runkeeper_tweets.map(tweet => new Tweet(tweet.text, tweet.created_at));
    const setText = (selector, value) => {
        document.querySelectorAll(selector).forEach(element => { element.textContent = value; });
    };
    const percentage = (count, total) => (total ? count / total * 100 : 0).toFixed(2) + '%';
    setText('#numberTweets', tweets.length);
    const dates = tweets.map(tweet => tweet.time.getTime()).filter(Number.isFinite);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    setText('#firstDate', dates.length ? new Date(Math.min(...dates)).toLocaleDateString('en-US', options) : 'No dates available');
    setText('#lastDate', dates.length ? new Date(Math.max(...dates)).toLocaleDateString('en-US', options) : 'No dates available');
    const categories = {
        completed_event: 'completedEvents', live_event: 'liveEvents',
        achievement: 'achievements', miscellaneous: 'miscellaneous'
    };
    Object.entries(categories).forEach(([source, className]) => {
        const count = tweets.filter(tweet => tweet.source === source).length;
        setText('.' + className, count);
        setText('.' + className + 'Pct', percentage(count, tweets.length));
    });
    const completed = tweets.filter(tweet => tweet.source === 'completed_event');
    const written = completed.filter(tweet => tweet.written).length;
    setText('.written', written);
    setText('.writtenPct', percentage(written, completed.length));
}

document.addEventListener('DOMContentLoaded', function () {
    loadSavedRunkeeperTweets().then(parseTweets).catch(error => {
        console.error(error);
        window.alert('Unable to load tweets. Please reload the page.');
    });
});
