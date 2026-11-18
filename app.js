/* =========================================================================
   محرك منصة مشاوير وتوصيل سوهاج الشامل (App Engine)
   مشروع سحابي متصل بـ Firebase: goldencacino-143a9
   ========================================================================= */

// -------------------------------------------------------------
// 1. تسجيل محرك الـ Service Worker لتطبيق الويب PWA
// -------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW fail', err));
  });
}

// -------------------------------------------------------------
// 2. درع الأمان ومكافحة التلاعب (Security Shield)
// -------------------------------------------------------------
document.addEventListener('contextmenu', e => e.preventDefault(), false);
document.addEventListener('keydown', function(e) {
  if (e.keyCode === 123) { e.preventDefault(); return false; } // F12
  if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) { e.preventDefault(); return false; }
  if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; } // Ctrl+U
}, false);

if (window.top !== window.self) { window.top.location = window.self.location; }

function auditWalletSecurity() {
  const c = parseFloat(localStorage.getItem('c_wallet'));
  const k = parseFloat(localStorage.getItem('k_wallet'));
  if (isNaN(c) || c > 50000 || c < -50) localStorage.setItem('c_wallet', '0');
  if (isNaN(k) || k > 50000) localStorage.setItem('k_wallet', '0');
}
setInterval(auditWalletSecurity, 4000);

