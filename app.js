/**
 * تطبيق توصيلة سوهاج ومصر - المحرك البرمجي الموحد
 * نظام آمن بالكامل ومحمي ضد التوقف والأخطاء الصامتة
 */

// 1. بيانات الأدمن والمحافظات الأساسية
const SUPER_ADMIN = {
  phone: "01068131386",
  email: "tawsilag@gmail.com",
  password: "0000"
};

const EGYPT_GOVERNORATES = [
  { id: 'sohag', name: 'سوهاج', center: [26.5569, 31.6948], zoom: 13, active: true },
  { id: 'cairo', name: 'القاهرة والجيزة', center: [30.0444, 31.2357], zoom: 12, active: true },
  { id: 'alex', name: 'الإسكندرية', center: [31.2001, 29.9187], zoom: 12, active: true },
  { id: 'asyut', name: 'أسيوط', center: [27.1809, 31.1837], zoom: 13, active: true },
  { id: 'qena', name: 'قنا', center: [26.1551, 32.7160], zoom: 13, active: true },
  { id: 'luxor', name: 'الأقصر', center: [25.6872, 32.6396], zoom: 13, active: true },
  { id: 'aswan', name: 'أسوان', center: [24.0889, 32.8998], zoom: 13, active: true },
  { id: 'redsea', name: 'البحر الأحمر (الغردقة)', center: [27.2579, 33.8116], zoom: 12, active: true },
  { id: 'dakahlia', name: 'الدقهلية (المنصورة)', center: [31.0409, 31.3785], zoom: 13, active: true },
  { id: 'gharbia', name: 'الغربية (طنطا)', center: [30.7865, 31.0004], zoom: 13, active: true }
];

const DEFAULT_STORE = {
  currentUser: null,
  users: [
    { phone: "01011111111", password: "123", name: "عميل تجريبي", role: "customer", wallet: 150.0 },
    { phone: "01022222222", password: "123", name: "كابتن أحمد", role: "captain", vehicle: "سيارة ملاكي", plate: "هـ ص ج 4589", status: "approved", wallet: 300.0 }
  ],
  moderators: [
    { id: 'mod_1', name: 'م. علي إبراهيم', phone: '01099998888', password: '111', role: 'moderator', permissions: { captains: true, governorates: true, features: true } }
  ],
  captainsPending: [],
  governorates: EGYPT_GOVERNORATES,
  selectedGovId: 'sohag',
  features: { biddingEnabled: true, surgeActive: false, surgeMultiplier: 1.3 },
  promoCodes: [
    { code: 'TAWSILA2026', discountPercent: 20, active: true },
    { code: 'SOHAG50', discountPercent: 50, active: true }
  ],
  activeDiscountPercent: 0,
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سوهاج', baseFare: 7.0, perKm: 2.5, icon: 'fa-solid fa-motorcycle', enabled: true },
    { id: 'moto', name: 'موتوسيكل سريع', baseFare: 9.0, perKm: 3.0, icon: 'fa-solid fa-bicycle', enabled: true },
    { id: 'car', name: 'سيارة ملاكي', baseFare: 12.0, perKm: 3.5, icon: 'fa-solid fa-car', enabled: true }
  ],
  selectedVehicleId: 'car',
  extraFare: 0,
  customBidFare: null
};

// قراءة الذاكرة بمفتاح جديد V5 لتنظيف أي كود قديم مكسور
function getDB() {
  try {
    const raw = localStorage.getItem('TAWSILA_APP_DATA_V5');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STORE));
    const parsed = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STORE)), parsed);
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

function saveDB(d) {
  try {
    localStorage.setItem('TAWSILA_APP_DATA_V5', JSON.stringify(d));
  } catch (e) {
    console.warn("تعذر حفظ البيانات في الذاكرة:", e);
  }
}

// ربط جميع المتغيرات العامة صراحة بـ window
window.DB = getDB();
window.activeTripData = null;
window.countdownInterval = null;
window.tempCaptainDocs = {};
window.map = null;
window.pickupMarker = null;
window.dropoffMarker = null;
window.routeLine = null;
window.selectedStarRating = 5;
window.alertAudioCtx = null;
window.isAlertRinging = false;
window.alertLoopTimeout = null;

// ==========================================
// 2. نظام الدخول وتحديد الصلاحيات
// ==========================================
window.handleUserLogin = function() {
  const idEl = document.getElementById('loginIdentifier');
  const passEl = document.getElementById('loginPassword');
  if (!idEl || !passEl) return;

  const idVal = idEl.value.trim();
  const passVal = passEl.value.trim();

  // 1. فحص الأدمن الرئيسي
  if ((idVal === SUPER_ADMIN.phone || idVal.toLowerCase() === SUPER_ADMIN.email) && passVal === SUPER_ADMIN.password) {
    window.DB.currentUser = { role: 'admin', isSuperAdmin: true, name: 'المدير العام', phone: SUPER_ADMIN.phone, permissions: { captains: true, governorates: true, features: true, moderators: true } };
    saveDB(window.DB);
    window.updateNavUI();
    window.navigate('admin');
    alert("🎉 مرحباً بك يا مدير النظام! تم تسجيل دخولك بنجاح.");
    return;
  }

  // 2. فحص المشرفين
  const mod = window.DB.moderators.find(m => m.phone === idVal && m.password === passVal);
  if (mod) {
    window.DB.currentUser = { role: 'moderator', isSuperAdmin: false, name: mod.name, phone: mod.phone, permissions: mod.permissions };
    saveDB(window.DB);
    window.updateNavUI();
    window.navigate('admin');
    alert(`🎉 مرحباً بك يا أستاذ ${mod.name} (مشرف النظام)!`);
    return;
  }

  // 3. فحص الكباتن المعلقين تحت المراجعة
  const pendingCap = window.DB.captainsPending.find(c => c.phone === idVal && c.password === passVal);
  if (pendingCap) {
    window.DB.currentUser = { role: 'captain', name: pendingCap.name, phone: pendingCap.phone, captainStatus: pendingCap.status };
    saveDB(window.DB);
    window.updateNavUI();
    window.navigate('driver');
    return;
  }

  // 4. فحص الركاب والكباتن المعتمدين
  const user = window.DB.users.find(u => u.phone === idVal && u.password === passVal);
  if (user) {
    window.DB.currentUser = user;
    saveDB(window.DB);
    window.updateNavUI();
    if (user.role === 'captain') window.navigate('driver');
    else window.navigate('customer');
    return;
  }

  alert("❌ خطأ: رقم الهاتف أو كلمة المرور غير صحيحة!");
};

