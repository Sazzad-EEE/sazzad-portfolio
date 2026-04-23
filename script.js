/* ═══════════════════════════════════════════
   PORTFOLIO — script.js
═══════════════════════════════════════════ */

/* ── IndexedDB helper ── */
const DB_NAME = 'sazzad_portfolio_db';
const DB_VER  = 1;

async function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files'))
        db.createObjectStore('files', { keyPath: 'key' });
    };
    r.onsuccess = e => resolve(e.target.result);
    r.onerror   = e => reject(e.target.error);
  });
}
async function getFile(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction('files','readonly').objectStore('files').get(key);
    r.onsuccess = e => resolve(e.target.result?.data);
    r.onerror   = e => reject(e.target.error);
  });
}

/* ── Default content (from CV) ── */
const DEFAULTS = {
  heroBadge:    'Publication Under Review · Open to Fully Funded MS/PhD',
  heroFirstName:'MD. Sazzad',
  heroLastName: 'Hossain',
  heroTagline:  'EEE Graduate · Digital Twin Researcher · Edge AI · Renewable Energy Systems',
  typeRoles:    ['Electrical Engineer', 'Digital Twin Researcher', 'Edge AI Developer', 'Renewable Energy Systems Engineer'],
  profileImgUrl:'profile.png',
  aboutPara1:   "I am Md. Sazzad Hossain, an Electrical & Electronic Engineering graduate from American International University-Bangladesh with versatile skills spanning practical electrical work and modern engineering tools. My research interests lie at the intersection of physics-informed machine learning, edge computing, and smart energy systems.",
  aboutPara2:   'With a publication under review at TENSYMP and industry experience at Energypac Engineering Ltd., I bridge academic research with real-world engineering. My goal is to grow as a well-rounded professional — adapting to new challenges and pursuing impactful graduate research.',
  chipEmailText:'md.sazzad.eee@gmail.com',
  chipPhoneText:'+880 01303-337052',
  chipLocation: 'Banani, Dhaka, Bangladesh',
  cEmail:       'md.sazzad.eee@gmail.com',
  cPhone:       '+880 01303-337052',
  cLocation:    'Banani, Block-B, Road 23/A, House 09, Dhaka 1213',
  cvUrl:        'CV_Sazzad_Hossain.pdf',
  projects: [
    {
      id: 1,
      title: 'Intelligent Edge Computing System for AI-Based Motion Detection',
      desc:  'Designed an edge computing system using Raspberry Pi 5, AI Camera Module, and Vision Kit for on-device computer vision. Sequential frame analysis detects motion events and triggers automated responses — no cloud dependency.',
      tags:  ['Raspberry Pi 5', 'OpenCV', 'Python', 'Edge AI', 'Computer Vision'],
      imgUrl: '',
      link:   ''
    },
    {
      id: 2,
      title: 'Physics-Informed Digital Twin for Multi-Inverter PV Systems',
      desc:  'Developed a self-calibrating digital twin framework with residual learning, conformal uncertainty quantification, and online calibration for multi-inverter photovoltaic systems. Achieved inverter-level anomaly detection using real-world plant data. (Publication under review at TENSYMP 2026)',
      tags:  ['Python', 'TensorFlow', 'Digital Twin', 'Conformal Prediction', 'PV Systems'],
      imgUrl: '',
      link:   ''
    },
    {
      id: 3,
      title: 'Transmission Line Fault Detection & Analysis System',
      desc:  'Designed an intelligent fault detection system for transmission lines using current sensing, RMS calculations, and conditional logic for automated system alerts and analysis.',
      tags:  ['MATLAB', 'Proteus', 'Arduino', 'Signal Processing'],
      imgUrl: '',
      link:   ''
    }
  ]
};

let DATA = {};

function loadData() {
  try {
    const saved = localStorage.getItem('sazzad_portfolio_data');
    DATA = saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    DATA = { ...DEFAULTS };
  }
}