// محرك الإشعارات المنبثقة
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-900';
  t.className = `${bg} text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold transition-all duration-300 transform translate-y-[-10px] opacity-0 flex items-center gap-2 pointer-events-auto`;
  t.innerHTML = `<span>🔔</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.classList.remove('opacity-0', 'translate-y-[-10px]'); }, 50);
  setTimeout(() => {
    t.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// -------------------------------------------------------------
// 3. تهيئة مشروع Firebase ببياناتك المباشرة
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCga_KzuwZbS0qilFuHNkD8eI9hmtE9pMc",
  authDomain: "goldencacino-143a9.firebaseapp.com",
  databaseURL: "https://goldencacino-143a9-default-rtdb.firebaseio.com",
  projectId: "goldencacino-143a9",
  storageBucket: "goldencacino-143a9.firebasestorage.app",
  messagingSenderId: "214476918071",
  appId: "1:214476918071:web:910e86a52361f905ad9eb2",
  measurementId: "G-5ZQPFB8LN6"
};

let fbDB = null;
try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    fbDB = firebase.database();
    console.log("🔥 تم ربط سيرفر Firebase بنجاح!");
  }
} catch (e) {
  console.warn("تعذر الاتصال بفايربيس، يتم العمل عبر التخزين المحلي:", e);
}

function syncCloudOrders(orders) {
  localStorage.setItem('sohag_orders_all', JSON.stringify(orders));
  if (fbDB) {
    fbDB.ref('orders').set(orders).catch(err => console.warn(err));
  }
}

if (fbDB) {
  fbDB.ref('orders').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      localStorage.setItem('sohag_orders_all', JSON.stringify(val));
      renderCaptainOrders();
      renderMonitorData();
    }
  });

  fbDB.ref('chats').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      Object.keys(val).forEach(k => localStorage.setItem(k, JSON.stringify(val[k])));
      renderChatMessages();
    }
  });

  fbDB.ref('patches').on('value', snapshot => {
    const val = snapshot.val();
    if (val) {
      appPatches = val;
      localStorage.setItem('sohag_app_patches', JSON.stringify(val));
      applyAllActivePatches();
      renderPatchesTable();
    }
  });
}

// -------------------------------------------------------------
// 4. أمن الأدمن وتشفير SHA-256
// -------------------------------------------------------------
const ADMIN_PHONE = "01068131386";
const ADMIN_PASS_HASH = "9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0"; // 0000

async function hashString(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let titleClicks = 0;
function handleSecretAdminClick() {
  if (++titleClicks >= 3) {
    titleClicks = 0;
    openModal('admin-login-modal');
  }
}

async function verifyAdminLogin() {
  const phone = document.getElementById('adm-input-phone').value.trim();
  const pass = document.getElementById('adm-input-pass').value;
  const passHash = await hashString(pass);

  if (phone === ADMIN_PHONE && passHash === ADMIN_PASS_HASH) {
    document.getElementById('adm-login-err').classList.add('hidden');
    closeModal('admin-login-modal');
    document.getElementById('admin-badge').classList.remove('hidden');
    switchView('admin');
    showToast("مرحباً بك في لوحة تحكم الإدارة السحابية", "success");
  } else {
    document.getElementById('adm-login-err').classList.remove('hidden');
  }
}

function adminLogout() {
  document.getElementById('admin-badge').classList.add('hidden');
  switchView('customer');
}

// -------------------------------------------------------------
// 5. نظام تسجيل الدخول والحسابات وهدايا التسجيل (20ج و 50ج)
// -------------------------------------------------------------
let currentAuthTab = 'login';
let regUserRole = 'client';

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const btnLog = document.getElementById('tab-auth-login');
  const btnReg = document.getElementById('tab-auth-register');
  const roleBox = document.getElementById('reg-role-box');
  const nameField = document.getElementById('auth-name-field');
  const submitBtn = document.getElementById('auth-submit-btn');
  const capFields = document.getElementById('captain-reg-fields');
  document.getElementById('auth-error-msg').classList.add('hidden');

  if (tab === 'login') {
    btnLog.className = "bg-white text-blue-600 py-1.5 rounded-xl shadow-xs";
    btnReg.className = "text-gray-500 py-1.5 rounded-xl";
    roleBox.classList.add('hidden');
    nameField.classList.add('hidden');
    capFields.classList.add('hidden');
    submitBtn.innerText = "تسجيل الدخول للمنصة 🔑";
  } else {
    btnReg.className = "bg-white text-blue-600 py-1.5 rounded-xl shadow-xs";
    btnLog.className = "text-gray-500 py-1.5 rounded-xl";
    roleBox.classList.remove('hidden');
    nameField.classList.remove('hidden');
    selectRegRole(regUserRole);
  }
}

function selectRegRole(role) {
  regUserRole = role;
  const btnC = document.getElementById('role-btn-client');
  const btnK = document.getElementById('role-btn-captain');
  const capFields = document.getElementById('captain-reg-fields');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (role === 'client') {
    btnC.className = "bg-blue-600 text-white py-1 rounded-lg";
    btnK.className = "text-gray-600 py-1 rounded-lg";
    capFields.classList.add('hidden');
    submitBtn.innerText = "إنشاء حساب عميل والحصول على 20 ج.م 🎁";
  } else {
    btnK.className = "bg-blue-600 text-white py-1 rounded-lg";
    btnC.className = "text-gray-600 py-1 rounded-lg";
    capFields.classList.remove('hidden');
    submitBtn.innerText = "تقديم طلب كابتن وبونص 50 ج.م 🚖";
  }
}

function readFileAsBase64(fileInput) {
  return new Promise((resolve) => {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return resolve(null);
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(fileInput.files[0]);
  });
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('auth-input-phone').value.trim();
  const pass = document.getElementById('auth-input-pass').value;
  const name = document.getElementById('auth-input-name').value.trim();
  const errBox = document.getElementById('auth-error-msg');

  if (!phone || !pass) return;

  let users = JSON.parse(localStorage.getItem('sohag_registered_users') || '[]');
  const passHash = await hashString(pass);

  if (currentAuthTab === 'register') {
    if (!name) {
      errBox.innerText = "يرجى كتابة الاسم كاملاً.";
      errBox.classList.remove('hidden');
      return;
    }
    if (users.some(u => u.phone === phone)) {
      errBox.innerText = "رقم الهاتف مسجل بالفعل! اختر تسجيل الدخول.";
      errBox.classList.remove('hidden');
      return;
    }

    if (regUserRole === 'client') {
      const newUser = {
        id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
        name: name,
        phone: phone,
        passHash: passHash,
        role: 'client',
        isBlocked: false,
        registeredAt: new Date().toLocaleDateString('ar-EG')
      };
      users.unshift(newUser);
      localStorage.setItem('sohag_registered_users', JSON.stringify(users));
      localStorage.setItem('sohag_logged_user', JSON.stringify(newUser));

      clientWallet += 20;
      localStorage.setItem('c_wallet', clientWallet);
      syncWalletsDisplay();

      closeModal('patch-auth-modal');
      alert(`🎉 مبروك يا ${name}!\nتم إنشاء حسابك وإيداع 20 ج.م هدية في محفظتك جاهزة للاستخدام.`);
    } else {
      const plate = document.getElementById('reg-cap-plate').value.trim();
      const vehicle = document.getElementById('reg-cap-vehicle').value;
      const idPhoto = await readFileAsBase64(document.getElementById('reg-cap-id-photo'));
      const licensePhoto = await readFileAsBase64(document.getElementById('reg-cap-license-photo'));

      if (!plate) {
        errBox.innerText = "يرجى إدخال رقم اللوحة.";
        errBox.classList.remove('hidden');
        return;
      }

      const newCaptain = {
        id: 'CAP-' + Math.floor(1000 + Math.random() * 9000),
        name: name,
        phone: phone,
        passHash: passHash,
        role: 'captain',
        vehicle: vehicle,
        plate: plate,
        idPhoto: idPhoto,
        licensePhoto: licensePhoto,
        status: 'pending_approval',
        registeredAt: new Date().toLocaleDateString('ar-EG')
      };

      let captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]');
      captains.unshift(newCaptain);
      localStorage.setItem('sohag_captains_applications', JSON.stringify(captains));

      users.unshift(newCaptain);
      localStorage.setItem('sohag_registered_users', JSON.stringify(users));
      localStorage.setItem('sohag_logged_user', JSON.stringify(newCaptain));

      if (fbDB) fbDB.ref('captains_applications').set(captains).catch(e => console.warn(e));

      closeModal('patch-auth-modal');
      alert(`🚖 تم استلام طلبك كابتن ${name}!\nحسابك قيد الفحص من الإدارة وسيتم تفعيله وصرف 50 ج.م بونص ترحيبي فور اعتماد المستندات.`);
    }
  } else {
    const user = users.find(u => u.phone === phone && u.passHash === passHash);
    if (!user) {
      errBox.innerText = "بيانات الهاتف أو كلمة المرور غير صحيحة.";
      errBox.classList.remove('hidden');
      return;
    }
    if (user.isBlocked) {
      errBox.innerText = "⚠️ هذا الحساب محظور من الإدارة.";
      errBox.classList.remove('hidden');
      return;
    }
    localStorage.setItem('sohag_logged_user', JSON.stringify(user));
    closeModal('patch-auth-modal');
    showToast(`أهلاً بعودتك يا ${user.name}`, "success");
  }

  checkUserSession();
}

function checkUserSession() {
  const user = JSON.parse(localStorage.getItem('sohag_logged_user') || 'null');
  if (!user) {
    openModal('patch-auth-modal');
  } else {
    const nameInp = document.getElementById('cust-name-input');
    const phoneInp = document.getElementById('cust-phone-input');
    if (nameInp) nameInp.value = user.name || '';
    if (phoneInp) phoneInp.value = user.phone || '';

    const badge = document.getElementById('user-header-badge');
    if (badge) {
      badge.classList.remove('hidden');
      document.getElementById('header-user-name').innerText = `👤 ${user.name.split(' ')[0]}`;
    }
    checkCaptainApprovalGuard();
  }
}

function logoutUserSession() {
  if (confirm("هل تريد تسجيل الخروج؟")) {
    localStorage.removeItem('sohag_logged_user');
    document.getElementById('user-header-badge').classList.add('hidden');
    document.getElementById('cust-name-input').value = '';
    document.getElementById('cust-phone-input').value = '';
    openModal('patch-auth-modal');
  }
}

function checkCaptainApprovalGuard() {
  const user = JSON.parse(localStorage.getItem('sohag_logged_user') || 'null');
  if (!user || user.role !== 'captain') return;

  const captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]');
  const myApp = captains.find(c => c.phone === user.phone);
  const banner = document.getElementById('captain-approval-banner');
  const onlineBtn = document.getElementById('btn-captain-online');

  if (!myApp || myApp.status === 'pending_approval') {
    banner.classList.remove('hidden');
    onlineBtn.disabled = true;
    onlineBtn.innerText = "قيد المراجعة";
    onlineBtn.className = "bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold cursor-not-allowed";
    isCaptainOnline = false;
  } else {
    banner.classList.add('hidden');
    onlineBtn.disabled = false;
  }
}

// -------------------------------------------------------------
// 6. محرك أداة الباتشات وحاقن الأكواد المصحح
// -------------------------------------------------------------
let appPatches = JSON.parse(localStorage.getItem('sohag_app_patches')) || [
  {
    id: "PATCH-101",
    name: "إبراز عنوان التطبيق (CSS Patch)",
    type: "css",
    code: "header h1 { color: #2563eb !important; font-weight: 900; }",
    enabled: true
  }
];

function applyAllActivePatches() {
  document.querySelectorAll('[data-patch-injected]').forEach(el => el.remove());
  appPatches.forEach(p => {
    if (!p.enabled) return;
    if (p.type === 'css') {
      const s = document.createElement('style');
      s.setAttribute('data-patch-injected', p.id);
      s.innerHTML = p.code;
      document.head.appendChild(s);
    } else if (p.type === 'js') {
      try {
        new Function(p.code)();
      } catch (err) {
        console.warn(`[خطأ في الباتش ${p.name}]:`, err);
      }
    }
  });
}

function renderPatchesTable() {
  const tbody = document.getElementById('admin-patches-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appPatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-gray-400">لا توجد باتشات محقونة حالياً</td></tr>';
    return;
  }

  appPatches.forEach((p, idx) => {
    const typeBadge = p.type === 'css' 
      ? '<span class="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">🎨 CSS</span>'
      : '<span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">⚡ JS</span>';

    const statusBadge = p.enabled 
      ? '<span class="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px]">نشط ومحقون ✅</span>'
      : '<span class="bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full text-[10px]">متوقف ⏸️</span>';

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-2.5 font-bold text-gray-800">${p.name}</td>
        <td class="p-2.5">${typeBadge}</td>
        <td class="p-2.5">${statusBadge}</td>
        <td class="p-2.5 text-center space-x-reverse space-x-1">
          <button onclick="togglePatchStatus(${idx})" class="border px-2 py-1 rounded text-[10px] font-bold ${p.enabled ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-green-50 text-green-700 border-green-300'}">
            ${p.enabled ? 'إيقاف ⏸️' : 'تشغيل ▶️'}
          </button>
          <button onclick="openPatchModalForEdit(${idx})" class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold">تعديل ✏️</button>
          <button onclick="deletePatch(${idx})" class="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold">حذف 🗑️</button>
        </td>
      </tr>
    `;
  });
}

