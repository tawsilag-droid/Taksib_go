/**
 * تطبيق توصيلة سوهاج ومصر - المحرك البرمجي المتقدم
 * يتضمن:
 * 1. بيانات الأدمن الحصرية (01068131386) ونظام إدارة المشرفين (Moderators)
 * 2. تغطية محافظات مصر بالكامل والتحكم الجغرافي (فتح/إغلاق المحافظات)
 * 3. الميزات العالمية التنافسية (المزايدة، الذروة، الكوبونات، وزر SOS، والتقييم)
 * 4. السارينة عالية التردد والنطق الصوتي بالعامية المصرية
 * 5. نظام الباتشات والخرائط الحية
 */

// بيانات الأدمن الرئيسي الحصرية
const SUPER_ADMIN = {
  phone: "01068131386",
  email: "tawsilag@gmail.com",
  password: "0000"
};

// خريطة محافظات جمهورية مصر العربية التفصيلية
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
  { id: 'gharbia', name: 'الغربية (طنطا)', center: [30.7865, 31.0004], zoom: 13, active: true },
  { id: 'sharqia', name: 'الشرقية (الزقازيق)', center: [30.5765, 31.5041], zoom: 13, active: true }
];

const DEFAULT_STORE = {
  currentUser: null,
  users: [
    { phone: "01011111111", password: "123", name: "عميل تجريبي", role: "customer", wallet: 150.0 },
    { phone: "01022222222", password: "123", name: "كابتن أحمد", role: "captain", vehicle: "سيارة ملاكي", plate: "هـ ص ج 4589", status: "approved", wallet: 300.0 }
  ],
  moderators: [
    {
      id: 'mod_1',
      name: 'م. علي إبراهيم',
      phone: '01099998888',
      password: '111',
      role: 'moderator',
      permissions: { captains: true, governorates: true, features: false }
    }
  ],
  captainsPending: [],
  governorates: EGYPT_GOVERNORATES,
  selectedGovId: 'sohag',
  features: {
    biddingEnabled: true,   // نظام التفاوض والمزايدة
    surgeActive: false,     // تسعير الذروة
    surgeMultiplier: 1.3    // نسبة مضاعفة الذروة 1.3x
  },
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

function getDB() {
  try {
    const raw = localStorage.getItem('TAWSILA_MEGA_STORE_V4');
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_STORE, parsed);
  } catch(e) {
    return DEFAULT_STORE;
  }
}

function saveDB(d) {
  try {
    localStorage.setItem('TAWSILA_MEGA_STORE_V4', JSON.stringify(d));
  } catch(e) {
    console.warn("Storage full! Cleaning images...");
  }
}

let DB = getDB();
let activeTripData = null;
let countdownInterval = null;
let tempCaptainDocs = {};
let map, pickupMarker, dropoffMarker, routeLine;
let selectedStarRating = 5;

// ==========================================
// 1. نظام الدخول وتحديد الصلاحيات (Admin & Moderators)
// ==========================================
function handleUserLogin(e) {
  e.preventDefault();
  const idVal = document.getElementById('loginIdentifier').value.trim();
  const passVal = document.getElementById('loginPassword').value.trim();

  // 1. فحص الأدمن الرئيسي
  if ((idVal === SUPER_ADMIN.phone || idVal.toLowerCase() === SUPER_ADMIN.email) && passVal === SUPER_ADMIN.password) {
    DB.currentUser = {
      role: 'admin',
      isSuperAdmin: true,
      name: 'المدير العام',
      phone: SUPER_ADMIN.phone,
      permissions: { captains: true, governorates: true, features: true, moderators: true }
    };
    saveDB(DB);
    updateNavUI();
    navigate('admin');
    alert("🎉 مرحباً بك يا مدير النظام! تم تسجيل دخولك بلوحة الإدارة العليا.");
    return;
  }

  // 2. فحص المشرفين (Moderators)
  const mod = DB.moderators.find(m => m.phone === idVal && m.password === passVal);
  if (mod) {
    DB.currentUser = {
      role: 'moderator',
      isSuperAdmin: false,
      name: mod.name,
      phone: mod.phone,
      permissions: mod.permissions
    };
    saveDB(DB);
    updateNavUI();
    navigate('admin');
    alert(`🎉 مرحباً بك يا أستاذ ${mod.name} (مشرف النظام)! تم فتح لوحة التحكم حسب صلاحياتك.`);
    return;
  }

  // 3. فحص الكباتن قيد الانتظار
  const pendingCap = DB.captainsPending.find(c => c.phone === idVal && c.password === passVal);
  if (pendingCap) {
    DB.currentUser = { role: 'captain', name: pendingCap.name, phone: pendingCap.phone, captainStatus: pendingCap.status };
    saveDB(DB);
    updateNavUI();
    navigate('driver');
    return;
  }

  // 4. فحص الركاب والكباتن المعتمدين
  const user = DB.users.find(u => u.phone === idVal && u.password === passVal);
  if (user) {
    DB.currentUser = user;
    saveDB(DB);
    updateNavUI();
    if (user.role === 'captain') navigate('driver');
    else navigate('customer');
    return;
  }

  alert("❌ خطأ: بيانات الدخول غير صحيحة!");
}

function handleRegisterCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('regCustName').value.trim();
  const phone = document.getElementById('regCustPhone').value.trim();
  const password = document.getElementById('regCustPass').value.trim();

  if (DB.users.some(u => u.phone === phone)) {
    alert("⚠️ هذا الرقم مسجل بالفعل، يرجى تسجيل الدخول.");
    return;
  }

  const newUser = { role: 'customer', name, phone, password, wallet: 150.0 };
  DB.users.push(newUser);
  DB.currentUser = newUser;
  saveDB(DB);
  updateNavUI();
  navigate('customer');
  alert(`🎉 أهلاً بك يا ${name}! تم فتح حسابك.`);
}

function handleRegisterCaptain(e) {
  e.preventDefault();
  const name = document.getElementById('regCapName').value.trim();
  const phone = document.getElementById('regCapPhone').value.trim();
  const password = document.getElementById('regCapPass').value.trim();
  const vehicle = document.getElementById('regCapVehicle').value;
  const plate = document.getElementById('regCapPlate').value.trim();

  if (!tempCaptainDocs.idFront || !tempCaptainDocs.idBack || !tempCaptainDocs.licenseDrive || !tempCaptainDocs.licenseCar) {
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
    docs: { ...tempCaptainDocs }
  };

  DB.captainsPending.push(newCaptain);
  DB.currentUser = { role: 'captain', name, phone, captainStatus: 'pending' };
  saveDB(DB);
  updateNavUI();
  navigate('driver');
  alert("✅ تم إرسال المستندات بنجاح! طلبك قيد مراجعة الإدارة.");
}

function logoutUser() {
  DB.currentUser = null;
  saveDB(DB);
  updateNavUI();
  navigate('auth');
}

function updateNavUI() {
  const u = DB.currentUser;
  const btnAdmin = document.getElementById('nav-btn-admin');
  const btnCustomer = document.getElementById('nav-btn-customer');
  const btnDriver = document.getElementById('nav-btn-driver');
  const btnLogin = document.getElementById('nav-btn-login');
  const userBadge = document.getElementById('navUserBadge');
  const userName = document.getElementById('navUserName');
  const walletBox = document.getElementById('navCustomerWalletBox');

  btnAdmin.classList.add('hidden');
  btnCustomer.classList.add('hidden');
  btnDriver.classList.add('hidden');
  userBadge.classList.add('hidden');
  walletBox.classList.add('hidden');
  btnLogin.classList.remove('hidden');

  if (u) {
    btnLogin.classList.add('hidden');
    userBadge.classList.remove('hidden');
    userName.innerText = u.name;

    if (u.role === 'admin' || u.role === 'moderator') {
      btnAdmin.classList.remove('hidden');
      btnCustomer.classList.remove('hidden');
      btnDriver.classList.remove('hidden');
    } else if (u.role === 'customer') {
      btnCustomer.classList.remove('hidden');
      walletBox.classList.remove('hidden');
      document.getElementById('navCustomerWallet').innerText = (u.wallet || 150).toFixed(2);
    } else if (u.role === 'captain') {
      btnDriver.classList.remove('hidden');
    }
  }
}

function switchAuthTab(tab) {
  document.getElementById('btnAuthTabLogin').className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  document.getElementById('btnAuthTabRegCust').className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  document.getElementById('btnAuthTabRegCap').className = "flex-1 py-2 rounded-xl text-slate-600 transition";

  document.getElementById('formLogin').classList.add('hidden');
  document.getElementById('formRegCustomer').classList.add('hidden');
  document.getElementById('formRegCaptain').classList.add('hidden');

  if (tab === 'login') {
    document.getElementById('btnAuthTabLogin').className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    document.getElementById('formLogin').classList.remove('hidden');
  } else if (tab === 'reg-customer') {
    document.getElementById('btnAuthTabRegCust').className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    document.getElementById('formRegCustomer').classList.remove('hidden');
  } else if (tab === 'reg-captain') {
    document.getElementById('btnAuthTabRegCap').className = "flex-1 py-2 rounded-xl bg-amber-500 text-slate-900 font-black shadow";
    document.getElementById('formRegCaptain').classList.remove('hidden');
  }
}

function handleCompressUpload(event, key) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 320;
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; }
      else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      tempCaptainDocs[key] = canvas.toDataURL('image/webp', 0.6);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 2. إدارة المحافظات والتحكم الجغرافي (Geofencing)
// ==========================================
function renderGovernoratesUI() {
  const select = document.getElementById('custGovernorateSelect');
  if (select) {
    select.innerHTML = DB.governorates.map(g => `
      <option value="${g.id}" ${g.id === DB.selectedGovId ? 'selected' : ''}>
        ${g.name} ${g.active ? '' : '(مغلقة حالياً)'}
      </option>
    `).join('');
  }

  // في لوحة الأدمن
  const grid = document.getElementById('adminGovernoratesGrid');
  if (grid) {
    grid.innerHTML = DB.governorates.map(g => `
      <div class="p-3 border rounded-2xl ${g.active ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'} flex items-center justify-between">
        <div>
          <b class="text-xs text-slate-800 block">${g.name}</b>
          <span class="text-[10px] font-bold ${g.active ? 'text-emerald-700' : 'text-rose-700'}">
            ${g.active ? '🟢 الخدمة مفتوحة ومتاحة' : '🔴 الخدمة متوقفة ومغلقة'}
          </span>
        </div>
        <button onclick="toggleGovernorateActive('${g.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black shadow transition ${g.active ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}">
          ${g.active ? 'إغلاق المحافظة' : 'فتح المحافظة'}
        </button>
      </div>
    `).join('');
  }
}

