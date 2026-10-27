async function parseTweets(runkeeper_tweets) {
    if (!Array.isArray(runkeeper_tweets)) {
        window.alert('No tweets returned');
        return;
    }
    const tweets = runkeeper_tweets.map(tweet => new Tweet(tweet.text, tweet.created_at));
    const completed = tweets.filter(tweet => tweet.source === 'completed_event');
    const counts = new Map();
    completed.forEach(tweet => {
        const activity = tweet.activityType;
        if (activity !== 'unknown') counts.set(activity, (counts.get(activity) || 0) + 1);
    });
    const activities = Array.from(counts, ([activity, count]) => ({ activity, count }))
        .sort((a, b) => b.count - a.count || a.activity.localeCompare(b.activity));
    const topActivities = activities.slice(0, 3).map(activity => activity.activity);
    const setText = (id, value) => { document.getElementById(id).textContent = value; };
    setText('numberActivities', activities.length);
    ['firstMost', 'secondMost', 'thirdMost'].forEach((id, index) => setText(id, topActivities[index] || 'none'));

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Use UTC consistently with the overview. Duration-only workouts have no distance.
    const distances = completed.filter(tweet => topActivities.includes(tweet.activityType) && tweet.distance > 0 && Number.isFinite(tweet.time.getTime()))
        .map(tweet => ({ activity: tweet.activityType, distance: tweet.distance,
            day: days[tweet.time.getUTCDay()], dayIndex: tweet.time.getUTCDay(), samples: 1 }));
    // Prepare one row per activity/day for the streaming-data mean view.
    const dailyGroups = new Map();
    distances.forEach(row => {
        const key = row.activity + ':' + row.dayIndex;
        if (!dailyGroups.has(key)) dailyGroups.set(key, { ...row, distance: 0, samples: 0 });
        const group = dailyGroups.get(key);
        group.distance += row.distance;
        group.samples += 1;
    });
    const dailyMeans = Array.from(dailyGroups.values(), group => ({
        ...group, distance: group.distance / group.samples
    }));
    const mean = values => values.length ? values.reduce((sum, value) => sum + value.distance, 0) / values.length : 0;
    const means = topActivities.map(activity => ({ activity, values: distances.filter(value => value.activity === activity) }))
        .filter(group => group.values.length).map(group => ({ activity: group.activity, mean: mean(group.values) }))
        .sort((a, b) => b.mean - a.mean);
    setText('longestActivityType', means.length ? means[0].activity : 'unknown');
    setText('shortestActivityType', means.length ? means[means.length - 1].activity : 'unknown');
    const weekends = distances.filter(value => value.day === 'Saturday' || value.day === 'Sunday');
    const weekdays = distances.filter(value => value.day !== 'Saturday' && value.day !== 'Sunday');
    setText('weekdayOrWeekendLonger', !weekends.length || !weekdays.length ? 'insufficient data' :
        mean(weekends) === mean(weekdays) ? 'weekdays and weekends equally' : mean(weekends) > mean(weekdays) ? 'weekends' : 'weekdays');

    const width = Math.max(260, Math.min(650, document.querySelector('main').clientWidth - 160));
    const activitySpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: 'Number of completed activities',
        description: 'Completed tweets grouped by activity type, including duration-only workouts.',
        width, height: { step: 24 }, data: { values: activities }, mark: 'bar',
        encoding: {
            x: { field: 'count', type: 'quantitative', title: 'Number of tweets' },
            y: { field: 'activity', type: 'nominal', sort: '-x', title: 'Activity' },
            tooltip: [{ field: 'activity', title: 'Activity' }, { field: 'count', type: 'quantitative', title: 'Tweets' }]
        }
    };
    const distanceSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: 'Activity distances by day', width, height: 320,
        description: 'Distances in miles for the three most frequently tweeted activities, grouped by UTC weekday.',
        data: { name: 'distanceData', values: distances.map(row => ({ ...row })) },
        mark: { type: 'point', opacity: 0.6, filled: true, size: 65 },
        encoding: {
            x: { field: 'day', type: 'ordinal', sort: days, title: 'Day of week (UTC)', axis: { labelAngle: -25 } },
            y: { field: 'distance', type: 'quantitative', title: 'Distance (miles)', scale: { zero: true } },
            color: { field: 'activity', type: 'nominal', title: 'Activity', scale: { domain: topActivities } },
            tooltip: [{ field: 'activity', title: 'Activity' }, { field: 'day', title: 'Day' },
                { field: 'distance', type: 'quantitative', format: '.2f', title: 'Miles' },
                { field: 'samples', type: 'quantitative', title: 'Activities represented' }]
        }
    };

    const button = document.getElementById('aggregate');
    const mode = document.getElementById('distanceMode');
    let showMeans = false;
    const updateLabels = () => {
        button.textContent = showMeans ? 'Show individual activities' : 'Show means';
        button.setAttribute('aria-pressed', String(showMeans));
        mode.textContent = showMeans
            ? 'Daily means: each point is the average distance for one activity type on one day.'
            : 'Individual activities: each point is the distance of one completed activity.';
    };
    button.disabled = true;
    updateLabels();
    const [, distanceChart] = await Promise.all([
        vegaEmbed('#activityVis', activitySpec, { actions: false }),
        vegaEmbed('#distanceVis', distanceSpec, { actions: false })
    ]);
    // Keep the same Vega View and canvas. Only its named dataset is replaced.
    // Clone rows because Vega attaches tuple metadata to inserted objects.
    button.onclick = async () => {
        if (button.disabled) return;
        button.disabled = true;
        const nextMode = !showMeans;
        try {
            const rows = nextMode ? dailyMeans : distances;
            const changes = vega.changeset().remove(() => true).insert(rows.map(row => ({ ...row })));
            await distanceChart.view.change('distanceData', changes).runAsync();
            showMeans = nextMode;
            updateLabels();
        } catch (error) {
            console.error(error);
            mode.textContent = 'Unable to update the chart. Please reload the page.';
        } finally {
            button.disabled = false;
        }
    };
    button.disabled = false;
}

document.addEventListener('DOMContentLoaded', function () {
    loadSavedRunkeeperTweets().then(parseTweets).catch(error => {
        console.error(error);
        document.getElementById('activityVis').textContent = 'Unable to load charts. Check your connection and reload.';
    });
});
