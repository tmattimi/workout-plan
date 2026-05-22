import { useState, useEffect, useCallback } from 'react';
import GoalTracker from './GoalTracker';
import WorkoutHistory from './WorkoutHistory';
import { supabase } from '../lib/supabase';
import {
  MUSCLE_GROUPS, BENCHMARK_LIFTS, RELATIVE_STRENGTH_STANDARDS,
  epley1RM, calculateMuscleScores, evaluateStrengthRatios, evaluateRelativeStrength, getExerciseWeights
} from '../lib/muscleWeights';
import {
  getClientMeasurements, getHealthLogs, getClientLogs, getClientPRs, getActivities, getGoals
} from '../lib/supabase';
import {
  calculateACWR, calculateProgressionStatus, calculateRecoveryScore, analyzeBodyComposition, analyzeCardioStrengthBalance
} from '../lib/trainingAnalytics';

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
function formatMonth(d) {
  if (!d) return '';
  const date = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#2563a8', height = 50, showDots = true, fillArea = false }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 100; const H = height;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `${pts[0].split(',')[0]},${H} ${polyline} ${pts[pts.length-1].split(',')[0]},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {fillArea && <polygon points={area} fill={color} opacity="0.08" />}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {showDots && vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 8) - 4;
        return <circle key={i} cx={x} cy={y} r={i === vals.length - 1 ? "3.5" : "2"} fill={color} />;
      })}
    </svg>
  );
}

// ── Sparkline with goal line overlay ────────────────────────────────────────
function SparklineWithGoal({ data, color = '#2563a8', height = 50, fillArea = false, goalValue, goalColor = '#b91c1c', goalLabel }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const allVals = goalValue ? [...vals, goalValue] : vals;
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const W = 100; const H = height;

  function toY(v) { return H - ((v - min) / range) * (H - 8) - 4; }
  function toX(i) { return (i / (vals.length - 1)) * W; }

  const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`);
  const polyline = pts.join(' ');
  const area = `${toX(0)},${H} ${polyline} ${toX(vals.length-1)},${H}`;
  const goalY = goalValue !== undefined && goalValue !== null ? toY(goalValue) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {fillArea && <polygon points={area} fill={color} opacity="0.08" />}
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Goal line */}
      {goalY !== null && (
        <>
          <line x1="0" y1={goalY} x2={W} y2={goalY} stroke={goalColor} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8" />
          <rect x={W - 18} y={goalY - 8} width={18} height={10} fill={goalColor} opacity="0.9" rx="2" />
          <text x={W - 9} y={goalY - 1} textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">GOAL</text>
        </>
      )}
      {/* Latest dot */}
      {vals.length > 0 && (
        <circle cx={toX(vals.length-1)} cy={toY(vals[vals.length-1])} r="3.5" fill={color} />
      )}
    </svg>
  );
}
function HBar({ value, max, color, label, sublabel }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#444' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{sublabel}</span>
      </div>
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Balance indicator ─────────────────────────────────────────────────────────
function BalanceIndicator({ ratio, min, max }) {
  if (ratio === null) return null;
  const clampedMax = max * 1.5;
  const pct = Math.min(100, Math.max(0, (ratio / clampedMax) * 100));
  const minPct = (min / clampedMax) * 100;
  const maxPct = (max / clampedMax) * 100;
  const status = ratio < min ? 'low' : ratio > max ? 'high' : 'ok';
  const dotColor = status === 'ok' ? '#16a34a' : '#d97706';
  return (
    <div style={{ position: 'relative', height: 10, background: '#f0f0f0', borderRadius: 5, marginBottom: 4 }}>
      <div style={{ position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`, height: '100%', background: '#16a34a22', borderRadius: 5 }} />
      <div style={{ position: 'absolute', left: `${minPct}%`, width: 2, height: '100%', background: '#16a34a55' }} />
      <div style={{ position: 'absolute', left: `${maxPct}%`, width: 2, height: '100%', background: '#16a34a55' }} />
      <div style={{ position: 'absolute', left: `${pct}%`, width: 14, height: 14, background: dotColor, borderRadius: '50%', top: -2, transform: 'translateX(-50%)', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

// ── Mini stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, trend }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '12px 14px', flex: 1 }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || '#111', ...F, letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#999' }}>{sub}</div>}
      {trend !== undefined && trend !== null && (
        <div style={{ fontSize: 10, color: trend > 0 ? '#16a34a' : trend < 0 ? '#b91c1c' : '#aaa', marginTop: 2 }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}
        </div>
      )}
    </div>
  );
}