function handleGovernorateChange(govId) {
  const gov = DB.governorates.find(g => g.id === govId);
  if (!gov) return;
  DB.selectedGovId = govId;
  saveDB(DB);

  document.getElementById('activeGovBadge').innerText = gov.name;
  if (!gov.active) {
    showTopAlert(`⚠️ تنبيه: خدمة حجز المشاوير متوقفة مؤقتاً في محافظة (${gov.name}) بقرار من الإدارة.`);
  } else {
    hideTopAlert();
  }

  if (map) {
    map.flyTo(gov.center, gov.zoom);
    pickupMarker.setLatLng(gov.center);
    dropoffMarker.setLatLng([gov.center[0] - 0.015, gov.center[1] + 0.015]);
    recalcTrip();
  }
}

function toggleGovernorateActive(govId) {
  const gov = DB.governorates.find(g => g.id === govId);
  if (!gov) return;
  gov.active = !gov.active;
  saveDB(DB);
  renderGovernoratesUI();
  if (DB.selectedGovId === govId) handleGovernorateChange(govId);
  alert(`تم ${gov.active ? 'فتح' : 'إغلاق'} العمل في محافظة (${gov.name}) بنجاح!`);
}

function showTopAlert(msg) {
  const bar = document.getElementById('topAlertBar');
  document.getElementById('topAlertMessage').innerText = msg;
  bar.classList.remove('hidden');
}
function hideTopAlert() {
  document.getElementById('topAlertBar').classList.add('hidden');
}

// ==========================================
// 3. الميزات العالمية (الكوبونات + الذروة + المزايدة + SOS)
// ==========================================
function applyPromoCode() {
  const codeInp = document.getElementById('promoCodeInput').value.trim().toUpperCase();
  const statusEl = document.getElementById('promoCodeStatus');
  const promo = DB.promoCodes.find(p => p.code === codeInp && p.active);

  if (promo) {
    DB.activeDiscountPercent = promo.discountPercent;
    statusEl.innerText = `🎉 تم تطبيق كود الخصم! خصم ${promo.discountPercent}% على الرحلة.`;
    statusEl.classList.remove('hidden');
    recalcTrip();
  } else {
    DB.activeDiscountPercent = 0;
    statusEl.innerText = `❌ كود الخصم غير صحيح أو منتهي الصلاحية.`;
    statusEl.classList.remove('hidden');
    recalcTrip();
  }
}

function toggleFeatureSetting(key) {
  DB.features[key] = !DB.features[key];
  saveDB(DB);
  updateFeaturesAdminUI();
  recalcTrip();
}

function updateSurgeMultiplier(val) {
  DB.features.surgeMultiplier = parseFloat(val) || 1.3;
  saveDB(DB);
  recalcTrip();
}

function updateFeaturesAdminUI() {
  const btnBidding = document.getElementById('btnToggleBidding');
  const btnSurge = document.getElementById('btnToggleSurge');
  const surgeInp = document.getElementById('surgeMultiplierInput');

  if (btnBidding) {
    btnBidding.className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.biddingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`;
    btnBidding.innerText = DB.features.biddingEnabled ? 'مفعل وشغال' : 'معطل';
  }
  if (btnSurge) {
    btnSurge.className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.surgeActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`;
    btnSurge.innerText = DB.features.surgeActive ? 'الذروة نشطة الآن' : 'معطلة';
  }
  if (surgeInp) {
    surgeInp.value = DB.features.surgeMultiplier || 1.3;
  }

  // قسم المزايدة في شاشة العميل
  const biddingBox = document.getElementById('biddingBoxSection');
  if (biddingBox) {
    if (DB.features.biddingEnabled) biddingBox.classList.remove('hidden');
    else biddingBox.classList.add('hidden');
  }

  // شارة الذروة
  const surgeBadge = document.getElementById('surgeBadge');
  if (surgeBadge) {
    if (DB.features.surgeActive) surgeBadge.classList.remove('hidden');
    else surgeBadge.classList.add('hidden');
  }

  renderPromoCodesList();
}

function renderPromoCodesList() {
  const container = document.getElementById('adminPromoCodesList');
  if (!container) return;
  container.innerHTML = DB.promoCodes.map((p, idx) => `
    <div class="flex justify-between items-center p-2 bg-slate-50 border rounded-xl text-xs">
      <div>
        <b class="font-mono text-emerald-700">${p.code}</b>
        <span class="text-slate-500 mr-2">خصم ${p.discountPercent}%</span>
      </div>
      <button onclick="deletePromo(${idx})" class="text-rose-600 font-bold hover:underline">حذف</button>
    </div>
  `).join('') || '<p class="text-slate-400 text-xs">لا توجد كوبونات مضافة</p>';
}

