import { AREAS, SYSTEMS } from './constants.js';

const HEB = {
  sh: '\u05e9', ch: '\u05d7', th: '\u05ea', tz: '\u05e6',
  a: '\u05d0', b: '\u05d1', c: '\u05db', d: '\u05d3', e: '\u05d0', f: '\u05e4',
  g: '\u05d2', h: '\u05d4', i: '\u05d9', j: '\u05d9', k: '\u05db', l: '\u05dc',
  m: '\u05de', n: '\u05e0', o: '\u05e2', p: '\u05e4', q: '\u05e7', r: '\u05e8',
  s: '\u05e1', t: '\u05d8', u: '\u05d5', v: '\u05d5', w: '\u05d5', x: '\u05e7\u05e1',
  y: '\u05d9', z: '\u05d6',
};

export function transliterate(text) {
  let output = '';
  let index = 0;
  const source = text.toLowerCase();

  while (index < source.length) {
    const digraph = source.slice(index, index + 2);
    if (source[index + 1] && HEB[digraph]) {
      output += HEB[digraph];
      index += 2;
      continue;
    }

    if (HEB[source[index]]) {
      output += HEB[source[index]];
    } else if (source[index] === ' ') {
      output += ' ';
    }

    index += 1;
  }

  return output;
}

export function scoreColor(value) {
  if (value >= 70) return '#4ADE80';
  if (value >= 55) return '#60A5FA';
  if (value >= 45) return '#FBBF24';
  return '#F87171';
}

export function scoreGradient(value) {
  if (value >= 70) return 'linear-gradient(90deg, #22c55e, #4ADE80)';
  if (value >= 55) return 'linear-gradient(90deg, #3B82F6, #60A5FA)';
  if (value >= 45) return 'linear-gradient(90deg, #F59E0B, #FBBF24)';
  return 'linear-gradient(90deg, #EF4444, #F87171)';
}

export function findHighlight(data, systemId, ...patterns) {
  const highlights = data?.systems?.[systemId]?.highlights;
  if (!highlights) {
    return null;
  }

  for (const highlight of highlights) {
    const label = highlight.label.toLowerCase();
    if (patterns.some((pattern) => label.includes(pattern))) {
      return String(highlight.value);
    }
  }

  return null;
}

