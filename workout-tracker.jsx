import { useState, useEffect, useRef, useCallback } from "react";

// ─── EXERCISE LIBRARY ────────────────────────────────────────────────────────
const EXERCISE_LIBRARY = {
  warmup: [
    "World's Greatest Stretch","Hip 90/90","Thread the Needle","Cat-Cow","Thoracic Rotation",
    "Ankle Circles","Shoulder Circles","Leg Swings","Arm Circles","Inchworm",
    "Hip Flexor Stretch","Glute Bridge","Dead Bug","Band Pull-Apart","Jumping Jacks",
  ],
  strength: [
    "Bench Press","Squat","Deadlift","Overhead Press","Barbell Row","Pull-Up","Dip",
    "Incline Bench Press","Romanian Deadlift","Front Squat","Bulgarian Split Squat",
    "Lat Pulldown","Cable Row","Chest Fly","Tricep Pushdown","Bicep Curl","Hammer Curl",
    "Lateral Raise","Face Pull","Leg Press","Leg Curl","Leg Extension","Calf Raise",
    "Hip Thrust","Farmers Walk","Turkish Get-Up","Kettlebell Swing","Box Jump",
    "Lunges","Step-Up","Goblet Squat","Sumo Deadlift","Hack Squat","Pendlay Row",
    "Seated Row","Arnold Press","Skull Crushers","Close-Grip Bench","Preacher Curl",
  ],
  cooldown: [
    "Pigeon Pose","Hamstring Stretch","Quad Stretch","Hip Flexor Lunge","Child's Pose",
    "Seated Forward Fold","Lying Spinal Twist","Doorway Chest Stretch","Cross-Body Shoulder Stretch",
    "Calf Stretch","Butterfly Stretch","Neck Side Stretch","Foam Roll Quads","Foam Roll Thoracic",
    "Downward Dog","Supine Glute Stretch","Figure Four","Couch Stretch",
  ],
};

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const STORAGE_KEY = "vitality_workout_history";

async function saveHistory(history) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(history)); } catch {}
}
async function loadHistory() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}

function calcStats(logs) {
  if (!logs || logs.length === 0) return null;
  const weights = logs.map(l => parseFloat(l.weight)).filter(w => !isNaN(w) && w > 0);
  if (!weights.length) return null;
  return {
    pb: Math.max(...weights),
    avg: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
    lastWeight: weights[weights.length - 1],
    logCount: logs.length,
  };
}

// ─── ICON COMPONENTS ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    minus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    flame: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2C8 8 6 11 6 14a6 6 0 0012 0c0-3-2-6-6-12zm0 17a4 4 0 01-2.83-6.83C10 11.5 11 10 12 7c1 3 2 4.5 2.83 3.17A4 4 0 0112 19z"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
    history: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    bolt: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    dumbbell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4M8 12h8"/></svg>,
    note: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  };
  return icons[name] || null;
};