window.handleRegisterCustomer = function() {
  const name = document.getElementById('regCustName')?.value.trim();
  const phone = document.getElementById('regCustPhone')?.value.trim();
  const password = document.getElementById('regCustPass')?.value.trim();

  if (!name || !phone || !password) { alert("يرجى ملء جميع الحقول."); return; }
  if (window.DB.users.some(u => u.phone === phone)) { alert("⚠️ هذا الرقم مسجل مسبقاً، يرجى تسجيل الدخول."); return; }

  const newUser = { role: 'customer', name, phone, password, wallet: 150.0 };
  window.DB.users.push(newUser);
  window.DB.currentUser = newUser;
  saveDB(window.DB);
  window.updateNavUI();
  window.navigate('customer');
  alert(`🎉 أهلاً بك يا ${name}! تم فتح الحساب بنجاح.`);
};

window.handleRegisterCaptain = function() {
  const name = document.getElementById('regCapName')?.value.trim();
  const phone = document.getElementById('regCapPhone')?.value.trim();
  const password = document.getElementById('regCapPass')?.value.trim();
  const vehicle = document.getElementById('regCapVehicle')?.value;
  const plate = document.getElementById('regCapPlate')?.value.trim();

  if (!name || !phone || !password) { alert("يرجى إكمال كافة البيانات."); return; }
  if (!window.tempCaptainDocs.idFront || !window.tempCaptainDocs.idBack || !window.tempCaptainDocs.licenseDrive || !window.tempCaptainDocs.licenseCar) {
    alert("⚠️ يرجى رفع جميع صور المستندات الأربعة المطلوبة.");
    return;
  }

  const newCaptain = {
    id: 'cap_' + Date.now(),
    role: 'captain',
    name,
    phone,
    password,
    vehicle,
    plate,
    status: 'pending',
    wallet: 0.0,
    docs: { ...window.tempCaptainDocs }
  };

  window.DB.captainsPending.push(newCaptain);
  window.DB.currentUser = { role: 'captain', name, phone, captainStatus: 'pending' };
  saveDB(window.DB);
  window.updateNavUI();
  window.navigate('driver');
  alert("✅ تم إرسال مستنداتك بنجاح! طلبك الآن قيد مراجعة واعتماد الإدارة.");
};

window.logoutUser = function() {
  window.DB.currentUser = null;
  saveDB(window.DB);
  window.updateNavUI();
  window.navigate('auth');
};

window.updateNavUI = function() {
  const u = window.DB.currentUser;
  const btnAdmin = document.getElementById('nav-btn-admin');
  const btnCustomer = document.getElementById('nav-btn-customer');
  const btnDriver = document.getElementById('nav-btn-driver');
  const btnLogin = document.getElementById('nav-btn-login');
  const userBadge = document.getElementById('navUserBadge');
  const userName = document.getElementById('navUserName');
  const walletBox = document.getElementById('navCustomerWalletBox');

  if (btnAdmin) btnAdmin.classList.add('hidden');
  if (btnCustomer) btnCustomer.classList.add('hidden');
  if (btnDriver) btnDriver.classList.add('hidden');
  if (userBadge) userBadge.classList.add('hidden');
  if (walletBox) walletBox.classList.add('hidden');
  if (btnLogin) btnLogin.classList.remove('hidden');

  if (u) {
    if (btnLogin) btnLogin.classList.add('hidden');
    if (userBadge) userBadge.classList.remove('hidden');
    if (userName) userName.innerText = u.name;

    if (u.role === 'admin' || u.role === 'moderator') {
      if (btnAdmin) btnAdmin.classList.remove('hidden');
      if (btnCustomer) btnCustomer.classList.remove('hidden');
      if (btnDriver) btnDriver.classList.remove('hidden');
    } else if (u.role === 'customer') {
      if (btnCustomer) btnCustomer.classList.remove('hidden');
      if (walletBox) walletBox.classList.remove('hidden');
      const wEl = document.getElementById('navCustomerWallet');
      if (wEl) wEl.innerText = (u.wallet || 150).toFixed(2);
    } else if (u.role === 'captain') {
      if (btnDriver) btnDriver.classList.remove('hidden');
    }
  }
};

window.switchAuthTab = function(tab) {
  const btnLogin = document.getElementById('btnAuthTabLogin');
  const btnCust = document.getElementById('btnAuthTabRegCust');
  const btnCap = document.getElementById('btnAuthTabRegCap');

  const fLogin = document.getElementById('formLogin');
  const fCust = document.getElementById('formRegCustomer');
  const fCap = document.getElementById('formRegCaptain');

  if (btnLogin) btnLogin.className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  if (btnCust) btnCust.className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  if (btnCap) btnCap.className = "flex-1 py-2 rounded-xl text-slate-600 transition";

  if (fLogin) fLogin.classList.add('hidden');
  if (fCust) fCust.classList.add('hidden');
  if (fCap) fCap.classList.add('hidden');

  if (tab === 'login') {
    if (btnLogin) btnLogin.className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    if (fLogin) fLogin.classList.remove('hidden');
  } else if (tab === 'reg-customer') {
    if (btnCust) btnCust.className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    if (fCust) fCust.classList.remove('hidden');
  } else if (tab === 'reg-captain') {
    if (btnCap) btnCap.className = "flex-1 py-2 rounded-xl bg-amber-500 text-slate-900 font-black shadow";
    if (fCap) fCap.classList.remove('hidden');
  }
};

window.handleLogoClick = function() {
  const u = window.DB.currentUser;
  if (!u) window.navigate('auth');
  else if (u.role === 'admin' || u.role === 'moderator') window.navigate('admin');
  else if (u.role === 'captain') window.navigate('driver');
  else window.navigate('customer');
};

