/* ============================================================
   Osteo Atlas — App logic
   ============================================================ */

const LS = {
  mastered: "osteo_mastered_v1",       // Set of "boneId::partName" known well
  weak: "osteo_weak_v1",               // map partKey -> wrong count
  examHistory: "osteo_exam_history_v1",// array of {date, score, total, pct}
};

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

let mastered = new Set(loadJSON(LS.mastered, []));
let weak = loadJSON(LS.weak, {});
let examHistory = loadJSON(LS.examHistory, []);

function partKey(p) { return `${p.boneId}::${p.name}`; }
function persistMastered() { saveJSON(LS.mastered, [...mastered]); }
function persistWeak() { saveJSON(LS.weak, weak); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n) { return shuffle(arr).slice(0, n); }
function typeInfo(t) { return BONE_TYPES[t] || BONE_TYPES.region; }
function chip(type) {
  const t = typeInfo(type);
  return `<span class="chip" style="background:${t.color}">${t.label}</span>`;
}

/* ---------------- Tabs ---------------- */
const tabs = ["study", "diagram", "flash", "quiz", "exam", "progress"];
function showTab(tab) {
  tabs.forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tab ? "" : "none";
  });
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  if (tab === "diagram") renderDiagram(currentDiagram);
  if (tab === "flash") renderFlashGroupOptions();
  if (tab === "quiz") { quizState ? renderQuizQuestion() : renderQuizSetup(); }
  if (tab === "exam") { examState ? renderExamQuestion() : renderExamSetup(); }
  if (tab === "progress") renderProgress();
}
document.getElementById("tabs").addEventListener("click", e => {
  const btn = e.target.closest("button[data-tab]");
  if (btn) showTab(btn.dataset.tab);
});

/* ---------------- Header stats ---------------- */
function refreshHeaderStats() {
  document.getElementById("stat-bones").textContent = BONES.length;
  document.getElementById("stat-parts").textContent = ALL_PARTS.length;
  document.getElementById("stat-mastered").textContent = mastered.size;
}

/* ---------------- Sidebar / Browse ---------------- */
let selectedBoneId = BONES[0].id;

function groupedBones() {
  const map = new Map();
  BONES.forEach(b => {
    if (!map.has(b.group)) map.set(b.group, []);
    map.get(b.group).push(b);
  });
  return map;
}

function renderBoneNav(filter = "") {
  const nav = document.getElementById("bone-nav");
  nav.innerHTML = "";
  const f = filter.trim().toLowerCase();
  const groups = groupedBones();
  for (const [group, bones] of groups) {
    const visible = bones.filter(b =>
      !f || b.name.toLowerCase().includes(f) || b.parts.some(p => p.name.toLowerCase().includes(f))
    );
    if (!visible.length) continue;
    const block = document.createElement("div");
    block.className = "group-block";
    block.innerHTML = `<div class="group-title">${group}</div>`;
    visible.forEach(b => {
      const btn = document.createElement("button");
      btn.className = "bone-link" + (b.id === selectedBoneId ? " active" : "");
      btn.innerHTML = `<span>${b.name}</span><span class="count">${b.parts.length}</span>`;
      btn.addEventListener("click", () => {
        selectedBoneId = b.id;
        showTab("study");
        renderStudy(b.id, filter);
        renderBoneNav(document.getElementById("search-input").value);
      });
      block.appendChild(btn);
    });
    nav.appendChild(block);
  }
}

document.getElementById("search-input").addEventListener("input", e => {
  const val = e.target.value;
  renderBoneNav(val);
  renderStudy(selectedBoneId, val);
});

/* ---------------- Study tab ---------------- */
function renderStudy(boneId, filter = "") {
  const bone = BONES.find(b => b.id === boneId) || BONES[0];
  const f = filter.trim().toLowerCase();
  const content = document.getElementById("study-content");
  const parts = bone.parts.filter(p => !f || p.name.toLowerCase().includes(f) || bone.name.toLowerCase().includes(f));

  const legend = Object.entries(BONE_TYPES).map(([k, v]) =>
    `<span class="chip" style="background:${v.color}">${v.label}</span>`).join(" ");

  content.innerHTML = `
    <h2>${bone.name}</h2>
    <div class="sub">${bone.region} — ${bone.group}</div>
    <p style="color:var(--text-dim); font-size:14.5px; line-height:1.6; max-width:70ch;">${bone.blurb}</p>
    <div class="legend">${legend}</div>
    <div class="part-list">
      ${parts.map(p => `
        <div class="part-card">
          <div class="row1">
            <span class="pname">${p.name}</span>
            ${chip(p.type)}
          </div>
          <div class="pdesc">${p.desc}</div>
        </div>
      `).join("") || `<div class="sub">No landmarks match your search on this bone.</div>`}
    </div>
  `;
}