// ─── EXERCISE PICKER MODAL ───────────────────────────────────────────────────
function ExercisePicker({ type, onSelect, onClose, history }) {
  const [search, setSearch] = useState("");
  const list = EXERCISE_LIBRARY[type] || [];
  const filtered = list.filter(e => e.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={styles.modal}>
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Select Exercise</span>
          <button style={styles.iconBtn} onClick={onClose}><Icon name="x" size={20}/></button>
        </div>
        <input
          style={styles.searchInput}
          placeholder="Search exercises…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div style={styles.exerciseList}>
          {filtered.map(ex => {
            const stats = calcStats(history[ex]);
            return (
              <button key={ex} style={styles.exerciseItem} onClick={() => { onSelect(ex); onClose(); }}>
                <span style={styles.exerciseName}>{ex}</span>
                {stats && (
                  <span style={styles.exerciseMeta}>
                    <span style={styles.metaPB}><Icon name="trophy" size={11} color="#FFB800"/> {stats.pb}kg</span>
                    <span style={styles.metaAvg}>avg {stats.avg}kg</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SET ROW ─────────────────────────────────────────────────────────────────
function SetRow({ setNum, data, onChange, pb }) {
  const isPB = data.weight && parseFloat(data.weight) > 0 && pb && parseFloat(data.weight) >= pb;
  return (
    <div style={{...styles.setRow, ...(data.done ? styles.setRowDone : {}), ...(isPB ? styles.setRowPB : {})}}>
      <div style={styles.setNum}>{setNum}</div>
      <div style={styles.setInputGroup}>
        <div style={styles.inputWrap}>
          <span style={styles.inputLabel}>KG</span>
          <input
            style={styles.setInput}
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={data.weight}
            onChange={e => onChange({ ...data, weight: e.target.value })}
          />
          {isPB && <span style={styles.pbBadge}>PB</span>}
        </div>
        <span style={styles.inputSep}>×</span>
        <div style={styles.inputWrap}>
          <span style={styles.inputLabel}>REPS</span>
          <input
            style={styles.setInput}
            type="number"
            inputMode="numeric"
            placeholder="—"
            value={data.reps}
            onChange={e => onChange({ ...data, reps: e.target.value })}
          />
        </div>
      </div>
      <button
        style={{...styles.doneBtn, ...(data.done ? styles.doneBtnActive : {})}}
        onClick={() => onChange({ ...data, done: !data.done })}
      >
        <Icon name="check" size={16} color={data.done ? "#0D0D0F" : "#444"}/>
      </button>
    </div>
  );
}

// ─── EXERCISE BLOCK ───────────────────────────────────────────────────────────
function ExerciseBlock({ label, exercise, sets, onExerciseChange, onSetsChange, history, phase, index }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const stats = calcStats(history[exercise]);

  const addSet = () => onSetsChange([...sets, { weight: "", reps: "", done: false }]);
  const removeSet = () => sets.length > 1 && onSetsChange(sets.slice(0, -1));
  const updateSet = (i, val) => { const s = [...sets]; s[i] = val; onSetsChange(s); };

  return (
    <div style={styles.exerciseBlock}>
      <div style={styles.exHeader}>
        <span style={styles.exLabel}>{label}</span>
        <button style={styles.exSelector} onClick={() => setShowPicker(true)}>
          <span style={styles.exName}>{exercise || "Choose exercise"}</span>
          <Icon name="chevronDown" size={16} color="#00E5FF"/>
        </button>
      </div>

      {stats && (
        <div style={styles.statsBar}>
          <span style={styles.statItem}><Icon name="trophy" size={13} color="#FFB800"/> PB {stats.pb}kg</span>
          <span style={styles.statDivider}>|</span>
          <span style={styles.statItem}><Icon name="history" size={13} color="#888"/> Avg {stats.avg}kg</span>
          <span style={styles.statDivider}>|</span>
          <span style={styles.statItem}><Icon name="bolt" size={13} color="#00E5FF"/> Last {stats.lastWeight}kg</span>
        </div>
      )}

      <div style={styles.setControls}>
        <span style={styles.setCountLabel}>{sets.length} SET{sets.length !== 1 ? "S" : ""}</span>
        <div style={styles.setCountBtns}>
          <button style={styles.countBtn} onClick={removeSet}><Icon name="minus" size={14}/></button>
          <button style={styles.countBtn} onClick={addSet}><Icon name="plus" size={14}/></button>
        </div>
      </div>

      {sets.map((s, i) => (
        <SetRow key={i} setNum={i + 1} data={s} onChange={v => updateSet(i, v)} pb={stats?.pb}/>
      ))}

      <button style={styles.noteToggle} onClick={() => setShowNote(!showNote)}>
        <Icon name="note" size={14} color="#666"/>
        <span>{showNote ? "Hide note" : (note ? "Edit note" : "Add note")}</span>
      </button>
      {showNote && (
        <textarea
          style={styles.noteInput}
          placeholder="Form cues, feelings, adjustments…"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
        />
      )}

      {showPicker && (
        <ExercisePicker
          type={phase === "warmup" ? "warmup" : phase === "cooldown" ? "cooldown" : "strength"}
          onSelect={onExerciseChange}
          onClose={() => setShowPicker(false)}
          history={history}
        />
      )}
    </div>
  );
}

// ─── WARMUP / COOLDOWN ITEM ──────────────────────────────────────────────────
function SimpleExerciseItem({ exercise, onExerciseChange, history, phase, done, onToggle }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div style={{...styles.simpleItem, ...(done ? styles.simpleItemDone : {})}}>
      <button style={styles.simpleDone} onClick={onToggle}>
        <Icon name="check" size={14} color={done ? "#0D0D0F" : "#333"}/>
      </button>
      <button style={styles.simpleSelector} onClick={() => setShowPicker(true)}>
        <span style={{...styles.simpleName, ...(done ? styles.simpleNameDone : {})}}>{exercise || "Choose exercise"}</span>
        <Icon name="chevronDown" size={14} color="#555"/>
      </button>
      {showPicker && (
        <ExercisePicker
          type={phase}
          onSelect={onExerciseChange}
          onClose={() => setShowPicker(false)}
          history={history}
        />
      )}
    </div>
  );
}

// ─── SUPERSET BLOCK ──────────────────────────────────────────────────────────
function SupersetBlock({ index, data, onChange, history }) {
  const updateExercise = (exIdx, name) => {
    const d = { ...data };
    d.exercises[exIdx].name = name;
    onChange(d);
  };
  const updateSets = (exIdx, sets) => {
    const d = { ...data };
    d.exercises[exIdx].sets = sets;
    onChange(d);
  };

  return (
    <div style={styles.supersetBlock}>
      <div style={styles.supersetHeader}>
        <div style={styles.supersetBadge}>
          <Icon name="bolt" size={13} color="#0D0D0F"/>
          <span>SUPERSET {index + 1}</span>
        </div>
      </div>
      {data.exercises.map((ex, i) => (
        <ExerciseBlock
          key={i}
          label={`EXERCISE ${String.fromCharCode(65 + i)}`}
          exercise={ex.name}
          sets={ex.sets}
          onExerciseChange={n => updateExercise(i, n)}
          onSetsChange={s => updateSets(i, s)}
          history={history}
          phase="strength"
          index={i}
        />
      ))}
    </div>
  );
}

// ─── PHASE HEADER ─────────────────────────────────────────────────────────────
function PhaseHeader({ icon, label, color, subtitle }) {
  return (
    <div style={{...styles.phaseHeader, borderColor: color}}>
      <div style={{...styles.phaseIcon, background: color + "22", color}}>
        <Icon name={icon} size={16} color={color}/>
      </div>
      <div>
        <div style={{...styles.phaseLabel, color}}>{label}</div>
        {subtitle && <div style={styles.phaseSub}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── PROGRESS RING ────────────────────────────────────────────────────────────
function ProgressRing({ total, done }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={styles.ringWrap}>
      <svg width={70} height={70}>
        <circle cx={35} cy={35} r={r} fill="none" stroke="#1a1a1f" strokeWidth={6}/>
        <circle cx={35} cy={35} r={r} fill="none" stroke="#00E5FF" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 35 35)"
          style={{transition:"stroke-dashoffset 0.5s ease"}}/>
      </svg>
      <div style={styles.ringLabel}>{pct}%</div>
    </div>
  );
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ history, onClose }) {
  const exercises = Object.keys(history).filter(k => history[k]?.length > 0);
  return (
    <div style={styles.historyOverlay}>
      <div style={styles.historyBox}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>Exercise History</span>
          <button style={styles.iconBtn} onClick={onClose}><Icon name="x" size={20}/></button>
        </div>
        {exercises.length === 0 ? (
          <p style={styles.emptyText}>No history yet. Log some workouts first.</p>
        ) : (
          <div style={styles.historyList}>
            {exercises.map(ex => {
              const stats = calcStats(history[ex]);
              const logs = history[ex];
              return (
                <div key={ex} style={styles.historyItem}>
                  <div style={styles.historyExName}>{ex}</div>
                  <div style={styles.historyStats}>
                    <span style={styles.historyPB}><Icon name="trophy" size={13} color="#FFB800"/> PB {stats.pb}kg</span>
                    <span style={styles.historyAvg}><Icon name="history" size={13} color="#888"/> Avg {stats.avg}kg</span>
                    <span style={styles.historySessions}>{logs.length} session{logs.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={styles.historyLog}>
                    {logs.slice(-5).reverse().map((l, i) => (
                      <div key={i} style={styles.historyLogRow}>
                        <span style={styles.historyDate}>{new Date(l.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>
                        <span style={styles.historyWeight}>{l.weight}kg × {l.reps}</span>
                        {i === 0 && l.weight === String(stats.pb) && <span style={styles.pbTag}>PB</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DEFAULT WORKOUT STATE ────────────────────────────────────────────────────
const makeSet = () => ({ weight: "", reps: "", done: false });
const defaultWorkout = () => ({
  warmup: [
    { name: "World's Greatest Stretch", done: false },
    { name: "Hip 90/90", done: false },
    { name: "Dead Bug", done: false },
  ],
  supersets: [
    { exercises: [{ name: "Bench Press", sets: [makeSet(),makeSet(),makeSet()] }, { name: "Barbell Row", sets: [makeSet(),makeSet(),makeSet()] }] },
    { exercises: [{ name: "Squat", sets: [makeSet(),makeSet(),makeSet()] }, { name: "Romanian Deadlift", sets: [makeSet(),makeSet(),makeSet()] }] },
    { exercises: [{ name: "Overhead Press", sets: [makeSet(),makeSet(),makeSet()] }, { name: "Pull-Up", sets: [makeSet(),makeSet(),makeSet()] }] },
  ],
  cooldown: [
    { name: "Pigeon Pose", done: false },
    { name: "Hamstring Stretch", done: false },
    { name: "Child's Pose", done: false },
  ],
});

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [workout, setWorkout] = useState(defaultWorkout);
  const [history, setHistory] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("warmup");

  useEffect(() => {
    loadHistory().then(h => { setHistory(h); setLoaded(true); });
  }, []);

  const countSets = () => {
    let total = 0, done = 0;
    workout.warmup.forEach(e => { total++; if (e.done) done++; });
    workout.supersets.forEach(ss => ss.exercises.forEach(ex => ex.sets.forEach(s => { total++; if (s.done) done++; })));
    workout.cooldown.forEach(e => { total++; if (e.done) done++; });
    return { total, done };
  };

  const saveWorkout = async () => {
    const newHistory = { ...history };
    workout.supersets.forEach(ss => {
      ss.exercises.forEach(ex => {
        if (!ex.name) return;
        if (!newHistory[ex.name]) newHistory[ex.name] = [];
        ex.sets.forEach(s => {
          if (s.weight && s.reps && s.done) {
            newHistory[ex.name].push({ weight: s.weight, reps: s.reps, date: new Date().toISOString() });
          }
        });
      });
    });
    await saveHistory(newHistory);
    setHistory(newHistory);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetWorkout = () => { if (confirm("Reset workout? All entries will be cleared.")) setWorkout(defaultWorkout()); };

  const { total, done } = countSets();
  const tabs = ["warmup","supersets","cooldown"];
  const tabLabels = { warmup: "Warm Up", supersets: "Work", cooldown: "Cool Down" };
  const tabIcons = { warmup: "flame", supersets: "dumbbell", cooldown: "refresh" };
  const tabColors = { warmup: "#FF6B35", supersets: "#00E5FF", cooldown: "#A78BFA" };

  if (!loaded) return (
    <div style={styles.root}>
      <div style={styles.loadingScreen}>
        <div style={styles.loadingDot}/>
        <span style={{color:"#444",fontSize:13}}>Loading…</span>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <Icon name="bolt" size={20} color="#00E5FF"/>
            <span style={styles.logoText}>VITALITY</span>
          </div>
          <div style={styles.dateText}>{new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}</div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.headerBtn} onClick={() => setShowHistory(true)}>
            <Icon name="history" size={20} color="#888"/>
          </button>
          <ProgressRing total={total} done={done}/>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button key={t} style={{...styles.tab, ...(activeTab === t ? {...styles.tabActive, borderColor: tabColors[t], color: tabColors[t]} : {})}} onClick={() => setActiveTab(t)}>
            <Icon name={tabIcons[t]} size={14} color={activeTab === t ? tabColors[t] : "#555"}/>
            <span>{tabLabels[t]}</span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={styles.content}>

        {/* WARMUP */}
        {activeTab === "warmup" && (
          <div style={styles.section}>
            <PhaseHeader icon="flame" label="WARM UP" color="#FF6B35" subtitle="3 exercises · Prep the body"/>
            {workout.warmup.map((item, i) => (
              <SimpleExerciseItem
                key={i}
                exercise={item.name}
                onExerciseChange={name => {
                  const w = {...workout};
                  w.warmup[i] = {...item, name};
                  setWorkout(w);
                }}
                history={history}
                phase="warmup"
                done={item.done}
                onToggle={() => {
                  const w = {...workout};
                  w.warmup[i] = {...item, done: !item.done};
                  setWorkout(w);
                }}
              />
            ))}
            <button style={styles.nextPhaseBtn} onClick={() => setActiveTab("supersets")}>
              Continue to Work <Icon name="chevronDown" size={16} color="#0D0D0F"/>
            </button>
          </div>
        )}

        {/* SUPERSETS */}
        {activeTab === "supersets" && (
          <div style={styles.section}>
            <PhaseHeader icon="dumbbell" label="STRENGTH WORK" color="#00E5FF" subtitle="3 supersets · 2 exercises each"/>
            {workout.supersets.map((ss, i) => (
              <SupersetBlock
                key={i}
                index={i}
                data={ss}
                onChange={d => {
                  const w = {...workout};
                  w.supersets[i] = d;
                  setWorkout(w);
                }}
                history={history}
              />
            ))}
            <div style={styles.saveRow}>
              <button style={styles.resetBtn} onClick={resetWorkout}>
                <Icon name="refresh" size={15}/>Reset
              </button>
              <button style={{...styles.saveBtn, ...(saved ? styles.saveBtnDone : {})}} onClick={saveWorkout}>
                {saved ? <><Icon name="check" size={16} color="#0D0D0F"/>Saved!</> : <><Icon name="bolt" size={16} color="#0D0D0F"/>Save Sets</>}
              </button>
            </div>
          </div>
        )}

        {/* COOLDOWN */}
        {activeTab === "cooldown" && (
          <div style={styles.section}>
            <PhaseHeader icon="refresh" label="COOL DOWN" color="#A78BFA" subtitle="3 stretches · Release & recover"/>
            {workout.cooldown.map((item, i) => (
              <SimpleExerciseItem
                key={i}
                exercise={item.name}
                onExerciseChange={name => {
                  const w = {...workout};
                  w.cooldown[i] = {...item, name};
                  setWorkout(w);
                }}
                history={history}
                phase="cooldown"
                done={item.done}
                onToggle={() => {
                  const w = {...workout};
                  w.cooldown[i] = {...item, done: !item.done};
                  setWorkout(w);
                }}
              />
            ))}
            <div style={styles.completionCard}>
              <div style={styles.completionTop}>
                <Icon name="trophy" size={32} color="#FFB800"/>
                <div style={styles.completionTitle}>Session Complete</div>
                <div style={styles.completionSub}>{done}/{total} sets logged</div>
              </div>
              <button style={styles.saveBtn} onClick={saveWorkout}>
                {saved ? <><Icon name="check" size={16} color="#0D0D0F"/>Saved to History!</> : <><Icon name="bolt" size={16} color="#0D0D0F"/>Save & Log Session</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {showHistory && <HistoryView history={history} onClose={() => setShowHistory(false)}/>}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#0D0D0F",
    color: "#E8E8EC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  loadingScreen: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    height: "100vh", gap: 12,
  },
  loadingDot: {
    width: 12, height: 12, borderRadius: "50%", background: "#00E5FF",
    animation: "pulse 1s infinite",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: "1px solid #1a1a1f",
    background: "#0D0D0F",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 2 },
  logo: { display: "flex", alignItems: "center", gap: 6 },
  logoText: {
    fontSize: 18, fontWeight: 800, letterSpacing: "0.15em",
    color: "#E8E8EC", fontFamily: "monospace",
  },
  dateText: { fontSize: 11, color: "#444", letterSpacing: "0.1em" },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  headerBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, borderRadius: 8, display: "flex",
  },
  ringWrap: { position: "relative", width: 70, height: 70 },
  ringLabel: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    fontSize: 13, fontWeight: 700, color: "#00E5FF", fontFamily: "monospace",
  },
  tabBar: {
    display: "flex", borderBottom: "1px solid #1a1a1f",
    background: "#0D0D0F", position: "sticky", top: 73, zIndex: 99,
  },
  tab: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "12px 4px", background: "none", border: "none", borderBottom: "2px solid transparent",
    color: "#555", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
    cursor: "pointer", transition: "all 0.2s",
  },
  tabActive: { borderBottom: "2px solid", fontWeight: 700 },
  content: { flex: 1, overflowY: "auto", paddingBottom: 40 },
  section: { padding: "16px 16px 24px" },
  phaseHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px", marginBottom: 14,
    background: "#111115", borderRadius: 12,
    borderLeft: "3px solid",
  },
  phaseIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  phaseLabel: { fontSize: 13, fontWeight: 800, letterSpacing: "0.12em" },
  phaseSub: { fontSize: 11, color: "#555", marginTop: 2 },
  simpleItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", marginBottom: 8,
    background: "#111115", borderRadius: 12,
    border: "1px solid #1e1e24",
    transition: "all 0.2s",
  },
  simpleItemDone: { opacity: 0.5, borderColor: "#2a2a30" },
  simpleDone: {
    width: 30, height: 30, borderRadius: 8,
    background: "#1a1a1f", border: "1px solid #2a2a30",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
  },
  simpleSelector: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "none", border: "none", cursor: "pointer", padding: 0,
  },
  simpleName: { fontSize: 14, fontWeight: 600, color: "#E8E8EC" },
  simpleNameDone: { textDecoration: "line-through", color: "#555" },
  supersetBlock: {
    marginBottom: 20, borderRadius: 14, overflow: "hidden",
    border: "1px solid #1e1e24",
  },
  supersetHeader: {
    background: "#111115", padding: "10px 14px",
    borderBottom: "1px solid #1a1a1f",
  },
  supersetBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#00E5FF", borderRadius: 6, padding: "4px 10px",
    fontSize: 11, fontWeight: 800, color: "#0D0D0F", letterSpacing: "0.1em",
  },
  exerciseBlock: {
    background: "#0f0f13", padding: "14px 14px 10px",
    borderBottom: "1px solid #1a1a1f",
  },
  exHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  exLabel: {
    fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", color: "#444",
    flexShrink: 0,
  },
  exSelector: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#111115", border: "1px solid #1e1e24",
    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
  },
  exName: { fontSize: 14, fontWeight: 700, color: "#E8E8EC" },
  statsBar: {
    display: "flex", alignItems: "center", gap: 6,
    background: "#0a0a0e", border: "1px solid #1a1a1f",
    borderRadius: 8, padding: "6px 10px", marginBottom: 10,
  },
  statItem: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, color: "#888",
  },
  statDivider: { color: "#222", fontSize: 12 },
  setControls: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 6,
  },
  setCountLabel: { fontSize: 10, fontWeight: 800, color: "#444", letterSpacing: "0.1em" },
  setCountBtns: { display: "flex", gap: 4 },
  countBtn: {
    width: 28, height: 28, borderRadius: 7,
    background: "#1a1a1f", border: "1px solid #2a2a30",
    color: "#888", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  setRow: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 0", borderBottom: "1px solid #111115",
    transition: "all 0.2s",
  },
  setRowDone: { opacity: 0.55 },
  setRowPB: { background: "rgba(255,184,0,0.04)", borderRadius: 8, padding: "8px" },
  setNum: {
    width: 22, height: 22, borderRadius: 6,
    background: "#1a1a1f", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 800, color: "#555", flexShrink: 0,
  },
  setInputGroup: {
    flex: 1, display: "flex", alignItems: "center", gap: 8,
  },
  inputWrap: {
    flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 2,
  },
  inputLabel: {
    fontSize: 9, fontWeight: 800, color: "#333", letterSpacing: "0.15em",
  },
  setInput: {
    width: "100%", background: "#111115", border: "1px solid #1e1e24",
    borderRadius: 8, padding: "7px 10px", color: "#E8E8EC",
    fontSize: 16, fontWeight: 700, fontFamily: "monospace",
    outline: "none", textAlign: "center",
    boxSizing: "border-box",
  },
  pbBadge: {
    position: "absolute", top: -6, right: -4,
    background: "#FFB800", color: "#0D0D0F",
    fontSize: 8, fontWeight: 900, borderRadius: 4, padding: "1px 4px",
  },
  inputSep: { fontSize: 18, color: "#333", fontWeight: 300, flexShrink: 0 },
  doneBtn: {
    width: 34, height: 34, borderRadius: 9,
    background: "#111115", border: "1px solid #1e1e24",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
  },
  doneBtnActive: { background: "#00E5FF", border: "1px solid #00E5FF" },
  noteToggle: {
    display: "flex", alignItems: "center", gap: 6,
    background: "none", border: "none", cursor: "pointer",
    color: "#555", fontSize: 12, padding: "6px 0 2px",
  },
  noteInput: {
    width: "100%", background: "#111115", border: "1px solid #1e1e24",
    borderRadius: 8, padding: "8px 10px", color: "#AAA",
    fontSize: 13, outline: "none", resize: "none",
    fontFamily: "inherit", boxSizing: "border-box", marginTop: 4,
  },
  saveRow: {
    display: "flex", gap: 10, marginTop: 16,
  },
  resetBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "12px 16px", borderRadius: 10,
    background: "#111115", border: "1px solid #1e1e24",
    color: "#666", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
  saveBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "14px 20px", borderRadius: 10,
    background: "#00E5FF", border: "none",
    color: "#0D0D0F", fontSize: 14, fontWeight: 800,
    cursor: "pointer", letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  saveBtnDone: { background: "#00C853" },
  nextPhaseBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 16, padding: "14px",
    background: "#FF6B35", border: "none", borderRadius: 10,
    color: "#0D0D0F", fontSize: 14, fontWeight: 800,
    cursor: "pointer", letterSpacing: "0.05em",
  },
  completionCard: {
    margin: "24px 0 0",
    background: "linear-gradient(135deg, #111115 0%, #0f0f13 100%)",
    border: "1px solid #2a2a30", borderRadius: 16,
    padding: "28px 20px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  completionTop: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  completionTitle: {
    fontSize: 22, fontWeight: 800, color: "#E8E8EC", letterSpacing: "0.05em",
  },
  completionSub: { fontSize: 14, color: "#555" },
  modal: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  modalBox: {
    background: "#111115", borderRadius: "20px 20px 0 0",
    width: "100%", maxHeight: "80vh",
    display: "flex", flexDirection: "column",
    border: "1px solid #1e1e24", borderBottom: "none",
  },
  modalHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: "1px solid #1a1a1f",
  },
  modalTitle: { fontSize: 16, fontWeight: 800, color: "#E8E8EC" },
  iconBtn: {
    background: "#1a1a1f", border: "none", borderRadius: 8,
    padding: 6, cursor: "pointer", display: "flex",
  },
  searchInput: {
    margin: "12px 16px",
    background: "#1a1a1f", border: "1px solid #2a2a30",
    borderRadius: 10, padding: "10px 14px",
    color: "#E8E8EC", fontSize: 14, outline: "none",
    fontFamily: "inherit",
  },
  exerciseList: {
    overflowY: "auto", padding: "0 16px 20px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  exerciseItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "11px 14px", borderRadius: 10,
    background: "#0f0f13", border: "1px solid #1e1e24",
    cursor: "pointer",
  },
  exerciseName: { fontSize: 14, fontWeight: 600, color: "#E8E8EC" },
  exerciseMeta: { display: "flex", alignItems: "center", gap: 8 },
  metaPB: {
    display: "flex", alignItems: "center", gap: 3,
    fontSize: 11, fontWeight: 700, color: "#FFB800",
  },
  metaAvg: { fontSize: 11, color: "#555" },
  historyOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
    zIndex: 200, display: "flex", alignItems: "flex-end",
  },
  historyBox: {
    background: "#111115", borderRadius: "20px 20px 0 0",
    width: "100%", maxHeight: "90vh",
    display: "flex", flexDirection: "column",
    border: "1px solid #1e1e24", borderBottom: "none",
  },
  historyList: { overflowY: "auto", padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 12 },
  historyItem: {
    background: "#0f0f13", borderRadius: 12,
    border: "1px solid #1e1e24", padding: "14px",
  },
  historyExName: { fontSize: 15, fontWeight: 800, color: "#E8E8EC", marginBottom: 8 },
  historyStats: { display: "flex", gap: 12, marginBottom: 10 },
  historyPB: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#FFB800" },
  historyAvg: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888" },
  historySessions: { fontSize: 12, color: "#444", marginLeft: "auto" },
  historyLog: { display: "flex", flexDirection: "column", gap: 4 },
  historyLogRow: { display: "flex", alignItems: "center", gap: 8 },
  historyDate: { fontSize: 11, color: "#444", width: 50, flexShrink: 0 },
  historyWeight: { fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "monospace" },
  pbTag: {
    background: "#FFB800", color: "#0D0D0F",
    fontSize: 9, fontWeight: 900, borderRadius: 4, padding: "1px 5px",
  },
  emptyText: { color: "#444", fontSize: 14, padding: "24px 20px", textAlign: "center" },
};