function togglePatchStatus(idx) {
  appPatches[idx].enabled = !appPatches[idx].enabled;
  savePatchesToStorage();
  showToast(appPatches[idx].enabled ? "تم تشغيل الباتش" : "تم إيقاف الباتش", "info");
}

function deletePatch(idx) {
  if (confirm(`هل أنت متأكد من حذف الباتش "${appPatches[idx].name}" نهائياً؟`)) {
    appPatches.splice(idx, 1);
    savePatchesToStorage();
    showToast("تم حذف الباتش بنجاح", "error");
  }
}

function openPatchModalForCreate() {
  document.getElementById('patch-modal-title').innerText = "إضافة باتش جديد";
  document.getElementById('patch-editing-id').value = "";
  document.getElementById('patch-name-input').value = "";
  document.getElementById('patch-type-select').value = "css";
  document.getElementById('patch-enabled-check').checked = true;
  document.getElementById('patch-code-textarea').value = "";
  openModal('patch-modal');
}

function openPatchModalForEdit(idx) {
  const p = appPatches[idx];
  document.getElementById('patch-modal-title').innerText = "تعديل الباتش: " + p.name;
  document.getElementById('patch-editing-id').value = p.id;
  document.getElementById('patch-name-input').value = p.name;
  document.getElementById('patch-type-select').value = p.type;
  document.getElementById('patch-enabled-check').checked = p.enabled;
  document.getElementById('patch-code-textarea').value = p.code;
  openModal('patch-modal');
}

function savePatchFromModal() {
  try {
    const id = document.getElementById('patch-editing-id').value;
    const name = document.getElementById('patch-name-input').value.trim();
    const type = document.getElementById('patch-type-select').value;
    const enabled = document.getElementById('patch-enabled-check').checked;
    const code = document.getElementById('patch-code-textarea').value.trim();

    if (!name || !code) return alert("يرجى إدخال اسم وكود للباتش.");

    if (id) {
      const p = appPatches.find(x => x.id === id);
      if (p) { p.name = name; p.type = type; p.enabled = enabled; p.code = code; }
    } else {
      appPatches.unshift({ id: 'PATCH-' + Date.now(), name, type, enabled, code });
    }

    savePatchesToStorage();
    closeModal('patch-modal');
    showToast("تم حفظ وتطبيق الباتش بنجاح! 🚀", "success");
  } catch (err) {
    alert("حدث خطأ أثناء حفظ الباتش: " + err.message);
  }
}

function savePatchesToStorage() {
  try {
    localStorage.setItem('sohag_app_patches', JSON.stringify(appPatches));
    if (fbDB) {
      fbDB.ref('patches').set(appPatches).catch(err => console.warn("Firebase sync warn:", err));
    }
    applyAllActivePatches();
    renderPatchesTable();
  } catch (e) {
    alert("تعذر حفظ الباتش محلياً: " + e.message);
  }
}

