class Tweet {
    // Small, manually curated English lexicon; inspired by the opinion-lexicon
    // approach linked in the assignment, not a copy of the full Hu/Liu dataset.
    private static readonly positiveWords = new Set(('amazing awesome beautiful best better brilliant calm cheerful comfortable confident cool delightful easy energetic enjoyable excellent exciting fantastic fine fresh fun glad glorious good gorgeous great happy healthy incredible lovely marvelous nice peaceful perfect pleasant pleased positive proud refreshing relaxed relaxing satisfying smooth strong successful sunny superb terrific thrilled wonderful enjoy enjoyed enjoying love loved loving').split(' '));
    private static readonly negativeWords = new Set(('aching angry annoying anxious awful bad boring brutal cold cruel depressing difficult disappointed disappointing dreadful exhausted exhausting frustrating gloomy horrible hurt injured miserable nasty negative painful poor rough sad sick slow sore stressful terrible tired tiring tough ugly uncomfortable unhappy unpleasant weak worse worst hate hated hating pain struggle struggling failed').split(' '));
    private text: string;
    time: Date;

    constructor(tweet_text: string, tweet_time: string) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }

    get source(): string {
        const text = this.text.trim();
        if (/^(?:just )?(?:completed|posted)\b/i.test(text) || /^I just (?:ran|completed an activity)\b/i.test(text)) return 'completed_event';
        if (/^Watch my\b/i.test(text) && /(?:right now|Runkeeper Live|#RKLive)/i.test(text)) return 'live_event';
        if (/^(?:Achieved\b|I just (?:set|achieved|completed|reached) (?:a |my )?goal\b|Just (?:set|achieved)\b)/i.test(text)) return 'achievement';
        return 'miscellaneous';
    }

    get written(): boolean {
        return this.writtenText.length > 0;
    }

    get writtenText(): string {
        let content = this.text.replace(/https?:\/\/\S+/gi, '')
            .replace(/#(?:Runkeeper|RKLive|FitnessAlerts)\b/gi, '').trim();
        // Generated summaries precede a spaced dash; only its suffix is authored.
        if (this.source !== 'miscellaneous') {
            const separator = content.match(/\s+[-–—]\s+/);
            if (separator && separator.index !== undefined) {
                content = content.slice(separator.index + separator[0].length);
            } else if (/^I just (?:ran|completed an activity)\b/i.test(content)) {
                content = content.replace(/^I just (?:ran|completed an activity)\s+with\s*(?:@?Runkeeper)?[.!]?/i, '');
            } else {
                return '';
            }
        } else if (/^Just linked\b.*\bHealth Graph\b/i.test(content)) {
            return '';
        }
        return content.replace(/with @?Runkeeper\.?\s*Check it out!?/gi, '')
            .replace(/\bTomTom MySports Watch\b/gi, '')
            .replace(/^\s*Check it out!\s*$/i, '').trim();
    }

    get activityType(): string {
        if (this.source !== 'completed_event') return 'unknown';
        if (/^I just ran\b/i.test(this.text.trim())) return 'run';
        if (/^I just completed an activity\b/i.test(this.text.trim())) return 'activity';
        // Retain multiword names; timed workouts have no distance prefix.
        const summary = this.text.trim().replace(/^(?:just )?(?:completed|posted)\s+(?:an?\s+)?/i, '');
        const match = summary.match(/^(?:[\d.,]+\s+(?:km|mi|miles?|kilometers?|kilometres?)\s+)?(.+?)(?=\s+in\s+\d+:|\s+with\s+@?Runkeeper|\s+[-–—]\s+|\s+@\s|\s+https?:\/\/|\s+#Runkeeper|$)/i);
        return match ? match[1].trim().toLowerCase().replace(/[.!]+$/, '') : 'unknown';
    }

    get distance(): number {
        if (this.source !== 'completed_event') return 0;
        const match = this.text.trim().match(/^(?:just )?(?:completed|posted)\s+(?:an?\s+)?([\d.,]+)\s+(km|mi|miles?|kilometers?|kilometres?)\b/i);
        if (!match) return 0;
        // Accept decimal commas and comma-separated thousands.
        const raw = match[1];
        const normalized = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
        const distance = Number(normalized);
        if (!Number.isFinite(distance)) return 0;
        return /^k/i.test(match[2]) ? distance / 1.609344 : distance;
    }

    get sentiment(): { label: string; score: number; matches: string[] } {
        const content = this.writtenText;
        if (!content) return { label: 'No authored text', score: 0, matches: [] };
        const tokens = content.toLowerCase().replace(/’/g, "'").match(/[a-z]+(?:'[a-z]+)?|[.!?,;:]/g) || [];
        let positive = 0;
        let negative = 0;
        let negationRemaining = 0;
        const matches: string[] = [];
        for (const token of tokens) {
            // Punctuation and contrast words end a simple three-word negation scope.
            if (/^[.!?,;:]$/.test(token) || ['but', 'however', 'yet'].includes(token)) {
                negationRemaining = 0;
                continue;
            }
            if (['not', 'no', 'never', 'neither', 'nor', 'without', 'hardly'].includes(token) || token.endsWith("n't")) {
                negationRemaining = 3;
                continue;
            }
            let weight = Tweet.positiveWords.has(token) ? 1 : Tweet.negativeWords.has(token) ? -1 : 0;
            if (weight !== 0) {
                const negated = negationRemaining > 0;
                if (negated) weight = -weight;
                if (weight > 0) positive++; else negative++;
                matches.push((negated ? 'not ' : '') + token + (weight > 0 ? ' (+1)' : ' (-1)'));
            }
            if (negationRemaining > 0) negationRemaining--;
        }
        const score = positive - negative;
        const label = score > 0 ? 'Positive' : score < 0 ? 'Negative' : positive + negative > 0 ? 'Mixed' : 'Neutral';
        return { label, score, matches };
    }

    getHTMLTableRow(rowNumber: number): string {
        // Escape tweet content; only http(s) URLs become clickable links.
        const escapeHTML = (text: string): string => text.replace(/[&<>"']/g, character => {
            const entities: { [key: string]: string } = {
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            };
            return entities[character];
        });
        let html = '';
        let position = 0;
        const urls = /https?:\/\/[^\s<>"']+/gi;
        let match: RegExpExecArray | null;
        while ((match = urls.exec(this.text)) !== null) {
            const url = match[0].replace(/[.,!?;:)\]]+$/, '');
            html += escapeHTML(this.text.slice(position, match.index));
            html += '<a href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(url) + '</a>';
            position = match.index + url.length;
        }
        html += escapeHTML(this.text.slice(position));
        const sentiment = this.sentiment;
        const colors: { [key: string]: string } = {
            Positive: 'text-bg-success', Negative: 'text-bg-danger', Mixed: 'text-bg-warning', Neutral: 'text-bg-secondary'
        };
        const explanation = sentiment.matches.length ? sentiment.matches.join(', ') : 'No sentiment words matched.';
        const score = sentiment.score > 0 ? '+' + sentiment.score : String(sentiment.score);
        return '<tr><th scope="row">' + escapeHTML(String(rowNumber)) + '</th><td>' +
            escapeHTML(this.activityType) + '</td><td>' + html + '</td><td class="sentiment">' +
            '<span class="badge ' + (colors[sentiment.label] || 'text-bg-secondary') + '" title="' + escapeHTML(explanation) + '">' +
            escapeHTML(sentiment.label) + ' (' + score + ')</span></td></tr>';
    }
}
