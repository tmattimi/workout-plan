// ── TRAINING ANALYTICS ────────────────────────────────────────────────────────
// Evidence-based calculations for training load, recovery, and progression.
// Sources: Gabbett (ACWR), Helms/3DMJ (progression), Israetel (volume landmarks)

// ── ACUTE:CHRONIC WORKLOAD RATIO (ACWR) ──────────────────────────────────────
// Research: Gabbett TJ (2016), Br J Sports Med. Used across NFL, Premier League,
// Olympic programs. Compares recent load (acute, 7 days) vs baseline (chronic, 28 days).
// Sweet spot: 0.8–1.3. Above 1.5 = danger zone (5× injury risk in Gabbett's data).
// Load formula: total weight lifted per day (sets × weight gives volume load).

export function calculateACWR(allLogs) {
  if (!allLogs || allLogs.length === 0) return null;

  // Sum load by date
  const loadByDate = {};
  allLogs.forEach(log => {
    if (!log.weight_lbs || !log.session_date) return;
    const date = log.session_date;
    if (!loadByDate[date]) loadByDate[date] = 0;
    loadByDate[date] += parseFloat(log.weight_lbs);
  });

  const today = new Date();

  // Build daily load array for last 35 days (need 28 for chronic + buffer)
  const dailyLoads = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyLoads.push({ date: key, load: loadByDate[key] || 0 });
  }

  // Acute load = sum of last 7 days
  const acute = dailyLoads.slice(-7).reduce((a, d) => a + d.load, 0);

  // Chronic load = rolling 28-day average (average of last 4 weekly sums)
  // Per Gabbett's methodology: average of 4 one-week totals
  const week1 = dailyLoads.slice(-7).reduce((a, d) => a + d.load, 0);
  const week2 = dailyLoads.slice(-14, -7).reduce((a, d) => a + d.load, 0);
  const week3 = dailyLoads.slice(-21, -14).reduce((a, d) => a + d.load, 0);
  const week4 = dailyLoads.slice(-28, -21).reduce((a, d) => a + d.load, 0);
  const chronic = (week1 + week2 + week3 + week4) / 4;

  if (chronic === 0) return null;

  const ratio = acute / chronic;

  // Weekly load trend for chart (last 8 weeks)
  const weeklyLoads = [];
  for (let i = 7; i >= 0; i--) {
    const weekLoads = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - (i * 7) - d);
      const key = date.toISOString().slice(0, 10);
      weekLoads.push(loadByDate[key] || 0);
    }
    const weekTotal = weekLoads.reduce((a, b) => a + b, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - i * 7 - 6);
    weeklyLoads.push({
      date: weekStart.toISOString().slice(0, 10),
      value: Math.round(weekTotal),
      label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  let zone, zoneColor, zoneMessage;
  if (ratio < 0.8) {
    zone = 'Undertraining';
    zoneColor = '#60a5fa';
    zoneMessage = 'Your recent training load is significantly below your baseline. You may be underrecovering from life stress, or simply training less than usual. Consider ramping back up gradually.';
  } else if (ratio <= 1.3) {
    zone = 'Optimal';
    zoneColor = '#16a34a';
    zoneMessage = 'Your training load is well-calibrated relative to your baseline. This is the zone associated with adaptation and low injury risk.';
  } else if (ratio <= 1.5) {
    zone = 'Caution';
    zoneColor = '#d97706';
    zoneMessage = 'Your recent load is notably higher than your baseline. This is manageable but warrants attention — prioritize sleep and recovery this week.';
  } else {
    zone = 'High Risk';
    zoneColor = '#b91c1c';
    zoneMessage = "Your acute load is 1.5× or more above your chronic baseline — Gabbett's research associates this with a 5× increase in injury risk. Consider a deload or reduced intensity this week.";
  }

  return {
    ratio: parseFloat(ratio.toFixed(2)),
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    zone,
    zoneColor,
    zoneMessage,
    weeklyLoads,
  };
}

// ── PROGRESSIVE OVERLOAD TRACKING ────────────────────────────────────────────
// Research: Helms et al. (2014), NSCA practical programming, Israetel volume work.
// For intermediate lifters, 2–5% monthly strength increase is optimal.
// Method: compare best working weight in last 4 weeks vs prior 4 weeks per exercise.
// Status: progressing | stalled | regressing | new (not enough data)

export function calculateProgressionStatus(allLogs) {
  if (!allLogs || allLogs.length === 0) return [];

  const today = new Date();
  const cutoff4w = new Date(today);
  cutoff4w.setDate(today.getDate() - 28);
  const cutoff8w = new Date(today);
  cutoff8w.setDate(today.getDate() - 56);

  // Group logs by exercise
  const byExercise = {};
  allLogs.forEach(log => {
    const name = (log.exercise_name || '').toLowerCase().trim();
    if (!name || !log.weight_lbs || !log.reps || !log.session_date) return;
    if (!byExercise[name]) byExercise[name] = [];
    byExercise[name].push({
      date: log.session_date,
      weight: parseFloat(log.weight_lbs),
      reps: parseInt(log.reps),
    });
  });

  const results = [];

  Object.entries(byExercise).forEach(([name, logs]) => {
    if (logs.length < 3) return; // Need meaningful data

    const recent = logs.filter(l => new Date(l.date) >= cutoff4w);
    const prior = logs.filter(l => new Date(l.date) >= cutoff8w && new Date(l.date) < cutoff4w);

    if (recent.length === 0) return; // No recent data

    const bestRecent = Math.max(...recent.map(l => l.weight));
    const bestPrior = prior.length > 0 ? Math.max(...prior.map(l => l.weight)) : null;

    // Month-over-month change
    const change = bestPrior !== null ? bestRecent - bestPrior : null;
    const changePct = bestPrior ? ((change / bestPrior) * 100).toFixed(1) : null;

    let status, statusColor, statusLabel;
    if (bestPrior === null) {
      status = 'new';
      statusColor = '#94a3b8';
      statusLabel = 'New';
    } else if (change > 0) {
      status = 'progressing';
      statusColor = '#16a34a';
      statusLabel = `+${change} lbs`;
    } else if (change === 0) {
      // Stalled — check how long. If >4 weeks same weight, flag it.
      const allSameOrLess = logs.filter(l => new Date(l.date) >= cutoff8w).every(l => l.weight <= bestRecent);
      status = 'stalled';
      statusColor = '#d97706';
      statusLabel = 'Stalled';
    } else {
      status = 'regressing';
      statusColor = '#b91c1c';
      statusLabel = `${change} lbs`;
    }

    // Trend data for sparkline — best weight per session date
    const byDate = {};
    logs.forEach(l => {
      if (!byDate[l.date] || l.weight > byDate[l.date]) byDate[l.date] = l.weight;
    });
    const trend = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-8)
      .map(([date, weight]) => ({ date, value: weight }));

    results.push({
      name,
      displayName: name.charAt(0).toUpperCase() + name.slice(1),
      bestRecent,
      bestPrior,
      change,
      changePct,
      status,
      statusColor,
      statusLabel,
      trend,
      sessions: logs.length,
    });
  });

  // Sort: regressing first, then stalled, then progressing, then new
  const order = { regressing: 0, stalled: 1, progressing: 2, new: 3 };
  return results.sort((a, b) => order[a.status] - order[b.status]);
}