// ضغط صور المستندات لحجم خفيف لمنع امتلاء الذاكرة
window.handleCompressUpload = function(event, key) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 280;
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; }
      else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      window.tempCaptainDocs[key] = canvas.toDataURL('image/webp', 0.5);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// ==========================================
// 3. إدارة المحافظات الجغرافية
// ==========================================
window.renderGovernoratesUI = function() {
  const select = document.getElementById('custGovernorateSelect');
  if (select) {
    select.innerHTML = window.DB.governorates.map(g => `
      <option value="${g.id}" ${g.id === window.DB.selectedGovId ? 'selected' : ''}>
        ${g.name} ${g.active ? '' : '(مغلقة)'}
      </option>
    `).join('');
  }

  const grid = document.getElementById('adminGovernoratesGrid');
  if (grid) {
    grid.innerHTML = window.DB.governorates.map(g => `
      <div class="p-3 border rounded-2xl ${g.active ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'} flex items-center justify-between">
        <div>
          <b class="text-xs text-slate-800 block">${g.name}</b>
          <span class="text-[10px] font-bold ${g.active ? 'text-emerald-700' : 'text-rose-700'}">
            ${g.active ? '🟢 الخدمة متاحة' : '🔴 الخدمة متوقفة ومغلقة'}
          </span>
        </div>
        <button type="button" onclick="window.toggleGovernorateActive('${g.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black shadow transition ${g.active ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}">
          ${g.active ? 'إغلاق المحافظة' : 'فتح المحافظة'}
        </button>
      </div>
    `).join('');
  }
};

window.handleGovernorateChange = function(govId) {
  const gov = window.DB.governorates.find(g => g.id === govId);
  if (!gov) return;
  window.DB.selectedGovId = govId;
  saveDB(window.DB);

  const b = document.getElementById('activeGovBadge');
  if (b) b.innerText = gov.name;

  if (!gov.active) {
    window.showTopAlert(`⚠️ تنبيه: خدمة حجز المشاوير متوقفة ومغلقة حالياً في محافظة (${gov.name}) بقرار الإدارة.`);
  } else {
    window.hideTopAlert();
  }

  if (window.map && window.pickupMarker && window.dropoffMarker) {
    window.map.flyTo(gov.center, gov.zoom);
    window.pickupMarker.setLatLng(gov.center);
    window.dropoffMarker.setLatLng([gov.center[0] - 0.015, gov.center[1] + 0.015]);
    window.recalcTrip();
  }
};

window.toggleGovernorateActive = function(govId) {
  const gov = window.DB.governorates.find(g => g.id === govId);
  if (!gov) return;
  gov.active = !gov.active;
  saveDB(window.DB);
  window.renderGovernoratesUI();
  if (window.DB.selectedGovId === govId) window.handleGovernorateChange(govId);
  alert(`تم ${gov.active ? 'فتح' : 'إغلاق'} العمل في محافظة (${gov.name}) بنجاح!`);
};

window.showTopAlert = function(msg) {
  const bar = document.getElementById('topAlertBar');
  const text = document.getElementById('topAlertMessage');
  if (text) text.innerText = msg;
  if (bar) bar.classList.remove('hidden');
};

window.hideTopAlert = function() {
  document.getElementById('topAlertBar')?.classList.add('hidden');
};

// ==========================================
// 4. الميزات التنافسية (الكوبونات، الذروة، المزايدة، SOS)
// ==========================================
window.applyPromoCode = function() {
  const codeInp = document.getElementById('promoCodeInput')?.value.trim().toUpperCase();
  const statusEl = document.getElementById('promoCodeStatus');
  const promo = window.DB.promoCodes.find(p => p.code === codeInp && p.active);

  if (promo) {
    window.DB.activeDiscountPercent = promo.discountPercent;
    if (statusEl) {
      statusEl.innerText = `🎉 تم تطبيق كود الخصم! خصم ${promo.discountPercent}% على المشوار.`;
      statusEl.classList.remove('hidden');
    }
  } else {
    window.DB.activeDiscountPercent = 0;
    if (statusEl) {
      statusEl.innerText = `❌ كود الخصم غير صحيح أو منتهي الصلاحية.`;
      statusEl.classList.remove('hidden');
    }
  }
  window.recalcTrip();
};

window.toggleFeatureSetting = function(key) {
  window.DB.features[key] = !window.DB.features[key];
  saveDB(window.DB);
  window.updateFeaturesAdminUI();
  window.recalcTrip();
};

window.updateSurgeMultiplier = function(val) {
  window.DB.features.surgeMultiplier = parseFloat(val) || 1.3;
  saveDB(window.DB);
  window.recalcTrip();
};

window.updateFeaturesAdminUI = function() {
  const btnBidding = document.getElementById('btnToggleBidding');
  const btnSurge = document.getElementById('btnToggleSurge');
  const surgeInp = document.getElementById('surgeMultiplierInput');

  if (btnBidding) {
    btnBidding.className = `px-3 py-1 rounded-lg text-xs font-bold ${window.DB.features.biddingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`;
    btnBidding.innerText = window.DB.features.biddingEnabled ? 'مفعل وشغال' : 'معطل';
  }
  if (btnSurge) {
    btnSurge.className = `px-3 py-1 rounded-lg text-xs font-bold ${window.DB.features.surgeActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`;
    btnSurge.innerText = window.DB.features.surgeActive ? 'الذروة نشطة الآن' : 'معطلة';
  }
  if (surgeInp) surgeInp.value = window.DB.features.surgeMultiplier || 1.3;

  const biddingBox = document.getElementById('biddingBoxSection');
  if (biddingBox) {
    if (window.DB.features.biddingEnabled) biddingBox.classList.remove('hidden');
    else biddingBox.classList.add('hidden');
  }

  const surgeBadge = document.getElementById('surgeBadge');
  if (surgeBadge) {
    if (window.DB.features.surgeActive) surgeBadge.classList.remove('hidden');
    else surgeBadge.classList.add('hidden');
  }

  window.renderPromoCodesList();
};

