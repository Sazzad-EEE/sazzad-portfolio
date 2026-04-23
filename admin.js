/* ═══════════════════════════════════════════
   ADMIN — admin.js
═══════════════════════════════════════════ */

const DEFAULT_PW = 'Sazzad@2025'; /* change via admin Settings after first login */

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
async function saveFile(key, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put({ key, data });
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
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
async function deleteFileDB(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files','readwrite');
    tx.objectStore('files').delete(key);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

/* ── Hash password ── */
async function hashPw(pw) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ── localStorage helpers ── */
function loadData() {
  try { return JSON.parse(localStorage.getItem('sazzad_portfolio_data') || '{}'); }
  catch { return {}; }
}
function saveData(d) { localStorage.setItem('sazzad_portfolio_data', JSON.stringify(d)); }

const DEFAULTS = {
  heroBadge:    'Available for Fully Funded MS/PhD Programs',
  heroFirstName:'MD. Sazzad',
  heroLastName: 'Hossain',
  heroTagline:  'EEE Graduate · Embedded Systems · Renewable Energy · Robotics Research',
  typeRoles:    ['Electrical Engineer','Embedded Systems Developer','Robotics Enthusiast','Renewable Energy Researcher'],
  aboutPara1:   "I'm an Electrical & Electronic Engineering graduate from American International University, Bangladesh, driven by a deep curiosity for embedded systems, intelligent automation, and sustainable energy.",
  aboutPara2:   'As I transition to graduate study, I aim to push boundaries in robotics, smart grid research, and AI-assisted electrical systems.',
  chipEmailText:'hossainmdsazzad0110@gmail.com',
  chipPhoneText:'+8801303-337052',
  chipLocation: 'Banani, Dhaka, Bangladesh',
  cEmail:       'hossainmdsazzad0110@gmail.com',
  cPhone:       '+8801303-337052',
  cLocation:    'Road-23/A, Block-B, Banani, Dhaka',
  cvUrl:        '',
  research: [
    { icon:'🤖', title:'Robotics & Automation', desc:'Intelligent control systems, embedded robotics, and real-time sensor fusion for autonomous applications.' },
    { icon:'☀️', title:'Renewable Energy Systems', desc:'Smart grid integration, off-grid energy optimization with HomerPro, and sustainable power architecture.' },
    { icon:'📊', title:'Electrical Fault Analysis', desc:'Current sensing-based fault localization, RMS signal processing, and ML-enhanced detection.' },
    { icon:'👁️', title:'Computer Vision Applications', desc:'Vision-based automation in transportation safety, object detection, and embedded vision.' },
    { icon:'📡', title:'Embedded & IoT Systems', desc:'Edge computing for sensor networks, real-time data acquisition, and IoT firmware development.' },
    { icon:'🌐', title:'Climate & Digital Technology', desc:'Engineering solutions bridging digital innovation with environmental sustainability.' }
  ],
  projects: [
    { id:1, title:'Transmission Line Fault Detection & Analysis System', desc:'Designed an intelligent fault detection system using current sensing, RMS calculations, and conditional logic for automated alerts.', tags:['MATLAB','Proteus','Arduino'], imgUrl:'', link:'' },
    { id:2, title:'Automatic Railway Gate Control Using Vision Processing', desc:'Computer vision-based railway gate control using Raspberry Pi, enabling automatic detection of train presence for safety.', tags:['Raspberry Pi','Vision Processing','Python'], imgUrl:'', link:'' }
  ]
};

/* ════════════════════════════════
   AUTH
════════════════════════════════ */
async function getStoredHash() {
  const stored = localStorage.getItem('sazzad_pw_hash');
  if (stored) return stored;
  /* First run: compute and persist hash of default password */
  const h = await hashPw(DEFAULT_PW);
  localStorage.setItem('sazzad_pw_hash', h);
  return h;
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const pw   = document.getElementById('pwInput').value;
  const hash = await hashPw(pw);
  const stored = await getStoredHash();
  if (hash === stored) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminApp').classList.add('show');
    initAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});
document.getElementById('pwInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  document.getElementById('adminApp').classList.remove('show');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('pwInput').value = '';
});

/* ════════════════════════════════
   TOAST
════════════════════════════════ */
function toast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (err ? ' error' : '');
  setTimeout(() => { t.className = err ? 'error' : ''; }, 3000);
}

/* ════════════════════════════════
   TAB NAVIGATION
════════════════════════════════ */
const TITLES = { general:'General', about:'About & CV', projects:'Projects', research:'Research Interests', contact:'Contact Info', settings:'Settings' };