/* ---------------- Diagram tab ---------------- */
let currentDiagram = "skeleton";

const SKELETON_HOTSPOTS = [
  { x: 120, y: 50,  label: "Skull",      group: "Skull – Cranial Bones" },
  { x: 120, y: 95,  label: "Cervical Vertebrae", boneId: "cervical" },
  { x: 120, y: 112, label: "Clavicle",   boneId: "clavicle" },
  { x: 65,  y: 165, label: "Scapula",    boneId: "scapula" },
  { x: 175, y: 165, label: "Scapula",    boneId: "scapula" },
  { x: 120, y: 150, label: "Sternum",    boneId: "sternum" },
  { x: 145, y: 175, label: "Ribs",       boneId: "ribs" },
  { x: 120, y: 250, label: "Lumbar Vertebrae", boneId: "lumbar" },
  { x: 62,  y: 220, label: "Humerus",    boneId: "humerus" },
  { x: 178, y: 220, label: "Humerus",    boneId: "humerus" },
  { x: 55,  y: 280, label: "Radius / Ulna", boneId: "radius" },
  { x: 185, y: 280, label: "Radius / Ulna", boneId: "ulna" },
  { x: 53,  y: 322, label: "Hand (Carpals, Metacarpals, Phalanges)", boneId: "carpals" },
  { x: 187, y: 322, label: "Hand (Carpals, Metacarpals, Phalanges)", boneId: "hand-digits" },
  { x: 110, y: 352, label: "Hip Bone (Pelvis)", boneId: "hipbone" },
  { x: 96,  y: 430, label: "Femur",      boneId: "femur" },
  { x: 144, y: 430, label: "Femur",      boneId: "femur" },
  { x: 95,  y: 474, label: "Patella",    boneId: "patella" },
  { x: 145, y: 474, label: "Patella",    boneId: "patella" },
  { x: 92,  y: 520, label: "Tibia",      boneId: "tibia" },
  { x: 148, y: 520, label: "Fibula",     boneId: "fibula" },
  { x: 88,  y: 556, label: "Foot (Tarsals, Metatarsals, Phalanges)", boneId: "tarsals" },
  { x: 152, y: 556, label: "Foot (Tarsals, Metatarsals, Phalanges)", boneId: "foot-digits" },
];

const SKULL_HOTSPOTS = [
  { x: 120, y: 34,  label: "Frontal Bone", boneId: "frontal" },
  { x: 60,  y: 70,  label: "Parietal Bone", boneId: "parietal" },
  { x: 180, y: 70,  label: "Parietal Bone", boneId: "parietal" },
  { x: 50,  y: 118, label: "Temporal Bone", boneId: "temporal" },
  { x: 190, y: 118, label: "Temporal Bone", boneId: "temporal" },
  { x: 120, y: 14,  label: "Coronal Suture", boneId: "sutures" },
  { x: 78,  y: 108, label: "Zygomatic Bone", boneId: "zygomatic" },
  { x: 162, y: 108, label: "Zygomatic Bone", boneId: "zygomatic" },
  { x: 120, y: 118, label: "Nasal Bone",  boneId: "nasal" },
  { x: 95,  y: 148, label: "Maxilla",     boneId: "maxilla" },
  { x: 145, y: 148, label: "Maxilla",     boneId: "maxilla" },
  { x: 120, y: 200, label: "Mandible",    boneId: "mandible" },
];