// -------------------------------------------------------------
// 7. لوحة الأدمن: إدارة الكباتن والمستخدمين وإلغاء الرحلات
// -------------------------------------------------------------
function renderAdminCaptainsTable() {
  const tbody = document.getElementById('admin-captains-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  const captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]');
  const pendingCount = captains.filter(c => c.status === 'pending_approval').length;
  document.getElementById('pending-captains-count').innerText = `${pendingCount} طلب قيد الانتظار`;

  if (captains.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-gray-400">لا توجد طلبات انضمام كباتن مسجلة.</td></tr>';
    return;
  }

  captains.forEach(c => {
    const isPending = c.status === 'pending_approval';
    const statusBadge = isPending
      ? '<span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">قيد الفحص ⏳</span>'
      : '<span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">معتمد ومفعل ✓</span>';

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-2.5 font-bold">
          <span class="text-gray-800 block">${c.name}</span>
          <span class="text-blue-700 font-mono text-[10px]">${c.phone}</span>
        </td>
        <td class="p-2.5 font-mono text-gray-600 font-bold">${c.plate} (${c.vehicle})</td>
        <td class="p-2.5 space-x-reverse space-x-1">
          <button onclick="previewCaptainDoc('${c.idPhoto || ''}', 'بطاقة الرقم القومي - ${c.name}')" class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">🪪 البطاقة</button>
          <button onclick="previewCaptainDoc('${c.licensePhoto || ''}', 'رخصة القيادة - ${c.name}')" class="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">📄 الرخصة</button>
        </td>
        <td class="p-2.5">${statusBadge}</td>
        <td class="p-2.5 text-center space-x-reverse space-x-1">
          ${isPending ? `
            <button onclick="approveCaptainAccount('${c.phone}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-xl text-[10px] shadow-sm">اعتماد وصرف 50ج ✅</button>
            <button onclick="rejectCaptainAccount('${c.phone}')" class="bg-red-600 text-white font-bold px-2 py-1 rounded-xl text-[10px]">رفض ❌</button>
          ` : `
            <button onclick="toggleCaptainBlock('${c.phone}')" class="bg-gray-100 text-red-600 border border-red-200 font-bold px-2 py-1 rounded-xl text-[10px]">إيقاف الحساب</button>
          `}
        </td>
      </tr>
    `;
  });
}

function previewCaptainDoc(imgSrc, title) {
  if (!imgSrc) return alert("لم يقم الكابتن برفع هذا المستند أثناء التسجيل.");
  document.getElementById('lightbox-title').innerText = title;
  document.getElementById('lightbox-img').src = imgSrc;
  openModal('doc-lightbox-modal');
}

function approveCaptainAccount(phone) {
  let captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]');
  const cap = captains.find(c => c.phone === phone);
  if (!cap) return;

  if (!confirm(`اعتماد الكابتن (${cap.name}) وتفعيل حسابه مع صرف 50 ج.م بونص ترحيبي في محفظته؟`)) return;

  cap.status = 'approved';
  localStorage.setItem('sohag_captains_applications', JSON.stringify(captains));

  captainWallet += 50;
  localStorage.setItem('k_wallet', captainWallet);
  syncWalletsDisplay();

  if (fbDB) fbDB.ref('captains_applications').set(captains).catch(e => console.warn(e));

  renderAdminCaptainsTable();
  showToast(`تم تفعيل حساب الكابتن ${cap.name} وصرف 50 ج.م بونص!`, "success");
}

function rejectCaptainAccount(phone) {
  if (!confirm("رفض طلب انضمام هذا الكابتن؟")) return;
  let captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]').filter(c => c.phone !== phone);
  localStorage.setItem('sohag_captains_applications', JSON.stringify(captains));
  if (fbDB) fbDB.ref('captains_applications').set(captains).catch(e => console.warn(e));
  renderAdminCaptainsTable();
  showToast("تم رفض الطلب", "error");
}

function toggleCaptainBlock(phone) {
  let captains = JSON.parse(localStorage.getItem('sohag_captains_applications') || '[]');
  const cap = captains.find(c => c.phone === phone);
  if (!cap) return;
  cap.status = (cap.status === 'approved') ? 'pending_approval' : 'approved';
  localStorage.setItem('sohag_captains_applications', JSON.stringify(captains));
  renderAdminCaptainsTable();
  showToast("تم تحديث حالة الكابتن", "info");
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('admin-users-rows');
  if (!tbody) return;
  tbody.innerHTML = '';

  const users = JSON.parse(localStorage.getItem('sohag_registered_users') || '[]');
  const query = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();

  let filtered = users;
  if (query) {
    filtered = users.filter(u => u.name.toLowerCase().includes(query) || u.phone.includes(query));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-gray-400">لا يوجد مستخدمون مطابقون.</td></tr>';
    return;
  }

  filtered.forEach(u => {
    const isBlocked = u.isBlocked === true;
    const statusBadge = isBlocked
      ? '<span class="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-[10px]">محظور 🚫</span>'
      : '<span class="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-[10px]">نشط ومفعل ✅</span>';

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 transition">
        <td class="p-2.5 font-bold text-gray-800">${u.id}</td>
        <td class="p-2.5 font-bold">${u.name}</td>
        <td class="p-2.5 font-mono">${u.phone}</td>
        <td class="p-2.5">${statusBadge}</td>
        <td class="p-2.5 text-center space-x-reverse space-x-1">
          <button onclick="toggleUserBlock('${u.phone}')" class="${isBlocked ? 'bg-green-600 text-white' : 'bg-red-600 text-white'} px-2 py-1 rounded text-[10px] font-bold">
            ${isBlocked ? 'فك الحظر' : 'حظر الحساب'}
          </button>
          <button onclick="deleteUserRecord('${u.phone}')" class="bg-gray-100 text-gray-700 hover:text-red-600 px-2 py-1 rounded text-[10px] font-bold">حذف</button>
        </td>
      </tr>
    `;
  });
}

function toggleUserBlock(phone) {
  let users = JSON.parse(localStorage.getItem('sohag_registered_users') || '[]');
  const u = users.find(x => x.phone === phone);
  if (!u) return;

  u.isBlocked = !u.isBlocked;
  localStorage.setItem('sohag_registered_users', JSON.stringify(users));
  renderAdminUsersTable();
  showToast(u.isBlocked ? `تم حظر الحساب (${u.name})` : `تم إلغاء حظر (${u.name})`, u.isBlocked ? "error" : "success");
}

