/* ============================================================
   K3 BONGKAR MUAT - APPLICATION LOGIC + GSAP ANIMATION
   Flow: Beranda (Home) -> Dashboard -> 4 Modul GBIM -> Evaluasi -> Sertifikat
   ============================================================ */

'use strict';

const STORAGE_KEY = 'k3_bm_portal_state';

// State Management
let appState = loadState() || {
  user: {
    name: '',
    nik: '',
    dept: ''
  },
  completedModules: [false, false, false, false], // Modul 1-4
  evalScore: 0,
  evalPassed: false
};

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

/* ─── NAVIGATION SYSTEM (WITH GSAP) ─── */
function navTo(screenId) {
  const currentScreen = document.querySelector('.screen.active');
  const targetScreen = document.getElementById(screenId);
  
  if (!targetScreen || currentScreen === targetScreen) return;

  // Update Nav Links
  document.querySelectorAll('.nav-item').forEach(ni => ni.classList.remove('active'));
  if (screenId === 'screen-home') document.getElementById('nl-home')?.classList.add('active');
  if (screenId === 'screen-info') document.getElementById('nl-info')?.classList.add('active');
  if (screenId === 'screen-dashboard') document.getElementById('nl-dash')?.classList.add('active');

  updateNavUserArea();

  // Animation Sequence
  if (currentScreen) {
    gsap.to(currentScreen, {
      opacity: 0,
      y: -10,
      duration: 0.2,
      onComplete: () => {
        currentScreen.classList.remove('active');
        showNewScreen(targetScreen);
      }
    });
  } else {
    showNewScreen(targetScreen);
  }
}

function showNewScreen(targetScreen) {
  targetScreen.classList.add('active');
  window.scrollTo(0, 0);
  gsap.fromTo(targetScreen, 
    { opacity: 0, y: 15 }, 
    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
  );

  // If going to dashboard, animate the cards staggering in
  if (targetScreen.id === 'screen-dashboard') {
    gsap.fromTo('.mod-card-row', 
      { opacity: 0, x: -20 }, 
      { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.1 }
    );
  }
}

function openPortalNav() {
  if (appState.user.name) {
    navTo('screen-dashboard');
  } else {
    openLoginModal();
  }
}

function updateNavUserArea() {
  const container = document.getElementById('nav-user-area');
  if (!container) return;

  if (appState.user.name) {
    container.innerHTML = `
      <button class="btn-safety-sm" onclick="navTo('screen-dashboard')">
        👷 ${appState.user.name.split(' ')[0]} (Dashboard)
      </button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-safety-sm" onclick="openLoginModal()">Masuk Portal →</button>
    `;
  }
}

/* ─── MODAL LOGIN & PENDATAAN (WITH GSAP) ─── */
function openLoginModal() {
  const modal = document.getElementById('modal-login');
  if (!modal) return;
  modal.classList.remove('hidden');
  
  const card = modal.querySelector('.modal-card');
  gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.fromTo(card, 
    { opacity: 0, scale: 0.9, y: 30 }, 
    { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.2)" }
  );
}

function closeLoginModal() {
  const modal = document.getElementById('modal-login');
  if (!modal) return;
  
  const card = modal.querySelector('.modal-card');
  gsap.to(card, { opacity: 0, scale: 0.95, y: 10, duration: 0.2 });
  gsap.to(modal, { 
    opacity: 0, 
    duration: 0.2, 
    delay: 0.1,
    onComplete: () => modal.classList.add('hidden') 
  });
}

function submitLoginData() {
  const name = document.getElementById('input-name').value.trim();
  const nik = document.getElementById('input-nik').value.trim();
  const dept = document.getElementById('input-dept').value;

  if (!name || !nik) {
    alert('Harap isi Nama Lengkap dan NIK terlebih dahulu!');
    return;
  }

  appState.user = { name, nik, dept };
  saveState();
  closeLoginModal();
  renderDashboard();
  navTo('screen-dashboard');
}

function confirmResetData() {
  if (confirm('Apakah Anda yakin ingin mengakhiri sesi/reset data pelatihan? Seluruh progres akan diulang dari awal.')) {
    localStorage.removeItem(STORAGE_KEY);
    appState = {
      user: { name: '', nik: '', dept: '' },
      completedModules: [false, false, false, false],
      evalScore: 0,
      evalPassed: false
    };
    saveState();
    navTo('screen-home');
  }
}