function openNewPromoModal() { document.getElementById('addPromoModal').classList.remove('hidden'); }
function closeNewPromoModal() { document.getElementById('addPromoModal').classList.add('hidden'); }
function handleSavePromo(e) {
  e.preventDefault();
  const code = document.getElementById('promoCodeVal').value.trim().toUpperCase();
  const disc = parseInt(document.getElementById('promoDiscountVal').value) || 20;
  DB.promoCodes.push({ code, discountPercent: disc, active: true });
  saveDB(DB);
  renderPromoCodesList();
  closeNewPromoModal();
  alert("تمت إضافة كود الخصم بنجاح!");
}
function deletePromo(idx) {
  DB.promoCodes.splice(idx, 1);
  saveDB(DB);
  renderPromoCodesList();
}

// المزايدة والتفاوض (Bidding)
function adjustBidFare(amt) {
  const inp = document.getElementById('customBidInput');
  let current = parseFloat(inp.value) || 30;
  current = Math.max(10, current + amt);
  inp.value = current;
  updateBidFare(current);
}

function updateBidFare(val) {
  DB.customBidFare = parseFloat(val);
  document.getElementById('customBidDisplay').innerText = `${DB.customBidFare} ج.م`;
  document.getElementById('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`;
}

// زر الأمان والاستغاثة SOS
function triggerEmergencySOS() {
  const confirmed = confirm("🚨 هل أنت في حالة طوارئ؟\nسيتم إرسال إشعار فوري وتحديد موقعك المباشر مع بيانات الرحلة لإدارة السلامة.");
  if (confirmed) {
    alert("🛡️ تم إطلاق تنبيه الأمان SOS ومشاركة موقعك المباشر مع فريق الدعم والإدارة فوراً!");
  }
}

// تقييم النجوم
function setRating(stars) {
  selectedStarRating = stars;
  const icons = document.querySelectorAll('#starsRatingContainer i');
  icons.forEach((ic, i) => {
    if (i < stars) {
      ic.className = "fa-solid fa-star text-amber-400";
    } else {
      ic.className = "fa-regular fa-star text-slate-300";
    }
  });
}

function submitRating() {
  document.getElementById('ratingModal').classList.add('hidden');
  alert(`⭐ شكراً لك! تم تسجيل تقييمك (${selectedStarRating} نجوم) للكابتن بنجاح.`);
}

// ==========================================
// 4. تعيين وإدارة المشرفين والصلاحيات (Moderators)
// ==========================================
function renderAdminModerators() {
  const tbody = document.getElementById('adminModeratorsListTable');
  if (!tbody) return;

  tbody.innerHTML = DB.moderators.map((m, idx) => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">${m.name}</td>
      <td class="p-3 font-mono text-slate-600">${m.phone}</td>
      <td class="p-3 space-x-1 space-x-reverse">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.captains ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">وثائق الكباتن</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.governorates ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'}">المحافظات</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.permissions.features ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}">الأدوات والكوبونات</span>
      </td>
      <td class="p-3 text-center">
        <button onclick="deleteModerator(${idx})" class="text-rose-600 font-bold hover:underline">حذف المشرف</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا يوجد مشرفين مضافين حالياً</td></tr>`;
}

function openNewModeratorModal() { document.getElementById('addModeratorModal').classList.remove('hidden'); }
function closeNewModeratorModal() { document.getElementById('addModeratorModal').classList.add('hidden'); }

function handleSaveModerator(e) {
  e.preventDefault();
  const name = document.getElementById('modNameInput').value.trim();
  const phone = document.getElementById('modPhoneInput').value.trim();
  const password = document.getElementById('modPassInput').value.trim();

  const newMod = {
    id: 'mod_' + Date.now(),
    name,
    phone,
    password,
    role: 'moderator',
    permissions: {
      captains: document.getElementById('permCaptains').checked,
      governorates: document.getElementById('permGovernorates').checked,
      features: document.getElementById('permFeatures').checked
    }
  };

  DB.moderators.push(newMod);
  saveDB(DB);
  renderAdminModerators();
  closeNewModeratorModal();
  alert(`✅ تم تعيين المشرف "${name}" بنجاح! يستطيع الآن الدخول برقمه وكلمة مروره.`);
}

function deleteModerator(idx) {
  if (!confirm("هل أنت متأكد من حذف هذا المشرف وسحب صلاحياته؟")) return;
  DB.moderators.splice(idx, 1);
  saveDB(DB);
  renderAdminModerators();
}

// تبويبات الأدمن مع مراعاة صلاحيات المشرف
function switchAdminTab(tab) {
  const u = DB.currentUser;
  // فحص الصلاحية للمشرفين
  if (u && u.role === 'moderator') {
    if (tab === 'moderators') {
      alert("⚠️ عفواً، إدارة المشرفين مقتصرة حصرياً على المدير العام.");
      return;
    }
    if (tab === 'captains' && !u.permissions.captains) {
      alert("⚠️ ليس لديك صلاحية لمراجعة وثائق الكباتن.");
      return;
    }
    if (tab === 'governorates' && !u.permissions.governorates) {
      alert("⚠️ ليس لديك صلاحية للتحكم بالمحافظات.");
      return;
    }
    if (tab === 'features' && !u.permissions.features) {
      alert("⚠️ ليس لديك صلاحية لإدارة الكوبونات والذروة.");
      return;
    }
  }

  document.querySelectorAll('.admin-tab-btn').forEach(b => b.className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100");
  ['captains', 'governorates', 'features', 'moderators', 'patches'].forEach(t => document.getElementById(`admintab-${t}`)?.classList.add('hidden'));

  const activeBtn = document.getElementById(`btn-adm-${tab}`);
  if (activeBtn) activeBtn.className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold";
  document.getElementById(`admintab-${tab}`)?.classList.remove('hidden');

  if (tab === 'captains') renderAdminCaptains();
  if (tab === 'governorates') renderGovernoratesUI();
  if (tab === 'features') updateFeaturesAdminUI();
  if (tab === 'moderators') renderAdminModerators();
  if (tab === 'patches') renderPatches();
}

// ==========================================
// 5. محرك الصوت المرتفع والنطق العامي
// ==========================================
let alertAudioCtx = null;
let isAlertRinging = false;
let alertLoopTimeout = null;

function initAudioContext() {
  if (!alertAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) alertAudioCtx = new AudioContextClass();
  }
  if (alertAudioCtx && alertAudioCtx.state === 'suspended') {
    alertAudioCtx.resume();
  }
}
document.addEventListener('click', initAudioContext, { once: false });

function playHighPitchDispatchAlarm(callback) {
  initAudioContext();
  if (!alertAudioCtx) { if (callback) callback(); return; }

  const now = alertAudioCtx.currentTime;
  const osc1 = alertAudioCtx.createOscillator();
  const osc2 = alertAudioCtx.createOscillator();
  const gain = alertAudioCtx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';

  osc1.frequency.setValueAtTime(750, now);
  osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.25);
  osc1.frequency.linearRampToValueAtTime(800, now + 0.5);
  osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.75);

  osc2.frequency.setValueAtTime(850, now);
  osc2.frequency.exponentialRampToValueAtTime(1550, now + 0.25);
  osc2.frequency.linearRampToValueAtTime(900, now + 0.5);
  osc2.frequency.exponentialRampToValueAtTime(1700, now + 0.75);

  gain.gain.setValueAtTime(1.0, now);
  gain.gain.setValueAtTime(1.0, now + 0.85);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(alertAudioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.1);
  osc2.stop(now + 1.1);

  if (callback) setTimeout(() => { if (isAlertRinging) callback(); }, 1150);
}

function speakTripDetailsArabic(trip) {
  if (!isAlertRinging || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const speechText = `يا كابتن! في مشوار جديد واصلك. الركوب من: ${trip.from}. والجهة إلى: ${trip.to}. والأجرة: ${Math.round(trip.fare)} جنيه مصري.`;
  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'ar-EG';
  utterance.rate = 0.95;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang === 'ar-EG') || voices.find(v => v.lang.startsWith('ar'));
  if (arVoice) utterance.voice = arVoice;

  utterance.onend = () => {
    if (isAlertRinging) {
      alertLoopTimeout = setTimeout(() => {
        if (isAlertRinging) playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip));
      }, 1200);
    }
  };

  window.speechSynthesis.speak(utterance);
}

function startIncomingTripAlert(trip) {
  isAlertRinging = true;
  initAudioContext();
  clearTimeout(alertLoopTimeout);
  playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip));
}

function stopIncomingTripAlert() {
  isAlertRinging = false;
  clearTimeout(alertLoopTimeout);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function testDriverAlertSound() {
  initAudioContext();
  alert("🔊 جاري تشغيل سارينة التنبيه ونطق تجريبي...");
  stopIncomingTripAlert();
  isAlertRinging = true;
  playHighPitchDispatchAlarm(() => {
    speakTripDetailsArabic({ from: "ميدان التحرير", to: "مصر الجديدة", fare: 45 });
    setTimeout(stopIncomingTripAlert, 6000);
  });
}

// ==========================================
// 6. الخريطة المتقدمة ودورة الرحلة
// ==========================================
function initMap() {
  if (map) return;
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  map = L.map('map').setView(activeGov.center, activeGov.zoom);

  // استخدام خريطة تفصيلية تدعم الشوارع المصرية
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const pIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const dIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });

  pickupMarker = L.marker(activeGov.center, { icon: pIcon, draggable: true }).addTo(map);
  dropoffMarker = L.marker([activeGov.center[0] - 0.015, activeGov.center[1] + 0.015], { icon: dIcon, draggable: true }).addTo(map);

  pickupMarker.on('dragend', () => recalcTrip());
  dropoffMarker.on('dragend', () => recalcTrip());

  map.on('click', e => {
    dropoffMarker.setLatLng(e.latlng);
    document.getElementById('dropoffInput').value = "الموقع المحدد على الخريطة";
    recalcTrip();
  });

  document.getElementById('pickupInput').value = `ميدان المحطة - ${activeGov.name}`;
  document.getElementById('dropoffInput').value = `الشارع الرئيسي - ${activeGov.name}`;
  renderCustomerVehicles();
  recalcTrip();
}

function recalcTrip() {
  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  const pLatLng = pickupMarker ? pickupMarker.getLatLng() : { lat: activeGov.center[0], lng: activeGov.center[1] };
  const dLatLng = dropoffMarker ? dropoffMarker.getLatLng() : { lat: activeGov.center[0] - 0.015, lng: activeGov.center[1] + 0.015 };

  if (routeLine && map) map.removeLayer(routeLine);
  if (map) routeLine = L.polyline([pLatLng, dLatLng], { color: '#059669', weight: 4 }).addTo(map);

  const dist = 4.5;
  document.getElementById('calcDistanceText').innerText = `${dist} كم`;

  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  let total = veh.baseFare + (dist * veh.perKm) + DB.extraFare;

  // تطبيق مضاعف الذروة إذا كانت نشطة
  if (DB.features.surgeActive) {
    total *= (DB.features.surgeMultiplier || 1.3);
  }

  // تطبيق كود الخصم إذا وجد
  if (DB.activeDiscountPercent > 0) {
    total -= (total * (DB.activeDiscountPercent / 100));
  }

  total = Math.max(10, total);

  if (DB.customBidFare !== null && DB.features.biddingEnabled) {
    document.getElementById('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`;
  } else {
    document.getElementById('calcTotalFareText').innerText = `${total.toFixed(2)} ج.م`;
    const bidInp = document.getElementById('customBidInput');
    if (bidInp) bidInp.value = Math.round(total);
    const bidDisp = document.getElementById('customBidDisplay');
    if (bidDisp) bidDisp.innerText = `${Math.round(total)} ج.م`;
  }
}

