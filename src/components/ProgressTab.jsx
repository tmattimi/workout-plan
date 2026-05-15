import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  MUSCLE_GROUPS, BENCHMARK_LIFTS, BALANCE_BENCHMARKS,
  epley1RM, calculateMuscleScores, evaluateBalance, getExerciseWeights
} from '../lib/muscleWeights';

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
const SERIF = { ...F };

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShort(d) {
  if (!d) return '';
  const date = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Mini sparkline chart ──────────────────────────────────────────────────────
function Sparkline({ data, color = '#2563a8', height = 40 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color}/>;
      })}
    </svg>
  );
}

// ── Horizontal bar for muscle score ──────────────────────────────────────────
function ScoreBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }}/>
    </div>
  );
}

// ── Balance indicator ─────────────────────────────────────────────────────────
function BalanceIndicator({ ratio, min, max, color }) {
  if (ratio === null) return <div style={{ fontSize: 11, color: '#aaa' }}>Not enough data</div>;
  const clampedMin = 0;
  const clampedMax = max * 1.4;
  const pct = Math.min(100, Math.max(0, ((ratio - clampedMin) / (clampedMax - clampedMin)) * 100));
  const minPct = ((min - clampedMin) / (clampedMax - clampedMin)) * 100;
  const maxPct = ((max - clampedMin) / (clampedMax - clampedMin)) * 100;
  const status = ratio < min ? 'low' : ratio > max ? 'high' : 'ok';
  const statusColor = status === 'ok' ? '#16a34a' : '#d97706';
  return (
    <div>
      <div style={{ position: 'relative', height: 10, background: '#f0f0f0', borderRadius: 5, marginBottom: 4 }}>
        <div style={{ position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`, height: '100%', background: '#16a34a22', borderRadius: 5 }}/>
        <div style={{ position: 'absolute', left: `${minPct}%`, width: 2, height: '100%', background: '#16a34a66' }}/>
        <div style={{ position: 'absolute', left: `${maxPct}%`, width: 2, height: '100%', background: '#16a34a66' }}/>
        <div style={{ position: 'absolute', left: `${pct}%`, width: 12, height: 12, background: statusColor, borderRadius: '50%', top: -1, transform: 'translateX(-50%)', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
        <span>0</span><span style={{ color: '#16a34a' }}>Healthy range</span><span>{(max * 1.4).toFixed(1)}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRENGTH TEST FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function StrengthTestFlow({ clientId, bodyweight, onComplete, onCancel }) {
  const [step, setStep] = useState('select'); // select | warmup | test | result | saving
  const [selectedLift, setSelectedLift] = useState(null);
  const [testWeight, setTestWeight] = useState('');
  const [testReps, setTestReps] = useState('');
  const [e1rm, setE1rm] = useState(null);
  const [warmupStep, setWarmupStep] = useState(0);
  const [error, setError] = useState('');

  const lift = selectedLift ? BENCHMARK_LIFTS.find(l => l.id === selectedLift) : null;

  function startLift(id) {
    setSelectedLift(id);
    setTestWeight('');
    setTestReps('');
    setE1rm(null);
    setWarmupStep(0);
    setStep('warmup');
  }

  function calculateResult() {
    const w = parseFloat(testWeight);
    const r = parseInt(testReps);
    if (!w || !r || r < 1) { setError('Enter valid weight and reps.'); return; }
    if (r > 15) { setError('For accurate e1RM, use a weight you can lift for 15 reps or fewer.'); return; }
    const estimated = epley1RM(w, r);
    setE1rm(estimated);
    setError('');
    setStep('result');
  }

  async function saveResult() {
    if (!e1rm || !lift) return;
    setStep('saving');
    try {
      // Save to personal_records with record_type = 'strength_test'
      await supabase.from('personal_records').upsert({
        client_id: clientId,
        exercise_id: null,
        exercise_name: lift.name,
        exercise_key: lift.exerciseKey,
        weight_lbs: parseFloat(testWeight),
        reps: parseInt(testReps),
        estimated_1rm: e1rm,
        record_type: 'strength_test',
        achieved_at: new Date().toISOString().slice(0, 10),
        primary_muscle: lift.primaryGroup,
      }, { onConflict: 'client_id,exercise_key,record_type,achieved_at' });
      onComplete && onComplete();
    } catch (err) {
      setError('Failed to save. Please try again.');
      setStep('result');
    }
  }

  // STEP: Select lift
  if (step === 'select') return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back</button>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Strength Assessment</div>
      <div style={{ fontSize: 20, fontWeight: 'normal', marginBottom: 4, ...F }}>1RM Strength Test</div>
      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 20 }}>
        Select a lift to test. You will not lift to failure — instead, perform a challenging set of 3 to 8 reps and the app will calculate your estimated one-rep max using the Epley formula. Retest every 12 weeks to track strength progress over time.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BENCHMARK_LIFTS.map(lift => (
          <button key={lift.id} onClick={() => startLift(lift.id)} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, ...F }}>
            <span style={{ fontSize: 24 }}>{lift.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{lift.name}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Primary: {MUSCLE_GROUPS[lift.primaryGroup]?.label}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 16, color: '#ddd' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  // STEP: Warm-up instructions
  if (step === 'warmup' && lift) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Choose different lift</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{lift.icon}</span>
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>Strength Test</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>

      {/* Safety note */}
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 13px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.65 }}>{lift.safetyNotes}</div>
      </div>

      {/* Protocol */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Testing Protocol</div>
        {lift.instructions.map((inst, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: warmupStep > i ? '#16a34a' : warmupStep === i ? '#111' : '#f0f0f0', color: warmupStep > i ? '#fff' : warmupStep === i ? '#fff' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
              {warmupStep > i ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 12, color: warmupStep >= i ? '#333' : '#aaa', lineHeight: 1.7, paddingTop: 2 }}>{inst}</div>
          </div>
        ))}
      </div>

      {/* Technique cues */}
      <div style={{ background: '#f9f9f7', borderRadius: 8, padding: '11px 13px', marginBottom: 20 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 8 }}>Technique cues</div>
        {lift.cues.map((cue, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            <span style={{ color: '#bbb' }}>·</span>
            <span>{cue}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setStep('test')} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', ...F }}>
        Ready to test →
      </button>
    </div>
  );

  // STEP: Enter test results
  if (step === 'test' && lift) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={() => setStep('warmup')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back to protocol</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>{lift.icon}</span>
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>Log Your Set</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', display: 'block', marginBottom: 8 }}>Weight used (lbs)</label>
          <input
            type="number"
            value={testWeight}
            onChange={e => setTestWeight(e.target.value)}
            placeholder="e.g. 185"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 18, fontWeight: 600, textAlign: 'center', ...F }}
          />
        </div>
        <div>
          <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', display: 'block', marginBottom: 8 }}>Reps completed</label>
          <input
            type="number"
            value={testReps}
            onChange={e => setTestReps(e.target.value)}
            placeholder="e.g. 5"
            min="1"
            max="15"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 18, fontWeight: 600, textAlign: 'center', ...F }}
          />
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 7 }}>{error}</div>}

      <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.65, marginBottom: 16, textAlign: 'center' }}>
        Use a weight you lifted for 3 to 8 reps with good form. The Epley formula works best in this range and gives you a safe, accurate estimated max.
      </p>

      <button onClick={calculateResult} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', ...F }}>
        Calculate my 1RM →
      </button>
    </div>
  );

  // STEP: Result
  if (step === 'result' && lift && e1rm) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>{lift.icon}</span>
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>Result</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>

      <div style={{ background: '#111', borderRadius: 12, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.15em', color: '#888', marginBottom: 8 }}>Estimated 1-Rep Max</div>
        <div style={{ fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>{e1rm}</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>lbs</div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: '#1a1a1a', borderRadius: 8, display: 'inline-block' }}>
          <span style={{ fontSize: 12, color: '#aaa' }}>{testWeight} lbs × {testReps} reps</span>
          <span style={{ fontSize: 11, color: '#555', marginLeft: 8 }}>Epley formula</span>
        </div>
      </div>

      {/* Training zone breakdown */}
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 20 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 12 }}>Training zones based on this 1RM</div>
        {[['Strength (1–3 reps)', 0.90, 0.97], ['Hypertrophy (6–12 reps)', 0.67, 0.85], ['Endurance (15+ reps)', 0.50, 0.65]].map(([label, minPct, maxPct]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round(e1rm * minPct)}–{Math.round(e1rm * maxPct)} lbs</span>
          </div>
        ))}
      </div>

      {error && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 7 }}>{error}</div>}

      <button onClick={saveResult} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', marginBottom: 10, ...F }}>
        Save this result
      </button>
      <button onClick={() => setStep('test')} style={{ width: '100%', background: 'transparent', color: '#888', border: '1px solid #e8e8e8', borderRadius: 10, padding: '12px', fontSize: 13, cursor: 'pointer', ...F }}>
        Re-enter weight and reps
      </button>
    </div>
  );

  if (step === 'saving') return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#888' }}>Saving your result…</div>
    </div>
  );

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUSCLE GROUP DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function MuscleGroupDetail({ group, muscleScore, allLogs, prs, onBack }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const mg = MUSCLE_GROUPS[group];

  // Get all exercises contributing to this group
  const exercises = muscleScore?.exercises || [];

  // Build per-exercise history from logs
  const exerciseHistory = {};
  allLogs.forEach(log => {
    const name = (log.exercise_name || log.exercises?.name || '').toLowerCase();
    const weights = getExerciseWeights(name);
    if (!weights || !weights[group]) return;
    if (!log.weight_lbs || !log.reps) return;
    const date = log.session_date;
    const e1rm = epley1RM(parseFloat(log.weight_lbs), parseInt(log.reps));
    if (!exerciseHistory[name]) exerciseHistory[name] = [];
    exerciseHistory[name].push({ date, weight: parseFloat(log.weight_lbs), reps: parseInt(log.reps), e1rm });
  });

  // Sort history by date and dedupe by date (best per day)
  Object.keys(exerciseHistory).forEach(name => {
    const byDate = {};
    exerciseHistory[name].forEach(entry => {
      if (!byDate[entry.date] || entry.e1rm > byDate[entry.date].e1rm) {
        byDate[entry.date] = entry;
      }
    });
    exerciseHistory[name] = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  });

  const exNames = Object.keys(exerciseHistory).filter(n => exerciseHistory[n].length > 0);

  const sel = selectedExercise || exNames[0];
  const history = sel ? exerciseHistory[sel] || [] : [];
  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest && first ? latest.e1rm - first.e1rm : 0;

  return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back to overview</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: mg.color }}/>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999' }}>Muscle Group</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 'normal', color: mg.color, marginBottom: 16, ...F }}>{mg.label}</div>

      {/* Score summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '11px 12px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa', marginBottom: 4 }}>Weighted Strength Score</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: mg.color }}>{Math.round(muscleScore?.score || 0)}</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>lbs (e1RM weighted)</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '11px 12px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa', marginBottom: 4 }}>Exercises tracked</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{exNames.length}</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>contributing to score</div>
        </div>
      </div>

      {/* Exercise selector */}
      {exNames.length > 0 && (
        <>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 8 }}>Exercise breakdown</div>
          <select
            value={sel}
            onChange={e => setSelectedExercise(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, background: '#fff', marginBottom: 14, ...F }}
          >
            {exNames.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
          </select>

          {/* Stats for selected exercise */}
          {latest && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['Best e1RM', `${latest.e1rm} lbs`],
                ['Sessions', history.length],
                ['e1RM change', `${change >= 0 ? '+' : ''}${change} lbs`],
              ].map(([label, val]) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 7, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: '#bbb', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: label === 'e1RM change' && change > 0 ? '#16a34a' : '#1a1a1a' }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* e1RM sparkline */}
          {history.length >= 2 && (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa', marginBottom: 8 }}>Estimated 1RM over time</div>
              <Sparkline data={history.map(d => ({ value: d.e1rm }))} color={mg.color} height={50}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(first.date)}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(latest.date)}</span>
              </div>
            </div>
          )}

          {/* Session log */}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '9px 13px', borderBottom: '1px solid #f0f0f0', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa' }}>Session History</div>
            {[...history].reverse().slice(0, 10).map((d, i) => (
              <div key={i} style={{ padding: '10px 13px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#555' }}>{formatDate(d.date)}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>{d.weight} lbs × {d.reps} reps</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.e1rm} lbs</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>e1RM</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {exNames.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#aaa', fontSize: 12, lineHeight: 1.6 }}>
          No logged exercises for this muscle group yet. Complete some sessions to see your strength breakdown here.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROGRESS TAB
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProgressTab({ clientId, bodyweight = 170, localLogs = {} }) {
  const [view, setView] = useState('dashboard'); // dashboard | test | group | exercise
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [prs, setPRs] = useState([]);
  const [strengthTests, setStrengthTests] = useState([]);
  const [muscleScores, setMuscleScores] = useState({});
  const [balanceResults, setBalanceResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!supabase || !clientId) return;
    setLoading(true);
    try {
      // Load all workout logs
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*, exercises(name, primary_muscle)')
        .eq('client_id', clientId)
        .eq('completed', true)
        .not('weight_lbs', 'is', null)
        .order('session_date', { ascending: false })
        .limit(500);

      // Load PRs (both workout PRs and strength tests)
      const { data: prData } = await supabase
        .from('personal_records')
        .select('*')
        .eq('client_id', clientId)
        .order('achieved_at', { ascending: false });

      const allPRs = prData || [];
      const workoutPRs = allPRs.filter(p => p.record_type !== 'strength_test');
      const tests = allPRs.filter(p => p.record_type === 'strength_test');

      // Merge local logs with Supabase logs for muscle scoring
      const localLogArray = [];
      Object.entries(localLogs).forEach(([key, val]) => {
        const parts = key.split('__');
        if (parts.length < 2) return;
        const exName = parts.slice(1).join('__');
        const dateMatch = parts[0].match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : null;
        if (!date || !val.sets) return;
        val.sets.filter(s => s.done && s.weight && s.reps).forEach(s => {
          localLogArray.push({
            exercise_name: exName,
            weight_lbs: parseFloat(s.weight),
            reps: parseInt(s.reps),
            session_date: date,
          });
        });
      });

      const combinedLogs = [...(logs || []).map(l => ({ ...l, exercise_name: l.exercises?.name })), ...localLogArray];
      setAllLogs(combinedLogs);

      // Calculate muscle scores
      const scores = calculateMuscleScores(combinedLogs, bodyweight);
      setMuscleScores(scores);
      setBalanceResults(evaluateBalance(scores));

      // Derive PRs from logs (source of truth — fixes the stale PR bug)
      // Group by exercise, find best e1RM
      const derivedPRs = {};
      combinedLogs.forEach(log => {
        const name = (log.exercise_name || '').toLowerCase();
        if (!name || !log.weight_lbs || !log.reps) return;
        const e1rm = epley1RM(parseFloat(log.weight_lbs), parseInt(log.reps));
        if (!derivedPRs[name] || e1rm > derivedPRs[name].e1rm) {
          derivedPRs[name] = {
            name,
            weight: parseFloat(log.weight_lbs),
            reps: parseInt(log.reps),
            e1rm,
            date: log.session_date,
          };
        }
      });

      setPRs(Object.values(derivedPRs).sort((a, b) => b.e1rm - a.e1rm));
      setStrengthTests(tests);
    } catch (err) {
      console.error('Progress load error:', err);
    }
    setLoading(false);
  }, [clientId, bodyweight, localLogs]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── STRENGTH TEST FLOW ──────────────────────────────────────────────────────
  if (view === 'test') return (
    <StrengthTestFlow
      clientId={clientId}
      bodyweight={bodyweight}
      onComplete={() => { loadData(); setView('dashboard'); }}
      onCancel={() => setView('dashboard')}
    />
  );

  // ── MUSCLE GROUP DETAIL ────────────────────────────────────────────────────
  if (view === 'group' && selectedGroup) return (
    <MuscleGroupDetail
      group={selectedGroup}
      muscleScore={muscleScores[selectedGroup]}
      allLogs={allLogs}
      prs={prs}
      onBack={() => { setSelectedGroup(null); setView('dashboard'); }}
    />
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#888' }}>Loading your progress data…</div>
    </div>
  );

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const topPRs = prs.slice(0, 5);
  const hasData = allLogs.length > 0;
  const maxScore = Math.max(...Object.values(muscleScores).map(s => s.score || 0), 1);

  // Latest strength test per lift
  const latestTests = {};
  strengthTests.forEach(t => {
    if (!latestTests[t.exercise_key] || t.achieved_at > latestTests[t.exercise_key].achieved_at) {
      latestTests[t.exercise_key] = t;
    }
  });

  return (
    <div style={{ padding: '14px 16px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 3 }}>Training Intelligence</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>Progress</div>
        </div>
        <button
          onClick={() => setView('test')}
          style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 11, cursor: 'pointer', ...F, whiteSpace: 'nowrap' }}
        >
          Strength Test
        </button>
      </div>

      {!hasData && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: 13, lineHeight: 1.7 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: 12 }}>No data yet</div>
          Log your first session to see your strength breakdown and muscle analysis here.
        </div>
      )}

      {hasData && (
        <>
          {/* ── Benchmark 1RM Tests ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999' }}>Benchmark Strength</div>
              <button onClick={() => setView('test')} style={{ background: 'none', border: 'none', fontSize: 11, color: '#2563a8', cursor: 'pointer', ...F }}>Test now</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {BENCHMARK_LIFTS.map(lift => {
                const test = latestTests[lift.exerciseKey];
                return (
                  <div key={lift.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 9, padding: '11px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{lift.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#1a1a1a' }}>{lift.name}</span>
                    </div>
                    {test ? (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 700, color: MUSCLE_GROUPS[lift.primaryGroup]?.color }}>{test.estimated_1rm || epley1RM(test.weight_lbs, test.reps)}</div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>lbs · {formatShort(test.achieved_at)}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: '#ccc', paddingTop: 4 }}>Not tested yet</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Muscle strength scores ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Strength by Muscle Group</div>
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              {Object.entries(MUSCLE_GROUPS).map(([group, mg], i) => {
                const score = muscleScores[group];
                if (!score || score.score === 0) return null;
                return (
                  <button
                    key={group}
                    onClick={() => { setSelectedGroup(group); setView('group'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: mg.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{mg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: mg.color }}>{Math.round(score.score)} lbs</span>
                      </div>
                      <ScoreBar value={score.score} max={maxScore} color={mg.color}/>
                    </div>
                    <span style={{ fontSize: 14, color: '#ddd', flexShrink: 0 }}>›</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 6, lineHeight: 1.6 }}>
              Scores are weighted averages of estimated 1RM across all contributing exercises, based on each exercise's muscle activation profile. Higher = stronger. Tap any group to drill down.
            </div>
          </div>

          {/* ── Balance analysis ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Strength Balance Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {balanceResults.map(result => (
                <div key={result.id} style={{ background: '#fff', border: `1px solid ${result.status === 'ok' ? '#e8e8e8' : '#fcd34d'}`, borderRadius: 10, padding: '13px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{result.label}</span>
                    {result.ratio !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: result.status === 'ok' ? '#16a34a' : '#d97706' }}>
                        {result.ratio.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <BalanceIndicator ratio={result.ratio} min={result.healthyMin} max={result.healthyMax}/>
                  <div style={{ marginTop: 8, fontSize: 11, color: result.status === 'ok' ? '#16a34a' : '#92400e', lineHeight: 1.6 }}>
                    {result.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top PRs from logged workouts ── */}
          {topPRs.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Top Workout PRs</div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                {topPRs.map((pr, i) => (
                  <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{pr.name}</div>
                      <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>{pr.weight} lbs × {pr.reps} reps · {formatShort(pr.date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{pr.e1rm}</div>
                      <div style={{ fontSize: 9, color: '#aaa' }}>e1RM</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