// ── Strength Test Flow ────────────────────────────────────────────────────────
function StrengthTestFlow({ clientId, bodyweight, onComplete, onCancel }) {
  const [step, setStep] = useState('select');
  const [selectedLift, setSelectedLift] = useState(null);
  const [testWeight, setTestWeight] = useState('');
  const [e1rm, setE1rm] = useState(null);
  const [warmupStep, setWarmupStep] = useState(0);
  const [error, setError] = useState('');

  const lift = selectedLift ? BENCHMARK_LIFTS.find(l => l.id === selectedLift) : null;

  function startLift(id) { setSelectedLift(id); setTestWeight(''); setE1rm(null); setWarmupStep(0); setStep('warmup'); }

  function calculateResult() {
    const w = parseFloat(testWeight);
    if (!w || w <= 0) { setError('Enter the weight you lifted.'); return; }
    setE1rm(w);
    setError('');
    setStep('result');
  }

  async function saveResult() {
    if (!e1rm || !lift) return;
    setStep('saving');
    try {
      await supabase.from('personal_records').upsert({
        client_id: clientId,
        exercise_id: null,
        exercise_name: lift.name,
        exercise_key: lift.exerciseKey,
        weight_lbs: parseFloat(testWeight),
        reps: 1,
        estimated_1rm: parseFloat(testWeight),
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

  if (step === 'select') return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back</button>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Strength Assessment</div>
      <div style={{ fontSize: 20, fontWeight: 'normal', marginBottom: 4, ...F }}>1-Rep Max Test</div>
      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.7, marginBottom: 20 }}>
        Select a lift to test. Follow the warm-up protocol exactly before attempting your max. Retest every 8–12 weeks to track progress.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BENCHMARK_LIFTS.map(lift => {
          const mg = MUSCLE_GROUPS[lift.primaryGroup];
          return (
            <button key={lift.id} onClick={() => startLift(lift.id)} style={{ background: '#fff', border: '1px solid #e8e8e8', borderLeft: `3px solid ${mg?.color || '#ddd'}`, borderRadius: 10, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, ...F }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: mg?.color || '#ddd', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{lift.name}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{mg?.label}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: '#ddd' }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (step === 'warmup' && lift) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Choose different lift</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: MUSCLE_GROUPS[lift.primaryGroup]?.color || '#ddd', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>1-Rep Max Test</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>
      <div style={{ background: '#fff9eb', border: '1px solid #f0c040', borderRadius: 8, padding: '10px 13px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.65 }}>{lift.safetyNotes}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Protocol</div>
        {lift.instructions.map((inst, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: warmupStep > i ? '#16a34a' : warmupStep === i ? '#111' : '#f0f0f0', color: warmupStep > i ? '#fff' : warmupStep === i ? '#fff' : '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
              {warmupStep > i ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 12, color: warmupStep >= i ? '#333' : '#aaa', lineHeight: 1.7, paddingTop: 2 }}>{inst}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#f9f9f7', borderRadius: 8, padding: '11px 13px', marginBottom: 20 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 8 }}>Technique cues</div>
        {lift.cues.map((cue, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            <span style={{ color: '#bbb' }}>·</span><span>{cue}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setStep('test')} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', ...F }}>
        Ready to test →
      </button>
    </div>
  );

  if (step === 'test' && lift) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={() => setStep('warmup')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back to protocol</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: MUSCLE_GROUPS[lift.primaryGroup]?.color || '#ddd', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>Log Your 1-Rep Max</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
        <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', display: 'block', marginBottom: 8 }}>Weight lifted for 1 rep (lbs)</label>
        <input type="number" value={testWeight} onChange={e => setTestWeight(e.target.value)} placeholder="e.g. 185"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 22, fontWeight: 600, textAlign: 'center', ...F }} />
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 7 }}>{error}</div>}
      <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.65, marginBottom: 16, textAlign: 'center' }}>
        Enter the maximum weight you successfully lifted for exactly 1 rep with good form today.
      </p>
      <button onClick={calculateResult} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', ...F }}>
        Save my 1-Rep Max →
      </button>
    </div>
  );

  if (step === 'result' && lift && e1rm) return (
    <div style={{ padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: MUSCLE_GROUPS[lift.primaryGroup]?.color || '#ddd', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.15em', color: '#999' }}>Result</div>
          <div style={{ fontSize: 20, fontWeight: 'normal', ...F }}>{lift.name}</div>
        </div>
      </div>
      <div style={{ background: '#111', borderRadius: 12, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.15em', color: '#888', marginBottom: 8 }}>1-Rep Max</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>{testWeight} <span style={{ fontSize: 20, color: '#888' }}>lbs</span></div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{lift.name} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 20 }}>
        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 12 }}>Training zones</div>
        {[['Strength (1–3 reps)', 0.90, 1.0], ['Hypertrophy (6–12 reps)', 0.67, 0.85], ['Endurance (15+ reps)', 0.50, 0.65]].map(([label, minPct, maxPct]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round(e1rm * minPct)}–{Math.round(e1rm * maxPct)} lbs</span>
          </div>
        ))}
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: '#fee2e2', borderRadius: 7 }}>{error}</div>}
      <button onClick={saveResult} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, cursor: 'pointer', marginBottom: 10, ...F }}>Save this 1RM</button>
      <button onClick={() => setStep('test')} style={{ width: '100%', background: 'transparent', color: '#888', border: '1px solid #e8e8e8', borderRadius: 10, padding: '12px', fontSize: 13, cursor: 'pointer', ...F }}>Re-enter weight</button>
    </div>
  );

  if (step === 'saving') return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#888' }}>Saving your result…</div>
    </div>
  );
  return null;
}