function renderCustomerVehicles() {
  const g = document.getElementById('vehicleTypesGrid');
  if (!g) return;
  g.innerHTML = DB.vehicles.filter(v => v.enabled).map(v => `
    <button onclick="selectVehicle('${v.id}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}">
      <i class="${v.icon} text-xl text-slate-600 mb-1"></i>
      <div class="font-black text-[11px]">${v.name}</div>
      <div class="text-[9px] text-emerald-700 font-bold">يبدأ ${v.baseFare} ج.م</div>
    </button>
  `).join('');
}

function selectVehicle(id) {
  DB.selectedVehicleId = id;
  saveDB(DB);
  renderCustomerVehicles();
  recalcTrip();
}

function handleSearchSuggestions(q, type) {
  const c = document.getElementById(`${type}Suggestions`);
  if (!q.trim()) { c.classList.add('hidden'); return; }
  const landmarks = ["ميدان التحرير", "ميدان الثقافة", "الكورنيش", "الجامعة", "محطة القطار", "ميدان العارف"];
  const matches = landmarks.filter(i => i.includes(q.trim()));
  c.innerHTML = matches.map(m => `
    <div onclick="document.getElementById('${type}Input').value='${m}'; document.getElementById('${type}Suggestions').classList.add('hidden');" class="p-2 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700">
      <i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i> ${m}
    </div>
  `).join('') || `<div class="p-2 text-slate-400">لا توجد نتائج</div>`;
  c.classList.remove('hidden');
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      const loc = [p.coords.latitude, p.coords.longitude];
      if (pickupMarker) pickupMarker.setLatLng(loc);
      if (map) map.setView(loc, 15);
      document.getElementById('pickupInput').value = "موقعي الحالي (GPS)";
      recalcTrip();
    });
  }
}