function deleteUserRecord(phone) {
  if (!confirm("حذف هذا الحساب نهائياً؟")) return;
  let users = JSON.parse(localStorage.getItem('sohag_registered_users') || '[]').filter(u => u.phone !== phone);
  localStorage.setItem('sohag_registered_users', JSON.stringify(users));
  renderAdminUsersTable();
  showToast("تم حذف الحساب بنجاح", "info");
}

function adminForceCancelTrip(orderId) {
  let orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const order = orders.find(o => o.id === orderId);
  if (!order) return alert("لم يتم العثور على الرحلة!");

  const reason = prompt(`سبب إلغاء المشوار (${orderId}):`, "مخالفة معايير التشغيل / بلاغ طارئ");
  if (reason === null) return;

  if (!confirm(`إلغاء الرحلة (${orderId}) نهائياً؟`)) return;

  order.status = 'cancelled_by_admin';
  order.cancelReason = reason.trim() || 'إلغاء إداري من غرفة العمليات';

  if (order.paymentMethod === 'wallet') {
    clientWallet += order.totalPrice;
    localStorage.setItem('c_wallet', clientWallet);
    syncWalletsDisplay();
  }

  syncCloudOrders(orders);
  showToast(`تم إلغاء الرحلة ${order.id} بنجاح`, 'error');
  renderMonitorData();
}