function skeletonSVG() {
  return `
  <svg viewBox="0 0 240 580" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="rgba(238,242,247,0.55)" stroke-width="4" stroke-linecap="round">
      <ellipse cx="120" cy="52" rx="30" ry="34" />
      <line x1="120" y1="86" x2="120" y2="105" />
      <line x1="75" y1="112" x2="120" y2="105" />
      <line x1="165" y1="112" x2="120" y2="105" />
      <path d="M85,120 Q120,100 155,120 Q160,190 130,235 Q120,245 110,235 Q80,190 85,120 Z" />
      <rect x="112" y="118" width="16" height="70" rx="4" />
      <line x1="120" y1="188" x2="120" y2="330" />
      <path d="M75,330 L165,330 L182,385 L58,385 Z" />
      <line x1="75" y1="112" x2="62" y2="222" />
      <line x1="62" y1="222" x2="55" y2="285" />
      <line x1="55" y1="285" x2="53" y2="320" />
      <line x1="165" y1="112" x2="178" y2="222" />
      <line x1="178" y1="222" x2="185" y2="285" />
      <line x1="185" y1="285" x2="187" y2="320" />
      <line x1="96" y1="385" x2="96" y2="472" />
      <line x1="144" y1="385" x2="144" y2="472" />
      <line x1="96" y1="472" x2="92" y2="555" />
      <line x1="144" y1="472" x2="148" y2="555" />
      <path d="M80,558 Q90,568 105,560" />
      <path d="M135,558 Q150,568 160,560" />
    </g>
    ${renderHotspots(SKELETON_HOTSPOTS)}
  </svg>`;
}

function skullSVG() {
  return `
  <svg viewBox="0 0 240 230" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="rgba(238,242,247,0.55)" stroke-width="4" stroke-linecap="round">
      <path d="M60,90 Q40,10 120,8 Q200,10 180,90 Q185,120 165,140 L160,150 Q150,190 120,210 Q90,190 80,150 L75,140 Q55,120 60,90 Z" />
      <line x1="120" y1="8" x2="120" y2="60" stroke-dasharray="3,5" />
      <line x1="80" y1="150" x2="160" y2="150" />
      <ellipse cx="98" cy="120" rx="10" ry="7" />
      <ellipse cx="142" cy="120" rx="10" ry="7" />
    </g>
    ${renderHotspots(SKULL_HOTSPOTS)}
  </svg>`;
}

function renderHotspots(list) {
  return list.map((h, i) => `
    <g class="hotspot" data-idx="${i}">
      <circle cx="${h.x}" cy="${h.y}" r="6"></circle>
    </g>
  `).join("");
}

function renderDiagram(kind) {
  currentDiagram = kind;
  document.querySelectorAll("[data-diagram]").forEach(b => b.classList.toggle("active", b.dataset.diagram === kind));
  const holder = document.getElementById("diagram-svg-holder");
  const hotspots = kind === "skull" ? SKULL_HOTSPOTS : SKELETON_HOTSPOTS;
  holder.innerHTML = kind === "skull" ? skullSVG() : skeletonSVG();

  holder.querySelectorAll(".hotspot").forEach(g => {
    g.addEventListener("click", () => {
      holder.querySelectorAll(".hotspot").forEach(x => x.classList.remove("active"));
      g.classList.add("active");
      const h = hotspots[+g.dataset.idx];
      showDiagramInfo(h);
    });
  });
}

function showDiagramInfo(h) {
  const box = document.getElementById("diagram-info-content");
  if (h.boneId) {
    const bone = BONES.find(b => b.id === h.boneId);
    box.innerHTML = `
      <h3 style="margin-top:0">${h.label}</h3>
      <p class="sub" style="margin-top:-6px">${bone.group}</p>
      <p style="font-size:13.5px;color:var(--text-dim);line-height:1.5">${bone.blurb}</p>
      <button class="glass-btn primary" id="jump-to-bone">Open full landmark list →</button>
    `;
    document.getElementById("jump-to-bone").addEventListener("click", () => {
      selectedBoneId = h.boneId;
      showTab("study");
      renderStudy(h.boneId);
      renderBoneNav("");
    });
  } else if (h.group) {
    const bones = BONES.filter(b => b.group === h.group);
    box.innerHTML = `
      <h3 style="margin-top:0">${h.label}</h3>
      <p class="sub" style="margin-top:-6px">${bones.length} bones in this region</p>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
        ${bones.map(b => `<button class="glass-btn" data-jump="${b.id}" style="text-align:left">${b.name}</button>`).join("")}
      </div>
    `;
    box.querySelectorAll("[data-jump]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedBoneId = btn.dataset.jump;
        showTab("study");
        renderStudy(btn.dataset.jump);
        renderBoneNav("");
      });
    });
  }
}