/* ─── RENDER DASHBOARD ─── */
function renderDashboard() {
  document.getElementById('dash-user-name').textContent = appState.user.name || 'Peserta';
  document.getElementById('dash-user-nik').textContent = 'NIK: ' + (appState.user.nik || '-');
  document.getElementById('dash-user-dept').textContent = 'Unit: ' + (appState.user.dept || '-');

  // Count Completed
  const completedCount = appState.completedModules.filter(Boolean).length;
  const pct = Math.round((completedCount / 4) * 100);

  // GSAP Counter Animation for Progress
  const circleObj = { val: 0 };
  const circleEl = document.getElementById('dash-circle-pct');
  gsap.to(circleObj, {
    val: pct,
    duration: 1,
    ease: "power2.out",
    onUpdate: function() {
      if (circleEl) circleEl.textContent = Math.round(circleObj.val) + '%';
    }
  });
  
  document.getElementById('dash-counter-text').textContent = completedCount + ' dari 4 Modul Completed';

  // Render Rows Status
  for (let i = 1; i <= 4; i++) {
    const row = document.getElementById('mc-' + i);
    const statusEl = document.getElementById('ms-' + i);
    if (!row || !statusEl) continue;

    const isDone = appState.completedModules[i - 1];
    const isUnlocked = i === 1 || appState.completedModules[i - 2];

    row.classList.remove('locked', 'completed');

    if (isDone) {
      row.classList.add('completed');
      statusEl.innerHTML = '<span class="btn-status open" style="color:var(--green-pass);">Selesai ✓</span>';
    } else if (isUnlocked) {
      statusEl.innerHTML = '<span class="btn-status open">Mulai Modul →</span>';
    } else {
      row.classList.add('locked');
      statusEl.innerHTML = '<span class="btn-status locked">🔒 Terkunci</span>';
    }
  }

  // Evaluasi Row (Index 5)
  const evalRow = document.getElementById('mc-5');
  const evalStatus = document.getElementById('ms-5');
  const allModulesDone = appState.completedModules.every(Boolean);

  if (evalRow && evalStatus) {
    evalRow.classList.remove('locked', 'completed');
    if (appState.evalPassed) {
      evalRow.classList.add('completed');
      evalStatus.innerHTML = '<span class="btn-status open" style="color:var(--green-pass);">Lulus ✓</span>';
    } else if (allModulesDone) {
      evalStatus.innerHTML = '<span class="btn-status open">Mulai Evaluasi →</span>';
    } else {
      evalRow.classList.add('locked');
      evalStatus.innerHTML = '<span class="btn-status locked">🔒 Terkunci (Selesaikan Modul 1-4)</span>';
    }
  }
}

function openModule(modNum) {
  if (modNum > 1 && modNum <= 4 && !appState.completedModules[modNum - 2]) {
    alert('Modul ini masih terkunci. Selesaikan modul sebelumnya terlebih dahulu!');
    return;
  }

  if (modNum === 5) {
    if (!appState.completedModules.every(Boolean)) {
      alert('Evaluasi Akhir masih terkunci. Selesaikan keempat modul terlebih dahulu!');
      return;
    }
    startEvaluation();
    navTo('screen-eval');
    return;
  }

  navTo('screen-mod' + modNum);

  // Initialize Module 1 Quiz Formatif
  if (modNum === 1) renderQuizModul1();
}