function switchAdminTab(tab) {
  ['monitor', 'captains', 'users-mgmt', 'patches'].forEach(t => {
    const sec = document.getElementById(`admin-sec-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (sec) sec.classList.add('hidden');
    if (btn) btn.className = "pb-2 text-gray-500 whitespace-nowrap";
  });
  const aSec = document.getElementById(`admin-sec-${tab}`);
  const aBtn = document.getElementById(`tab-btn-${tab}`);
  if (aSec) aSec.classList.remove('hidden');
  if (aBtn) aBtn.className = "pb-2 border-b-2 border-blue-600 text-blue-600 whitespace-nowrap font-bold";

  if (tab === 'monitor') renderMonitorData();
  if (tab === 'captains') renderAdminCaptainsTable();
  if (tab === 'users-mgmt') renderAdminUsersTable();
  if (tab === 'patches') renderPatchesTable();
}

function renderMonitorData() {
  const orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const completed = orders.filter(o => o.status === 'completed');
  let gross = 0, comm = 0;
  completed.forEach(o => { gross += (o.totalPrice || 0); comm += (o.commission || 0); });

  document.getElementById('mon-stat-gross').innerText = `${gross} ج.م`;
  document.getElementById('mon-stat-comm').innerText = `${comm} ج.م`;
  document.getElementById('mon-stat-captains').innerText = `${gross - comm} ج.م`;

  const actContainer = document.getElementById('mon-active-trips-container');
  actContainer.innerHTML = '';
  const activeTrips = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled_by_admin');
  
  if (activeTrips.length === 0) {
    actContainer.innerHTML = '<div class="col-span-full p-4 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">لا توجد مشاوير نشطة حالياً.</div>';
  } else {
    activeTrips.forEach(t => {
      actContainer.innerHTML += `
        <div class="p-3 bg-gray-50 border rounded-xl text-xs space-y-1.5 border-r-4 border-blue-600">
          <div class="flex justify-between font-bold">
            <span>${t.id} (${t.vehicle})</span>
            <span class="text-blue-700 font-black">${t.totalPrice} ج.م</span>
          </div>
          <p>📍 ${t.pickup} ⬅️ ${t.dropoff}</p>
          <div class="flex justify-between text-[10px] text-gray-500 pt-1 border-t">
            <span>العميل: ${t.customerName} (${t.customerPhone})</span>
            <span>الحالة: <strong class="text-green-600">${t.status}</strong></span>
          </div>
          <button onclick="adminForceCancelTrip('${t.id}')" class="w-full mt-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-xl text-xs shadow-sm">
            🚫 إلغاء الرحلة فوراً كإدارة
          </button>
        </div>
      `;
    });
  }
}

// -------------------------------------------------------------
// 8. محرك الخرائط والتسعير ومراكز سوهاج
// -------------------------------------------------------------
const SOHAG_INIT = [26.5569, 31.6948];
const customerMap = L.map('customer-map').setView(SOHAG_INIT, 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(customerMap);

let pCoords = SOHAG_INIT;
let dCoords = [26.5647, 31.7456];
let pMarker = L.marker(pCoords, {draggable: true}).addTo(customerMap).bindPopup("مكان التحرك");
let dMarker = L.marker(dCoords, {draggable: true}).addTo(customerMap).bindPopup("مكان الوصول");
let routePoly;

pMarker.on('dragend', e => { pCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng]; calculateTripFare(); });
dMarker.on('dragend', e => { dCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng]; calculateTripFare(); });

let calculatedDistance = 0;
let finalTripPrice = 0;
let isPackageMode = false;
let clientWallet = parseFloat(localStorage.getItem('c_wallet')) || 150;
let captainWallet = parseFloat(localStorage.getItem('k_wallet')) || 60;
let clientPoints = parseInt(localStorage.getItem('sohag_loyalty_points')) || 40;

function quickSelectCenter(centerName, lat, lon) {
  document.getElementById('dropoff-input').value = `مركز ${centerName}`;
  dCoords = [lat, lon];
  dMarker.setLatLng(dCoords);
  customerMap.setView(dCoords, 13);
  calculateTripFare();
  showToast(`تم اختيار وجهة: مركز ${centerName}`);
}

function locateUserGPS() {
  if (!navigator.geolocation) return alert("خدمة GPS غير مدعومة على متصفحك");
  navigator.geolocation.getCurrentPosition(pos => {
    pCoords = [pos.coords.latitude, pos.coords.longitude];
    pMarker.setLatLng(pCoords);
    customerMap.setView(pCoords, 15);
    document.getElementById('pickup-input').value = "موقعي الحالي عبر الـ GPS";
    calculateTripFare();
    showToast("تم تحديد موقعك بدقة", "success");
  });
}

function switchServiceType(type) {
  isPackageMode = (type === 'package');
  document.getElementById('tab-service-ride').className = !isPackageMode ? "bg-white text-blue-600 py-1.5 rounded-xl shadow-xs" : "text-gray-500 py-1.5 rounded-xl";
  document.getElementById('tab-service-package').className = isPackageMode ? "bg-white text-blue-600 py-1.5 rounded-xl shadow-xs" : "text-gray-500 py-1.5 rounded-xl";
  document.getElementById('package-details-box').classList.toggle('hidden', !isPackageMode);
  calculateTripFare();
}

function calculateTripFare() {
  if (routePoly) customerMap.removeLayer(routePoly);
  routePoly = L.polyline([pCoords, dCoords], {color: '#2563eb', weight: 4}).addTo(customerMap);
  customerMap.fitBounds([pCoords, dCoords], {padding: [30, 30]});

  calculatedDistance = parseFloat((L.latLng(pCoords).distanceTo(L.latLng(dCoords)) / 1000).toFixed(1));
  const vehicle = document.getElementById('vehicle-type').value;

  let base = vehicle === 'tuktuk' ? 7 : vehicle === 'bike' ? 10 : 20;
  let kmRate = vehicle === 'tuktuk' ? 2.5 : vehicle === 'bike' ? 3.5 : 5.5;

  finalTripPrice = Math.max(base, Math.round(base + (calculatedDistance * kmRate)));

  document.getElementById('trip-distance-txt').innerText = calculatedDistance + " كم";
  document.getElementById('trip-price-txt').innerText = finalTripPrice + " ج.م";
}

async function searchSohagAddress(type) {
  const inputVal = document.getElementById(type + '-input').value.trim();
  if (!inputVal) return alert("اكتب اسم المكان أولاً");
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputVal + ' سوهاج مصر')}&countrycodes=eg&limit=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      if (type === 'pickup') { pCoords = coords; pMarker.setLatLng(pCoords); }
      else { dCoords = coords; dMarker.setLatLng(dCoords); }
      calculateTripFare();
    }
  } catch (e) {}
}

function syncWalletsDisplay() {
  document.getElementById('client-wallet-val').innerText = clientWallet + " ج.م";
  document.getElementById('captain-wallet-val').innerText = captainWallet + " ج.م";
  document.getElementById('client-loyalty-pts').innerText = `${clientPoints} نقطة`;
  localStorage.setItem('c_wallet', clientWallet);
  localStorage.setItem('k_wallet', captainWallet);
  localStorage.setItem('sohag_loyalty_points', clientPoints);
}

function redeemLoyaltyPoints() {
  if (clientPoints < 50) return alert(`لديك ${clientPoints} نقطة. تحتاج 50 نقطة لاستبدالها بـ 10 ج.م.`);
  clientPoints -= 50;
  clientWallet += 10;
  syncWalletsDisplay();
  showToast("تم تحويل 50 نقطة إلى 10 ج.م رصيد!", "success");
}

function openVoucherRedeemModal() {
  const code = prompt("أدخل كود كارت الشحن (مثال: SOHAG50-XXXX):");
  if (code) {
    clientWallet += 50;
    syncWalletsDisplay();
    showToast("تم شحن 50 ج.م بنجاح!", "success");
  }
}

function openReferralModal() {
  alert("كود الإحالة الخاص بك هو: SOHAG-REF\nشاركه مع أصدقائك لتربح 15 ج.م عند تسجيلهم!");
}

function openClientHistoryModal() {
  const orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const completed = orders.filter(o => o.status === 'completed');
  alert(`📜 سجل المشاوير:\nعدد رحلاتك المكتملة في سوهاج: ${completed.length} مشوار.`);
}

// -------------------------------------------------------------
// 9. دورة حياة المشوار الحية والمزامنة السحابية
// -------------------------------------------------------------
let currentActiveRide = null;
let waitTimer = null;
let waitSeconds = 0;
let isCaptainOnline = true;

const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playNewOrderAlert() {
    this.init();
    const now = this.ctx.currentTime;
    [0, 0.25, 0.5, 0.75].forEach(d => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + d);
      osc.frequency.exponentialRampToValueAtTime(1760, now + d + 0.15);
      gain.gain.setValueAtTime(0.8, now + d);
      gain.gain.exponentialRampToValueAtTime(0.01, now + d + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + d);
      osc.stop(now + d + 0.2);
    });
  },
  playAcceptSound() {
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.7, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (idx * 0.1));
      osc.stop(now + (idx * 0.1) + 0.2);
    });
  },
  playRideStartSound() {
    this.init();
    const now = this.ctx.currentTime;
    [440, 660, 880, 1320].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.75, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (idx * 0.1));
      osc.stop(now + (idx * 0.1) + 0.25);
    });
  },
  playCompleteSound() {
    this.init();
    const now = this.ctx.currentTime;
    [587.33, 739.99, 880.00, 1174.66].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + (idx * 0.12));
      gain.gain.setValueAtTime(0.7, now + (idx * 0.12));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.12) + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (idx * 0.12));
      osc.stop(now + (idx * 0.12) + 0.3);
    });
  }
};
window.addEventListener('click', () => AudioEngine.init(), { once: true });

function submitCustomerOrder() {
  const cName = document.getElementById('cust-name-input').value.trim();
  const cPhone = document.getElementById('cust-phone-input').value.trim();
  if (!cName || !cPhone) return alert("يرجى إدخال اسمك ورقم هاتفك أولاً.");

  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const order = {
    id: 'SH-' + Math.floor(1000 + Math.random() * 9000),
    pickup: document.getElementById('pickup-input').value || "سوهاج",
    dropoff: document.getElementById('dropoff-input').value || "أخميم",
    customerName: cName,
    customerPhone: cPhone,
    vehicle: document.getElementById('vehicle-type').value,
    distance: calculatedDistance,
    totalPrice: finalTripPrice,
    commission: Math.round(finalTripPrice * 0.15),
    captainProfit: Math.round(finalTripPrice * 0.85),
    paymentMethod: document.getElementById('payment-method').value,
    otpPin: generatedOtp,
    status: 'pending',
    time: new Date().toLocaleTimeString('ar-EG')
  };

  currentActiveRide = order;
  let orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  orders.unshift(order);

  syncCloudOrders(orders);

  AudioEngine.playNewOrderAlert();
  document.getElementById('booking-inputs-container').classList.add('hidden');
  document.getElementById('client-order-status').classList.remove('hidden');
  renderCaptainOrders();
  showToast("تم إرسال الطلب سحابياً لكل الكباتن!", "success");
}

function renderCaptainOrders() {
  const orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const container = document.getElementById('captain-orders-list');
  if (!container) return;
  container.innerHTML = '';

  const pendings = orders.filter(o => o.status === 'pending');
  if (pendings.length === 0) {
    container.innerHTML = '<p class="text-center text-xs text-gray-400 py-6 bg-white rounded-2xl border border-dashed">في انتظار طلبات جديدة من مراكز سوهاج... ⏳</p>';
    return;
  }

  pendings.forEach(order => {
    const div = document.createElement('div');
    div.className = "bg-white p-3.5 rounded-2xl shadow-sm border border-r-4 border-blue-600 space-y-2";
    div.innerHTML = `
      <div class="flex justify-between items-center border-b pb-1.5">
        <span class="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">${order.vehicle}</span>
        <span class="font-black text-green-600 text-base">${order.totalPrice} ج.م</span>
      </div>
      <div class="text-xs space-y-1">
        <p>العميل: <strong>${order.customerName}</strong> (${order.customerPhone})</p>
        <p>من: <strong>${order.pickup}</strong> ⬅️ <strong>${order.dropoff}</strong></p>
      </div>
      <button onclick="captainAcceptTrip('${order.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs shadow-md">
        قبول المشوار والتوجه للعميل ✅
      </button>
    `;
    container.appendChild(div);
  });
}

function captainAcceptTrip(id) {
  let orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const order = orders.find(x => x.id === id);
  if (!order) return;

  order.status = 'accepted';
  currentActiveRide = order;
  syncCloudOrders(orders);

  AudioEngine.playAcceptSound();

  document.getElementById('captain-orders-list').classList.add('hidden');
  document.getElementById('captain-active-trip-box').classList.remove('hidden');

  document.getElementById('active-cust-name').innerText = order.customerName;
  document.getElementById('active-cust-phone').innerText = order.customerPhone;
  document.getElementById('active-pickup-txt').innerText = order.pickup;
  document.getElementById('active-dropoff-txt').innerText = order.dropoff;
  document.getElementById('active-collect-txt').innerText = `${order.totalPrice} ج.م (${order.paymentMethod})`;

  document.getElementById('btn-gmaps-navigate').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.pickup + ' سوهاج')}&travelmode=driving`;

  document.getElementById('client-status-title').innerText = "تم قبول طلبك! الكابتن في طريقه إليك.";
  document.getElementById('client-otp-val').innerText = order.otpPin;
  document.getElementById('client-otp-card').classList.remove('hidden');
  document.getElementById('client-captain-card').classList.remove('hidden');
}

function captainStartRideWithOtp() {
  const enteredOtp = document.getElementById('captain-entered-otp').value.trim();
  const actualOtp = currentActiveRide ? currentActiveRide.otpPin : '';

  if (actualOtp && enteredOtp !== actualOtp) {
    return alert("رمز الأمان (OTP) غير صحيح! اسأل العميل عن كود الـ 4 أرقام لتأكيد بدء المشوار.");
  }

  document.getElementById('otp-input-wrapper').classList.add('hidden');

  let orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  const order = orders.find(x => x.id === currentActiveRide.id);
  if (!order) return;

  order.status = 'in_progress';
  currentActiveRide = order;
  syncCloudOrders(orders);

  AudioEngine.playRideStartSound();

  document.getElementById('trip-badge-status').innerText = "الرحلة انطلقت والعداد يعمل 🚦";
  document.getElementById('trip-badge-status').className = "bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-lg font-bold";
  document.getElementById('btn-start-ride').classList.add('hidden');
  document.getElementById('in-ride-controls').classList.remove('hidden');

  document.getElementById('client-status-title').innerText = "الرحلة قيد التنفيذ حالياً 🛣️";
  document.getElementById('client-otp-card').classList.add('hidden');
  showToast("انطلق المشوار بالسلامة", "info");
}

function toggleWaitTimer() {
  const btn = document.getElementById('btn-wait-timer');
  if (!waitTimer) {
    btn.innerText = "إيقاف ⏸️";
    waitTimer = setInterval(() => {
      waitSeconds++;
      const m = String(Math.floor(waitSeconds / 60)).padStart(2, '0');
      const s = String(waitSeconds % 60).padStart(2, '0');
      document.getElementById('wait-timer-display').innerText = `الانتظار: ${m}:${s}`;
    }, 1000);
  } else {
    clearInterval(waitTimer);
    waitTimer = null;
    btn.innerText = "بدء انتظار ⏱️";
  }
}

function captainFinishRide() {
  if (waitTimer) { clearInterval(waitTimer); waitTimer = null; }
  currentActiveRide.status = 'completed';

  if (currentActiveRide.paymentMethod === 'cash') {
    captainWallet -= currentActiveRide.commission;
  } else {
    clientWallet -= currentActiveRide.totalPrice;
    captainWallet += currentActiveRide.captainProfit;
  }
  syncWalletsDisplay();

  let orders = JSON.parse(localStorage.getItem('sohag_orders_all') || '[]');
  orders = orders.map(o => o.id === currentActiveRide.id ? currentActiveRide : o);

  syncCloudOrders(orders);
  AudioEngine.playCompleteSound();

  document.getElementById('captain-active-trip-box').classList.add('hidden');
  document.getElementById('btn-start-ride').classList.remove('hidden');
  document.getElementById('in-ride-controls').classList.add('hidden');
  document.getElementById('captain-orders-list').classList.remove('hidden');

  document.getElementById('bill-route').innerText = `${currentActiveRide.pickup} ⬅️ ${currentActiveRide.dropoff}`;
  document.getElementById('bill-dist').innerText = `${currentActiveRide.distance} كم`;
  document.getElementById('bill-total-price').innerText = `${currentActiveRide.totalPrice} ج.م`;

  openModal('billing-modal');
  document.getElementById('client-order-status').classList.add('hidden');
  document.getElementById('booking-inputs-container').classList.remove('hidden');

  renderCaptainOrders();
  renderMonitorData();
}

// -------------------------------------------------------------
// 10. الشات المباشر السحابي
// -------------------------------------------------------------
let currentChatRole = 'customer';
function openLiveChat(role) {
  currentChatRole = role;
  renderChatMessages();
  openModal('chat-modal');
}

function renderChatMessages() {
  const box = document.getElementById('chat-messages-box');
  if (!box) return;
  box.innerHTML = '';
  const orderId = currentActiveRide ? currentActiveRide.id : 'default';
  const msgs = JSON.parse(localStorage.getItem('chat_' + orderId) || '[]');

  msgs.forEach(m => {
    const isMe = m.role === currentChatRole;
    const b = document.createElement('div');
    b.className = isMe ? 'self-start bg-blue-600 text-white p-2.5 rounded-2xl max-w-[80%]' : 'self-end bg-white border text-gray-800 p-2.5 rounded-2xl max-w-[80%]';
    b.innerHTML = `<p class="font-bold">${m.text}</p><span class="block text-[8px] opacity-60 text-left">${m.time}</span>`;
    box.appendChild(b);
  });
  box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt) return;

  const orderId = currentActiveRide ? currentActiveRide.id : 'default';
  const msgs = JSON.parse(localStorage.getItem('chat_' + orderId) || '[]');
  msgs.push({
    role: currentChatRole,
    text: txt,
    time: new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})
  });

  localStorage.setItem('chat_' + orderId, JSON.stringify(msgs));
  if (fbDB) fbDB.ref(`chats/chat_${orderId}`).set(msgs);

  inp.value = '';
  renderChatMessages();
}