document.getElementById("diagram-wrap"); // ensure exists
document.querySelector(".diagram-picker").addEventListener("click", e => {
  const btn = e.target.closest("button[data-diagram]");
  if (btn) renderDiagram(btn.dataset.diagram);
});

/* ---------------- Flashcards ---------------- */
let flashDeck = [];
let flashIdx = 0;
let flashFlipped = false;
let flashStats = { seen: 0, known: 0 };

function renderFlashGroupOptions() {
  const sel = document.getElementById("flash-group-filter");
  if (sel.dataset.built) { renderFlashcard(); return; }
  const groups = [...new Set(BONES.map(b => b.group))];
  sel.innerHTML = `<option value="all">All bones (${ALL_PARTS.length} landmarks)</option>` +
    groups.map(g => {
      const count = ALL_PARTS.filter(p => p.group === g).length;
      return `<option value="${g}">${g} (${count})</option>`;
    }).join("");
  sel.dataset.built = "1";
  sel.addEventListener("change", () => buildFlashDeck(sel.value));
  buildFlashDeck("all");
}

function buildFlashDeck(groupFilter) {
  const pool = groupFilter === "all" ? ALL_PARTS : ALL_PARTS.filter(p => p.group === groupFilter);
  flashDeck = shuffle(pool);
  flashIdx = 0;
  flashFlipped = false;
  flashStats = { seen: 0, known: 0 };
  renderFlashcard();
}

function renderFlashcard() {
  const card = document.getElementById("flashcard");
  const prog = document.getElementById("flash-progress");
  if (!flashDeck.length) { card.innerHTML = "<p>No cards.</p>"; return; }
  if (flashIdx >= flashDeck.length) {
    card.innerHTML = `<div><h3>Deck complete 🎉</h3><p class="sub">Knew ${flashStats.known}/${flashStats.seen}</p></div>`;
    prog.textContent = "";
    return;
  }
  const p = flashDeck[flashIdx];
  prog.textContent = `Card ${flashIdx + 1} of ${flashDeck.length} — knew ${flashStats.known}/${flashStats.seen}`;
  if (!flashFlipped) {
    card.innerHTML = `<div class="fc-front"><div class="name">${p.name}</div><div class="bone">on the ${p.bone}</div></div>`;
  } else {
    card.innerHTML = `<div class="fc-back"><div class="desc">${p.desc}</div><div class="type">${chip(p.type)}</div></div>`;
  }
}

document.getElementById("flashcard").addEventListener("click", () => {
  flashFlipped = !flashFlipped;
  renderFlashcard();
});
document.getElementById("flash-restart").addEventListener("click", () => {
  buildFlashDeck(document.getElementById("flash-group-filter").value);
});
function answerFlash(knew) {
  if (flashIdx >= flashDeck.length) return;
  const p = flashDeck[flashIdx];
  flashStats.seen++;
  const key = partKey(p);
  if (knew) {
    flashStats.known++;
    mastered.add(key);
  } else {
    mastered.delete(key);
    weak[key] = (weak[key] || 0) + 1;
    flashDeck.push(p); // re-queue missed card later in the deck
    persistWeak();
  }
  persistMastered();
  refreshHeaderStats();
  flashIdx++;
  flashFlipped = false;
  renderFlashcard();
}
document.getElementById("flash-know").addEventListener("click", () => answerFlash(true));
document.getElementById("flash-dont-know").addEventListener("click", () => answerFlash(false));

/* ---------------- Quiz builder (shared by Test-Your-Knowledge and Knowledge Test) ---------------- */
function pickDistractors(correct, pool, n, keyFn) {
  const others = pool.filter(p => keyFn(p) !== keyFn(correct));
  const sameGroup = others.filter(p => p.group === correct.group);
  const chosen = sample(sameGroup.length >= n ? sameGroup : others, n);
  return chosen;
}

