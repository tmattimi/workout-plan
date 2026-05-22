// Recovery assessment engine
// Reads dailyHealth data and returns a recovery score + recommendation

export function getRecoveryAssessment(dailyHealth, todayKey) {
  const today = dailyHealth[todayKey] || {};
  
  // Get last 7 days of data for trend analysis
  const last7 = getLast7Days(dailyHealth, todayKey);
  
  // Individual factor scores (0-100)
  const sleepScore = scoreSleep(today.sleep_hours);
  const hrScore = scoreHeartRate(today.resting_hr, last7);
  const hrvScore = scoreHRV(today.hrv, last7);
  const energyScore = scoreEnergy(today.energy_level);
  
  // Weighted composite score
  // Sleep is the biggest factor per the research
  const weights = { sleep: 0.40, hr: 0.25, hrv: 0.20, energy: 0.15 };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  if (sleepScore !== null) { weightedSum += sleepScore * weights.sleep; totalWeight += weights.sleep; }
  if (hrScore !== null)    { weightedSum += hrScore * weights.hr;      totalWeight += weights.hr; }
  if (hrvScore !== null)   { weightedSum += hrvScore * weights.hrv;    totalWeight += weights.hrv; }
  if (energyScore !== null){ weightedSum += energyScore * weights.energy; totalWeight += weights.energy; }
  
  // Not enough data to assess
  if (totalWeight < 0.15) return null;
  
  const score = Math.round(weightedSum / totalWeight);
  
  // Determine status and recommendation
  const status = getStatus(score, today, last7);
  
  return {
    score,
    status,      // "go" | "modified" | "rest"
    label: status.label,
    color: status.color,
    summary: status.summary,
    factors: buildFactors(today, last7, sleepScore, hrScore, hrvScore, energyScore),
    recommendation: status.recommendation,
    intensityMultiplier: status.intensityMultiplier,
  };
}

function getLast7Days(dailyHealth, todayKey) {
  const days = [];
  const today = new Date(todayKey + "T12:00:00");
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (dailyHealth[key]) days.push(dailyHealth[key]);
  }
  return days;
}

function scoreSleep(hours) {
  if (!hours) return null;
  const h = parseFloat(hours);
  if (h < 4)   return 0;
  if (h < 5)   return 15;
  if (h < 6)   return 35;
  if (h < 6.5) return 55;
  if (h < 7)   return 70;
  if (h < 7.5) return 82;
  if (h < 8)   return 90;
  if (h <= 9)  return 100;
  return 90; // oversleeping slightly penalized
}

function scoreHeartRate(rhr, last7) {
  if (!rhr) return null;
  const hr = parseFloat(rhr);
  
  // Compare to 7-day average if available
  const pastHRs = last7.map(d => parseFloat(d.resting_hr)).filter(v => !isNaN(v) && v > 0);
  if (pastHRs.length >= 3) {
    const avg = pastHRs.reduce((a, b) => a + b, 0) / pastHRs.length;
    const pctAbove = (hr - avg) / avg;
    if (pctAbove >= 0.10) return 10;  // 10%+ elevated — flag
    if (pctAbove >= 0.07) return 35;
    if (pctAbove >= 0.04) return 60;
    if (pctAbove >= 0)    return 80;
    return 100; // at or below average
  }
  
  // No baseline — use absolute ranges
  if (hr < 50)  return 100;
  if (hr < 60)  return 95;
  if (hr < 70)  return 85;
  if (hr < 80)  return 70;
  if (hr < 90)  return 50;
  return 30;
}

function scoreHRV(hrv, last7) {
  if (!hrv) return null;
  const h = parseFloat(hrv);
  
  const pastHRVs = last7.map(d => parseFloat(d.hrv)).filter(v => !isNaN(v) && v > 0);
  if (pastHRVs.length >= 3) {
    const avg = pastHRVs.reduce((a, b) => a + b, 0) / pastHRVs.length;
    const ratio = h / avg;
    if (ratio >= 1.10) return 100; // above baseline
    if (ratio >= 0.95) return 85;
    if (ratio >= 0.85) return 65;
    if (ratio >= 0.75) return 40;
    return 20;
  }
  
  // No baseline — use relative to typical ranges
  if (h >= 70) return 100;
  if (h >= 50) return 85;
  if (h >= 35) return 70;
  if (h >= 20) return 50;
  return 30;
}

function scoreEnergy(level) {
  if (!level) return null;
  const map = { 1: 5, 2: 25, 3: 50, 4: 75, 5: 95 };
  return map[parseInt(level)] ?? null;
}