// ── Muscle Group Detail ───────────────────────────────────────────────────────
function MuscleGroupDetail({ group, muscleScore, allLogs, prs, onBack }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const mg = MUSCLE_GROUPS[group];
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
  Object.keys(exerciseHistory).forEach(name => {
    const byDate = {};
    exerciseHistory[name].forEach(e => { if (!byDate[e.date] || e.e1rm > byDate[e.date].e1rm) byDate[e.date] = e; });
    exerciseHistory[name] = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  });
  const exNames = Object.keys(exerciseHistory).filter(n => exerciseHistory[n].length > 0);
  const sel = selectedExercise || exNames[0];
  const history = sel ? exerciseHistory[sel] || [] : [];
  const latest = history[history.length - 1];
  const first = history[0];
  const change = latest && first ? Math.round(latest.e1rm - first.e1rm) : 0;

  return (
    <div style={{ padding: '16px 16px 40px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 12, color: '#888', cursor: 'pointer', marginBottom: 12, padding: 0, ...F }}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: mg.color }} />
        <div style={{ fontSize: 20, fontWeight: 'normal', color: mg.color, ...F }}>{mg.label}</div>
      </div>
      {exNames.length > 0 ? (
        <>
          <select value={sel} onChange={e => setSelectedExercise(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1px solid #e0e0e0', fontSize: 13, background: '#fff', marginBottom: 14, ...F }}>
            {exNames.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
          </select>
          {latest && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[['Best', `${latest.weight} lbs`], ['Sessions', history.length], ['Change', `${change >= 0 ? '+' : ''}${change}`]].map(([l, v]) => (
                <div key={l} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 7, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: '#bbb', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: l === 'Change' && change > 0 ? '#16a34a' : '#1a1a1a' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {history.length >= 2 && (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa', marginBottom: 8 }}>Weight over time</div>
              <Sparkline data={history.map(d => ({ value: d.weight }))} color={mg.color} height={50} fillArea />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(first.date)}</span>
                <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(latest.date)}</span>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '9px 13px', borderBottom: '1px solid #f0f0f0', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: '#aaa' }}>Session History</div>
            {[...history].reverse().slice(0, 10).map((d, i) => (
              <div key={i} style={{ padding: '10px 13px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#555' }}>{formatDate(d.date)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.weight} lbs × {d.reps}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#aaa', fontSize: 12 }}>No logged exercises for this muscle group yet.</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROGRESS TAB
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProgressTab({ clientId, bodyweight = 170, localLogs = {} }) {
  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [prs, setPRs] = useState([]);
  const [strengthTests, setStrengthTests] = useState([]);
  const [muscleScores, setMuscleScores] = useState({});
  const [strengthRatios, setStrengthRatios] = useState([]);
  const [relativeStrength, setRelativeStrength] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [acwr, setAcwr] = useState(null);
  const [progressionStatus, setProgressionStatus] = useState([]);
  const [recoveryScore, setRecoveryScore] = useState(null);
  const [bodyComposition, setBodyComposition] = useState(null);
  const [cardioStrengthBalance, setCardioStrengthBalance] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!supabase || !clientId) return;
    setLoading(true);
    try {
      const [logsRes, prRes, measRes, healthRes, goalsRes, activitiesRes] = await Promise.all([
        supabase.from('workout_logs').select('*, exercises(name, primary_muscle)')
          .eq('client_id', clientId).eq('completed', true)
          .not('weight_lbs', 'is', null).order('session_date', { ascending: false }).limit(500),
        supabase.from('personal_records').select('*').eq('client_id', clientId).order('achieved_at', { ascending: false }),
        getClientMeasurements(clientId),
        getHealthLogs(clientId, 90),
        getGoals(clientId).catch(() => ({ data: [] })),
        getActivities(clientId, 200).catch(() => ({ data: [] })),
      ]);

      const allPRs = prRes.data || [];
      const tests = allPRs.filter(p => p.record_type === 'strength_test');

      const localLogArray = [];
      Object.entries(localLogs).forEach(([key, val]) => {
        const parts = key.split('__');
        if (parts.length < 2) return;
        const exName = parts.slice(1).join('__');
        const dateMatch = parts[0].match(/(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : null;
        if (!date || !val.sets) return;
        val.sets.filter(s => s.done && s.weight && s.reps).forEach(s => {
          localLogArray.push({ exercise_name: exName, weight_lbs: parseFloat(s.weight), reps: parseInt(s.reps), session_date: date });
        });
      });

      const combinedLogs = [...(logsRes.data || []).map(l => ({ ...l, exercise_name: l.exercises?.name })), ...localLogArray];
      setAllLogs(combinedLogs);

      const scores = calculateMuscleScores(combinedLogs, bodyweight);
      setMuscleScores(scores);
      setStrengthRatios(evaluateStrengthRatios(scores, tests));
      setRelativeStrength(evaluateRelativeStrength(tests, bodyweight));

      const derivedPRs = {};
      combinedLogs.forEach(log => {
        const name = (log.exercise_name || '').toLowerCase();
        if (!name || !log.weight_lbs || !log.reps) return;
        const e1rm = epley1RM(parseFloat(log.weight_lbs), parseInt(log.reps));
        if (!derivedPRs[name] || e1rm > derivedPRs[name].e1rm) {
          derivedPRs[name] = { name, weight: parseFloat(log.weight_lbs), reps: parseInt(log.reps), e1rm, date: log.session_date };
        }
      });

      setPRs(Object.values(derivedPRs).sort((a, b) => b.e1rm - a.e1rm));
      setStrengthTests(tests);
      setMeasurements(measRes.data || []);
      setHealthLogs(healthRes.data || []);

      // Goals — Supabase first, fallback to localStorage
      const supabaseGoals = goalsRes?.data || [];
      if (supabaseGoals.length > 0) {
        setGoals(supabaseGoals);
      } else {
        try { setGoals(JSON.parse(localStorage.getItem('goals_v1') || '[]')); } catch { setGoals([]); }
      }
      // Also pull goal_weight from client record if available
      try {
        const { data: clientRecord } = await supabase.from('clients').select('goal_weight_lbs').eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id).single();
        if (clientRecord?.goal_weight_lbs) {
          setGoals(prev => {
            const hasWeightGoal = prev.some(g => g.type === 'bodyweight');
            if (!hasWeightGoal) return [...prev, { id: 'intake_weight', type: 'bodyweight', name: 'Goal Weight', target_value: clientRecord.goal_weight_lbs, current_value: 0, unit: 'lbs', completed: false, source: 'intake' }];
            return prev;
          });
        }
      } catch {}

      // ── Analytics calculations ──
      const acwrResult = calculateACWR(combinedLogs);
      setAcwr(acwrResult);
      setProgressionStatus(calculateProgressionStatus(combinedLogs));
      setRecoveryScore(calculateRecoveryScore(healthRes.data || [], acwrResult));
      setBodyComposition(analyzeBodyComposition(measRes.data || [], combinedLogs));
      // Get client goal for cardio balance
      const { data: clientRecord } = await supabase.from('clients').select('goal').eq('id', clientId).single().catch(() => ({ data: null }));
      const clientGoal = clientRecord?.goal || 'recomp';
      setCardioStrengthBalance(analyzeCardioStrengthBalance(combinedLogs, activitiesRes?.data || [], clientGoal));
    } catch (err) { console.error('Progress load error:', err); }
    setLoading(false);
  }, [clientId, bodyweight, localLogs]);

  useEffect(() => { loadData(); }, [loadData]);

  if (view === 'test') return <StrengthTestFlow clientId={clientId} bodyweight={bodyweight} onComplete={() => { loadData(); setView('dashboard'); }} onCancel={() => setView('dashboard')} />;
  if (view === 'group' && selectedGroup) return <MuscleGroupDetail group={selectedGroup} muscleScore={muscleScores[selectedGroup]} allLogs={allLogs} prs={prs} onBack={() => { setSelectedGroup(null); setView('dashboard'); }} />;

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: '#888', ...F }}>Loading your data…</div>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────────
  const hasData = allLogs.length > 0;
  const latestTests = {};
  strengthTests.forEach(t => {
    if (!latestTests[t.exercise_key] || t.achieved_at > latestTests[t.exercise_key].achieved_at) latestTests[t.exercise_key] = t;
  });

  // Session frequency — only count weeks that had at least one session logged
  const sessionDates = [...new Set(allLogs.map(l => l.session_date))].sort().reverse();
  const last8WeekSessions = sessionDates.filter(d => {
    const diff = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24);
    return diff <= 56;
  });
  // Count distinct weeks with sessions (not total elapsed weeks)
  const activeWeeks = new Set(last8WeekSessions.map(d => {
    const date = new Date(d);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart.toISOString().slice(0, 10);
  }));
  const sessionsPerWeek = activeWeeks.size > 0
    ? (last8WeekSessions.length / activeWeeks.size).toFixed(1)
    : '0.0';

  // Total volume trend — sets × weight, group by week
  const volumeByWeek = {};
  allLogs.forEach(log => {
    if (!log.weight_lbs) return;
    const date = new Date(log.session_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!volumeByWeek[key]) volumeByWeek[key] = 0;
    volumeByWeek[key] += parseFloat(log.weight_lbs);
  });
  const weeklyVolume = Object.entries(volumeByWeek).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
    .map(([week, vol]) => ({ label: formatShort(week), value: Math.round(vol) }));

  // Weight trend from measurements
  const weightTrend = measurements.filter(m => m.weight_lbs).map(m => ({ date: m.measured_at, value: m.weight_lbs, label: formatShort(m.measured_at) }));
  const latestWeight = weightTrend[weightTrend.length - 1]?.value;
  const firstWeight = weightTrend[0]?.value;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null;

  // Body measurements trend
  const waistTrend = measurements.filter(m => m.waist_in).map(m => ({ date: m.measured_at, value: m.waist_in }));
  const hipsTrend = measurements.filter(m => m.hips_in).map(m => ({ date: m.measured_at, value: m.hips_in }));
  const bfTrend = measurements.filter(m => m.body_fat_pct).map(m => ({ date: m.measured_at, value: m.body_fat_pct }));
  const latestMeas = measurements[measurements.length - 1];
  const firstMeas = measurements[0];

  // Health data averages — last 30 days
  const recentHealth = healthLogs.slice(0, 30);
  const avgSteps = recentHealth.filter(h => h.steps).length
    ? Math.round(recentHealth.filter(h => h.steps).reduce((a, h) => a + h.steps, 0) / recentHealth.filter(h => h.steps).length) : null;
  const avgSleep = recentHealth.filter(h => h.sleep_hours).length
    ? (recentHealth.filter(h => h.sleep_hours).reduce((a, h) => a + h.sleep_hours, 0) / recentHealth.filter(h => h.sleep_hours).length).toFixed(1) : null;
  const avgHRV = recentHealth.filter(h => h.hrv).length
    ? Math.round(recentHealth.filter(h => h.hrv).reduce((a, h) => a + h.hrv, 0) / recentHealth.filter(h => h.hrv).length) : null;

  // Steps trend
  const stepsTrend = [...healthLogs].reverse().filter(h => h.steps).slice(-30).map(h => ({ value: h.steps, date: h.log_date }));
  const sleepTrend = [...healthLogs].reverse().filter(h => h.sleep_hours).slice(-30).map(h => ({ value: h.sleep_hours, date: h.log_date }));
  const hrvTrend = [...healthLogs].reverse().filter(h => h.hrv).slice(-30).map(h => ({ value: h.hrv, date: h.log_date }));

  // Strength trend for benchmark lifts — all tests over time
  const strengthHistory = {};
  strengthTests.forEach(t => {
    if (!strengthHistory[t.exercise_key]) strengthHistory[t.exercise_key] = [];
    strengthHistory[t.exercise_key].push({ date: t.achieved_at, value: t.weight_lbs });
  });
  Object.keys(strengthHistory).forEach(k => strengthHistory[k].sort((a, b) => a.date.localeCompare(b.date)));

  // Exercise volume by muscle group — pie-like breakdown
  const muscleVolume = {};
  allLogs.forEach(log => {
    const name = (log.exercise_name || '').toLowerCase();
    const weights = getExerciseWeights(name);
    if (!weights || !log.weight_lbs) return;
    const primary = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!primary) return;
    if (!muscleVolume[primary]) muscleVolume[primary] = 0;
    muscleVolume[primary] += parseFloat(log.weight_lbs);
  });
  const totalMuscleVol = Object.values(muscleVolume).reduce((a, b) => a + b, 0);
  const muscleVolumeBreakdown = Object.entries(muscleVolume)
    .map(([g, v]) => ({ group: g, vol: v, pct: Math.round((v / totalMuscleVol) * 100), color: MUSCLE_GROUPS[g]?.color || '#ddd', label: MUSCLE_GROUPS[g]?.label || g }))
    .sort((a, b) => b.vol - a.vol).slice(0, 6);

  // ── Goal lines for charts ─────────────────────────────────────────────────
  const activeGoals = goals.filter(g => !g.completed);
  const goalWeightTarget = activeGoals.find(g => g.type === 'bodyweight')?.target_value || null;
  const goalBFTarget = activeGoals.find(g => g.type === 'body_fat')?.target_value || null;
  const goalWaistTarget = activeGoals.find(g =>
    g.type === 'measurement' && (g.metric_key === 'waist_in' || g.name?.toLowerCase().includes('waist'))
  )?.target_value || null;
  const goalHipsTarget = activeGoals.find(g =>
    g.type === 'measurement' && (g.metric_key === 'hips_in' || g.name?.toLowerCase().includes('hip'))
  )?.target_value || null;

  // Strength goals — match by exercise name
  const strengthGoals = activeGoals.filter(g => g.type === 'strength' && g.exercise_name && g.target_value);

  // For each benchmark lift, check if there's a matching strength goal
  const liftGoals = {};
  BENCHMARK_LIFTS.forEach(lift => {
    const match = strengthGoals.find(g =>
      g.exercise_name?.toLowerCase().includes(lift.name.toLowerCase().split(' ')[0]) ||
      lift.name.toLowerCase().includes(g.exercise_name?.toLowerCase() || '')
    );
    if (match) liftGoals[lift.exerciseKey] = match.target_value;
  });

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
    { id: 'strength', label: 'Strength' },
    { id: 'body', label: 'Body' },
    { id: 'goals', label: 'Goals' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div style={{ background: '#f7f6f3', minHeight: '100vh' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5', overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: '0 0 auto', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#111' : 'transparent'}`, padding: '12px 18px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: activeTab === tab.id ? '#111' : '#999', cursor: 'pointer', ...F, whiteSpace: 'nowrap' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ padding: '16px 16px 60px' }}>
          {!hasData ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>No data yet</div>
              <div style={{ fontSize: 14, ...F, lineHeight: 1.7 }}>Log your first session to see your analytics here.</div>
            </div>
          ) : (
            <>
              {/* Goals summary */}
          {activeGoals.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Active Goals</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeGoals.slice(0, 5).map((goal, i) => {
                  const currentVal = goal.current_value ?? goal.currentValue ?? 0;
                  const targetVal = goal.target_value ?? goal.targetValue;
                  const lowerIsBetter = goal.type === 'bodyweight' || goal.type === 'body_fat' || goal.type === 'measurement';
                  const startVal = goal.start_value || currentVal;
                  let pct = null;
                  if (targetVal && startVal !== undefined) {
                    if (lowerIsBetter && startVal > targetVal) {
                      pct = Math.min(100, Math.max(0, Math.round(((startVal - currentVal) / (startVal - targetVal)) * 100)));
                    } else if (!lowerIsBetter) {
                      pct = Math.min(100, Math.round((currentVal / targetVal) * 100));
                    }
                  }
                  const accentColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563a8' : '#c47a0a';
                  return (
                    <div key={goal.id || i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 9, padding: '12px 14px', borderLeft: `3px solid ${accentColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: targetVal ? 8 : 0 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{goal.name}</div>
                          {goal.target_date && <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>By {goal.target_date}</div>}
                        </div>
                        {targetVal && pct !== null && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>{pct}%</div>
                        )}
                      </div>
                      {targetVal && pct !== null && (
                        <>
                          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
                            <span>Current: {currentVal} {goal.unit}</span>
                            <span>Target: {targetVal} {goal.unit}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key stats row */}
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>At a Glance</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <StatCard label="Sessions / wk" value={sessionsPerWeek} sub="last 8 weeks" />
                <StatCard label="Weight" value={latestWeight ? `${latestWeight}` : '—'} sub={weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange} lbs total` : 'lbs'} trend={weightChange ? parseFloat(weightChange) : undefined} />
                <StatCard label="PRs logged" value={prs.length} sub="all time" />
              </div>

              {/* Weekly volume trend */}
              {weeklyVolume.length >= 3 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 2 }}>Weekly Training Volume</div>
                      <div style={{ fontSize: 11, color: '#888' }}>Total weight lifted per week (lbs)</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, ...F }}>{weeklyVolume[weeklyVolume.length - 1]?.value.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>this week</div>
                    </div>
                  </div>
                  <Sparkline data={weeklyVolume} color="#2563a8" height={55} fillArea />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{weeklyVolume[0]?.label}</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{weeklyVolume[weeklyVolume.length - 1]?.label}</span>
                  </div>
                </div>
              )}

              {/* Muscle volume breakdown */}
              {muscleVolumeBreakdown.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 4 }}>Training Distribution</div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Where your volume is going by muscle group</div>
                  {muscleVolumeBreakdown.map(m => (
                    <HBar key={m.group} label={m.label} value={m.vol} max={muscleVolumeBreakdown[0].vol} color={m.color} sublabel={`${m.pct}%`} />
                  ))}
                </div>
              )}

              {/* Session streak */}
              {sessionDates.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Last 30 Days</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (29 - i));
                      const key = d.toISOString().slice(0, 10);
                      const hasSession = sessionDates.includes(key);
                      return (
                        <div key={i} title={key} style={{ width: 'calc((100% - 116px) / 30)', minWidth: 8, aspectRatio: '1', borderRadius: 2, background: hasSession ? '#111' : '#f0f0f0' }} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>30 days ago</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{sessionDates.filter(d => { const diff = (new Date() - new Date(d)) / (1000*60*60*24); return diff <= 30; }).length} sessions</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>Today</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recovery score */}
          {recoveryScore && (
            <div style={{ marginTop: 16, paddingBottom: 8 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Today's Readiness</div>
              <div style={{ background: '#fff', borderLeft: `4px solid ${recoveryScore.color}`, border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Recovery Score</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{recoveryScore.dataPoints} indicator{recoveryScore.dataPoints !== 1 ? 's' : ''} logged today</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 38, fontWeight: 700, color: recoveryScore.color, ...F, lineHeight: 1 }}>{recoveryScore.score}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: recoveryScore.color }}>{recoveryScore.label}</div>
                  </div>
                </div>
                <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${recoveryScore.score}%`, background: recoveryScore.color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {recoveryScore.factors.map((f, i) => (
                    <div key={i} style={{ background: f.status === 'good' ? 'rgba(22,163,74,0.08)' : f.status === 'ok' ? 'rgba(37,99,168,0.08)' : 'rgba(185,28,28,0.08)', borderRadius: 20, padding: '3px 10px', display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: f.status === 'good' ? '#16a34a' : f.status === 'ok' ? '#2563a8' : '#b91c1c' }}>{f.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#555' }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6, ...F }}>{recoveryScore.advice}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STRENGTH TAB ── */}
      {activeTab === 'strength' && (
        <div style={{ padding: '16px 16px 60px' }}>

          {/* Benchmark cards with history */}
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Benchmark Lifts</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
            1RM is your tested max. Training best is the heaviest set logged in workouts.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {BENCHMARK_LIFTS.map(lift => {
              const test = latestTests[lift.exerciseKey];
              const mg = MUSCLE_GROUPS[lift.primaryGroup];
              const trainingBest = prs.find(pr =>
                pr.name.toLowerCase().includes(lift.exerciseKey.replace(/_/g, ' ')) ||
                lift.exerciseKey.replace(/_/g, ' ').includes(pr.name.toLowerCase()) ||
                pr.name.toLowerCase() === lift.name.toLowerCase()
              );
              const history = strengthHistory[lift.exerciseKey] || [];
              return (
                <div key={lift.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', borderLeft: `3px solid ${mg?.color || '#ddd'}` }}>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: mg?.color || '#ddd', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{lift.name}</span>
                      <span style={{ fontSize: 10, color: '#bbb', marginLeft: 'auto' }}>{mg?.label}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: test ? '#111' : '#f9f9f7', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: test ? '#888' : '#bbb', marginBottom: 4 }}>1-Rep Max</div>
                        {test ? (
                          <>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{test.weight_lbs} <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>lbs</span></div>
                            <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{formatShort(test.achieved_at)}</div>
                          </>
                        ) : (
                          <button onClick={() => setView('test')} style={{ fontSize: 11, color: '#2563a8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, ...F }}>Test now →</button>
                        )}
                      </div>
                      <div style={{ background: trainingBest ? mg?.color + '12' || '#f5f5f3' : '#f9f9f7', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: '#bbb', marginBottom: 4 }}>Training Best</div>
                        {trainingBest ? (
                          <>
                            <div style={{ fontSize: 22, fontWeight: 700, color: mg?.color || '#111', letterSpacing: '-0.5px' }}>{trainingBest.weight} <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>lbs</span></div>
                            <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>× {trainingBest.reps} reps</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>No sets logged</div>
                        )}
                      </div>
                    </div>
                    {/* 1RM history sparkline with goal line */}
                    {history.length >= 2 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 9, color: '#bbb' }}>1RM history</span>
                          {liftGoals[lift.exerciseKey] && (
                            <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>Goal: {liftGoals[lift.exerciseKey]} lbs</span>
                          )}
                        </div>
                        <SparklineWithGoal data={history} color={mg?.color || '#2563a8'} height={36} fillArea goalValue={liftGoals[lift.exerciseKey] || null} goalColor="#16a34a" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                          <span style={{ fontSize: 8, color: '#ccc' }}>{formatShort(history[0].date)} · {history[0].value} lbs</span>
                          <span style={{ fontSize: 8, color: '#ccc' }}>{formatShort(history[history.length-1].date)} · {history[history.length-1].value} lbs</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setView('test')} style={{ width: '100%', background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 12, cursor: 'pointer', ...F, marginBottom: 24, letterSpacing: '.05em' }}>
            + Run a Strength Test
          </button>

          {/* Relative strength */}
          {relativeStrength.filter(r => r.ratio !== null).length > 0 && (
            <>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Relative Strength</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>Your 1RM relative to bodyweight — the standard used to gauge strength level regardless of size.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {relativeStrength.filter(r => r.ratio !== null).map(r => {
                  const levels = RELATIVE_STRENGTH_STANDARDS.find(s => s.id === r.id)?.levels || [];
                  return (
                    <div key={r.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '13px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{r.lift}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.levelColor, background: r.levelColor + '18', padding: '2px 10px', borderRadius: 20 }}>{r.level}</span>
                      </div>
                      <div style={{ position: 'relative', height: 8, background: '#f0f0f0', borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, width: `${Math.min(100, (r.ratio / 2.5) * 100)}%`, height: '100%', background: r.levelColor, borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        {levels.map(l => (
                          <span key={l.label} style={{ fontSize: 8, color: r.level === l.label ? l.color : '#ccc', fontWeight: r.level === l.label ? 700 : 400 }}>{l.label}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{r.weight} lbs · {r.ratio.toFixed(2)}× bodyweight{r.nextLevel ? ` · next: ${r.nextLevel.min}×` : ''}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Strength ratios */}
          {strengthRatios.length > 0 && (
            <>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Strength Balance</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>Evidence-based ratios used by coaches to identify imbalances that affect injury risk and programming.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {strengthRatios.map(result => (
                  <div key={result.id} style={{ background: '#fff', border: `1px solid ${result.ratio === null ? '#e8e8e8' : result.status === 'balanced' ? '#e8e8e8' : 'rgba(217,119,6,0.3)'}`, borderRadius: 10, padding: '13px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{result.label}</span>
                      {result.ratio !== null ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: result.status === 'balanced' ? '#16a34a' : '#b45309', background: result.status === 'balanced' ? 'rgba(22,163,74,0.08)' : 'rgba(180,83,9,0.08)', padding: '2px 8px', borderRadius: 20 }}>
                          {result.ratio.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#bbb' }}>{result.missingTest ? `Test ${result.missingTest} first` : 'Log more workouts'}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#bbb', marginBottom: result.ratio !== null ? 10 : 0, lineHeight: 1.5 }}>{result.context}</div>
                    {result.ratio !== null && (
                      <>
                        <BalanceIndicator ratio={result.ratio} min={result.healthyMin} max={result.healthyMax} />
                        <div style={{ marginTop: 8, fontSize: 11, color: result.status === 'balanced' ? '#16a34a' : '#92400e', lineHeight: 1.6 }}>{result.message}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Exercise drill-down by muscle group */}
          {Object.keys(muscleScores).some(g => muscleScores[g]?.score > 0) && (
            <>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Drill Down by Muscle</div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                {Object.entries(MUSCLE_GROUPS).map(([group, mg]) => {
                  const score = muscleScores[group];
                  if (!score || score.score === 0) return null;
                  return (
                    <button key={group} onClick={() => { setSelectedGroup(group); setView('group'); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: mg.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{mg.label}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{score.exercises?.length || 0} exercises</span>
                      <span style={{ fontSize: 14, color: '#ddd' }}>›</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── BODY TAB ── */}
      {activeTab === 'body' && (
        <div style={{ padding: '16px 16px 60px' }}>
          {measurements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>No measurements yet</div>
              <div style={{ fontSize: 14, ...F, lineHeight: 1.7 }}>Log measurements in the Body tab to see trends here.</div>
            </div>
          ) : (
            <>
              {/* Latest snapshot */}
              {latestMeas && (
                <>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Latest · {formatDate(latestMeas.measured_at)}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { key: 'weight_lbs', label: 'Weight', unit: 'lbs' },
                      { key: 'body_fat_pct', label: 'Body Fat', unit: '%' },
                      { key: 'waist_in', label: 'Waist', unit: 'in' },
                      { key: 'hips_in', label: 'Hips', unit: 'in' },
                    ].filter(f => latestMeas[f.key]).map(f => {
                      const prev = firstMeas?.[f.key];
                      const change = prev ? (latestMeas[f.key] - prev).toFixed(1) : null;
                      return (
                        <StatCard key={f.key} label={f.label} value={`${latestMeas[f.key]}${f.unit}`}
                          sub={change ? `${change > 0 ? '+' : ''}${change} total` : undefined}
                          trend={change ? parseFloat(change) : undefined}
                          color={f.key === 'body_fat_pct' && change < 0 ? '#16a34a' : undefined}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* Weight chart */}
              {weightTrend.length >= 2 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 2 }}>Weight</div>
                      <div style={{ fontSize: 11, color: '#888' }}>lbs over time</div>
                    </div>
                    {weightChange && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: parseFloat(weightChange) < 0 ? '#16a34a' : parseFloat(weightChange) > 0 ? '#b91c1c' : '#888', ...F }}>
                          {weightChange > 0 ? '+' : ''}{weightChange} lbs
                        </div>
                        <div style={{ fontSize: 9, color: '#aaa' }}>total change</div>
                      </div>
                    )}
                  </div>
                  <SparklineWithGoal data={weightTrend} color="#2563a8" height={60} fillArea goalValue={goalWeightTarget} goalColor="#16a34a" goalLabel="Goal" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(weightTrend[0]?.date)} · {weightTrend[0]?.value} lbs</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{formatShort(weightTrend[weightTrend.length-1]?.date)} · {weightTrend[weightTrend.length-1]?.value} lbs</span>
                  </div>
                </div>
              )}

              {/* Waist chart */}
              {waistTrend.length >= 2 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Waist (in)</div>
                  <SparklineWithGoal data={waistTrend} color="#d97706" height={50} fillArea goalValue={goalWaistTarget} goalColor="#16a34a" />
                </div>
              )}

              {/* Hips chart */}
              {hipsTrend.length >= 2 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Hips (in)</div>
                  <SparklineWithGoal data={hipsTrend} color="#b91c1c" height={50} fillArea goalValue={goalHipsTarget} goalColor="#16a34a" />
                </div>
              )}

              {/* Body fat chart */}
              {bfTrend.length >= 2 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Body Fat %</div>
                  <SparklineWithGoal data={bfTrend} color="#7c3aed" height={50} fillArea goalValue={goalBFTarget} goalColor="#16a34a" />
                </div>
              )}

              {/* Full measurement history table */}
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>All Measurements</div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  {['Date', 'Weight', 'Waist', 'Hips', 'BF%'].map(h => (
                    <span key={h} style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: '#bbb' }}>{h}</span>
                  ))}
                </div>
                {[...measurements].reverse().map((m, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '9px 12px', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{formatShort(m.measured_at)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{m.weight_lbs || '—'}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{m.waist_in || '—'}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{m.hips_in || '—'}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{m.body_fat_pct || '—'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── HEALTH TAB ── */}
      {activeTab === 'history' && (
        <WorkoutHistory clientId={clientId} localLogs={localLogs} />
      )}

      {activeTab === 'goals' && (
        <div style={{ padding: '16px 16px 60px' }}>
          <GoalTracker clientId={clientId} />
        </div>
      )}

      {activeTab === 'health' && (
        <div style={{ padding: '16px 16px 60px' }}>
          {healthLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>No health data yet</div>
              <div style={{ fontSize: 14, ...F, lineHeight: 1.7 }}>Log daily health data from the Plan tab to see trends here.</div>
            </div>
          ) : (
            <>
              {/* Health averages */}
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>30-Day Averages</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {avgSteps && <StatCard label="Avg Steps" value={avgSteps.toLocaleString()} sub="goal: 10,000" color={avgSteps >= 10000 ? '#16a34a' : '#111'} />}
                {avgSleep && <StatCard label="Avg Sleep" value={`${avgSleep}h`} sub="goal: 8 hrs" color={parseFloat(avgSleep) >= 8 ? '#16a34a' : '#111'} />}
                {avgHRV && <StatCard label="Avg HRV" value={`${avgHRV}`} sub="ms" />}
              </div>

              {/* Steps trend */}
              {stepsTrend.length >= 5 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa' }}>Daily Steps</div>
                    <div style={{ fontSize: 11, color: '#888' }}>last 30 days</div>
                  </div>
                  <Sparkline data={stepsTrend} color="#16a34a" height={55} fillArea />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>30 days ago</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>Today</span>
                  </div>
                </div>
              )}

              {/* Sleep trend */}
              {sleepTrend.length >= 5 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Sleep (hours)</div>
                  <Sparkline data={sleepTrend} color="#2563a8" height={50} fillArea />
                  {/* 8hr reference line hint */}
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 6, textAlign: 'right' }}>Target: 8 hrs</div>
                </div>
              )}

              {/* HRV trend */}
              {hrvTrend.length >= 5 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 4 }}>Heart Rate Variability</div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>Higher is generally better — indicates good recovery</div>
                  <Sparkline data={hrvTrend} color="#7c3aed" height={50} fillArea />
                </div>
              )}

              {/* Daily log table — last 14 days */}
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 10 }}>Recent Log</div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                  {['Date', 'Steps', 'Sleep', 'HRV', 'Energy'].map(h => (
                    <span key={h} style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '.1em', color: '#bbb' }}>{h}</span>
                  ))}
                </div>
                {healthLogs.slice(0, 14).map((h, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', padding: '9px 12px', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{formatShort(h.log_date)}</span>
                    <span style={{ fontSize: 11, color: h.steps >= 10000 ? '#16a34a' : '#555' }}>{h.steps ? h.steps.toLocaleString() : '—'}</span>
                    <span style={{ fontSize: 11, color: h.sleep_hours >= 8 ? '#16a34a' : '#555' }}>{h.sleep_hours ? `${h.sleep_hours}h` : '—'}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{h.hrv || '—'}</span>
                    <span style={{ fontSize: 11, color: '#555' }}>{h.energy_level ? `${h.energy_level}/10` : '—'}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div style={{ padding: '16px 16px 60px' }}>

          {/* ── ACWR Training Load ── */}
          {acwr ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Training Load · ACWR</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
                Acute:Chronic Workload Ratio — compares your last 7 days of training load against your 28-day baseline. Used across professional sports to monitor injury risk.
              </div>
              <div style={{ background: '#fff', borderLeft: `4px solid ${acwr.zoneColor}`, border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>ACWR Ratio</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Optimal range: 0.8 – 1.3</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 38, fontWeight: 700, color: acwr.zoneColor, ...F, lineHeight: 1 }}>{acwr.ratio}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: acwr.zoneColor }}>{acwr.zone}</div>
                  </div>
                </div>
                {/* Zone bar */}
                <div style={{ position: 'relative', height: 10, background: '#f0f0f0', borderRadius: 5, marginBottom: 6 }}>
                  {/* Optimal zone shading */}
                  <div style={{ position: 'absolute', left: `${(0.8/2.5)*100}%`, width: `${((1.3-0.8)/2.5)*100}%`, height: '100%', background: '#16a34a22', borderRadius: 5 }} />
                  <div style={{ position: 'absolute', left: `${(0.8/2.5)*100}%`, width: 2, height: '100%', background: '#16a34a55' }} />
                  <div style={{ position: 'absolute', left: `${(1.3/2.5)*100}%`, width: 2, height: '100%', background: '#16a34a55' }} />
                  <div style={{ position: 'absolute', left: `${(1.5/2.5)*100}%`, width: 2, height: '100%', background: '#d9770655' }} />
                  {/* Marker */}
                  <div style={{ position: 'absolute', left: `${Math.min(98, (acwr.ratio/2.5)*100)}%`, width: 14, height: 14, background: acwr.zoneColor, borderRadius: '50%', top: -2, transform: 'translateX(-50%)', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 9, color: '#bbb' }}>0 · Under</span>
                  <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>0.8–1.3 Optimal</span>
                  <span style={{ fontSize: 9, color: '#d97706' }}>1.5+ Risk</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Acute (7d)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, ...F }}>{acwr.acute.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>lbs lifted</div>
                  </div>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 7, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Chronic (28d avg)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, ...F }}>{acwr.chronic.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>lbs/week avg</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6, ...F }}>{acwr.zoneMessage}</div>
              </div>
              {/* Weekly load chart */}
              {acwr.weeklyLoads.filter(w => w.value > 0).length >= 3 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Weekly Load (8 weeks)</div>
                  <Sparkline data={acwr.weeklyLoads} color={acwr.zoneColor} height={55} fillArea />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{acwr.weeklyLoads[0]?.label}</span>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{acwr.weeklyLoads[acwr.weeklyLoads.length-1]?.label}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 6 }}>Training Load · ACWR</div>
              <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>Log at least 4 weeks of sessions to see your Acute:Chronic Workload Ratio.</div>
            </div>
          )}

          {/* ── Progressive Overload ── */}
          {progressionStatus.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Progressive Overload</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
                Month-over-month strength change per exercise. Stalled lifts (no increase in 4+ weeks) may need a program adjustment.
              </div>
              {/* Summary counts */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Progressing', status: 'progressing', color: '#16a34a' },
                  { label: 'Stalled', status: 'stalled', color: '#d97706' },
                  { label: 'Regressing', status: 'regressing', color: '#b91c1c' },
                ].map(s => {
                  const count = progressionStatus.filter(p => p.status === s.status).length;
                  if (count === 0) return null;
                  return (
                    <div key={s.status} style={{ flex: 1, background: '#fff', border: `1px solid ${s.color}40`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color, ...F }}>{count}</div>
                      <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.label}</div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {progressionStatus.filter(p => p.status !== 'new').slice(0, 12).map((ex, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${ex.status === 'regressing' ? '#b91c1c40' : ex.status === 'stalled' ? '#d9770640' : '#e8e8e8'}`, borderRadius: 9, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize', marginBottom: 3 }}>{ex.displayName}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{ex.sessions} sessions · best: {ex.bestRecent} lbs</div>
                      {ex.trend.length >= 2 && (
                        <div style={{ marginTop: 6, height: 24 }}>
                          <Sparkline data={ex.trend} color={ex.statusColor} height={24} showDots={false} fillArea />
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ex.statusColor }}>{ex.statusLabel}</div>
                      {ex.changePct && <div style={{ fontSize: 9, color: '#aaa' }}>{ex.changePct}%</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Body Composition Trajectory ── */}
          {bodyComposition && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Body Composition Trajectory</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
                Analysis of your weight change rate vs strength trend. Based on research by Helms, Aragon & Fitschen on natural athletes.
              </div>
              <div style={{ background: '#fff', borderLeft: `4px solid ${bodyComposition.color}`, border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: bodyComposition.color, ...F }}>{bodyComposition.assessment}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Over {bodyComposition.weeks} weeks</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: bodyComposition.totalChange > 0 ? '#b91c1c' : bodyComposition.totalChange < 0 ? '#16a34a' : '#888', ...F }}>
                      {bodyComposition.totalChange > 0 ? '+' : ''}{bodyComposition.totalChange} lbs
                    </div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 7, padding: '9px 11px' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Weekly rate</div>
                    <div style={{ fontSize: 15, fontWeight: 700, ...F }}>{bodyComposition.weeklyRate > 0 ? '+' : ''}{bodyComposition.weeklyRate} lbs</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>{bodyComposition.weeklyRatePct > 0 ? '+' : ''}{bodyComposition.weeklyRatePct}% BW/wk</div>
                  </div>
                  {bodyComposition.strengthTrend !== null && (
                    <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 7, padding: '9px 11px' }}>
                      <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>Strength trend</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: bodyComposition.strengthTrend > 0 ? '#16a34a' : bodyComposition.strengthTrend < 0 ? '#b91c1c' : '#888', ...F }}>
                        {bodyComposition.strengthTrend > 0 ? '+' : ''}{bodyComposition.strengthTrend} lbs
                      </div>
                      <div style={{ fontSize: 9, color: '#aaa' }}>avg working weight</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.65, ...F }}>{bodyComposition.detail}</div>
              </div>
            </div>
          )}

          {/* ── Cardio:Strength Balance ── */}
          {cardioStrengthBalance ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 4 }}>Cardio : Strength Balance</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
                Weekly cardio vs strength sessions benchmarked against your goal. Based on ACSM guidelines and Helms/Wilson research on concurrent training interference.
              </div>
              <div style={{ background: '#fff', borderLeft: `4px solid ${cardioStrengthBalance.overallStatus === 'ok' ? '#16a34a' : '#d97706'}`, border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 10 }}>
                {/* Summary stats */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 8, padding: '11px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Strength / wk</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: cardioStrengthBalance.strengthStatus === 'ok' ? '#16a34a' : '#d97706', ...F }}>{cardioStrengthBalance.avgStrength}</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>target: {cardioStrengthBalance.targets.strengthMin}–{cardioStrengthBalance.targets.strengthMax}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 8, padding: '11px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Cardio / wk</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: cardioStrengthBalance.cardioStatus === 'ok' ? '#16a34a' : cardioStrengthBalance.interferenceRisk ? '#b91c1c' : '#d97706', ...F }}>{cardioStrengthBalance.avgCardio}</div>
                    <div style={{ fontSize: 9, color: '#aaa' }}>target: {cardioStrengthBalance.targets.cardioMin}–{cardioStrengthBalance.targets.cardioMax}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f9f9f7', borderRadius: 8, padding: '11px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Goal</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', ...F, marginTop: 4 }}>{cardioStrengthBalance.goal.replace('_', ' ')}</div>
                  </div>
                </div>

                {/* Interference warning */}
                {cardioStrengthBalance.interferenceRisk && (
                  <div style={{ background: 'rgba(185,28,28,0.06)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>Interference Effect Risk</div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>Cardio volume exceeds the threshold associated with impaired strength and hypertrophy adaptations (Wilson et al., 2012).</div>
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#666', lineHeight: 1.65, ...F, marginBottom: 12 }}>{cardioStrengthBalance.recommendation}</div>

                {/* Goal-specific notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ background: '#f9f9f7', borderRadius: 7, padding: '9px 12px' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Strength guidance</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{cardioStrengthBalance.targets.strengthNote}</div>
                  </div>
                  <div style={{ background: '#f9f9f7', borderRadius: 7, padding: '9px 12px' }}>
                    <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 3 }}>Cardio guidance</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{cardioStrengthBalance.targets.cardioNote}</div>
                  </div>
                </div>
              </div>

              {/* Weekly breakdown chart */}
              {cardioStrengthBalance.weeklyData.length >= 3 && (
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#aaa', marginBottom: 10 }}>Weekly breakdown</div>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 60, marginBottom: 6 }}>
                    {cardioStrengthBalance.weeklyData.map((w, i) => {
                      const maxVal = Math.max(...cardioStrengthBalance.weeklyData.map(d => d.strength + d.cardio), 1);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <div style={{ width: '100%', height: Math.round((w.cardio / maxVal) * 44), background: '#2563a8', borderRadius: '2px 2px 0 0', minHeight: w.cardio > 0 ? 4 : 0 }} />
                            <div style={{ width: '100%', height: Math.round((w.strength / maxVal) * 44), background: '#111', borderRadius: w.cardio > 0 ? 0 : '2px 2px 0 0', minHeight: w.strength > 0 ? 4 : 0 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{cardioStrengthBalance.weeklyData[0]?.label}</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 9, color: '#111', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, background: '#111', borderRadius: 2, display: 'inline-block' }} />Strength</span>
                      <span style={{ fontSize: 9, color: '#2563a8', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, background: '#2563a8', borderRadius: 2, display: 'inline-block' }} />Cardio</span>
                    </div>
                    <span style={{ fontSize: 9, color: '#bbb' }}>{cardioStrengthBalance.weeklyData[cardioStrengthBalance.weeklyData.length-1]?.label}</span>
                  </div>
                </div>
              )}
            </div>
          ) : hasData && (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '16px', marginBottom: 24 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.18em', color: '#999', marginBottom: 6 }}>Cardio : Strength Balance</div>
              <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>Log cardio activities using the "Replace with activity" button on your workout days to see your balance here.</div>
            </div>
          )}

          {/* No analytics data */}
          {!acwr && progressionStatus.length === 0 && !bodyComposition && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 12 }}>Not enough data yet</div>
              <div style={{ fontSize: 14, ...F, lineHeight: 1.7 }}>Log sessions consistently for 4+ weeks to unlock training load and progression analytics.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