function buildQuestions(pool, count, mode) {
  const chosenParts = sample(pool, Math.min(count, pool.length));
  return chosenParts.map(p => {
    const askName = mode === "mixed" ? Math.random() < 0.5 : mode === "name";
    if (askName) {
      // Show description -> pick correct NAME
      const distractors = pickDistractors(p, pool, 3, x => x.name + x.boneId).map(d => d.name);
      const options = shuffle([p.name, ...new Set(distractors)].slice(0, 4));
      while (options.length < 4) options.push("None of the above");
      return { prompt: `Which landmark is described as: "${p.desc}"?`, sub: `(${p.bone})`, options, answer: p.name, part: p };
    } else {
      // Show name -> pick correct DESCRIPTION
      const distractors = pickDistractors(p, pool, 3, x => x.name + x.boneId).map(d => d.desc);
      const options = shuffle([p.desc, ...new Set(distractors)].slice(0, 4));
      while (options.length < 4) options.push("None of the above");
      return { prompt: `What best describes the "${p.name}" (${p.bone})?`, sub: "", options, answer: p.desc, part: p };
    }
  });
}

/* ---------------- Test Your Knowledge (quick, untimed, instant feedback) ---------------- */
let quizState = null;

function renderQuizSetup() {
  const el = document.getElementById("quiz-content");
  const groups = [...new Set(BONES.map(b => b.group))];
  el.innerHTML = `
    <div class="quiz-setup">
      <div class="sub">Pick a topic and go — instant feedback after every answer.</div>
      <div class="filter-row">
        <select id="qz-group"><option value="all">All bones</option>${groups.map(g => `<option value="${g}">${g}</option>`).join("")}</select>
        <select id="qz-count"><option value="10">10 questions</option><option value="20">20 questions</option><option value="30">30 questions</option></select>
        <select id="qz-mode"><option value="mixed">Mixed (name ↔ description)</option><option value="name">Show description → pick name</option><option value="desc">Show name → pick description</option></select>
      </div>
      <button class="glass-btn primary" id="qz-start">Start Quiz</button>
    </div>
  `;
  document.getElementById("qz-start").addEventListener("click", () => {
    const group = document.getElementById("qz-group").value;
    const count = +document.getElementById("qz-count").value;
    const mode = document.getElementById("qz-mode").value;
    const pool = group === "all" ? ALL_PARTS : ALL_PARTS.filter(p => p.group === group);
    quizState = { questions: buildQuestions(pool, count, mode), idx: 0, score: 0, answered: false };
    renderQuizQuestion();
  });
}

function renderQuizQuestion() {
  const el = document.getElementById("quiz-content");
  const s = quizState;
  if (s.idx >= s.questions.length) {
    el.innerHTML = `
      <div class="result-summary">
        <div class="result-stat"><div class="num">${s.score}/${s.questions.length}</div><div class="label">Score</div></div>
        <div class="result-stat"><div class="num">${Math.round((s.score / s.questions.length) * 100)}%</div><div class="label">Accuracy</div></div>
      </div>
      <button class="glass-btn primary" id="qz-again">Try Another Set</button>
    `;
    document.getElementById("qz-again").addEventListener("click", renderQuizSetup);
    return;
  }
  const q = s.questions[s.idx];
  el.innerHTML = `
    <div class="quiz-header">
      <div class="sub">Question ${s.idx + 1} of ${s.questions.length}</div>
      <div class="sub">Score: ${s.score}</div>
    </div>
    <div class="progress-bar"><div style="width:${(s.idx / s.questions.length) * 100}%"></div></div>
    <h3 style="margin:16px 0 4px">${q.prompt}</h3>
    <div class="quiz-options" id="qz-options">
      ${q.options.map((opt, i) => `<button class="option-btn" data-i="${i}">${opt}</button>`).join("")}
    </div>
    <div style="margin-top:14px"><button class="glass-btn" id="qz-next" style="display:none">Next →</button></div>
  `;
  document.querySelectorAll("#qz-options .option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (s.answered) return;
      s.answered = true;
      const chosen = btn.textContent;
      const correct = chosen === q.answer;
      if (correct) s.score++;
      const key = partKey(q.part);
      if (!correct) { weak[key] = (weak[key] || 0) + 1; persistWeak(); }
      document.querySelectorAll("#qz-options .option-btn").forEach(b => {
        b.disabled = true;
        if (b.textContent === q.answer) b.classList.add("correct");
        else if (b === btn) b.classList.add("incorrect");
      });
      document.getElementById("qz-next").style.display = "";
    });
  });
  document.getElementById("qz-next")?.addEventListener("click", () => {
    s.idx++; s.answered = false; renderQuizQuestion();
  });
}

