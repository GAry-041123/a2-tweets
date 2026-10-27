class Tweet {
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
        return '<tr><th scope="row">' + escapeHTML(String(rowNumber)) + '</th><td>' +
            escapeHTML(this.activityType) + '</td><td>' + html + '</td></tr>';
    }
}