function getStatus(score, today, last7) {
  // Hard overrides — regardless of composite score
  const sleep = parseFloat(today.sleep_hours);
  if (!isNaN(sleep) && sleep < 4) {
    return {
      label: "Rest Day",
      color: "#ef4444",
      summary: `${sleep}h sleep — your body needs rest, not a workout today.`,
      recommendation: "Skip training. A short walk or gentle stretch is the ceiling today. Sleep is the recovery. Let it work.",
      intensityMultiplier: 0,
    };
  }
  
  // Check for elevated HR trend over 3+ days
  const pastHRs = last7.slice(0, 3).map(d => parseFloat(d.resting_hr)).filter(v => !isNaN(v) && v > 0);
  const allPastHRs = last7.map(d => parseFloat(d.resting_hr)).filter(v => !isNaN(v) && v > 0);
  const todayHR = parseFloat(today.resting_hr);
  if (pastHRs.length >= 2 && allPastHRs.length >= 4 && !isNaN(todayHR)) {
    const baseline = allPastHRs.reduce((a, b) => a + b, 0) / allPastHRs.length;
    const recentAvg = pastHRs.reduce((a, b) => a + b, 0) / pastHRs.length;
    if ((todayHR - baseline) / baseline >= 0.10 && (recentAvg - baseline) / baseline >= 0.07) {
      return {
        label: "Active Recovery",
        color: "#f59e0b",
        summary: "Resting HR has been elevated for several days — a sign of accumulated fatigue or early illness.",
        recommendation: "Active recovery only. Easy walk, light stretching, or yoga. No intensity today. If this continues another 3 days, it's worth checking in with a doctor.",
        intensityMultiplier: 0.3,
      };
    }
  }
  
  // Score-based status
  if (score >= 80) return {
    label: "Ready",
    color: "#22c55e",
    summary: "Recovery looks solid. Push today.",
    recommendation: "Full session. Go for progression — add weight or reps if you've been hitting your targets.",
    intensityMultiplier: 1.0,
  };
  
  if (score >= 60) return {
    label: "Good",
    color: "#4ade80",
    summary: "Good shape to train. Nothing to hold back.",
    recommendation: "Normal session at planned intensity. Pay attention to how you feel warming up.",
    intensityMultiplier: 0.9,
  };
  
  if (score >= 40) return {
    label: "Modified",
    color: "#f59e0b",
    summary: "Some recovery gaps. Train but pull back a bit.",
    recommendation: "Reduce working weight by 10-15% and cut one set from each main exercise. Quality over quantity today.",
    intensityMultiplier: 0.7,
  };
  
  if (score >= 20) return {
    label: "Light Only",
    color: "#f97316",
    summary: "Recovery is low. Heavy training will dig a deeper hole.",
    recommendation: "Light movement only — keep it to 60% effort max. Isolation work, mobility, or a short easy cardio session. Skip the heavy compounds.",
    intensityMultiplier: 0.4,
  };
  
  return {
    label: "Rest Day",
    color: "#ef4444",
    summary: "Multiple recovery signals are down. Your body is asking for rest.",
    recommendation: "Active recovery at most. Walk, stretch, breathe. The workout will be better tomorrow if you rest today.",
    intensityMultiplier: 0,
  };
}

function buildFactors(today, last7, sleepScore, hrScore, hrvScore, energyScore) {
  const factors = [];
  
  if (today.sleep_hours !== undefined && today.sleep_hours !== "") {
    const h = parseFloat(today.sleep_hours);
    factors.push({
      label: "Sleep",
      value: `${h}h`,
      score: sleepScore,
      note: h >= 7.5 ? "Well rested" : h >= 6.5 ? "Adequate" : h >= 5.5 ? "Short — affects performance" : "Poor — significantly impacts recovery",
    });
  }
  
  if (today.resting_hr !== undefined && today.resting_hr !== "") {
    const hr = parseFloat(today.resting_hr);
    const pastHRs = last7.map(d => parseFloat(d.resting_hr)).filter(v => !isNaN(v) && v > 0);
    const avg = pastHRs.length ? Math.round(pastHRs.reduce((a, b) => a + b, 0) / pastHRs.length) : null;
    const diff = avg ? hr - avg : null;
    factors.push({
      label: "Resting HR",
      value: `${Math.round(hr)} bpm`,
      score: hrScore,
      note: diff === null ? "No baseline yet" :
            diff > 5  ? `+${diff} bpm above your avg — elevated` :
            diff < -3 ? `${diff} bpm below avg — well recovered` :
            `Within normal range (avg ${avg})`,
    });
  }
  
  if (today.hrv !== undefined && today.hrv !== "") {
    const h = parseFloat(today.hrv);
    const pastHRVs = last7.map(d => parseFloat(d.hrv)).filter(v => !isNaN(v) && v > 0);
    const avg = pastHRVs.length ? Math.round(pastHRVs.reduce((a, b) => a + b, 0) / pastHRVs.length) : null;
    factors.push({
      label: "HRV",
      value: `${Math.round(h)} ms`,
      score: hrvScore,
      note: avg === null ? "Building baseline" :
            h >= avg * 1.05 ? "Above baseline — nervous system recovered" :
            h >= avg * 0.90 ? "Near baseline" :
            "Below baseline — nervous system under stress",
    });
  }
  
  if (today.energy_level) {
    const labels = { 1: "Very low", 2: "Low", 3: "Moderate", 4: "Good", 5: "High" };
    factors.push({
      label: "Energy",
      value: `${today.energy_level}/5`,
      score: energyScore,
      note: labels[parseInt(today.energy_level)] || "",
    });
  }
  
  return factors;
}

export function getRecoveryColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#4ade80";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}