/* ---------------- Knowledge Test (timed exam mode) ---------------- */
let examState = null;
let examTimerId = null;

function renderExamSetup() {
  const el = document.getElementById("exam-content");
  el.innerHTML = `
    <div class="quiz-setup">
      <div class="sub">Simulates real test conditions: a timed, comprehensive exam across the whole skeleton. Feedback is shown only at the end.</div>
      <div class="filter-row">
        <select id="ex-count"><option value="25">25 questions</option><option value="50" selected>50 questions</option><option value="75">75 questions</option></select>
        <select id="ex-minutes"><option value="15">15 min</option><option value="25" selected>25 min</option><option value="40">40 min</option></select>
      </div>
      <button class="glass-btn primary" id="ex-start">Start Timed Test</button>
      <div id="ex-history"></div>
    </div>
  `;
  renderExamHistory();
  document.getElementById("ex-start").addEventListener("click", () => {
    const count = +document.getElementById("ex-count").value;
    const minutes = +document.getElementById("ex-minutes").value;
    examState = {
      questions: buildQuestions(ALL_PARTS, count, "mixed"),
      idx: 0,
      answers: [],
      secondsLeft: minutes * 60,
    };
    startExamTimer();
    renderExamQuestion();
  });
}

function renderExamHistory() {
  const box = document.getElementById("ex-history");
  if (!box) return;
  if (!examHistory.length) { box.innerHTML = ""; return; }
  box.innerHTML = `<h3 style="margin-bottom:6px">Past Attempts</h3><div class="history-list">${
    examHistory.slice(-8).reverse().map(h => `<div class="history-row"><span>${h.date}</span><span>${h.score}/${h.total} (${h.pct}%)</span></div>`).join("")
  }</div>`;
}

function startExamTimer() {
  clearInterval(examTimerId);
  examTimerId = setInterval(() => {
    if (!examState) return clearInterval(examTimerId);
    examState.secondsLeft--;
    updateExamTimerDisplay();
    if (examState.secondsLeft <= 0) {
      clearInterval(examTimerId);
      finishExam();
    }
  }, 1000);
}

function updateExamTimerDisplay() {
  const t = document.getElementById("ex-timer");
  if (!t || !examState) return;
  const m = Math.floor(examState.secondsLeft / 60);
  const sec = examState.secondsLeft % 60;
  t.textContent = `${m}:${sec.toString().padStart(2, "0")}`;
  t.classList.toggle("low", examState.secondsLeft < 60);
}

function renderExamQuestion() {
  const el = document.getElementById("exam-content");
  const s = examState;
  const q = s.questions[s.idx];
  el.innerHTML = `
    <div class="quiz-header">
      <div class="sub">Question ${s.idx + 1} of ${s.questions.length}</div>
      <div class="quiz-timer" id="ex-timer"></div>
    </div>
    <div class="progress-bar"><div style="width:${(s.idx / s.questions.length) * 100}%"></div></div>
    <h3 style="margin:16px 0 4px">${q.prompt}</h3>
    <div class="quiz-options" id="ex-options">
      ${q.options.map((opt, i) => `<button class="option-btn" data-i="${i}">${opt}</button>`).join("")}
    </div>
    <div style="margin-top:14px;display:flex;gap:10px">
      <button class="glass-btn" id="ex-skip">Skip</button>
      <button class="glass-btn primary" id="ex-next" style="display:none">Next →</button>
    </div>
  `;
  updateExamTimerDisplay();
  let picked = null;
  document.querySelectorAll("#ex-options .option-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#ex-options .option-btn").forEach(b => b.classList.remove("correct"));
      btn.classList.add("correct");
      picked = btn.textContent;
      document.getElementById("ex-next").style.display = "";
    });
  });
  document.getElementById("ex-skip").addEventListener("click", () => {
    s.answers.push({ q, chosen: null });
    s.idx++;
    if (s.idx >= s.questions.length) finishExam(); else renderExamQuestion();
  });
  document.getElementById("ex-next").addEventListener("click", () => {
    s.answers.push({ q, chosen: picked });
    s.idx++;
    if (s.idx >= s.questions.length) finishExam(); else renderExamQuestion();
  });
}