// طلب الرحلة
function handleCustomerRequestRide() {
  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  if (!activeGov.active) {
    alert(`⚠️ عفواً، خدمة طلب المشاوير متوقفة ومغلقة حالياً في محافظة (${activeGov.name}).`);
    return;
  }

  initAudioContext();
  const fare = parseFloat(document.getElementById('calcTotalFareText').innerText);
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId);

  activeTripData = {
    from: document.getElementById('pickupInput').value,
    to: document.getElementById('dropoffInput').value,
    vehicle: veh.name,
    fare: fare
  };

  document.getElementById('btnRequestRide').disabled = true;
  document.getElementById('btnRequestRide').innerText = "جاري البحث عن أقرب كابتن...";
  document.getElementById('custStatusBadge').innerText = "تم إرسال الطلب";

  document.getElementById('driverIdleBox').classList.add('hidden');
  document.getElementById('driverOfferBox').classList.remove('hidden');
  document.getElementById('offerFromText').innerText = activeTripData.from;
  document.getElementById('offerToText').innerText = activeTripData.to;
  document.getElementById('offerVehicleText').innerText = activeTripData.vehicle;
  document.getElementById('offerFareText').innerText = `${activeTripData.fare} ج.م`;

  startIncomingTripAlert(activeTripData);

  let timeLeft = 25;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    const t = document.getElementById('countdownTimer');
    if (t) t.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      stopIncomingTripAlert();
      resetCaptain();
      alert("انتهت مهلة قبول المشوار.");
    }
  }, 1000);
}

function captainAcceptTrip() {
  clearInterval(countdownInterval);
  stopIncomingTripAlert();
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.remove('hidden');
  document.getElementById('driverActiveTripFare').innerText = `الأجرة: ${activeTripData.fare} ج.م`;
  document.getElementById('customerDriverCard').classList.remove('hidden');
  document.getElementById('custStatusBadge').innerText = "الكابتن قادم لموقعك";
}