window.renderPromoCodesList = function() {
  const container = document.getElementById('adminPromoCodesList');
  if (!container) return;
  container.innerHTML = window.DB.promoCodes.map((p, idx) => `
    <div class="flex justify-between items-center p-2 bg-slate-50 border rounded-xl text-xs">
      <div>
        <b class="font-mono text-emerald-700">${p.code}</b>
        <span class="text-slate-500 mr-2">خصم ${p.discountPercent}%</span>
      </div>
      <button type="button" onclick="window.deletePromo(${idx})" class="text-rose-600 font-bold hover:underline">حذف</button>
    </div>
  `).join('') || '<p class="text-slate-400 text-xs">لا توجد كوبونات مضافة</p>';
};

window.openNewPromoModal = function() { document.getElementById('addPromoModal')?.classList.remove('hidden'); };
window.closeNewPromoModal = function() { document.getElementById('addPromoModal')?.classList.add('hidden'); };
window.handleSavePromo = function() {
  const code = document.getElementById('promoCodeVal')?.value.trim().toUpperCase();
  const disc = parseInt(document.getElementById('promoDiscountVal')?.value) || 20;
  if (!code) return;
  window.DB.promoCodes.push({ code, discountPercent: disc, active: true });
  saveDB(window.DB);
  window.renderPromoCodesList();
  window.closeNewPromoModal();
  alert("تمت إضافة كود الخصم بنجاح!");
};
window.deletePromo = function(idx) {
  window.DB.promoCodes.splice(idx, 1);
  saveDB(window.DB);
  window.renderPromoCodesList();
};

window.adjustBidFare = function(amt) {
  const inp = document.getElementById('customBidInput');
  let current = parseFloat(inp?.value) || 30;
  current = Math.max(10, current + amt);
  if (inp) inp.value = current;
  window.updateBidFare(current);
};

window.updateBidFare = function(val) {
  window.DB.customBidFare = parseFloat(val);
  const disp = document.getElementById('customBidDisplay');
  const total = document.getElementById('calcTotalFareText');
  if (disp) disp.innerText = `${window.DB.customBidFare} ج.م`;
  if (total) total.innerText = `${window.DB.customBidFare} ج.م`;
};

window.triggerEmergencySOS = function() {
  if (confirm("🚨 هل أنت في حالة طوارئ؟\nسيتم إرسال إشعار فوري لمسؤولي السلامة.")) {
    alert("🛡️ تم إرسال استغاثة SOS وموقعك المباشر بنجاح!");
  }
};

window.setRating = function(stars) {
  window.selectedStarRating = stars;
  const icons = document.querySelectorAll('#starsRatingContainer i');
  icons.forEach((ic, i) => {
    ic.className = (i < stars) ? "fa-solid fa-star text-amber-400" : "fa-regular fa-star text-slate-300";
  });
};

window.submitRating = function() {
  document.getElementById('ratingModal')?.classList.add('hidden');
  alert(`⭐ شكراً لك! تم تسجيل تقييمك (${window.selectedStarRating} نجوم) بنجاح.`);
};