function finishExam() {
  clearInterval(examTimerId);
  const s = examState;
  // fill in any unanswered remaining questions as skipped
  while (s.answers.length < s.questions.length) s.answers.push({ q: s.questions[s.answers.length], chosen: null });
  const score = s.answers.filter(a => a.chosen === a.q.answer).length;
  const total = s.questions.length;
  const pct = Math.round((score / total) * 100);

  s.answers.forEach(a => {
    if (a.chosen !== a.q.answer) {
      const key = partKey(a.q.part);
      weak[key] = (weak[key] || 0) + 1;
    }
  });
  persistWeak();

  examHistory.push({ date: new Date().toLocaleString(), score, total, pct });
  saveJSON(LS.examHistory, examHistory);

  const el = document.getElementById("exam-content");
  el.innerHTML = `
    <div class="result-summary">
      <div class="result-stat"><div class="num">${score}/${total}</div><div class="label">Score</div></div>
      <div class="result-stat"><div class="num">${pct}%</div><div class="label">Accuracy</div></div>
      <div class="result-stat"><div class="num">${s.answers.filter(a => a.chosen === null).length}</div><div class="label">Skipped</div></div>
    </div>
    <h3>Review</h3>
    <div id="ex-review"></div>
    <button class="glass-btn primary" id="ex-restart">Back to Setup</button>
  `;
  document.getElementById("ex-review").innerHTML = s.answers.map(a => {
    const correct = a.chosen === a.q.answer;
    return `<div class="review-item ${correct ? "right" : "wrong"}">
      <div class="q">${a.q.prompt}</div>
      <div class="a">Your answer: ${a.chosen ?? "(skipped)"} ${correct ? "" : `— Correct: ${a.q.answer}`}</div>
    </div>`;
  }).join("");
  document.getElementById("ex-restart").addEventListener("click", renderExamSetup);
  examState = null;
}

/* ---------------- Progress tab ---------------- */
function renderProgress() {
  const el = document.getElementById("progress-content");
  const weakSorted = Object.entries(weak).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const weakParts = weakSorted.map(([key, count]) => {
    const [boneId, name] = key.split("::");
    const part = ALL_PARTS.find(p => p.boneId === boneId && p.name === name);
    return part ? { ...part, missed: count } : null;
  }).filter(Boolean);

  el.innerHTML = `
    <div class="result-summary">
      <div class="result-stat"><div class="num">${mastered.size}</div><div class="label">Mastered Landmarks</div></div>
      <div class="result-stat"><div class="num">${ALL_PARTS.length - mastered.size}</div><div class="label">Remaining</div></div>
      <div class="result-stat"><div class="num">${examHistory.length}</div><div class="label">Knowledge Tests Taken</div></div>
    </div>
    <h3>Focus Review — your most-missed landmarks</h3>
    <div class="part-list">
      ${weakParts.length ? weakParts.map(p => `
        <div class="part-card">
          <div class="row1"><span class="pname">${p.name}</span>${chip(p.type)}</div>
          <div class="bonetag">${p.bone} — missed ${p.missed}×</div>
          <div class="pdesc">${p.desc}</div>
        </div>`).join("") : `<div class="sub">No missed items yet — take a quiz or knowledge test to build this list.</div>`}
    </div>
    <h3>Knowledge Test History</h3>
    <div class="history-list">
      ${examHistory.length ? examHistory.slice().reverse().map(h => `<div class="history-row"><span>${h.date}</span><span>${h.score}/${h.total} (${h.pct}%)</span></div>`).join("") : `<div class="sub">No knowledge tests taken yet.</div>`}
    </div>
    <div style="margin-top:16px">
      <button class="glass-btn" id="reset-progress">Reset All Progress</button>
    </div>
  `;
  document.getElementById("reset-progress").addEventListener("click", () => {
    if (!confirm("Reset mastered cards, weak-area tracking, and test history?")) return;
    mastered = new Set(); weak = {}; examHistory = [];
    persistMastered(); persistWeak(); saveJSON(LS.examHistory, examHistory);
    refreshHeaderStats(); renderProgress();
  });
}

/* ---------------- Init ---------------- */
renderBoneNav();
renderStudy(selectedBoneId);
refreshHeaderStats();