document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('tab-' + item.dataset.tab).classList.add('active');
    document.getElementById('tabTitle').textContent = TITLES[item.dataset.tab];
  });
});

/* ════════════════════════════════
   INIT ADMIN
════════════════════════════════ */
function initAdmin() {
  const d = { ...DEFAULTS, ...loadData() };
  fillGeneral(d);
  fillAbout(d);
  fillResearch(d);
  fillProjects(d);
  fillContact(d);
  loadPhotoPreview();
}

/* ── General ── */
function fillGeneral(d) {
  document.getElementById('g-firstName').value = d.heroFirstName || '';
  document.getElementById('g-lastName').value  = d.heroLastName  || '';
  document.getElementById('g-badge').value     = d.heroBadge     || '';
  document.getElementById('g-tagline').value   = d.heroTagline   || '';
  document.getElementById('g-roles').value     = (d.typeRoles || []).join(', ');
}
document.getElementById('saveGeneral').addEventListener('click', () => {
  const d = loadData();
  d.heroFirstName = document.getElementById('g-firstName').value.trim();
  d.heroLastName  = document.getElementById('g-lastName').value.trim();
  d.heroBadge     = document.getElementById('g-badge').value.trim();
  d.heroTagline   = document.getElementById('g-tagline').value.trim();
  d.typeRoles     = document.getElementById('g-roles').value.split(',').map(s => s.trim()).filter(Boolean);
  saveData(d);
  toast('General settings saved!');
});

/* ── About ── */
function fillAbout(d) {
  document.getElementById('a-para1').value = d.aboutPara1 || '';
  document.getElementById('a-para2').value = d.aboutPara2 || '';
  document.getElementById('a-cvUrl').value = d.cvUrl      || '';
}
async function loadPhotoPreview() {
  const img = await getFile('profile_image').catch(() => null);
  if (img) {
    const prev = document.getElementById('photoPreview');
    prev.src = img; prev.style.display = 'block';
  }
}

/* Photo upload */
let pendingPhoto = null;
const photoZone = document.getElementById('photoUploadZone');
const photoInput = document.getElementById('photoInput');
photoZone.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhoto = ev.target.result;
    const prev = document.getElementById('photoPreview');
    prev.src = pendingPhoto; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
});
photoZone.addEventListener('dragover', e => { e.preventDefault(); photoZone.style.borderColor = 'var(--cyan)'; });
photoZone.addEventListener('dragleave', () => { photoZone.style.borderColor = ''; });
photoZone.addEventListener('drop', e => {
  e.preventDefault(); photoZone.style.borderColor = '';
  const file = e.dataTransfer.files[0]; if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhoto = ev.target.result;
    const prev = document.getElementById('photoPreview');
    prev.src = pendingPhoto; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
});
document.getElementById('savePhoto').addEventListener('click', async () => {
  if (!pendingPhoto) { toast('Select a photo first.', true); return; }
  await saveFile('profile_image', pendingPhoto);
  toast('Photo saved!');
});
document.getElementById('deletePhoto').addEventListener('click', async () => {
  await deleteFileDB('profile_image');
  document.getElementById('photoPreview').style.display = 'none';
  pendingPhoto = null;
  toast('Photo removed.');
});

/* CV */
let pendingCvData = null;
const cvZone  = document.getElementById('cvUploadZone');
const cvInput = document.getElementById('cvInput');
cvZone.addEventListener('click', () => cvInput.click());
cvInput.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { pendingCvData = ev.target.result; toast('PDF ready — click "Upload PDF" to save.'); };
  reader.readAsDataURL(file);
});
document.getElementById('saveCv').addEventListener('click', () => {
  const d = loadData();
  d.cvUrl = document.getElementById('a-cvUrl').value.trim();
  saveData(d); toast('CV URL saved!');
});
document.getElementById('saveCvFile').addEventListener('click', async () => {
  if (!pendingCvData) { toast('Select a PDF first.', true); return; }
  const d = loadData(); d.cvUrl = '';
  await saveFile('cv_file', pendingCvData);
  saveData(d); toast('CV PDF uploaded!');
});
document.getElementById('deleteCv').addEventListener('click', async () => {
  await deleteFileDB('cv_file');
  const d = loadData(); d.cvUrl = '';
  document.getElementById('a-cvUrl').value = '';
  saveData(d); toast('CV removed.');
});

document.getElementById('saveBio').addEventListener('click', () => {
  const d = loadData();
  d.aboutPara1 = document.getElementById('a-para1').value.trim();
  d.aboutPara2 = document.getElementById('a-para2').value.trim();
  saveData(d); toast('Bio saved!');
});