/* ─── SLIDE NAVIGATION (WITH GSAP) ─── */
function goSlide(modNum, slideTarget) {
  const modScreen = document.getElementById('screen-mod' + modNum);
  if (!modScreen) return;

  const currentSlide = modScreen.querySelector('.slide-card.active');
  const targetSlide = document.getElementById(`m${modNum}s${slideTarget}`);
  
  if (!targetSlide || currentSlide === targetSlide) return;

  // Animate Slide Change
  gsap.to(currentSlide, {
    opacity: 0,
    x: -20,
    duration: 0.2,
    onComplete: () => {
      currentSlide.classList.remove('active');
      
      targetSlide.classList.add('active');
      gsap.fromTo(targetSlide, 
        { opacity: 0, x: 20 }, 
        { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  });

  const counter = document.getElementById(`m${modNum}-counter`);
  if (counter) {
    const totalSlides = modScreen.querySelectorAll('.slide-card').length;
    counter.textContent = slideTarget + ' / ' + totalSlides;
  }
}

/* ─── KUIS FORMATIF MODUL 1 ─── */
const quizMod1Data = [
  {
    q: "Apa landasan utama penerapan Keselamatan Kerja di Indonesia?",
    options: ["UU No. 1 Tahun 1970", "PP No. 50 Tahun 2012", "Permenaker No. 8/2020"],
    answer: 0
  },
  {
    q: "Aturan spesifikasi APD & kewajiban pengusaha memfasilitasi APD diatur dalam?",
    options: ["UU No. 13/2003", "Permenakertrans PER.08/MEN/VII/2010", "UU Cipta Kerja"],
    answer: 1
  }
];

let quizM1Answers = {};

function renderQuizModul1() {
  const container = document.getElementById('quiz-m1-container');
  if (!container) return;

  container.innerHTML = quizMod1Data.map((qItem, qIdx) => `
    <div class="q-box-clean">
      <div class="q-text">${qIdx + 1}. ${qItem.q}</div>
      <div class="q-options-clean">
        ${qItem.options.map((opt, oIdx) => `
          <button class="q-opt-btn ${quizM1Answers[qIdx] === oIdx ? 'selected' : ''}" 
                  onclick="selectQuizM1Option(${qIdx}, ${oIdx})">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('') + `
    <div style="margin-top:16px; text-align:right;">
      <button class="btn-safety-sm" onclick="finishModule1()">Verifikasi &amp; Selesaikan Modul 1 ✅</button>
    </div>
  `;
}

function selectQuizM1Option(qIdx, oIdx) {
  quizM1Answers[qIdx] = oIdx;
  renderQuizModul1();
}

function finishModule1() {
  if (Object.keys(quizM1Answers).length < quizMod1Data.length) {
    alert('Harap jawab semua soal kuis formatif terlebih dahulu!');
    return;
  }

  appState.completedModules[0] = true;
  saveState();
  renderDashboard();
  alert('Selamat! Modul 1 diselesaikan. Modul 2 sekarang terbuka.');
  navTo('screen-dashboard');
}

/* ─── SIMULASI MODUL 2 (HAZARD SPOTTING) ─── */
function clickHazardItem(element) {
  element.classList.toggle('selected');
}

function verifyHazardSim() {
  const items = document.querySelectorAll('#hazard-spotting-items .hsi-card');
  let score = 0;
  let totalHazards = 0;

  items.forEach(item => {
    const isHazard = item.dataset.hazard === 'true';
    const isSelected = item.classList.contains('selected');

    if (isHazard) totalHazards++;

    if (isHazard && isSelected) {
      item.classList.add('correct-ans');
      score++;
    } else if (isHazard && !isSelected) {
      item.classList.add('wrong-ans');
    } else if (!isHazard && isSelected) {
      item.classList.add('wrong-ans');
    }
  });

  const feedback = document.getElementById('haz-sim-feedback');
  feedback.classList.remove('hidden', 'pass', 'fail');

  // GSAP Pop Animation for feedback
  gsap.fromTo(feedback, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" });

  if (score === totalHazards) {
    feedback.classList.add('pass');
    feedback.textContent = '✅ SEMPURNA! Anda berhasil menemukan seluruh 5 titik potensi bahaya dengan tepat!';
    
    appState.completedModules[1] = true;
    saveState();
    renderDashboard();

    setTimeout(() => {
      alert('Selamat! Modul 2 diselesaikan. Modul 3 sekarang terbuka.');
      navTo('screen-dashboard');
    }, 2000);
  } else {
    feedback.classList.add('fail');
    feedback.textContent = `⚠️ Anda menemukan ${score} dari ${totalHazards} bahaya. Periksa item merah dan coba lagi!`;
  }
}

/* ─── SIMULASI MODUL 3 (APD SELECT) ─── */
function toggleAPDSelect(element) {
  element.classList.toggle('selected');
}

function verifyAPDSelect() {
  const items = document.querySelectorAll('#apd-select-grid .acg-item');
  let correct = true;

  items.forEach(item => {
    const isReq = item.dataset.required === 'true';
    const isSel = item.classList.contains('selected');

    if ((isReq && !isSel) || (!isReq && isSel)) {
      correct = false;
    }
  });

  const feedback = document.getElementById('apd-feedback-clean');
  feedback.classList.remove('hidden', 'pass', 'fail');
  
  // GSAP Pop Animation for feedback
  gsap.fromTo(feedback, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" });

  if (correct) {
    feedback.classList.add('pass');
    feedback.textContent = '✅ APD LENGKAP & SPESIFIKASI SESUAI PER.08/MEN/VII/2010!';
    
    appState.completedModules[2] = true;
    saveState();
    renderDashboard();

    setTimeout(() => {
      alert('Selamat! Modul 3 diselesaikan. Modul 4 sekarang terbuka.');
      navTo('screen-dashboard');
    }, 2000);
  } else {
    feedback.classList.add('fail');
    feedback.textContent = '⚠️ Pilihan APD kurang tepat. Pastikan hanya memilih APD Wajib K3 Bongkar Muat (Helm, Sepatu, Rompi, Sarung Tangan)!';
  }
}

/* ─── FINISH MODUL 4 ─── */
function finishModule4() {
  appState.completedModules[3] = true;
  saveState();
  renderDashboard();
  alert('Selamat! Seluruh 4 Modul GBIM telah diselesaikan. Evaluasi Akhir sekarang terbuka!');
  navTo('screen-dashboard');
}

/* ─── EVALUASI AKHIR (10 SOAL UJI KOMPETENSI) ─── */
const evalQuestions = [
  {
    q: "Landasan hukum utama Keselamatan Kerja di Indonesia adalah...",
    options: ["UU No. 1 Tahun 1970", "PP No. 50 Tahun 2012", "Permenaker No. 8/2020", "UU Cipta Kerja"],
    ans: 0
  },
  {
    q: "Aturan spesifikasi APD dan kewajiban pengusaha menyediakannya secara gratis diatur dalam...",
    options: ["Permenaker No. 5/2018", "Permenakertrans PER.08/MEN/VII/2010", "UU No. 13/2003", "PP No. 50/2012"],
    ans: 1
  },
  {
    q: "Perbedaan utama antara Hazard (Bahaya) dan Risk (Risiko) adalah...",
    options: [
      "Hazard adalah konsekuensi, Risk adalah penyebab",
      "Hazard adalah sumber potensi cedera, Risk adalah probabilitas & tingkat keparahan dampak",
      "Keduanya memiliki arti yang persis sama",
      "Hazard hanya ada di jalan raya"
    ],
    ans: 1
  },
  {
    q: "Batas beban maksimum pengangkatan manual (Manual Handling) tanpa alat bantu adalah...",
    options: ["10 kg", "15 kg", "25 kg", "50 kg"],
    ans: 2
  },
  {
    q: "Prinsip STOP-THINK-ACT diterapkan ketika pekerja...",
    options: [
      "Melihat tumpukan miring atau kondisi berbahaya di lapangan",
      "Hendak makan siang",
      "Menerima gaji bulanan",
      "Mengisi absensi pagi"
    ],
    ans: 0
  },
  {
    q: "Apa yang dimaksud dengan kejadan Near-Miss (Hampir Celaka)?",
    options: [
      "Kecelakaan yang menyebabkan luka parah",
      "Kejadian yang berpotensi celaka tetapi tidak menimbulkan cedera",
      "Tindakan pelanggaran jam kerja",
      "Kerusakan mesin berat"
    ],
    ans: 1
  },
  {
    q: "Protokol Eye Contact wajib dilakukan sebelum...",
    options: [
      "Mengabaikan operator",
      "Menyeberangi jalur pergerakan forklift / truk",
      "Membuka pintu gerbang",
      "Mengganti rompi menyala"
    ],
    ans: 1
  },
  {
    q: "Postur tubuh yang benar saat mengangkat muatan berat dari lantai adalah...",
    options: [
      "Membungkukkan punggung dengan lutut lurus",
      "Menekuk lutut dan bertumpu pada kekuatan otot kaki",
      "Memutar pinggang saat membawa beban",
      "Mengangkat sambil berlari"
    ],
    ans: 1
  },
  {
    q: "Dalam prosedur P3K, tindakan yang DILARANG pada korban cedera berat adalah...",
    options: [
      "Memeriksa kesadaran",
      "Memindahkan posisi korban secara sembarangan",
      "Menghubungi ambulans",
      "Mencatat kronologi kejadian"
    ],
    ans: 1
  },
  {
    q: "Permenaker No. 8 Tahun 2020 mengatur tentang K3 pada...",
    options: [
      "Pekerjaan Ketinggian",
      "Pesawat Angkat & Pesawat Angkut (Crane, Forklift)",
      "Bahan Kimia Berbahaya",
      "Kebisingan Lingkungan Kerja"
    ],
    ans: 1
  }
];

let currentEvalIdx = 0;
let evalUserAnswers = [];

function startEvaluation() {
  currentEvalIdx = 0;
  evalUserAnswers = [];
  document.getElementById('eval-wrapper').classList.remove('hidden');
  document.getElementById('eval-result-card').classList.add('hidden');
  renderEvalQuestion();
}

function renderEvalQuestion() {
  const q = evalQuestions[currentEvalIdx];
  document.getElementById('eval-q-num').textContent = `Soal ${currentEvalIdx + 1} / ${evalQuestions.length}`;
  document.getElementById('eval-q-text').textContent = q.q;

  const fill = document.getElementById('eval-progress-fill');
  gsap.to(fill, { width: Math.round(((currentEvalIdx + 1) / evalQuestions.length) * 100) + '%', duration: 0.4 });

  const container = document.getElementById('eval-options-container');
  container.innerHTML = q.options.map((opt, oIdx) => `
    <button class="q-opt-btn ${evalUserAnswers[currentEvalIdx] === oIdx ? 'selected' : ''}"
            onclick="selectEvalOption(${oIdx})">
      ${opt}
    </button>
  `).join('');

  // Animate options staggering in
  gsap.fromTo('.q-opt-btn', {opacity: 0, x: 20}, {opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power2.out"});

  document.getElementById('eval-question-feedback').classList.add('hidden');
  document.getElementById('btn-next-eval-q').classList.add('hidden');
}

function selectEvalOption(oIdx) {
  evalUserAnswers[currentEvalIdx] = oIdx;
  renderEvalQuestion();

  // Show Next Button
  const btnNext = document.getElementById('btn-next-eval-q');
  btnNext.classList.remove('hidden');
  btnNext.textContent = currentEvalIdx === evalQuestions.length - 1 ? 'Lihat Hasil Evaluasi →' : 'Soal Berikutnya →';
  gsap.fromTo(btnNext, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.3});
}

function nextEvalQuestion() {
  if (currentEvalIdx < evalQuestions.length - 1) {
    currentEvalIdx++;
    renderEvalQuestion();
  } else {
    calculateEvalScore();
  }
}

function calculateEvalScore() {
  let score = 0;
  evalQuestions.forEach((q, idx) => {
    if (evalUserAnswers[idx] === q.ans) {
      score += 10;
    }
  });

  appState.evalScore = score;
  appState.evalPassed = score >= 70;
  saveState();
  renderDashboard();

  document.getElementById('eval-wrapper').classList.add('hidden');
  const resultCard = document.getElementById('eval-result-card');
  resultCard.classList.remove('hidden');
  
  gsap.fromTo(resultCard, {opacity: 0, scale: 0.95}, {opacity: 1, scale: 1, duration: 0.5, ease: "power2.out"});

  // Animate the score number
  const scoreObj = { val: 0 };
  const scoreEl = document.getElementById('eval-final-score');
  gsap.to(scoreObj, {
    val: score,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: function() {
      scoreEl.textContent = Math.round(scoreObj.val);
    }
  });

  const title = document.getElementById('eval-result-title');
  const desc = document.getElementById('eval-result-desc');
  const certBtn = document.getElementById('btn-view-cert');

  if (appState.evalPassed) {
    title.textContent = '🎉 LULUS - TERKUALIFIKASI K3';
    desc.textContent = `Selamat! Anda meraih skor ${score}/100 dan dinyatakan KOMPETEN dalam K3 Bongkar Muat.`;
    certBtn.classList.remove('hidden');
    renderCertificate();
  } else {
    title.textContent = '⚠️ BELUM LULUS (Skor Min. 70)';
    desc.textContent = `Skor Anda adalah ${score}/100. Pelajari kembali materi modul dan silakan ulangi evaluasi.`;
    certBtn.classList.add('hidden');
  }
}

function retakeEvaluation() {
  startEvaluation();
}

/* ─── RENDER CERTIFICATE ─── */
function renderCertificate() {
  document.getElementById('cert-user-name').textContent = appState.user.name.toUpperCase();
  document.getElementById('cert-user-nik').textContent = 'NIK: ' + appState.user.nik;
  document.getElementById('cert-user-dept').textContent = 'Unit: ' + appState.user.dept;
  document.getElementById('cert-final-score-val').textContent = appState.evalScore;

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('cert-date-val').textContent = dateStr;
  document.getElementById('cert-doc-no').textContent = `CERT/K3-BM/${today.getFullYear()}/${appState.user.nik}`;
}

/* ─── INIT APP ─── */
document.addEventListener('DOMContentLoaded', () => {
  updateNavUserArea();
  renderDashboard();
  
  // Basic load animation for home screen
  gsap.fromTo('.hero-content > *', {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out"});
  gsap.fromTo('.hero-card-preview', {opacity: 0, x: 20}, {opacity: 1, x: 0, duration: 0.6, ease: "power2.out", delay: 0.3});
});