/* ── Apply data to DOM ── */
async function applyData() {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
  const setHref = (id, href) => { const el = document.getElementById(id); if (el && href) el.href = href; };

  set('heroBadge', DATA.heroBadge);
  set('heroFirstName', DATA.heroFirstName);
  set('heroLastName', DATA.heroLastName);
  set('heroTagline', DATA.heroTagline);
  set('aboutPara1', DATA.aboutPara1);
  set('aboutPara2', DATA.aboutPara2);
  set('chipEmailText', DATA.chipEmailText);
  set('chipPhoneText', DATA.chipPhoneText);
  set('chipLocation', DATA.chipLocation);
  set('cEmail', DATA.cEmail);
  set('cPhone', DATA.cPhone);
  set('cLocation', DATA.cLocation);

  setHref('chipEmail', 'mailto:' + DATA.chipEmailText);
  setHref('chipPhone', 'tel:' + (DATA.chipPhoneText || '').replace(/[^+\d]/g,''));
  setHref('contactEmailBtn', 'mailto:' + DATA.cEmail);

  /* update contact section anchors */
  const cEmailEl = document.querySelector('#contact a[href^="mailto"]');
  const cPhoneEl = document.querySelector('#contact a[href^="tel"]');
  if (cEmailEl && DATA.cEmail) cEmailEl.href = 'mailto:' + DATA.cEmail;
  if (cPhoneEl && DATA.cPhone) cPhoneEl.href = 'tel:' + DATA.cPhone.replace(/[^+\d]/g,'');

  /* CV button */
  const cvBtns = [document.getElementById('navCvBtn'), document.getElementById('cvDownloadBtn')];
  const cvFileData = await getFile('cv_file').catch(() => null);
  cvBtns.forEach(btn => {
    if (!btn) return;
    if (cvFileData) {
      btn.href = cvFileData; btn.download = 'Sazzad_Hossain_CV.pdf'; btn.target = '_blank';
    } else if (DATA.cvUrl) {
      btn.href = DATA.cvUrl; btn.download = 'Sazzad_Hossain_CV.pdf';
    } else {
      btn.addEventListener('click', e => { e.preventDefault(); alert('CV not uploaded yet. Check back soon!'); });
    }
  });

  /* Profile image */
  const profileImg  = document.getElementById('profileImg');
  const placeholder = document.getElementById('photoPlaceholder');
  const imgData = await getFile('profile_image').catch(() => null);
  const imgUrl  = imgData || DATA.profileImgUrl || '';
  if (imgUrl && profileImg) {
    profileImg.src = imgUrl;
    profileImg.classList.remove('hidden');
    if (placeholder) placeholder.style.display = 'none';
  }

  /* Projects */
  renderProjects();
}

async function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const projects = DATA.projects || DEFAULTS.projects;
  grid.innerHTML = '';

  for (const p of projects) {
    const imgData = await getFile('proj_img_' + p.id).catch(() => null);
    const imgSrc  = imgData || p.imgUrl || '';

    const card = document.createElement('div');
    card.className = 'proj-card reveal tilt-card';
    card.innerHTML = `
      <div class="proj-img-wrap">
        ${imgSrc
          ? `<img class="proj-img" src="${imgSrc}" alt="${p.title}" />`
          : `<div class="proj-placeholder"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>`
        }
        <div class="proj-overlay">
          <span class="proj-view-btn">${p.link ? 'View Details' : 'Project Info'}</span>
        </div>
      </div>
      <div class="proj-body">
        <div class="proj-tags">${(p.tags||[]).map(t=>`<span class="proj-tag">${t}</span>`).join('')}</div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
      </div>`;

    /* Lightbox on image click */
    if (imgSrc) {
      card.querySelector('.proj-overlay').addEventListener('click', () => openLightbox(imgSrc));
    } else if (p.link) {
      card.querySelector('.proj-overlay').addEventListener('click', () => window.open(p.link,'_blank'));
    }

    /* 3D tilt */
    initTilt(card);
    grid.appendChild(card);
  }

  /* Re-trigger reveal observer on new cards */
  grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Lightbox ── */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lbImg').src = src;
  lb.classList.add('open');
}
document.getElementById('lbClose').addEventListener('click', () => {
  document.getElementById('lightbox').classList.remove('open');
});
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

/* ══════════════════════════════════════════
   LOADER
══════════════════════════════════════════ */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 1500);
});

/* ══════════════════════════════════════════
   CUSTOM CURSOR + PARTICLES
══════════════════════════════════════════ */
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left  = mx + 'px';
  dot.style.top   = my + 'px';
  spawnParticle(mx, my);
});
document.addEventListener('mousedown', () => { dot.classList.add('clicked'); ring.classList.add('clicked'); });
document.addEventListener('mouseup',   () => { dot.classList.remove('clicked'); ring.classList.remove('clicked'); });

/* Ring follows with lag */
function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

/* Hover state */
document.querySelectorAll('a, button, .magnetic, .glass-card, .proj-card, .res-card, .ach-card, .tl-card').forEach(el => {
  el.addEventListener('mouseenter', () => { dot.classList.add('hovered'); ring.classList.add('hovered'); });
  el.addEventListener('mouseleave', () => { dot.classList.remove('hovered'); ring.classList.remove('hovered'); });
});