/* ── Research ── */
function fillResearch(d) {
  const list  = document.getElementById('researchList');
  const cards = d.research || DEFAULTS.research;
  list.innerHTML = cards.map((c, i) => `
    <div class="proj-item" data-ri="${i}">
      <div class="row" style="margin-bottom:12px">
        <div class="field">
          <label>Icon (emoji)</label>
          <input type="text" class="r-icon" value="${c.icon}" />
        </div>
        <div class="field">
          <label>Title</label>
          <input type="text" class="r-title" value="${escHtml(c.title)}" />
        </div>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea class="r-desc" rows="2">${escHtml(c.desc)}</textarea>
      </div>
    </div>`).join('');
}
document.getElementById('saveResearch').addEventListener('click', () => {
  const d = loadData();
  d.research = Array.from(document.querySelectorAll('#researchList .proj-item')).map(item => ({
    icon:  item.querySelector('.r-icon').value.trim(),
    title: item.querySelector('.r-title').value.trim(),
    desc:  item.querySelector('.r-desc').value.trim()
  }));
  saveData(d); toast('Research cards saved!');
});

/* ── Projects ── */
function fillProjects(d) {
  const projects = d.projects || DEFAULTS.projects;
  renderProjectList(projects);
}

function renderProjectList(projects) {
  const list = document.getElementById('projectsList');
  list.innerHTML = '';
  projects.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'proj-item';
    item.dataset.pid = p.id;
    item.innerHTML = `
      <div class="proj-item-head">
        <h4>${escHtml(p.title)}</h4>
        <div class="proj-actions">
          <button class="btn btn-ghost edit-proj-btn" data-i="${i}">Edit</button>
          <button class="btn btn-red delete-proj-btn"  data-i="${i}">Delete</button>
        </div>
      </div>
      <div class="proj-form" id="pf-${i}">
        <div class="field"><label>Title</label><input type="text" class="pf-title" value="${escHtml(p.title)}" /></div>
        <div class="field"><label>Description</label><textarea class="pf-desc" rows="3">${escHtml(p.desc)}</textarea></div>
        <div class="field">
          <label>Tags</label>
          <div class="tag-input" id="tags-${i}">
            ${(p.tags||[]).map(t=>`<span class="tag-chip">${t}<button data-tag="${t}" class="rm-tag">×</button></span>`).join('')}
            <input type="text" class="tag-text" placeholder="Add tag, press Enter" />
          </div>
        </div>
        <div class="field"><label>Project Link (optional)</label><input type="text" class="pf-link" value="${p.link||''}" /></div>
        <div class="field"><label>Image URL (paste hosted URL)</label><input type="text" class="pf-imgurl" value="${p.imgUrl||''}" /></div>
        <div class="field">
          <label>Or Upload Image</label>
          <div class="upload-zone pf-upload" style="padding:16px">
            <input type="file" class="pf-img-input" accept="image/*" />
            <p>Click to upload project image</p>
          </div>
          <img class="pf-img-preview preview-img" src="${p.imgUrl||''}" style="${p.imgUrl?'':'display:none'}" />
        </div>
        <div class="actions">
          <button class="btn btn-cyan save-proj-btn" data-i="${i}">Save Project</button>
          <button class="btn btn-red del-proj-img-btn" data-i="${i}">Remove Image</button>
        </div>
      </div>`;
    list.appendChild(item);

    /* Edit toggle */
    item.querySelector('.edit-proj-btn').addEventListener('click', () => {
      document.getElementById('pf-'+i).classList.toggle('open');
    });

    /* Delete project */
    item.querySelector('.delete-proj-btn').addEventListener('click', () => {
      if (!confirm('Delete this project?')) return;
      const d = loadData();
      d.projects = (d.projects || DEFAULTS.projects).filter((_,j) => j !== i);
      saveData(d);
      renderProjectList(d.projects);
      toast('Project deleted.');
    });

    /* Tag management */
    const tagWrap  = document.getElementById('tags-'+i);
    const tagInput = tagWrap.querySelector('.tag-text');
    tagWrap.addEventListener('click', () => tagInput.focus());
    tagInput.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ',') && tagInput.value.trim()) {
        e.preventDefault();
        const tag = tagInput.value.trim().replace(/,$/,'');
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${escHtml(tag)}<button class="rm-tag">×</button>`;
        chip.querySelector('.rm-tag').addEventListener('click', () => chip.remove());
        tagWrap.insertBefore(chip, tagInput);
        tagInput.value = '';
      }
    });
    tagWrap.querySelectorAll('.rm-tag').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.tag-chip').remove());
    });

    /* Image upload for project */
    const imgInput   = item.querySelector('.pf-img-input');
    const imgPreview = item.querySelector('.pf-img-preview');
    const uploadZone = item.querySelector('.pf-upload');
    uploadZone.addEventListener('click', () => imgInput.click());
    imgInput.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      new FileReader().onload = ev => { imgPreview.src = ev.target.result; imgPreview.style.display = 'block'; };
      new FileReader().readAsDataURL(file);
      const fr = new FileReader();
      fr.onload = ev => { imgPreview.src = ev.target.result; imgPreview.style.display = 'block'; item._pendingImg = ev.target.result; };
      fr.readAsDataURL(file);
    });

    /* Save project */
    item.querySelector('.save-proj-btn').addEventListener('click', async () => {
      const d   = loadData();
      const proj = (d.projects || DEFAULTS.projects)[i];
      proj.title  = item.querySelector('.pf-title').value.trim();
      proj.desc   = item.querySelector('.pf-desc').value.trim();
      proj.link   = item.querySelector('.pf-link').value.trim();
      proj.imgUrl = item.querySelector('.pf-imgurl').value.trim();
      proj.tags   = Array.from(item.querySelectorAll('.tag-chip'))
                        .map(c => c.childNodes[0].textContent.trim())
                        .filter(Boolean);
      if (item._pendingImg) {
        await saveFile('proj_img_' + proj.id, item._pendingImg);
        proj.imgUrl = ''; /* prefer IndexedDB */
      }
      d.projects[i] = proj;
      saveData(d);
      renderProjectList(d.projects);
      toast('Project saved!');
    });

    /* Remove project image */
    item.querySelector('.del-proj-img-btn').addEventListener('click', async () => {
      const d    = loadData();
      const proj = (d.projects || DEFAULTS.projects)[i];
      await deleteFileDB('proj_img_' + proj.id);
      proj.imgUrl = '';
      d.projects[i] = proj;
      saveData(d);
      toast('Image removed.');
    });
  });
}

/* Add new project */
document.getElementById('addProjectBtn').addEventListener('click', () => {
  const d = loadData();
  d.projects = d.projects || [...DEFAULTS.projects];
  const newId = Date.now();
  d.projects.push({ id: newId, title: 'New Project', desc: '', tags: [], imgUrl: '', link: '' });
  saveData(d);
  renderProjectList(d.projects);
  toast('Project added — click Edit to fill it in.');
});

/* ── Contact ── */
function fillContact(d) {
  document.getElementById('c-email').value    = d.cEmail    || '';
  document.getElementById('c-phone').value    = d.cPhone    || '';
  document.getElementById('c-location').value = d.cLocation || '';
}
document.getElementById('saveContact').addEventListener('click', () => {
  const d = loadData();
  const email    = document.getElementById('c-email').value.trim();
  const phone    = document.getElementById('c-phone').value.trim();
  const location = document.getElementById('c-location').value.trim();
  d.cEmail = email; d.chipEmailText = email;
  d.cPhone = phone; d.chipPhoneText = phone;
  d.cLocation = location; d.chipLocation = location;
  saveData(d); toast('Contact info saved!');
});

/* ── Settings ── */
document.getElementById('changePwBtn').addEventListener('click', async () => {
  const cur     = document.getElementById('s-curPw').value;
  const newPw   = document.getElementById('s-newPw').value;
  const confirm = document.getElementById('s-confirmPw').value;
  if (newPw !== confirm) { toast('New passwords do not match.', true); return; }
  if (newPw.length < 8)  { toast('Password must be at least 8 characters.', true); return; }
  const curHash = await hashPw(cur);
  if (curHash !== await getStoredHash()) { toast('Current password is wrong.', true); return; }
  localStorage.setItem('sazzad_pw_hash', await hashPw(newPw));
  toast('Password updated!');
  document.getElementById('s-curPw').value = '';
  document.getElementById('s-newPw').value = '';
  document.getElementById('s-confirmPw').value = '';
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const d    = loadData();
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'portfolio-backup.json';
  a.click();
  toast('JSON exported!');
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset ALL content to defaults? This cannot be undone.')) return;
  localStorage.removeItem('sazzad_portfolio_data');
  toast('Reset complete. Reload page.');
  setTimeout(() => location.reload(), 1000);
});

/* ── Utility ── */
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Auto-login if session stored ── */
/* (not persisted — must login each visit for security) */