export function systemAvgScore(result, systemId) {
  const scores = result?.systems?.[systemId]?.scores;
  if (!scores) {
    return null;
  }

  const values = AREAS.map((area) => scores[area.key]?.value).filter((value) => value != null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

export function generateCosmicMessage(result) {
  const probabilities = result?.combined?.probabilities || {};
  const sorted = Object.entries(probabilities).sort((left, right) => right[1].value - left[1].value);
  if (!sorted.length) {
    return '';
  }

  const [area, info] = sorted[0];
  const agreeing = info.agreeing_systems?.length || 0;
  const rounded = Math.round(info.value);

  if (rounded < 50) {
    return 'The stars advise patience and reflection today. With mixed signals across your chart, focus on what you can control and trust the process.';
  }

  const messages = {
    love: `Your love energy is radiating today - ${agreeing} of 8 systems see warmth and connection ahead.`,
    career: `Your career energy peaks today - ${agreeing} of 8 systems agree this is a day to push forward.`,
    health: `Your vitality is strong today - ${agreeing} of 8 systems align on wellness and renewal.`,
    wealth: `Financial currents flow in your favor - ${agreeing} of 8 systems sense abundance on your horizon.`,
    mood: `Your emotional compass points true today - ${agreeing} of 8 systems feel inner harmony.`,
  };

  return messages[area] || `${agreeing} of 8 systems align on ${area} at ${rounded}%.`;
}

export function generateDoDont(result) {
  const probabilities = result?.combined?.probabilities || {};
  const sorted = Object.entries(probabilities).sort((left, right) => right[1].value - left[1].value);
  const doMap = {
    love: ['Trust your heart in conversations today', 'Reach out to someone you have been thinking about', 'Express affection openly - it lands well today'],
    career: ['Push forward on that project you have been planning', 'Speak up - your ideas carry weight right now', 'Take initiative on something you have delayed'],
    health: ['Move your body - your energy supports it', 'Try that wellness change you have been considering', 'Listen to what your body is telling you'],
    wealth: ['Review your financial goals with fresh eyes', 'Trust your instincts on that decision', 'Plant seeds for long-term growth'],
    mood: ['Follow your creative impulses today', 'Share your energy with those around you', 'Trust your emotional instincts - they are sharp'],
  };
  const dontMap = {
    love: ['Avoid the hard conversation today - timing is off', 'Do not force a connection that is not flowing', 'Skip the jealousy spiral - it is not grounded'],
    career: ['Do not commit to major career changes yet', 'Avoid workplace confrontations today', 'Skip the risky pitch - wait for alignment'],
    health: ['Do not push through fatigue - rest matters more', 'Avoid overcommitting your energy today', 'Skip the late night - sleep is your ally'],
    wealth: ['Avoid major financial commitments today', 'Do not lend money right now - hold boundaries', 'Skip impulse purchases - wait 48 hours'],
    mood: ['Do not make big decisions on today\'s emotions', 'Avoid energy-draining situations', 'Do not suppress feelings - acknowledge them gently'],
  };

  const dos = [];
  const donts = [];

  for (const [area, info] of sorted) {
    if (info.value >= 55 && dos.length < 3) {
      const options = doMap[area] || [];
      dos.push(options[(area.charCodeAt(0) + Math.floor(info.value)) % options.length] || `Lean into ${area} energy`);
    }
  }

  for (const [area, info] of [...sorted].reverse()) {
    if (info.value < 48 && donts.length < 3) {
      const options = dontMap[area] || [];
      donts.push(options[(area.charCodeAt(0) + Math.floor(info.value)) % options.length] || `Be cautious with ${area}`);
    }
  }

  while (dos.length < 3) {
    dos.push(['Stay open to unexpected opportunities', 'Practice gratitude for what is working', 'Connect with something grounding'][dos.length]);
  }

  while (donts.length < 3) {
    donts.push(['Do not overthink - trust the process', 'Avoid comparing yourself to others', 'Do not neglect your basic needs'][donts.length]);
  }

  return { dos: dos.slice(0, 3), donts: donts.slice(0, 3) };
}

export function getDailyContent(result) {
  const daily = result?.daily;
  if (daily?.message && Array.isArray(daily.dos) && Array.isArray(daily.donts)) {
    return {
      source: 'backend',
      dateLabel: daily.date_label || '',
      message: daily.message,
      dos: daily.dos.slice(0, 3),
      donts: daily.donts.slice(0, 3),
      focus: daily.focus || null,
      caution: daily.caution || null,
    };
  }

  const fallback = generateDoDont(result);
  return {
    source: 'fallback',
    dateLabel: '',
    message: generateCosmicMessage(result),
    dos: fallback.dos,
    donts: fallback.donts,
    focus: null,
    caution: null,
  };
}

export function getTimeGreeting(fullName, now = new Date()) {
  const firstName = fullName ? fullName.trim().split(/\s+/)[0] : '';
  const hour = now.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return firstName ? `Good ${partOfDay}, ${firstName}` : `Good ${partOfDay}`;
}

export function extractCosmicDNA(result) {
  if (!result) {
    return [];
  }

  return [
    { label: 'Sun', value: findHighlight(result, 'western', 'sun'), sym: '\u2609' },
    { label: 'Moon', value: findHighlight(result, 'western', 'moon'), sym: '\u263d' },
    { label: 'Rising', value: findHighlight(result, 'western', 'rising', 'ascendant', 'asc'), sym: '\u2191' },
    { label: 'Chinese', value: findHighlight(result, 'chinese', 'animal', 'zodiac', 'sign'), sym: '\ud83d\udc09' },
    { label: 'Day Master', value: findHighlight(result, 'bazi', 'day master', 'day stem', 'day element'), sym: '\u67f1' },
    { label: 'Life Path', value: findHighlight(result, 'numerology', 'life path'), sym: '#' },
  ].filter((item) => item.value);
}

export function getSystemVotes(result, areaKey) {
  if (!result?.systems) {
    return [];
  }

  return SYSTEMS.map((system) => {
    const value = result.systems[system.id]?.scores?.[areaKey]?.value;
    if (value == null) {
      return null;
    }

    return {
      id: system.id,
      name: system.name,
      value: Math.round(value),
      sentiment: value >= 60 ? 'positive' : value >= 45 ? 'mixed' : 'negative',
    };
  }).filter(Boolean);
}

export function areaExplanation(result, areaKey) {
  const info = result?.combined?.probabilities?.[areaKey];
  if (!info) {
    return '';
  }

  const rounded = Math.round(info.value);
  const leaders = info.leaders || [];
  const top = leaders[0];
  const sentenceMap = {
    'strong positive': 'The cosmic energy strongly supports',
    positive: 'The stars are aligned to support',
    mixed: 'The celestial signals are nuanced for',
    challenging: 'The alignments suggest caution in',
    'strong challenging': 'The stars urge patience with',
  };
  const opener = sentenceMap[info.sentiment] || 'The stars indicate movement in';
  const topInfo = top ? `${top.name} leads at ${Math.round(top.value)}%` : 'Multiple systems contribute';
  return `${opener} your ${areaKey} life right now. ${topInfo}, giving an overall reading of ${rounded}% across the consensus.`;
}

export function getOracleTone(sentiment) {
  if (sentiment?.includes('positive')) {
    return 'positive';
  }

  if (sentiment === 'mixed') {
    return 'mixed';
  }

  return 'challenging';
}

export function splitAnswerSentences(answer) {
  if (!answer) {
    return [];
  }

  return (answer.match(/[^.!?]+[.!?]?/g) || [answer]).map((sentence) => sentence.trim()).filter(Boolean);
}

export function buildShareText(question, answer) {
  return `"${question}"\n\n${answer}\n\n- All Star Astrology`;
}

export function getSystemAgreement(result, systemId) {
  if (!result?.systems || !result?.combined?.probabilities) {
    return { agreeing: 0, total: 8, level: 'unknown', label: 'No data' };
  }

  const systemScores = result.systems[systemId]?.scores || {};
  let totalAgree = 0;
  let totalChecked = 0;

  for (const area of AREAS) {
    const sysVal = systemScores[area.key]?.value;
    if (sysVal == null) continue;

    const combVal = result.combined?.probabilities?.[area.key]?.value;
    if (combVal == null) continue;

    totalChecked++;
    const diff = Math.abs(sysVal - combVal);
    if (diff < 15) totalAgree++;
  }

  const ratio = totalChecked > 0 ? totalAgree / totalChecked : 0;
  let level, label;
  if (ratio >= 0.8) {
    level = 'high';
    label = 'Strong consensus';
  } else if (ratio >= 0.5) {
    level = 'medium';
    label = 'Mixed signals';
  } else {
    level = 'low';
    label = 'Systems disagree';
  }

  const otherSystems = SYSTEMS.filter((s) => s.id !== systemId);
  let agreesWithCount = 0;
  for (const other of otherSystems) {
    const otherScores = result.systems[other.id]?.scores || {};
    let matchCount = 0;
    let checkCount = 0;
    for (const area of AREAS) {
      const a = systemScores[area.key]?.value;
      const b = otherScores[area.key]?.value;
      if (a != null && b != null) {
        checkCount++;
        if (Math.abs(a - b) < 18) matchCount++;
      }
    }
    if (checkCount > 0 && matchCount / checkCount >= 0.6) agreesWithCount++;
  }

  return { agreeing: agreesWithCount, total: 7, level, label };
}

export function getConfidenceBadge(agreeing, total) {
  const ratio = total > 0 ? agreeing / total : 0;
  if (ratio >= 0.85) return { text: 'Almost unanimous', color: '#FFD700' };
  if (ratio >= 0.7) return { text: 'Strong consensus', color: '#4ADE80' };
  if (ratio >= 0.4) return { text: 'Mixed signals', color: '#FBBF24' };
  return { text: 'Systems disagree', color: '#F87171' };
}

export function getSystemInsightsByArea(result, systemId) {
  const data = result?.systems?.[systemId];
  if (!data) return [];

  const scores = data.scores || {};
  return AREAS.map((area) => {
    const info = scores[area.key];
    if (!info) return null;
    const value = Math.round(info.value);
    return {
      area: area.key,
      label: area.label,
      icon: area.icon,
      value,
      sentiment: info.label || (value >= 60 ? 'Favorable' : value >= 45 ? 'Neutral' : 'Challenging'),
      text: info.label
        ? `${area.label}: ${info.label} (${value}%)`
        : `${area.label} energy reads at ${value}%`,
    };
  }).filter(Boolean);
}

export function mergeOracleHistory(items, entry, limit = 12) {
  const next = [entry, ...items];
  const deduped = next.filter((item, index, array) => array.findIndex((candidate) => candidate.q === item.q && candidate.a === item.a) === index);
  return deduped.slice(0, limit);
}