// ── RECOVERY SCORE ────────────────────────────────────────────────────────────
// Combines available health metrics into a 0–100 daily readiness score.
// Weighted formula based on research into recovery monitoring:
//   - Sleep duration (40%) — most impactful single factor (Walker, Why We Sleep; Fullagar et al.)
//   - HRV trend (30%) — best objective recovery marker (Plews et al., IJSPP)
//   - Training load ratio (20%) — acute:chronic proximity to optimal zone
//   - Soreness self-report (10%) — subjective wellness, quick proxy
//
// Note: without wearable HRV, we use the trend direction (improving/declining) rather than absolute values.

export function calculateRecoveryScore(healthLogs, acwr) {
  if (!healthLogs || healthLogs.length === 0) return null;

  const today = healthLogs[0]; // Most recent (logs are desc order)
  if (!today) return null;

  let score = 0;
  let factors = [];
  let dataPoints = 0;

  // ── SLEEP (40 points) ──
  if (today.sleep_hours) {
    dataPoints++;
    const sleep = parseFloat(today.sleep_hours);
    // Optimal: 8–9 hrs = 40 pts. Linear drop below 6 and above 10.
    let sleepScore;
    if (sleep >= 8 && sleep <= 9) sleepScore = 40;
    else if (sleep >= 7 && sleep < 8) sleepScore = 34;
    else if (sleep >= 6 && sleep < 7) sleepScore = 24;
    else if (sleep >= 9 && sleep <= 10) sleepScore = 36;
    else if (sleep < 6) sleepScore = Math.max(0, 14 - (6 - sleep) * 7);
    else sleepScore = 28;
    score += sleepScore;
    factors.push({
      label: 'Sleep',
      value: `${sleep}h`,
      points: sleepScore,
      max: 40,
      status: sleep >= 8 ? 'good' : sleep >= 7 ? 'ok' : 'poor',
    });
  }

  // ── HRV TREND (30 points) ──
  const recentHRV = healthLogs.filter(h => h.hrv).slice(0, 7);
  if (recentHRV.length >= 3) {
    dataPoints++;
    const values = recentHRV.map(h => h.hrv).reverse(); // oldest first
    const avg7 = values.reduce((a, b) => a + b, 0) / values.length;
    const last3avg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const trendPct = ((last3avg - avg7) / avg7) * 100;

    let hrvScore;
    if (trendPct >= 2) hrvScore = 30;       // Improving
    else if (trendPct >= -2) hrvScore = 24;  // Stable
    else if (trendPct >= -8) hrvScore = 16;  // Declining slightly
    else hrvScore = 8;                        // Declining significantly

    score += hrvScore;
    factors.push({
      label: 'HRV Trend',
      value: trendPct > 0 ? `+${trendPct.toFixed(1)}%` : `${trendPct.toFixed(1)}%`,
      points: hrvScore,
      max: 30,
      status: trendPct >= 2 ? 'good' : trendPct >= -2 ? 'ok' : 'poor',
    });
  }

  // ── TRAINING LOAD (20 points) ──
  if (acwr && acwr.ratio) {
    dataPoints++;
    const r = acwr.ratio;
    let loadScore;
    if (r >= 0.8 && r <= 1.3) loadScore = 20;       // Optimal zone
    else if (r >= 0.6 && r < 0.8) loadScore = 16;   // Slightly under
    else if (r > 1.3 && r <= 1.5) loadScore = 10;   // Slightly over
    else if (r > 1.5) loadScore = 4;                 // Danger zone
    else loadScore = 12;                              // Very under

    score += loadScore;
    factors.push({
      label: 'Training Load',
      value: `${r}×`,
      points: loadScore,
      max: 20,
      status: r >= 0.8 && r <= 1.3 ? 'good' : r <= 1.5 ? 'ok' : 'poor',
    });
  }

  // ── SORENESS (10 points) ──
  if (today.soreness_level) {
    dataPoints++;
    const soreness = parseInt(today.soreness_level);
    let sorenessScore;
    if (soreness <= 2) sorenessScore = 10;
    else if (soreness <= 4) sorenessScore = 8;
    else if (soreness <= 6) sorenessScore = 5;
    else if (soreness <= 8) sorenessScore = 2;
    else sorenessScore = 0;
    score += sorenessScore;
    factors.push({
      label: 'Soreness',
      value: `${soreness}/10`,
      points: sorenessScore,
      max: 10,
      status: soreness <= 3 ? 'good' : soreness <= 6 ? 'ok' : 'poor',
    });
  }

  if (dataPoints === 0) return null;

  // Normalize to available data points
  const maxPossible = factors.reduce((a, f) => a + f.max, 0);
  const normalized = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;

  let label, color, advice;
  if (normalized >= 80) {
    label = 'Ready';
    color = '#16a34a';
    advice = 'Your recovery indicators are strong. Good day to train hard or test a new max.';
  } else if (normalized >= 60) {
    label = 'Good';
    color = '#2563a8';
    advice = 'Recovery is solid. Train normally — you may not be at peak but you will adapt well.';
  } else if (normalized >= 40) {
    label = 'Moderate';
    color = '#d97706';
    advice = 'Some recovery signals are suboptimal. Consider a moderate session — still train, but avoid maximal effort today.';
  } else {
    label = 'Low';
    color = '#b91c1c';
    advice = 'Multiple recovery indicators are low. Consider a light or active recovery session. Pushing hard today risks injury and impairs adaptation.';
  }

  return { score: normalized, label, color, advice, factors, dataPoints };
}