// -------------------------------------------------------------
// 11. دوال عامة والتنقل والتحكم
// -------------------------------------------------------------
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
function toggleDarkMode() { document.body.classList.toggle('sohag-dark'); }
function toggleLowDataMode() { document.body.classList.toggle('low-data'); }

function switchView(target) {
  document.getElementById('view-customer').classList.add('hidden');
  document.getElementById('view-captain').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');

  const btnC = document.getElementById('btn-tab-customer');
  const btnK = document.getElementById('btn-tab-captain');

  if (target === 'customer') {
    document.getElementById('view-customer').classList.remove('hidden');
    btnC.className = "px-3 py-1.5 rounded-lg bg-white shadow-sm text-blue-600";
    btnK.className = "px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800";
    setTimeout(() => customerMap.invalidateSize(), 200);
  } else if (target === 'captain') {
    document.getElementById('view-captain').classList.remove('hidden');
    btnK.className = "px-3 py-1.5 rounded-lg bg-white shadow-sm text-blue-600";
    btnC.className = "px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800";
    renderCaptainOrders();
  } else if (target === 'admin') {
    document.getElementById('view-admin').classList.remove('hidden');
    renderMonitorData();
    renderPatchesTable();
    renderAdminCaptainsTable();
    renderAdminUsersTable();
  }
}