// ==========================================
// 5. إدارة المشرفين والصلاحيات
// ==========================================
window.renderAdminModerators = function() {
  const tbody = document.getElementById('adminModeratorsListTable');
  if (!tbody) return;
  tbody.innerHTML = window.DB.moderators.map((m, idx) => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">${m.name}</td>
      <td class="p-3 font-mono text-slate-600">${m.phone}</td>
      <td class="p-3 space-x-1 space-x-reverse">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.captains ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">الكباتن</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.governorates ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}">المحافظات</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.features ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}">الأدوات والكوبونات</span>
      </td>
      <td class="p-3 text-center">
        <button type="button" onclick="window.deleteModerator(${idx})" class="text-rose-600 font-bold hover:underline">حذف</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا يوجد مشرفين مضافين</td></tr>`;
};

window.openNewModeratorModal = function() { document.getElementById('addModeratorModal')?.classList.remove('hidden'); };
window.closeNewModeratorModal = function() { document.getElementById('addModeratorModal')?.classList.add('hidden'); };

window.handleSaveModerator = function() {
  const name = document.getElementById('modNameInput')?.value.trim();
  const phone = document.getElementById('modPhoneInput')?.value.trim();
  const password = document.getElementById('modPassInput')?.value.trim();

  if (!name || !phone || !password) return;

  const newMod = {
    id: 'mod_' + Date.now(),
    name,
    phone,
    password,
    role: 'moderator',
    permissions: {
      captains: document.getElementById('permCaptains')?.checked,
      governorates: document.getElementById('permGovernorates')?.checked,
      features: document.getElementById('permFeatures')?.checked
    }
  };

  window.DB.moderators.push(newMod);
  saveDB(window.DB);
  window.renderAdminModerators();
  window.closeNewModeratorModal();
  alert(`✅ تم تعيين المشرف "${name}" بنجاح!`);
};

window.deleteModerator = function(idx) {
  if (!confirm("هل أنت متأكد من حذف هذا المشرف؟")) return;
  window.DB.moderators.splice(idx, 1);
  saveDB(window.DB);
  window.renderAdminModerators();
};

window.switchAdminTab = function(tab) {
  const u = window.DB.currentUser;
  if (u && u.role === 'moderator') {
    if (tab === 'moderators') { alert("⚠️ إدارة المشرفين مقتصرة حصرياً على المدير العام."); return; }
    if (tab === 'captains' && !u.permissions.captains) { alert("⚠️ ليس لديك صلاحية لمراجعة وثائق الكباتن."); return; }
    if (tab === 'governorates' && !u.permissions.governorates) { alert("⚠️ ليس لديك صلاحية للتحكم بالمحافظات."); return; }
    if (tab === 'features' && !u.permissions.features) { alert("⚠️ ليس لديك صلاحية لإدارة الكوبونات والذروة."); return; }
  }

  document.querySelectorAll('.admin-tab-btn').forEach(b => b.className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100");
  ['captains', 'governorates', 'features', 'moderators', 'patches'].forEach(t => document.getElementById(`admintab-${t}`)?.classList.add('hidden'));

  const activeBtn = document.getElementById(`btn-adm-${tab}`);
  if (activeBtn) activeBtn.className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold";
  document.getElementById(`admintab-${tab}`)?.classList.remove('hidden');

  if (tab === 'captains') window.renderAdminCaptains();
  if (tab === 'governorates') window.renderGovernoratesUI();
  if (tab === 'features') window.updateFeaturesAdminUI();
  if (tab === 'moderators') window.renderAdminModerators();
  if (tab === 'patches') window.renderPatches();
};

// ==========================================
// 6. السارينة عالية التردد والنطق الصوتي
// ==========================================
window.initAudioContext = function() {
  if (!window.alertAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) window.alertAudioCtx = new AudioCtx();
  }
  if (window.alertAudioCtx && window.alertAudioCtx.state === 'suspended') {
    window.alertAudioCtx.resume();
  }
};
document.addEventListener('click', () => window.initAudioContext(), { once: false });

window.playHighPitchDispatchAlarm = function(callback) {
  window.initAudioContext();
  if (!window.alertAudioCtx) { if (callback) callback(); return; }

  if ("vibrate" in navigator) navigator.vibrate([500, 150, 500, 150, 800, 200, 1000]);

  const now = window.alertAudioCtx.currentTime;
  const oscSaw = window.alertAudioCtx.createOscillator();
  const oscSqr = window.alertAudioCtx.createOscillator();
  const gain = window.alertAudioCtx.createGain();

  oscSaw.type = 'sawtooth';
  oscSqr.type = 'square';

  oscSaw.frequency.setValueAtTime(800, now);
  oscSaw.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
  oscSaw.frequency.linearRampToValueAtTime(900, now + 0.4);
  oscSaw.frequency.exponentialRampToValueAtTime(2200, now + 0.65);

  oscSqr.frequency.setValueAtTime(950, now);
  oscSqr.frequency.exponentialRampToValueAtTime(2000, now + 0.2);
  oscSqr.frequency.linearRampToValueAtTime(1050, now + 0.4);
  oscSqr.frequency.exponentialRampToValueAtTime(2400, now + 0.65);

  gain.gain.setValueAtTime(1.0, now);
  gain.gain.setValueAtTime(1.0, now + 0.85);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

  oscSaw.connect(gain);
  oscSqr.connect(gain);
  gain.connect(window.alertAudioCtx.destination);

  oscSaw.start(now);
  oscSqr.start(now);
  oscSaw.stop(now + 1.1);
  oscSqr.stop(now + 1.1);

  if (callback) setTimeout(() => { if (window.isAlertRinging) callback(); }, 1150);
};

window.speakTripDetailsArabic = function(trip) {
  if (!window.isAlertRinging || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const text = `انتبه يا كابتن! في مشوار جديد واصلك. الركوب من: ${trip.from}. رايح على: ${trip.to}. فئة المشوار: ${trip.vehicle}. والأجرة: ${Math.round(trip.fare)} جنيه مصري. اضغط قبول المشوار فوراً!`;
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang = 'ar-EG';
  ut.rate = 0.94;
  ut.pitch = 1.12;

  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang === 'ar-EG') || voices.find(v => v.lang.startsWith('ar'));
  if (arVoice) ut.voice = arVoice;

  ut.onend = () => {
    if (window.isAlertRinging) {
      window.alertLoopTimeout = setTimeout(() => {
        if (window.isAlertRinging) window.playHighPitchDispatchAlarm(() => window.speakTripDetailsArabic(trip));
      }, 1200);
    }
  };

  window.speechSynthesis.speak(ut);
};

window.startIncomingTripAlert = function(trip) {
  window.isAlertRinging = true;
  window.initAudioContext();
  clearTimeout(window.alertLoopTimeout);
  window.playHighPitchDispatchAlarm(() => window.speakTripDetailsArabic(trip));
};

window.stopIncomingTripAlert = function() {
  window.isAlertRinging = false;
  clearTimeout(window.alertLoopTimeout);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if ("vibrate" in navigator) navigator.vibrate(0);
};

window.testDriverAlertSound = function() {
  window.initAudioContext();
  alert("🔊 جاري تشغيل سارينة التنبيه الخارقة واهتزاز الهاتف مع النطق التجريبي...");
  window.stopIncomingTripAlert();
  window.isAlertRinging = true;
  window.playHighPitchDispatchAlarm(() => {
    window.speakTripDetailsArabic({ from: "ميدان التحرير", to: "مصر الجديدة", vehicle: "سيارة ملاكي", fare: 45 });
    setTimeout(() => window.stopIncomingTripAlert(), 7000);
  });
};

// ==========================================
// 7. الخريطة ودورة تنفيذ المشوار
// ==========================================
window.initMap = function() {
  if (window.map || typeof L === 'undefined') return;
  const el = document.getElementById('map');
  if (!el) return;

  const activeGov = window.DB.governorates.find(g => g.id === window.DB.selectedGovId) || window.DB.governorates[0];
  window.map = L.map('map').setView(activeGov.center, activeGov.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(window.map);

  const pIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const dIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });

  window.pickupMarker = L.marker(activeGov.center, { icon: pIcon, draggable: true }).addTo(window.map);
  window.dropoffMarker = L.marker([activeGov.center[0] - 0.015, activeGov.center[1] + 0.015], { icon: dIcon, draggable: true }).addTo(window.map);

  window.pickupMarker.on('dragend', () => window.recalcTrip());
  window.dropoffMarker.on('dragend', () => window.recalcTrip());

  window.map.on('click', e => {
    window.dropoffMarker.setLatLng(e.latlng);
    const dInp = document.getElementById('dropoffInput');
    if (dInp) dInp.value = "الموقع المحدد على الخريطة";
    window.recalcTrip();
  });

  const pInp = document.getElementById('pickupInput');
  const dInp = document.getElementById('dropoffInput');
  if (pInp) pInp.value = `ميدان المحطة - ${activeGov.name}`;
  if (dInp) dInp.value = `الشارع الرئيسي - ${activeGov.name}`;

  window.renderCustomerVehicles();
  window.recalcTrip();
};

window.recalcTrip = function() {
  const activeGov = window.DB.governorates.find(g => g.id === window.DB.selectedGovId) || window.DB.governorates[0];
  const pLatLng = window.pickupMarker ? window.pickupMarker.getLatLng() : { lat: activeGov.center[0], lng: activeGov.center[1] };
  const dLatLng = window.dropoffMarker ? window.dropoffMarker.getLatLng() : { lat: activeGov.center[0] - 0.015, lng: activeGov.center[1] + 0.015 };

  if (window.routeLine && window.map) window.map.removeLayer(window.routeLine);
  if (window.map) window.routeLine = L.polyline([pLatLng, dLatLng], { color: '#059669', weight: 4 }).addTo(window.map);

  const dist = 4.5;
  const dText = document.getElementById('calcDistanceText');
  if (dText) dText.innerText = `${dist} كم`;

  const veh = window.DB.vehicles.find(v => v.id === window.DB.selectedVehicleId) || window.DB.vehicles[0];
  let total = veh.baseFare + (dist * veh.perKm) + window.DB.extraFare;

  if (window.DB.features.surgeActive) total *= (window.DB.features.surgeMultiplier || 1.3);
  if (window.DB.activeDiscountPercent > 0) total -= (total * (window.DB.activeDiscountPercent / 100));

  total = Math.max(10, total);

  if (window.DB.customBidFare !== null && window.DB.features.biddingEnabled) {
    const totalEl = document.getElementById('calcTotalFareText');
    if (totalEl) totalEl.innerText = `${window.DB.customBidFare} ج.م`;
  } else {
    const totalEl = document.getElementById('calcTotalFareText');
    if (totalEl) totalEl.innerText = `${total.toFixed(2)} ج.م`;
    const bidInp = document.getElementById('customBidInput');
    if (bidInp) bidInp.value = Math.round(total);
    const bidDisp = document.getElementById('customBidDisplay');
    if (bidDisp) bidDisp.innerText = `${Math.round(total)} ج.م`;
  }
};

window.renderCustomerVehicles = function() {
  const g = document.getElementById('vehicleTypesGrid');
  if (!g) return;
  g.innerHTML = window.DB.vehicles.filter(v => v.enabled).map(v => `
    <button type="button" onclick="window.selectVehicle('${v.id}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === window.DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}">
      <i class="${v.icon} text-xl text-slate-600 mb-1"></i>
      <div class="font-black text-[11px]">${v.name}</div>
      <div class="text-[9px] text-emerald-700 font-bold">يبدأ ${v.baseFare} ج.م</div>
    </button>
  `).join('');
};

window.selectVehicle = function(id) {
  window.DB.selectedVehicleId = id;
  saveDB(window.DB);
  window.renderCustomerVehicles();
  window.recalcTrip();
};

window.handleSearchSuggestions = function(q, type) {
  const c = document.getElementById(`${type}Suggestions`);
  if (!c) return;
  if (!q.trim()) { c.classList.add('hidden'); return; }
  const landmarks = ["ميدان التحرير", "ميدان الثقافة", "الكورنيش", "الجامعة", "محطة القطار", "ميدان العارف", "شارع الجمهورية"];
  const matches = landmarks.filter(i => i.includes(q.trim()));
  c.innerHTML = matches.map(m => `
    <div onclick="document.getElementById('${type}Input').value='${m}'; document.getElementById('${type}Suggestions').classList.add('hidden');" class="p-2 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700">
      <i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i> ${m}
    </div>
  `).join('') || `<div class="p-2 text-slate-400">لا توجد نتائج</div>`;
  c.classList.remove('hidden');
};

window.getCurrentLocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      const loc = [p.coords.latitude, p.coords.longitude];
      if (window.pickupMarker) window.pickupMarker.setLatLng(loc);
      if (window.map) window.map.setView(loc, 15);
      const pInp = document.getElementById('pickupInput');
      if (pInp) pInp.value = "موقعي الحالي (GPS)";
      window.recalcTrip();
    });
  }
};

window.handleCustomerRequestRide = function() {
  const activeGov = window.DB.governorates.find(g => g.id === window.DB.selectedGovId) || window.DB.governorates[0];
  if (!activeGov.active) {
    alert(`⚠️ عفواً، خدمة حجز المشاوير متوقفة ومغلقة حالياً في محافظة (${activeGov.name}).`);
    return;
  }

  window.initAudioContext();
  const fare = parseFloat(document.getElementById('calcTotalFareText')?.innerText) || 30;
  const veh = window.DB.vehicles.find(v => v.id === window.DB.selectedVehicleId) || window.DB.vehicles[0];

  window.activeTripData = {
    from: document.getElementById('pickupInput')?.value || "موقعي",
    to: document.getElementById('dropoffInput')?.value || "الوجهة",
    vehicle: veh.name,
    fare: fare
  };

  const btn = document.getElementById('btnRequestRide');
  if (btn) { btn.disabled = true; btn.innerText = "جاري البحث عن كابتن..."; }

  const statusB = document.getElementById('custStatusBadge');
  if (statusB) statusB.innerText = "تم إرسال الطلب";

  document.getElementById('driverIdleBox')?.classList.add('hidden');
  document.getElementById('driverOfferBox')?.classList.remove('hidden');

  const fFrom = document.getElementById('offerFromText');
  const fTo = document.getElementById('offerToText');
  const fVeh = document.getElementById('offerVehicleText');
  const fFare = document.getElementById('offerFareText');

  if (fFrom) fFrom.innerText = window.activeTripData.from;
  if (fTo) fTo.innerText = window.activeTripData.to;
  if (fVeh) fVeh.innerText = window.activeTripData.vehicle;
  if (fFare) fFare.innerText = `${window.activeTripData.fare} ج.م`;

  window.startIncomingTripAlert(window.activeTripData);

  let timeLeft = 25;
  clearInterval(window.countdownInterval);
  window.countdownInterval = setInterval(() => {
    timeLeft--;
    const t = document.getElementById('countdownTimer');
    if (t) t.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(window.countdownInterval);
      window.stopIncomingTripAlert();
      window.resetCaptain();
      alert("انتهت مهلة قبول المشوار.");
    }
  }, 1000);
};

window.captainAcceptTrip = function() {
  clearInterval(window.countdownInterval);
  window.stopIncomingTripAlert();
  document.getElementById('driverOfferBox')?.classList.add('hidden');
  document.getElementById('driverActiveTripBox')?.classList.remove('hidden');

  const fareEl = document.getElementById('driverActiveTripFare');
  if (fareEl) fareEl.innerText = `الأجرة: ${window.activeTripData.fare} ج.م`;

  document.getElementById('customerDriverCard')?.classList.remove('hidden');
  const b = document.getElementById('custStatusBadge');
  if (b) b.innerText = "الكابتن قادم لموقعك";
};

window.captainRejectTrip = function() {
  clearInterval(window.countdownInterval);
  window.stopIncomingTripAlert();
  window.resetCaptain();
  const btn = document.getElementById('btnRequestRide');
  if (btn) { btn.disabled = false; btn.innerText = "طلب المشوار فوراً"; }
};

window.captainNotifyArrived = function() {
  document.getElementById('btnCaptainArrived')?.classList.add('hidden');
  document.getElementById('btnCaptainStartTrip')?.classList.remove('hidden');
  alert("🔔 إشعار للعميل: وصل الكابتن وهو بانتظارك!");
};

window.captainStartTrip = function() {
  document.getElementById('btnCaptainStartTrip')?.classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip')?.classList.remove('hidden');
};

window.captainCompleteTrip = function() {
  const fare = window.activeTripData.fare;
  const u = window.DB.currentUser;
  if (u && u.role === 'customer' && u.wallet >= fare) u.wallet -= fare;
  saveDB(window.DB);
  window.updateNavUI();
  window.resetCaptain();

  const btn = document.getElementById('btnRequestRide');
  if (btn) { btn.disabled = false; btn.innerText = "طلب المشوار فوراً"; }
  document.getElementById('customerDriverCard')?.classList.add('hidden');

  document.getElementById('ratingModal')?.classList.remove('hidden');
};

window.resetCaptain = function() {
  document.getElementById('driverOfferBox')?.classList.add('hidden');
  document.getElementById('driverActiveTripBox')?.classList.add('hidden');
  document.getElementById('driverIdleBox')?.classList.remove('hidden');
};

window.handleDriverViewLogic = function() {
  const u = window.DB.currentUser;
  const pendingScreen = document.getElementById('captainPendingScreen');
  const activeScreen = document.getElementById('captainActiveScreen');

  if (u && u.role === 'captain' && u.captainStatus === 'pending') {
    if (pendingScreen) pendingScreen.classList.remove('hidden');
    if (activeScreen) activeScreen.classList.add('hidden');
  } else {
    if (pendingScreen) pendingScreen.classList.add('hidden');
    if (activeScreen) activeScreen.classList.remove('hidden');
    if (u) {
      const dName = document.getElementById('driverDashboardName');
      const dWallet = document.getElementById('driverWalletEGP');
      if (dName) dName.innerText = `الكابتن: ${u.name}`;
      if (dWallet) dWallet.innerText = `${(u.wallet || 300).toFixed(2)} ج.م`;
    }
  }
};

// ==========================================
// 8. فحص وثائق الكباتن واعتماد الأدمن
// ==========================================
window.renderAdminCaptains = function() {
  const tbody = document.getElementById('adminCaptainsListTable');
  const countEl = document.getElementById('adminPendingCount');
  if (!tbody) return;

  const pending = window.DB.captainsPending.filter(c => c.status === 'pending');
  if (countEl) countEl.innerText = pending.length;

  if (window.DB.captainsPending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد طلبات معلقة</td></tr>`;
    return;
  }

  tbody.innerHTML = window.DB.captainsPending.map(c => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">${c.name}</td>
      <td class="p-3 font-mono">${c.phone}<br><span class="text-slate-500">${c.plate}</span></td>
      <td class="p-3">${c.vehicle}</td>
      <td class="p-3">
        <button type="button" onclick="window.inspectCaptainDocs('${c.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded text-[11px] font-bold">
          <i class="fa-solid fa-eye ml-1"></i> فحص المستندات (4)
        </button>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
          ${c.status === 'approved' ? 'معتمد ومفعل' : c.status === 'rejected' ? 'مرفوض' : 'بانتظار الاعتماد'}
        </span>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        ${c.status !== 'approved' ? `<button type="button" onclick="window.approveCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-xs">قبول وتفعيل</button>` : ''}
        ${c.status !== 'rejected' ? `<button type="button" onclick="window.rejectCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-rose-600 text-white rounded font-bold text-xs">رفض</button>` : ''}
      </td>
    </tr>
  `).join('');
};

window.inspectCaptainDocs = function(capId) {
  const cap = window.DB.captainsPending.find(c => c.id === capId);
  if (!cap || !cap.docs) return;
  const title = document.getElementById('inspectCaptainTitle');
  if (title) title.innerText = `مستندات الكابتن: ${cap.name}`;
  const grid = document.getElementById('inspectImagesGrid');

  const docsList = [
    { label: "بطاقة الرقم القومي (وجه)", src: cap.docs.idFront },
    { label: "بطاقة الرقم القومي (ظهر)", src: cap.docs.idBack },
    { label: "رخصة القيادة", src: cap.docs.licenseDrive },
    { label: "رخصة تسيير المركبة", src: cap.docs.licenseCar }
  ];

  if (grid) {
    grid.innerHTML = docsList.map(d => `
      <div class="border rounded-2xl p-2 bg-slate-50 space-y-1">
        <span class="font-bold text-slate-700 block">${d.label}</span>
        <div class="h-32 bg-white rounded-xl border flex items-center justify-center overflow-hidden">
          ${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : '<span class="text-slate-400">غير متوفر</span>'}
        </div>
      </div>
    `).join('');
  }

  document.getElementById('adminDocsInspectModal')?.classList.remove('hidden');
};

window.closeDocsInspectModal = function() {
  document.getElementById('adminDocsInspectModal')?.classList.add('hidden');
};

window.approveCaptainByAdmin = function(capId) {
  const cap = window.DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'approved';

  if (!window.DB.users.some(u => u.phone === cap.phone)) {
    window.DB.users.push({
      role: 'captain',
      name: cap.name,
      phone: cap.phone,
      password: cap.password,
      vehicle: cap.vehicle,
      plate: cap.plate,
      status: 'approved',
      wallet: 200.0
    });
  }

  saveDB(window.DB);
  window.renderAdminCaptains();
  alert(`✅ تم اعتماد الكابتن "${cap.name}" بنجاح!`);
};

window.rejectCaptainByAdmin = function(capId) {
  const cap = window.DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'rejected';
  saveDB(window.DB);
  window.renderAdminCaptains();
  alert(`تم رفض الكابتن "${cap.name}".`);
};

// ==========================================
// 9. محرك وحاقن الباتشات البرمجية
// ==========================================
window.getPatches = function() {
  try {
    const raw = localStorage.getItem('TAWSILA_PATCHES');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
};
window.savePatches = function(p) { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(p)); };

window.injectPatch = function(p, idx) {
  document.getElementById(`injected-patch-css-${idx}`)?.remove();
  document.getElementById(`injected-patch-html-${idx}`)?.remove();

  if (!p.enabled) return;
  if (p.type === 'css') {
    const s = document.createElement('style');
    s.id = `injected-patch-css-${idx}`;
    s.textContent = p.code;
    document.head.appendChild(s);
  } else if (p.type === 'html') {
    const c = document.getElementById('patchHtmlContainer');
    if (c) {
      const d = document.createElement('div');
      d.id = `injected-patch-html-${idx}`;
      d.innerHTML = p.code;
      c.appendChild(d);
    }
  } else if (p.type === 'js') {
    try { new Function(p.code)(); } catch(err) { console.error("Patch Error:", err); }
  }
};

window.applyAllPatches = function() {
  window.getPatches().forEach((p, idx) => { if (p.enabled) window.injectPatch(p, idx); });
};

window.renderPatches = function() {
  const tbody = document.getElementById('adminPatchesListTable');
  if (!tbody) return;
  const p = window.getPatches();
  tbody.innerHTML = p.map((item, idx) => `
    <tr class="border-b">
      <td class="p-3 font-bold">${item.name}</td>
      <td class="p-3 uppercase text-[10px] font-bold font-mono">${item.type}</td>
      <td class="p-3"><button type="button" onclick="window.togglePatchStatus(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${item.enabled ? 'مفعل ومحقون' : 'معطل'}</button></td>
      <td class="p-3 text-center"><button type="button" onclick="window.deletePatch(${idx})" class="text-rose-600 font-bold text-xs">حذف</button></td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات</td></tr>`;
};

window.openNewPatchModal = function() {
  const pName = document.getElementById('patchNameInput');
  const pCode = document.getElementById('patchCodeInput');
  if (pName) pName.value = '';
  if (pCode) pCode.value = '';
  document.getElementById('patchEditorModal')?.classList.remove('hidden');
};
window.closePatchModal = function() { document.getElementById('patchEditorModal')?.classList.add('hidden'); };

window.handleSavePatch = function() {
  const name = document.getElementById('patchNameInput')?.value.trim();
  const type = document.getElementById('patchTypeInput')?.value;
  const code = document.getElementById('patchCodeInput')?.value;
  if (!name || !code) return;

  const p = window.getPatches();
  p.push({ name, type, code, enabled: true });
  window.savePatches(p);
  window.applyAllPatches();
  window.renderPatches();
  window.closePatchModal();
  alert("تم حقن الباتش فوراً!");
};

window.togglePatchStatus = function(idx) {
  const p = window.getPatches();
  if (p[idx]) { p[idx].enabled = !p[idx].enabled; window.savePatches(p); window.applyAllPatches(); window.renderPatches(); }
};

window.deletePatch = function(idx) {
  const p = window.getPatches();
  p.splice(idx, 1);
  window.savePatches(p);
  window.applyAllPatches();
  window.renderPatches();
};

// ==========================================
// 10. المحفظة والمحادثات والتنقل العام
// ==========================================
window.openWalletModal = function() { document.getElementById('walletModal')?.classList.remove('hidden'); };
window.closeWalletModal = function() { document.getElementById('walletModal')?.classList.add('hidden'); };
window.confirmCustomerRecharge = function() {
  const amt = parseFloat(document.getElementById('walletRechargeAmount')?.value) || 50;
  if (window.DB.currentUser) window.DB.currentUser.wallet = (window.DB.currentUser.wallet || 0) + amt;
  saveDB(window.DB);
  window.updateNavUI();
  window.closeWalletModal();
  alert(`تم شحن المحفظة بمبلغ ${amt} ج.م بنجاح!`);
};

window.openChatModal = function() { document.getElementById('chatModal')?.classList.remove('hidden'); };
window.closeChatModal = function() { document.getElementById('chatModal')?.classList.add('hidden'); };
window.handleSendChatMessage = function() {
  const inp = document.getElementById('chatInputText');
  const box = document.getElementById('chatMessagesBox');
  if (inp && box && inp.value.trim()) {
    box.innerHTML += `<div class="bg-emerald-600 text-white p-2 rounded-xl text-xs max-w-[80%] mr-auto">${inp.value}</div>`;
    inp.value = '';
  }
};

window.startVoiceCall = function() { document.getElementById('voiceCallModal')?.classList.remove('hidden'); };
window.endVoiceCall = function() { document.getElementById('voiceCallModal')?.classList.add('hidden'); };

window.navigate = function(view) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove('hidden');

  if (view === 'customer') {
    setTimeout(() => { if (typeof window.initMap === 'function') window.initMap(); }, 200);
  } else if (view === 'driver') {
    window.handleDriverViewLogic();
  } else if (view === 'admin') {
    const u = window.DB.currentUser;
    const title = document.getElementById('adminWelcomeTitle');
    if (title) {
      title.innerText = (u && u.role === 'moderator') ? `لوحة المشرف: ${u.name}` : `لوحة الإدارة العليا (المدير العام)`;
    }
    window.switchAdminTab('captains');
  }
};

// ==========================================
// 11. تشغيل التطبيق بأمان
// ==========================================
function bootApplication() {
  document.querySelectorAll('.fixed.inset-0').forEach(m => m.classList.add('hidden'));

  window.renderGovernoratesUI();
  window.updateFeaturesAdminUI();
  window.updateNavUI();
  window.applyAllPatches();

  if (window.DB.currentUser) {
    if (window.DB.currentUser.role === 'admin' || window.DB.currentUser.role === 'moderator') window.navigate('admin');
    else if (window.DB.currentUser.role === 'captain') window.navigate('driver');
    else window.navigate('customer');
  } else {
    window.navigate('auth');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApplication);
} else {
  bootApplication();
}