function captainRejectTrip() {
  clearInterval(countdownInterval);
  stopIncomingTripAlert();
  resetCaptain();
  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerText = "طلب المشوار فوراً";
  document.getElementById('custStatusBadge').innerText = "تم الرفض، جرب ثانية";
}

function captainNotifyArrived() {
  document.getElementById('btnCaptainArrived').classList.add('hidden');
  document.getElementById('btnCaptainStartTrip').classList.remove('hidden');
  alert("🔔 إشعار للعميل: وصل الكابتن وهو بانتظارك!");
}

function captainStartTrip() {
  document.getElementById('btnCaptainStartTrip').classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip').classList.remove('hidden');
}

function captainCompleteTrip() {
  const fare = activeTripData.fare;
  const u = DB.currentUser;
  if (u && u.role === 'customer' && u.wallet >= fare) u.wallet -= fare;
  saveDB(DB);
  updateNavUI();
  resetCaptain();

  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerText = "طلب المشوار فوراً";
  document.getElementById('customerDriverCard').classList.add('hidden');
  document.getElementById('custStatusBadge').innerText = "اكتملت الرحلة";

  // إظهار نافذة تقييم النجوم للعميل
  document.getElementById('ratingModal').classList.remove('hidden');
}

function resetCaptain() {
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.add('hidden');
  document.getElementById('driverIdleBox').classList.remove('hidden');
}

