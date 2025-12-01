// Dictionary Service for Multilingual POS Support
class DictionaryService {
    constructor() {
        this.dictionaries = new Map();
        this.baseUrl = 'assets/dictionaries/';
        
        // Embedded starter dictionaries (to avoid loading external files for now)
        this.embeddedData = {
            'af': {
                nouns: [
                    'bladsy', 'boek', 'huis', 'man', 'vrou', 'kind', 'kar', 'boom', 'hond', 'kat',
                    'rekenaar', 'foon', 'tafel', 'stoel', 'kantoor', 'werk', 'skool', 'universiteit',
                    'regering', 'land', 'stad', 'dorp', 'pad', 'straat', 'geld', 'bank',
                    'literatuuroorsig', 'afdeling', 'reisreël', 'drempel', 'minimum',
                    'oorgrensoorplasings', 'lande', 'data', 'inligting', 'begunstigde',
                    'oordrag', 'naam', 'rekeningnommers', 'adres', 'transaksiedatum',
                    'bedrag', 'leiding', 'konteks', 'woord', 'rekordbehoud', 'rekords',
                    'besonderhede', 'instansie', 'owerhede', 'implementering', 'regulasie'
                ],
                verbs: [
                    'is', 'het', 'was', 'word', 'sal', 'kan', 'moet', 'gaan', 'kom', 'sien',
                    'kyk', 'loop', 'hardloop', 'eet', 'drink', 'slaap', 'werk', 'speel',
                    'leer', 'skryf', 'lees', 'praat', 'luister', 'verstaan', 'weet', 'dink',
                    'glo', 'hoop', 'voel', 'gebruik', 'maak', 'doen', 'kry', 'gee',
                    'aanvaar', 'toepas', 'vergesel', 'toegewys', 'versend', 'gehou',
                    'gestel'
                ],
                adjectives: [
                    'goeie', 'slegte', 'groot', 'klein', 'lang', 'kort', 'vinnige', 'stadige',
                    'mooi', 'lelike', 'nuwe', 'ou', 'jong', 'ryk', 'arm', 'belangrike',
                    'globale', 'regulatoriese', 'binnelandse', 'volledige', 'oorspronklike',
                    'verduidelik', 'onmiddellik', 'veilig', 'europese', 'ontvangende'
                ],
                adverbs: [
                    'baie', 'bietjie', 'nou', 'dan', 'toe', 'hier', 'daar', 'altyd', 'nooit',
                    'dalk', 'miskien', 'seker', 'vinnig', 'stadig', 'goed', 'sleg', 'selfs',
                    'ten minste'
                ],
                prepositions: [
                    'in', 'op', 'by', 'met', 'van', 'vir', 'aan', 'oor', 'onder', 'bo',
                    'langs', 'tussen', 'deur', 'na', 'uit', 'om', 'sonder', 'teen'
                ],
                conjunctions: [
                    'en', 'of', 'maar', 'want', 'omdat', 'sodat', 'terwyl', 'voordat', 'nadat',
                    'as', 'of', 'dat'
                ],
                determiners: [
                    'die', "'n", 'hierdie', 'daardie', 'elke', 'enige', 'sommige', 'baie', 'min'
                ],
                pronouns: [
                    'ek', 'jy', 'hy', 'sy', 'dit', 'ons', 'julle', 'hulle', 'my', 'jou', 'syne',
                    'hare', 'onse'
                ]
            },
            // We can add more languages here later (zu, xh, etc.)
            'zu': {
                nouns: ['umuntu', 'abantu', 'imoto', 'izimoto', 'indlu', 'izindlu'],
                verbs: ['hamba', 'dla', 'phuza', 'lala', 'sebenza', 'funda'],
                // ...
            }
        };
    }

    async loadDictionary(langCode) {
        // Normalize lang code
        const code = langCode.toLowerCase().split('-')[0];
        
        if (this.dictionaries.has(code)) {
            return this.dictionaries.get(code);
        }

        // Check embedded data
        if (this.embeddedData[code]) {
            const dict = this.embeddedData[code];
            const lookup = new Map();
            
            // Build lookup map for O(1) access
            Object.entries(dict).forEach(([pos, words]) => {
                words.forEach(word => {
                    lookup.set(word.toLowerCase(), pos.replace(/s$/, '')); // 'nouns' -> 'noun'
                });
            });
            
            this.dictionaries.set(code, lookup);
            return lookup;
        }

        return null;
    }

    getPOS(word, langCode) {
        const code = langCode.toLowerCase().split('-')[0];
        const dict = this.dictionaries.get(code);
        
        if (dict) {
            return dict.get(word.toLowerCase());
        }
        return null;
    }
}

// Export instance
const dictionaryService = new DictionaryService();