let isCaptainOnline = true;
function toggleCaptainOnline() {
  isCaptainOnline = !isCaptainOnline;
  const btn = document.getElementById('btn-captain-online');
  btn.innerText = isCaptainOnline ? "أونلاين" : "أوفلاين";
  btn.className = isCaptainOnline ? "bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold" : "bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold";
  showToast(isCaptainOnline ? "أنت متصل وتستقبل طلبات سوهاج سحابياً" : "أنت غير متصل حالياً");
}

function adminQuickReset() {
  if (confirm("تصفير جميع البيانات والرحلات السحابية؟")) {
    localStorage.clear();
    if (fbDB) fbDB.ref().set({});
    location.reload();
  }
}

// مزامنة التغييرات الحية عبر ألسنة المتصفح
window.addEventListener('storage', (e) => {
  if (e.key === 'sohag_orders_all') {
    renderCaptainOrders();
    renderMonitorData();
    const orders = JSON.parse(e.newValue || '[]');
    if (currentActiveRide) {
      const myOrder = orders.find(o => o.id === currentActiveRide.id);
      if (myOrder) {
        if (myOrder.status === 'in_progress') {
          AudioEngine.playRideStartSound();
          document.getElementById('client-status-title').innerText = "الرحلة قيد التنفيذ حالياً 🛣️";
          document.getElementById('client-otp-card').classList.add('hidden');
        } else if (myOrder.status === 'completed') {
          AudioEngine.playCompleteSound();
          document.getElementById('client-order-status').classList.add('hidden');
          showBillingModal(myOrder);
        } else if (myOrder.status === 'cancelled_by_admin') {
          document.getElementById('client-order-status').classList.add('hidden');
          document.getElementById('booking-inputs-container').classList.remove('hidden');
          document.getElementById('captain-active-trip-box').classList.add('hidden');
          document.getElementById('captain-orders-list').classList.remove('hidden');
          alert(`⚠️ إشعار من الإدارة:\nتم إلغاء الرحلة (${myOrder.id}).\nالسبب: ${myOrder.cancelReason || 'إلغاء إداري'}`);
          currentActiveRide = null;
        }
      }
    }
  } else if (e.key === 'sohag_app_patches') {
    appPatches = JSON.parse(e.newValue || '[]');
    applyAllActivePatches();
    renderPatchesTable();
  } else if (e.key && e.key.startsWith('chat_')) {
    renderChatMessages();
  } else if (e.key === 'sohag_logged_user') {
    checkUserSession();
  }
});

// -------------------------------------------------------------
// التشغيل الأولي
// -------------------------------------------------------------
checkUserSession();
applyAllActivePatches();
syncWalletsDisplay();
calculateTripFare();
renderCaptainOrders();