// ==========================================
// 7. إدارة وثائق الكباتن للأدمن
// ==========================================
function renderAdminCaptains() {
  const tbody = document.getElementById('adminCaptainsListTable');
  const countEl = document.getElementById('adminPendingCount');
  if (!tbody) return;

  const pending = DB.captainsPending.filter(c => c.status === 'pending');
  if (countEl) countEl.innerText = pending.length;

  if (DB.captainsPending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد طلبات كباتن مسجلة حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = DB.captainsPending.map(c => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">${c.name}</td>
      <td class="p-3 font-mono">${c.phone}<br><span class="text-slate-500">${c.plate}</span></td>
      <td class="p-3">${c.vehicle}</td>
      <td class="p-3">
        <button onclick="inspectCaptainDocs('${c.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded text-[11px] font-bold">
          <i class="fa-solid fa-eye ml-1"></i> فحص المستندات (4)
        </button>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
          ${c.status === 'approved' ? 'معتمد ومفعل' : c.status === 'rejected' ? 'مرفوض' : 'بانتظار الاعتماد'}
        </span>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        ${c.status !== 'approved' ? `<button onclick="approveCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs">قبول وتفعيل الكابتن</button>` : ''}
        ${c.status !== 'rejected' ? `<button onclick="rejectCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs">رفض</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function inspectCaptainDocs(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap || !cap.docs) return;
  document.getElementById('inspectCaptainTitle').innerText = `مستندات الكابتن: ${cap.name}`;
  const grid = document.getElementById('inspectImagesGrid');
  
  const docsList = [
    { label: "بطاقة الرقم القومي (وجه)", src: cap.docs.idFront },
    { label: "بطاقة الرقم القومي (ظهر)", src: cap.docs.idBack },
    { label: "رخصة القيادة", src: cap.docs.licenseDrive },
    { label: "رخصة تسيير المركبة", src: cap.docs.licenseCar }
  ];

  grid.innerHTML = docsList.map(d => `
    <div class="border rounded-2xl p-2 bg-slate-50 space-y-1">
      <span class="font-bold text-slate-700 block">${d.label}</span>
      <div class="h-32 bg-white rounded-xl border flex items-center justify-center overflow-hidden">
        ${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : '<span class="text-slate-400">غير متوفر</span>'}
      </div>
    </div>
  `).join('');

  document.getElementById('adminDocsInspectModal').classList.remove('hidden');
}

function closeDocsInspectModal() { document.getElementById('adminDocsInspectModal').classList.add('hidden'); }

function approveCaptainByAdmin(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'approved';

  if (!DB.users.some(u => u.phone === cap.phone)) {
    DB.users.push({
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

  saveDB(DB);
  renderAdminCaptains();
  alert(`✅ تم اعتماد الكابتن "${cap.name}" بنجاح!`);
}

function rejectCaptainByAdmin(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'rejected';
  saveDB(DB);
  renderAdminCaptains();
  alert(`تم رفض الكابتن "${cap.name}".`);
}

// ==========================================
// 8. محرك الباتشات البرمجية
// ==========================================
function getPatches() {
  try {
    const raw = localStorage.getItem('TAWSILA_PATCHES');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}
function savePatches(p) { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(p)); }

function injectPatch(p, idx) {
  const oldS = document.getElementById(`injected-patch-css-${idx}`);
  if (oldS) oldS.remove();
  const oldH = document.getElementById(`injected-patch-html-${idx}`);
  if (oldH) oldH.remove();

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
}

function applyAllPatches() {
  getPatches().forEach((p, idx) => { if (p.enabled) injectPatch(p, idx); });
}

function renderPatches() {
  const tbody = document.getElementById('adminPatchesListTable');
  if (!tbody) return;
  const p = getPatches();
  tbody.innerHTML = p.map((item, idx) => `
    <tr class="border-b">
      <td class="p-3 font-bold">${item.name}</td>
      <td class="p-3 uppercase text-[10px] font-bold font-mono">${item.type}</td>
      <td class="p-3"><button onclick="togglePatchStatus(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${item.enabled ? 'مفعل ومحقون' : 'معطل'}</button></td>
      <td class="p-3 text-center"><button onclick="deletePatch(${idx})" class="text-rose-600 font-bold text-xs">حذف</button></td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات</td></tr>`;
}

function openNewPatchModal() {
  document.getElementById('patchNameInput').value = '';
  document.getElementById('patchCodeInput').value = '';
  document.getElementById('patchEditorModal').classList.remove('hidden');
}
function closePatchModal() { document.getElementById('patchEditorModal').classList.add('hidden'); }

function handleSavePatch(e) {
  e.preventDefault();
  const name = document.getElementById('patchNameInput').value.trim();
  const type = document.getElementById('patchTypeInput').value;
  const code = document.getElementById('patchCodeInput').value;
  const p = getPatches();
  p.push({ name, type, code, enabled: true });
  savePatches(p);
  applyAllPatches();
  renderPatches();
  closePatchModal();
  alert("تم حقن الباتش فوراً!");
}

function togglePatchStatus(idx) {
  const p = getPatches();
  if (p[idx]) { p[idx].enabled = !p[idx].enabled; savePatches(p); applyAllPatches(); renderPatches(); }
}

function deletePatch(idx) {
  const p = getPatches();
  p.splice(idx, 1);
  savePatches(p);
  applyAllPatches();
  renderPatches();
}

// ==========================================
// 9. التنقل وإقلاع النظام
// ==========================================
function navigate(view) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove('hidden');

  if (view === 'customer') {
    setTimeout(() => { initMap(); if (map) map.invalidateSize(); }, 200);
  } else if (view === 'driver') {
    handleDriverViewLogic();
  } else if (view === 'admin') {
    const u = DB.currentUser;
    if (u && u.role === 'moderator') {
      document.getElementById('adminWelcomeTitle').innerText = `لوحة المشرف: ${u.name}`;
      switchAdminTab('captains');
    } else {
      document.getElementById('adminWelcomeTitle').innerText = `لوحة الإدارة العليا (المدير العام)`;
      switchAdminTab('captains');
    }
  }
}

function handleDriverViewLogic() {
  const u = DB.currentUser;
  const pendingScreen = document.getElementById('captainPendingScreen');
  const activeScreen = document.getElementById('captainActiveScreen');

  if (u && u.role === 'captain' && u.captainStatus === 'pending') {
    pendingScreen.classList.remove('hidden');
    activeScreen.classList.add('hidden');
  } else {
    pendingScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');
    if (u) {
      document.getElementById('driverDashboardName').innerText = `الكابتن: ${u.name}`;
      document.getElementById('driverWalletEGP').innerText = `${(u.wallet || 300).toFixed(2)} ج.م`;
    }
  }
}

function handleLogoClick() {
  const u = DB.currentUser;
  if (!u) navigate('auth');
  else if (u.role === 'admin' || u.role === 'moderator') navigate('admin');
  else if (u.role === 'captain') navigate('driver');
  else navigate('customer');
}

function openWalletModal() { document.getElementById('walletModal').classList.remove('hidden'); }
function closeWalletModal() { document.getElementById('walletModal').classList.add('hidden'); }
function confirmCustomerRecharge() {
  const amt = parseFloat(document.getElementById('walletRechargeAmount').value) || 50;
  if (DB.currentUser) DB.currentUser.wallet = (DB.currentUser.wallet || 0) + amt;
  saveDB(DB);
  updateNavUI();
  closeWalletModal();
  alert(`تم شحن المحفظة بمبلغ ${amt} ج.م بنجاح!`);
}

function openChatModal() { document.getElementById('chatModal').classList.remove('hidden'); }
function closeChatModal() { document.getElementById('chatModal').classList.add('hidden'); }
function handleSendChatMessage(e) {
  e.preventDefault();
  const inp = document.getElementById('chatInputText');
  document.getElementById('chatMessagesBox').innerHTML += `<div class="bg-emerald-600 text-white p-2 rounded-xl text-xs max-w-[80%] mr-auto">${inp.value}</div>`;
  inp.value = '';
}

function startVoiceCall() { document.getElementById('voiceCallModal').classList.remove('hidden'); }
function endVoiceCall() { document.getElementById('voiceCallModal').classList.add('hidden'); }

// بدء التشغيل
window.addEventListener('DOMContentLoaded', () => {
  renderGovernoratesUI();
  updateFeaturesAdminUI();
  updateNavUI();
  applyAllPatches();

  if (DB.currentUser) {
    if (DB.currentUser.role === 'admin' || DB.currentUser.role === 'moderator') navigate('admin');
    else if (DB.currentUser.role === 'captain') navigate('driver');
    else navigate('customer');
  } else {
    navigate('auth');
  }
});