/* Particle trail */
const canvas = document.getElementById('particleCanvas');
const ctx    = canvas.getContext('2d');
let particles = [];

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

function spawnParticle(x, y) {
  particles.push({ x, y, vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5-0.5, size: Math.random()*3+1, life: 1 });
  if (particles.length > 60) particles.shift();
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0.02);
  particles.forEach(p => {
    p.life -= 0.04; p.x += p.vx; p.y += p.vy; p.size *= 0.96;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0, 212, 255, ${p.life * 0.5})`;
    ctx.fill();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ══════════════════════════════════════════
   HERO MOUSE PARALLAX
══════════════════════════════════════════ */
const hero = document.querySelector('.hero');
if (hero) {
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    document.querySelectorAll('.parallax-layer').forEach(layer => {
      const d = parseFloat(layer.dataset.depth);
      layer.style.transform = `translate(${dx * d * 60}px, ${dy * d * 60}px)`;
    });
  });
}

/* ══════════════════════════════════════════
   TYPING ANIMATION
══════════════════════════════════════════ */
function startTyping(roles) {
  const el = document.getElementById('typeText');
  if (!el) return;
  let ri = 0, ci = 0, deleting = false;
  function tick() {
    const role = roles[ri % roles.length];
    if (!deleting) {
      el.textContent = role.slice(0, ++ci);
      if (ci === role.length) { deleting = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = role.slice(0, --ci);
      if (ci === 0) { deleting = false; ri++; }
    }
    setTimeout(tick, deleting ? 50 : 100);
  }
  tick();
}

/* ══════════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════════ */
function animateCounters() {
  document.querySelectorAll('.count').forEach(el => {
    const target  = parseFloat(el.dataset.target);
    const decimal = parseInt(el.dataset.decimal || 0);
    const dur = 1800;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * ease).toFixed(decimal);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ══════════════════════════════════════════
   SCROLL REVEAL (Intersection Observer)
══════════════════════════════════════════ */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    /* Skill bars */
    entry.target.querySelectorAll('.sk-bar').forEach(bar => {
      bar.style.setProperty('--tw', bar.dataset.w);
      bar.classList.add('animated');
    });
    /* GPA bars */
    entry.target.querySelectorAll('.gpa-bar').forEach(bar => bar.classList.add('animated'));
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* Also observe entire tl-card for GPA bar animation */
document.querySelectorAll('.tl-card').forEach(card => observer.observe(card));

/* ══════════════════════════════════════════
   HERO COUNTER (triggered on page load)
══════════════════════════════════════════ */
const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCounters(); heroObserver.disconnect(); }
  });
}, { threshold: 0.5 });
const heroSec = document.querySelector('.hero');
if (heroSec) heroObserver.observe(heroSec);

/* ══════════════════════════════════════════
   NAV SCROLL STATE & ACTIVE LINK
══════════════════════════════════════════ */
const nav = document.getElementById('nav');
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  let cur = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) cur = s.id;
  });
  document.querySelectorAll('.nl').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + cur);
  });
});

/* ── Mobile nav ── */
document.getElementById('navBurger').addEventListener('click', function() {
  this.classList.toggle('open');
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('.nl').forEach(l => {
  l.addEventListener('click', () => {
    document.getElementById('navBurger').classList.remove('open');
    document.getElementById('navLinks').classList.remove('open');
  });
});

/* ══════════════════════════════════════════
   3D TILT EFFECT
══════════════════════════════════════════ */
function initTilt(card) {
  card.addEventListener('mousemove', e => {
    const r   = card.getBoundingClientRect();
    const x   = e.clientX - r.left - r.width  / 2;
    const y   = e.clientY - r.top  - r.height / 2;
    const rx2 = (-y / (r.height/2)) * 8;
    const ry2 = ( x / (r.width /2)) * 8;
    card.style.transform = `perspective(600px) rotateX(${rx2}deg) rotateY(${ry2}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}
document.querySelectorAll('.glass-card, .proj-card').forEach(initTilt);

/* ══════════════════════════════════════════
   MAGNETIC BUTTONS
══════════════════════════════════════════ */
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width  / 2);
    const dy = e.clientY - (r.top  + r.height / 2);
    btn.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
loadData();
applyData().then(() => {
  startTyping(DATA.typeRoles || DEFAULTS.typeRoles);
});
