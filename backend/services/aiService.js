/**
 * Simple keyword-based AI Grievance Analysis Service
 * Maps grievance content to a category and priority.
 */

const CATEGORY_KEYWORDS = {
    water_supply: ['water', 'pipe', 'leak', 'tap', 'sewage', 'drainage', 'flood', 'drinking water', 'no water', 'contamination'],
    electricity: ['light', 'electric', 'power', 'load shedding', 'street light', 'bill', 'shock', 'tranformer', 'pole', 'current'],
    roads: ['road', 'pothole', 'street', 'bridge', 'pavement', 'tar', 'construction', 'speed breaker', 'traffic'],
    sanitation: ['garbage', 'trash', 'waste', 'smell', 'clean', 'public toilet', 'drain', 'overflow', 'health'],
    public_transport: ['bus', 'train', 'metro', 'station', 'route', 'fare', 'timings', 'overcrowded', 'driver', 'conductor'],
    healthcare: ['hospital', 'clinic', 'doctor', 'medicine', 'emergency', 'ambulance', 'treatment', 'vaccine', 'pharmacy'],
    education: ['school', 'college', 'teacher', 'fees', 'exam', 'student', 'admission', 'library', 'campus'],
    law_enforcement: ['police', 'theft', 'crime', 'safety', 'harassment', 'noise', 'fighting', 'law', 'patrol'],
    housing: ['house', 'building', 'rent', 'roof', 'wall', 'illegal', 'encroachment', 'planning', 'permission'],
    environment: ['air', 'pollution', 'trees', 'park', 'noise', 'smoke', 'dust', 'climate', 'greenery'],
    corruption: ['bribe', 'money', 'scam', 'official', 'demand', 'unethical', 'blackmail', 'fraud', 'integrity']
};

const PRIORITY_KEYWORDS = {
    urgent: ['dangerous', 'death', 'immediately', 'emergency', 'fire', 'bleeding', 'explosion', 'collapsing', 'poison', 'crime in progress', 'no power for 3 days', 'serious accident'],
    high: ['broken', 'injury', 'urgent', 'quickly', 'asap', 'hazard', 'severe', 'pain', 'risk', 'security', 'leakage']
};

const analyzeGrievance = (title = '', description = '') => {
    const text = (title + ' ' + description).toLowerCase();
    const result = {
        sentiment: 'neutral',
        urgencyScore: 1,
        suggestedCategory: 'other',
        confidence: 0.5,
        keywords: [],
        suggestedPriority: 'normal'
    };

    // 1. Identify Category
    let maxMatches = 0;
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const matches = keywords.filter(kw => text.includes(kw));
        if (matches.length > maxMatches) {
            maxMatches = matches.length;
            result.suggestedCategory = category;
            result.confidence = Math.min(0.5 + (matches.length * 0.1), 0.95);
            result.keywords = matches;
        }
    }

    // 2. Determine Priority
    let urgencyScore = 1;
    const urgentMatches = PRIORITY_KEYWORDS.urgent.filter(kw => text.includes(kw));
    const highMatches = PRIORITY_KEYWORDS.high.filter(kw => text.includes(kw));

    if (urgentMatches.length > 0) {
        result.suggestedPriority = 'urgent';
        urgencyScore = 5;
        result.keywords = [...new Set([...result.keywords, ...urgentMatches])];
    } else if (highMatches.length > 0) {
        result.suggestedPriority = 'high';
        urgencyScore = 4;
        result.keywords = [...new Set([...result.keywords, ...highMatches])];
    }

    result.urgencyScore = urgencyScore;
    
    // 3. Simple Sentiment
    if (urgentMatches.length > 2 || text.includes('angry') || text.includes('disappointed') || text.includes('worst')) {
        result.sentiment = 'negative';
    } else if (text.includes('thanks') || text.includes('good') || text.includes('helpful')) {
        result.sentiment = 'positive';
    }

    return result;
};

module.exports = { analyzeGrievance };
