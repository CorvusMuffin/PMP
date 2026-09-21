/* ============================================================
   K3 BONGKAR MUAT – MULTIMEDIA INTERAKTIF
   app.js – All Application Logic
   ============================================================ */

'use strict';

/* ─── STATE ─── */
const state = {
  user: { name: '', unit: '', date: '' },
  modulesDone: [false, false, false, false],
  evalScore: 0,
  qqScores: [0, 0, 0],
  currentQQIndex: 0,
  currentEvalQ: 0,
  evalAnswers: [],
  hazardFound: 0,
  hazardTimer: null,
  hazardSeconds: 0,
  hazardGameActive: false,
};

/* ─── SCREEN NAVIGATION ─── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    // Scroll to top
    target.scrollTop = 0;
  }
  updateProgress();
}

/* ─── PARTICLES (Landing) ─── */
function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 2 + Math.random() * 4;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${40 + Math.random() * 55}%;
      --dur:${6 + Math.random() * 8}s;
      --delay:${Math.random() * 6}s;
    `;
    container.appendChild(p);
  }
}

/* ─── PROFILE ─── */
function submitProfile() {
  const name = document.getElementById('inp-name').value.trim();
  const unit = document.getElementById('inp-unit').value.trim();
  const date = document.getElementById('inp-date').value;

  if (!name) {
    showModal('⚠️', 'Nama Wajib Diisi', 'Masukkan nama lengkap Anda sebelum melanjutkan.');
    return;
  }

  state.user.name = name;
  state.user.unit = unit || 'Divisi Bongkar Muat';
  state.user.date = date || new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });

  // Update user chip
  document.getElementById('user-chip').textContent = '👷 ' + name.split(' ')[0];

  showScreen('screen-modules');
}

/* ─── PROGRESS BAR ─── */
function updateProgress() {
  const done = state.modulesDone.filter(Boolean).length;
  const pct  = Math.round((done / 4) * 100);
  const fill = document.getElementById('progress-fill');
  const lbl  = document.getElementById('progress-label');
  if (fill) fill.style.width = pct + '%';
  if (lbl)  lbl.textContent  = pct + '% Selesai';
}

/* ─── MODULE UNLOCK ─── */
function updateModuleCards() {
  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById('mc-' + i);
    const stat = document.getElementById('ms-' + i);
    if (!card) continue;
    const done = state.modulesDone[i - 1];
    const unlocked = i === 1 || state.modulesDone[i - 2];
    if (done) {
      card.classList.remove('locked');
      card.classList.add('completed');
      stat.textContent = '✅';
    } else if (unlocked) {
      card.classList.remove('locked', 'completed');
      stat.textContent = '→';
    } else {
      card.classList.add('locked');
      card.classList.remove('completed');
      stat.textContent = '🔒';
    }
  }
  updateProgress();
}

function startModule(n) {
  if (n > 1 && !state.modulesDone[n - 2]) {
    showModal('🔒', 'Modul Terkunci', 'Selesaikan Modul ' + (n - 1) + ' terlebih dahulu untuk membuka modul ini.');
    return;
  }
  showScreen('screen-mod' + n);
}

function completeModule(n) {
  state.modulesDone[n - 1] = true;
  updateModuleCards();
  showScreen('screen-modules');
  if (n < 4) {
    setTimeout(() => {
      showModal('🎉', 'Modul ' + n + ' Selesai!', 'Selamat! Modul ' + n + ' telah diselesaikan. Modul berikutnya kini terbuka!');
    }, 100);
  }
}

/* ═══════════════════════════════════════════
   MODULE 1 – APD Slides
═══════════════════════════════════════════ */
function nextSlide(mod, slideNum) {
  const allSlides = document.querySelectorAll('#screen-' + mod + ' .slide');
  allSlides.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(mod + '-slide-' + slideNum);
  if (target) target.classList.add('active');
  // If last slide was the simulation slide and it was slide 4 (last), no auto-complete
}

function toggleAPD(el) {
  el.classList.toggle('selected');
}

function checkAPD() {
  const items  = document.querySelectorAll('.apd-sim-item');
  const result = document.getElementById('apd-result');
  let missing   = [];
  let wrong     = [];

  items.forEach(item => {
    const required = item.dataset.required === 'true';
    const selected = item.classList.contains('selected');
    const name     = item.querySelector('span:last-child').textContent;
    if (required && !selected) missing.push(name);
    if (!required && selected) wrong.push(name);
  });

  result.classList.remove('hidden', 'pass', 'fail');

  if (missing.length === 0 && wrong.length === 0) {
    result.classList.add('pass');
    result.innerHTML = '✅ Sempurna! Semua APD wajib telah dipilih dengan benar. Karyawan siap bekerja dengan aman!';
    // Complete module after short delay
    setTimeout(() => {
      completeModule(1);
    }, 2200);
  } else {
    result.classList.add('fail');
    let msg = '⚠️ Belum sepenuhnya benar. ';
    if (missing.length)  msg += `APD wajib yang belum dipilih: <strong>${missing.join(', ')}</strong>. `;
    if (wrong.length)    msg += `APD yang tidak boleh dipilih (bukan standar K3): <strong>${wrong.join(', ')}</strong>.`;
    result.innerHTML = msg;
  }
}

/* ═══════════════════════════════════════════
   MODULE 2 – HAZARD SPOTTING
═══════════════════════════════════════════ */
const HAZARDS = {
  1: { icon: '⛑️', title: 'Pekerja Tanpa Helm Safety!', desc: 'Pekerja di area bongkar muat tanpa menggunakan helm safety berisiko cedera kepala parah akibat benda jatuh dari atas kontainer atau crane.' },
  2: { icon: '🏗️', title: 'Pekerja Berdiri di Bawah Beban Crane!', desc: 'Dilarang keras berada di bawah beban yang sedang diangkat. Jika sling putus, beban dapat jatuh dan menyebabkan kematian instan (bahaya struck-by).' },
  3: { icon: '🛢️', title: 'Tumpahan Oli di Lantai Dermaga!', desc: 'Ceceran oli sangat licin dan berpotensi menyebabkan pekerja terpeleset dan jatuh. Wajib segera diberi tanda peringatan dan dibersihkan.' },
  4: { icon: '⚡', title: 'Kabel Listrik Terkelupas!', desc: 'Kabel listrik yang terkelupas atau terputus di area kerja berpotensi menyebabkan korsleting dan sengatan listrik (electrocution) yang fatal.' },
  5: { icon: '🧯', title: 'APAR Kosong / Tidak Berfungsi!', desc: 'APAR harus selalu dalam kondisi prima dengan segel tidak rusak dan tekanan dalam zona hijau. APAR kosong adalah pelanggaran K3 serius.' },
  6: { icon: '🚦', title: 'Tidak Ada Marka Jalur Pejalan Kaki!', desc: 'Area bongkar muat tanpa marka jalur pejalan kaki yang jelas sangat berbahaya. Pekerja berisiko tertabrak forklift atau kendaraan operasional.' },
  7: { icon: '📦', title: 'Kontainer Tumpuk Tidak Stabil / Miring!', desc: 'Kontainer yang ditumpuk miring tanpa twist-lock berpotensi roboh dan menimpa pekerja atau peralatan. Maksimum kemiringan hanya 3 derajat.' },
};

function startHazardGame() {
  document.getElementById('hazard-intro').classList.add('hidden');
  document.getElementById('hazard-game').classList.remove('hidden');
  state.hazardFound    = 0;
  state.hazardSeconds  = 0;
  state.hazardGameActive = true;
  updateHazardScore();
  startHazardTimer();
}

function startHazardTimer() {
  if (state.hazardTimer) clearInterval(state.hazardTimer);
  state.hazardTimer = setInterval(() => {
    if (!state.hazardGameActive) { clearInterval(state.hazardTimer); return; }
    state.hazardSeconds++;
    const m = String(Math.floor(state.hazardSeconds / 60)).padStart(2, '0');
    const s = String(state.hazardSeconds % 60).padStart(2, '0');
    const el = document.getElementById('hazard-timer');
    if (el) el.textContent = `⏱ ${m}:${s}`;
  }, 1000);
}

function updateHazardScore() {
  const el  = document.getElementById('hf2');
  const tot = document.getElementById('hazard-total');
  if (el)  el.textContent = state.hazardFound;
  if (tot) tot.textContent = 7;
}

function hitHazard(id) {
  const hs = document.getElementById('hs-' + id);
  if (!hs || hs.classList.contains('found')) return;
  hs.classList.add('found');
  state.hazardFound++;
  updateHazardScore();

  // Show popup
  const h = HAZARDS[id];
  const popup   = document.getElementById('hazard-popup');
  const hpIcon  = document.getElementById('hp-icon');
  const hpTitle = document.getElementById('hp-title');
  const hpDesc  = document.getElementById('hp-desc');
  if (hpIcon)  hpIcon.textContent  = h.icon;
  if (hpTitle) hpTitle.textContent = h.title;
  if (hpDesc)  hpDesc.textContent  = h.desc;
  if (popup)   popup.classList.remove('hidden');

  // Check completion
  if (state.hazardFound >= 7) {
    state.hazardGameActive = false;
    clearInterval(state.hazardTimer);
    setTimeout(() => {
      popup.classList.add('hidden');
      const complete = document.getElementById('hazard-complete');
      if (complete) {
        complete.classList.remove('hidden');
        const m = String(Math.floor(state.hazardSeconds / 60)).padStart(2, '0');
        const s = String(state.hazardSeconds % 60).padStart(2, '0');
        document.getElementById('hc-time').textContent =
          `Anda menemukan semua 7 bahaya dalam ${m}:${s}. Kerja bagus, pengawas K3!`;
      }
    }, 1500);
  }
}

function closeHazardPopup() {
  const popup = document.getElementById('hazard-popup');
  if (popup) popup.classList.add('hidden');
}

/* ═══════════════════════════════════════════
   MODULE 3 – PROSEDUR
═══════════════════════════════════════════ */
function switchProcTab(num) {
  document.querySelectorAll('.proc-tab').forEach((t, i) => {
    t.classList.toggle('active', i === num - 1);
  });
  document.querySelectorAll('.proc-tab-content').forEach((c, i) => {
    c.classList.toggle('active', i === num - 1);
  });
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  const checkEl = el.querySelector('.cl-check');
  if (el.classList.contains('checked')) {
    checkEl.textContent = '✅';
  } else {
    checkEl.textContent = '○';
  }
}

/* Quick Quiz M3 */
let qqCurrentIndex = 0;
let qqScore = 0;
const qqTotal = 3;

function answerQQ(btn, isCorrect) {
  // Disable all options in current question
  const qqItem = btn.closest('.qq-item');
  const opts   = qqItem.querySelectorAll('.qq-opt');
  opts.forEach(o => {
    o.disabled = true;
    if (o === btn) {
      o.classList.add(isCorrect ? 'correct' : 'incorrect');
    }
  });

  // Mark correct answer green
  if (!isCorrect) {
    opts.forEach(o => {
      if (o.getAttribute('onclick').includes('true')) {
        o.classList.add('correct');
      }
    });
  }

  // Show feedback
  const fbId = 'qf-' + (qqCurrentIndex + 1);
  const fb   = document.getElementById(fbId);
  if (fb) {
    fb.classList.remove('hidden');
    if (isCorrect) {
      fb.className = 'qq-feedback correct-fb';
      fb.textContent = '✅ Benar! Jawaban yang tepat.';
      qqScore++;
    } else {
      fb.className = 'qq-feedback incorrect-fb';
      fb.textContent = '❌ Kurang tepat. Perhatikan kembali materi prosedur K3 di atas.';
    }
  }

  // Next question or complete
  qqCurrentIndex++;
  setTimeout(() => {
    if (qqCurrentIndex < qqTotal) {
      qqItem.classList.remove('active');
      const next = document.getElementById('qq-' + (qqCurrentIndex + 1));
      if (next) next.classList.add('active');
    } else {
      qqItem.classList.remove('active');
      const comp = document.getElementById('qq-complete');
      if (comp) {
        comp.classList.remove('hidden');
        const pct = Math.round((qqScore / qqTotal) * 100);
        document.getElementById('qq-score-text').textContent =
          `Anda menjawab ${qqScore} dari ${qqTotal} soal dengan benar (${pct}%). ` +
          (pct >= 70 ? '🏆 Lanjutkan ke Evaluasi Akhir!' : 'Silakan pelajari ulang materi jika perlu.');
      }
    }
  }, 1400);
}

/* ═══════════════════════════════════════════
   MODULE 4 – EVALUASI AKHIR
═══════════════════════════════════════════ */
const EVAL_QUESTIONS = [
  {
    q: 'Apa singkatan dari APD dalam konteks Keselamatan dan Kesehatan Kerja?',
    opts: ['Alat Pengaman Diri', 'Alat Pelindung Diri', 'Alat Perlengkapan Dinas', 'Alat Pencegah Darurat'],
    ans: 1,
    exp: 'APD adalah Alat Pelindung Diri, yaitu kelengkapan wajib yang digunakan pekerja untuk menjaga keselamatan dan kesehatan di tempat kerja, diatur dalam UU No. 1 Tahun 1970.'
  },
  {
    q: 'Pekerja bongkar muat yang bekerja di ketinggian lebih dari berapa meter WAJIB menggunakan Safety Harness?',
    opts: ['1 meter', '1,5 meter', '2 meter', '3 meter'],
    ans: 2,
    exp: 'Berdasarkan standar K3, pekerja yang bekerja di ketinggian lebih dari 2 meter wajib menggunakan full body harness dengan anchor point yang telah diuji beban minimum 15 kN.'
  },
  {
    q: 'Apa yang harus dilakukan pekerja PERTAMA KALI jika menemukan tumpahan cairan B3 di area kerja?',
    opts: [
      'Langsung membersihkan sendiri dengan kain',
      'Jauhkan semua personel dari area tumpahan dan identifikasi jenis B3',
      'Menutup tumpahan dengan tanah atau pasir',
      'Menghubungi media massa untuk meliput kejadian'
    ],
    ans: 1,
    exp: 'Langkah pertama adalah menjauhkan semua personel dari area tumpahan untuk mencegah paparan dan kecelakaan kedua. Setelah itu, identifikasi jenis B3 dari label atau MSDS.'
  },
  {
    q: 'Berapa kecepatan maksimum forklift yang diperbolehkan di area dermaga/pelabuhan?',
    opts: ['5 km/jam', '10 km/jam', '15 km/jam', '20 km/jam'],
    ans: 1,
    exp: 'Kecepatan maksimum forklift di area pelabuhan adalah 10 km/jam untuk menjamin keselamatan pekerja pejalan kaki dan mencegah kecelakaan tabrakan.'
  },
  {
    q: 'Berapa tumpukan maksimum (tier) kontainer yang diizinkan dalam operasi bongkar muat?',
    opts: ['2 tier', '3 tier', '4 tier', '5 tier'],
    ans: 2,
    exp: 'Standar operasional bongkar muat mengizinkan maksimum 4 tier (4 kontainer ke atas). Kontainer lebih berat harus diletakkan di bagian paling bawah untuk stabilitas.'
  },
  {
    q: 'Nomor telepon darurat yang harus dihubungi saat terjadi kebakaran di area pelabuhan adalah?',
    opts: ['110', '112', '118', '119'],
    ans: 3,
    exp: 'Nomor 119 adalah nomor darurat pemadam kebakaran di Indonesia. Nomor 118 adalah ambulans, 110 adalah polisi, dan 112 adalah nomor darurat umum.'
  },
  {
    q: 'Dokumen apa yang WAJIB dibaca pekerja sebelum menangani kargo Bahan Berbahaya dan Beracun (B3)?',
    opts: [
      'Surat Perintah Kerja (SPK)',
      'Material Safety Data Sheet (MSDS)',
      'Surat Jalan Kargo',
      'Manifest Kargo Biasa'
    ],
    ans: 1,
    exp: 'MSDS (Material Safety Data Sheet) adalah dokumen yang berisi informasi komprehensif tentang sifat fisik/kimia, bahaya, dan cara penanganan aman suatu bahan berbahaya. Wajib dibaca sebelum menangani B3.'
  },
  {
    q: 'Dalam prosedur penanganan kecelakaan kerja, apa yang dimaksud dengan "mencegah kecelakaan kedua"?',
    opts: [
      'Memanggil saksi untuk merekam kejadian',
      'Mengamankan area sekitar lokasi kecelakaan agar tidak ada korban tambahan',
      'Segera melaporkan ke media sosial perusahaan',
      'Memindahkan korban secepat mungkin tanpa prosedur'
    ],
    ans: 1,
    exp: 'Mengamankan lokasi kecelakaan adalah prioritas untuk mencegah korban tambahan. Misalnya, memasang barikade di sekitar area agar pekerja lain tidak masuk dan mengalami bahaya yang sama.'
  },
  {
    q: 'Rompi Hi-Vis (High Visibility) pada area bongkar muat berfungsi utama untuk?',
    opts: [
      'Membuat pekerja terlihat jelas oleh operator alat berat dan kendaraan',
      'Melindungi tubuh dari panas ekstrem',
      'Menjadi identitas divisi/unit kerja',
      'Melindungi dari percikan bahan kimia'
    ],
    ans: 0,
    exp: 'Rompi Hi-Vis (berwarna kuning/oranye terang dengan strip reflektif) berfungsi utama untuk membuat pekerja terlihat jelas, terutama oleh operator crane, forklift, dan kendaraan — mencegah tertabrak (struck-by accidents).'
  },
  {
    q: 'Apa yang dimaksud dengan "Safety Briefing Harian" dalam prosedur kerja K3?',
    opts: [
      'Sesi olahraga bersama sebelum kerja',
      'Pemeriksaan absensi karyawan pagi hari',
      'Pertemuan singkat 10-15 menit untuk menjelaskan risiko dan prosedur keselamatan hari itu',
      'Rapat evaluasi kinerja bulanan'
    ],
    ans: 2,
    exp: 'Safety Briefing Harian adalah pertemuan singkat (10-15 menit) sebelum shift dimulai yang bertujuan menyampaikan risiko kerja hari ini, kondisi alat, dan memastikan seluruh karyawan memahami prosedur keselamatan yang berlaku.'
  },
];

let evalQIndex  = 0;
let evalScore   = 0;
let evalAnswered = false;

function startEval() {
  evalQIndex  = 0;
  evalScore   = 0;
  evalAnswered = false;
  document.getElementById('eval-intro').classList.add('hidden');
  document.getElementById('eval-quiz').classList.remove('hidden');
  renderEvalQ();
}

function renderEvalQ() {
  const q  = EVAL_QUESTIONS[evalQIndex];
  const qEl = document.getElementById('eval-question');
  const oEl = document.getElementById('eval-options');
  const fb  = document.getElementById('eval-feedback');
  const nBtn = document.getElementById('btn-eq-next');
  const prog = document.getElementById('eq-prog-fill');
  const progT= document.getElementById('eq-prog-text');

  evalAnswered = false;
  fb.classList.add('hidden');
  nBtn.classList.add('hidden');

  if (qEl) qEl.textContent = `${evalQIndex + 1}. ${q.q}`;
  if (prog) prog.style.width = ((evalQIndex / EVAL_QUESTIONS.length) * 100) + '%';
  if (progT) progT.textContent = `Soal ${evalQIndex + 1} / ${EVAL_QUESTIONS.length}`;

  if (oEl) {
    const letters = ['A', 'B', 'C', 'D'];
    oEl.innerHTML = q.opts.map((opt, i) => `
      <button class="eval-opt" onclick="answerEval(this, ${i})" id="eval-opt-${i}">
        <span class="opt-letter">${letters[i]}</span> ${opt}
      </button>
    `).join('');
  }
}

function answerEval(btn, idx) {
  if (evalAnswered) return;
  evalAnswered = true;
  const q = EVAL_QUESTIONS[evalQIndex];

  // Disable all
  document.querySelectorAll('.eval-opt').forEach(o => o.disabled = true);

  const isCorrect = idx === q.ans;
  if (isCorrect) {
    btn.classList.add('correct');
    evalScore++;
  } else {
    btn.classList.add('incorrect');
    document.getElementById('eval-opt-' + q.ans)?.classList.add('correct');
  }

  const fb = document.getElementById('eval-feedback');
  if (fb) {
    fb.classList.remove('hidden', 'correct-fb', 'incorrect-fb');
    fb.classList.add(isCorrect ? 'correct-fb' : 'incorrect-fb');
    fb.innerHTML = (isCorrect ? '✅ Benar! ' : '❌ Kurang tepat. ') + q.exp;
  }

  const nBtn = document.getElementById('btn-eq-next');
  if (nBtn) {
    nBtn.classList.remove('hidden');
    nBtn.textContent = evalQIndex < EVAL_QUESTIONS.length - 1 ? 'Soal Berikutnya →' : 'Lihat Hasil →';
  }
}

function nextEvalQ() {
  evalQIndex++;
  if (evalQIndex < EVAL_QUESTIONS.length) {
    renderEvalQ();
  } else {
    showEvalResult();
  }
}

function showEvalResult() {
  document.getElementById('eval-quiz').classList.add('hidden');
  const resultEl = document.getElementById('eval-result');
  resultEl.classList.remove('hidden');

  const score    = Math.round((evalScore / EVAL_QUESTIONS.length) * 100);
  const circle   = document.getElementById('result-circle');
  const scoreEl  = document.getElementById('result-score');
  const titleEl  = document.getElementById('result-title');
  const descEl   = document.getElementById('result-desc');
  const certBtn  = document.getElementById('btn-cert');

  state.evalScore = score;

  if (scoreEl) scoreEl.textContent = score;
  circle.classList.toggle('pass', score >= 70);
  circle.classList.toggle('fail', score < 70);

  if (score >= 70) {
    if (titleEl) titleEl.textContent = '🏆 LULUS! Selamat!';
    if (descEl) descEl.textContent =
      `Anda menjawab ${evalScore} dari ${EVAL_QUESTIONS.length} soal dengan benar (nilai ${score}). ` +
      'Anda dinyatakan KOMPETEN dalam bidang K3 Bongkar Muat. Sertifikat pelatihan Anda telah siap!';
    if (certBtn) certBtn.style.display = 'inline-flex';
    // Mark module 4 done
    state.modulesDone[3] = true;
    updateModuleCards();
    // Prepare certificate
    prepareCertificate(score);
  } else {
    if (titleEl) titleEl.textContent = '❌ Belum Lulus';
    if (descEl) descEl.textContent =
      `Anda menjawab ${evalScore} dari ${EVAL_QUESTIONS.length} soal dengan benar (nilai ${score}). ` +
      'Nilai minimum kelulusan adalah 70. Pelajari kembali materi modul dan coba lagi!';
    if (certBtn) certBtn.style.display = 'none';
  }
}

function retakeEval() {
  document.getElementById('eval-result').classList.add('hidden');
  document.getElementById('eval-intro').classList.remove('hidden');
  document.getElementById('eval-quiz').classList.add('hidden');
}

/* ─── CERTIFICATE ─── */
function prepareCertificate(score) {
  document.getElementById('cert-name').textContent  = state.user.name.toUpperCase();
  document.getElementById('cert-unit').textContent  = state.user.unit;
  document.getElementById('cert-score-val').textContent = score;
  document.getElementById('cert-date').textContent  = state.user.date || new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
}

function downloadCert() {
  // Use html2canvas if available, otherwise guide user
  if (typeof html2canvas !== 'undefined') {
    html2canvas(document.getElementById('cert-card'), { backgroundColor: '#0f2e4a', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'Sertifikat_K3_' + state.user.name.replace(/\s/g, '_') + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  } else {
    showModal(
      '💡',
      'Download Sertifikat',
      'Untuk menyimpan sertifikat ini:\n1. Klik kanan pada area sertifikat\n2. Pilih "Print" atau tekan Ctrl+P\n3. Ubah tujuan ke "Save as PDF"\n4. Klik Simpan.\n\nAtau gunakan screenshot layar untuk menyimpannya sebagai gambar.'
    );
  }
}

/* ═══════════════════════════════════════════
   MODAL SYSTEM
═══════════════════════════════════════════ */
function showModal(icon, title, desc) {
  document.getElementById('modal-icon').textContent  = icon;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Spawn particles
  spawnParticles();

  // Set today's date as default in profile
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  const dateInput = document.getElementById('inp-date');
  if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;

  // Show landing
  showScreen('screen-landing');

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Init proc tabs click handler
  document.querySelectorAll('.proc-tab').forEach((tab, i) => {
    tab.addEventListener('click', () => switchProcTab(i + 1));
  });

  // Quick-quiz reset vars
  qqCurrentIndex = 0;
  qqScore = 0;
});