// ── BODY COMPOSITION TRAJECTORY ──────────────────────────────────────────────
// Research: Helms, Aragon, Fitschen (2014) — natural bodybuilding contest prep research.
// Rate of weight change + strength trend → estimate if loss is fat-dominant or muscle-dominant.
// Losing >1% BW/week while strength is declining = likely muscle loss.
// Losing 0.5–1% BW/week while strength is stable/increasing = optimal fat loss.

export function analyzeBodyComposition(measurements, allLogs) {
  if (!measurements || measurements.length < 2) return null;

  const sorted = [...measurements].filter(m => m.weight_lbs).sort((a, b) => a.measured_at.localeCompare(b.measured_at));
  if (sorted.length < 2) return null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysDiff = (new Date(last.measured_at) - new Date(first.measured_at)) / (1000 * 60 * 60 * 24);
  if (daysDiff < 7) return null;

  const totalChange = last.weight_lbs - first.weight_lbs;
  const weeklyRate = (totalChange / daysDiff) * 7;
  const weeklyRatePct = first.weight_lbs > 0 ? (weeklyRate / first.weight_lbs) * 100 : 0;

  // Strength trend — compare first 4 weeks vs last 4 weeks of logs
  const cutoffFirst = new Date(first.measured_at);
  cutoffFirst.setDate(cutoffFirst.getDate() + 28);
  const cutoffLast = new Date(last.measured_at);
  cutoffLast.setDate(cutoffLast.getDate() - 28);

  const earlyLogs = allLogs.filter(l => new Date(l.session_date) <= cutoffFirst && l.weight_lbs);
  const recentLogs = allLogs.filter(l => new Date(l.session_date) >= cutoffLast && l.weight_lbs);

  const avgEarlyWeight = earlyLogs.length > 0 ? earlyLogs.reduce((a, l) => a + parseFloat(l.weight_lbs), 0) / earlyLogs.length : null;
  const avgRecentWeight = recentLogs.length > 0 ? recentLogs.reduce((a, l) => a + parseFloat(l.weight_lbs), 0) / recentLogs.length : null;
  const strengthTrend = avgEarlyWeight && avgRecentWeight ? avgRecentWeight - avgEarlyWeight : null;

  let assessment, color, detail;
  const absRate = Math.abs(weeklyRatePct);

  if (totalChange > 0) {
    // Gaining weight
    if (absRate <= 0.5) {
      assessment = 'Lean Gain';
      color = '#16a34a';
      detail = 'Weight is increasing slowly — ideal rate for muscle gain while minimizing fat. Research supports 0.25–0.5% BW/week as optimal for drug-free athletes.';
    } else if (absRate <= 1.0) {
      assessment = 'Moderate Gain';
      color = '#2563a8';
      detail = 'Gaining at a moderate rate. Some fat accumulation is expected at this pace, but it is manageable. Monitor body composition measurements closely.';
    } else {
      assessment = 'Aggressive Gain';
      color = '#d97706';
      detail = 'Gaining faster than 1% BW/week. Excess fat gain is likely at this rate. Consider slowing the calorie surplus unless this is an intentional bulk phase.';
    }
  } else if (totalChange < 0) {
    // Losing weight
    if (absRate > 1.0 && strengthTrend !== null && strengthTrend < -5) {
      assessment = 'Muscle Loss Risk';
      color = '#b91c1c';
      detail = 'You are losing weight faster than 1% BW/week AND training weights are declining. This pattern is associated with muscle loss. Slow the caloric deficit and prioritize protein intake.';
    } else if (absRate > 1.0) {
      assessment = 'Aggressive Cut';
      color = '#d97706';
      detail = 'Losing faster than 1% BW/week. This is aggressive — research suggests above this rate, muscle loss becomes increasingly likely even with adequate protein.';
    } else if (absRate >= 0.5) {
      assessment = 'Optimal Fat Loss';
      color = '#16a34a';
      detail = 'Losing at 0.5–1% BW/week. This is the research-backed optimal range for fat loss while preserving muscle mass.';
    } else {
      assessment = 'Gradual Loss';
      color = '#2563a8';
      detail = 'Losing weight slowly — well within the safe range for muscle preservation. Progress will be slow but sustainable.';
    }
  } else {
    assessment = 'Maintaining';
    color = '#888';
    detail = 'Weight is stable. If your goal is fat loss or muscle gain, this is a maintenance phase.';
  }

  return {
    totalChange: parseFloat(totalChange.toFixed(1)),
    weeklyRate: parseFloat(weeklyRate.toFixed(2)),
    weeklyRatePct: parseFloat(weeklyRatePct.toFixed(2)),
    assessment,
    color,
    detail,
    strengthTrend: strengthTrend ? parseFloat(strengthTrend.toFixed(1)) : null,
    weeks: Math.round(daysDiff / 7),
  };
}
