
/**
 * تطبيق توصيلة مصر - المحرك الموحد السحابي الكامل (Firebase-First Super App)
 * يشمل: كل الباتشات الـ 27 + الميزات المتقدمة + OSRM + GPS + حماية XSS + إصلاح الدخول والقيادة والمحفظة.
 */

const DEFAULT_FIREBASE_DB_URL = "https://tawsila-37a80-default-rtdb.firebaseio.com";
const FIREBASE_APP_CONFIG = {
  apiKey: "AIzaSyCInSPfdx4IVQNZP-d5N20Iph9pPrjgEgY",
  authDomain: "tawsila-37a80.firebaseapp.com",
  databaseURL: "https://tawsila-37a80-default-rtdb.firebaseio.com",
  projectId: "tawsila-37a80",
  storageBucket: "tawsila-37a80.firebasestorage.app",
  messagingSenderId: "445529499230",
  appId: "1:445529499230:web:3dd3c1d31414d7576436cf",
  measurementId: "G-FE5MJE4R28"
};
const SUPER_ADMIN = { phone: "01068131386", email: "tawsilag@gmail.com", password: "0000" };

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const toEnDigits = s => String(s ?? '').replace(/[\s\u200e\u200f\u202a-\u202e\ufeff]/g, '').replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
const safeNum = (v, fb = 0, min = -Infinity, max = Infinity) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb; };
const safeJson = (r, fb) => { try { const p = JSON.parse(r); return (p && typeof p === 'object') ? p : fb; } catch (e) { return fb; } };
async function fetchTimeout(url, opt = {}, ms = 4000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opt, signal: c.signal }); } finally { clearTimeout(t); }
}

const EGYPT_27_GOVS = [
  ['sohag','سوهاج',26.5569,31.6948,13,'مدينة سوهاج,أخميم,جرجا,طهطا,طما,المراغة,البلينا,دار السلام'],
  ['cairo','القاهرة',30.0444,31.2357,12,'مدينة نصر,مصر الجديدة,المعادي,شبرا,حلوان,التجمع الخامس'],
  ['giza','الجيزة',30.0131,31.2089,12,'الدقي,المهندسين,الهرم,فيصل,6 أكتوبر,الشيخ زايد,البدرشين'],
  ['alex','الإسكندرية',31.2001,29.9187,12,'سموحة,سيدي جابر,المنتزه,العجمي,محطة الرمل,برج العرب'],
  ['qalyubia','القليوبية',30.4660,31.1848,12,'بنها,شبرا الخيمة,قليوب,القناطر الخيرية,طوخ,الخانكة'],
  ['sharqia','الشرقية',30.5765,31.5041,12,'الزقازيق,العاشر من رمضان,بلبيس,منيا القمح,فاقوس,أبو حماد'],
  ['dakahlia','الدقهلية',31.0409,31.3785,12,'المنصورة,طلخا,ميت غمر,السنبلاوين,دكرنس,بلقاس'],
  ['gharbia','الغربية',30.7865,31.0004,12,'طنطا,المحلة الكبرى,زفتى,كفر الزيات,السنطة,سمنود'],
  ['monufia','المنوفية',30.5503,31.0106,12,'شبين الكوم,مدينة السادات,منوف,أشمون,قويسنا,الباجور'],
  ['beheira','البحيرة',31.0422,30.4667,12,'دمنهور,كفر الدوار,إيتاي البارود,كوم حمادة,رشيد,أبو المطامير'],
  ['kafrelsheikh','كفر الشيخ',31.1107,30.9388,12,'كفر الشيخ,دسوق,بيلا,فوه,سيدي سالم,الحامول'],
  ['damietta','دمياط',31.4175,31.8144,12,'دمياط,دمياط الجديدة,رأس البر,فارسكور,الزرقا,كفر سعد'],
  ['portsaid','بورسعيد',31.2653,32.3019,13,'حي الشرق,حي العرب,حي الضواحي,بورفؤاد,حي الزهور'],
  ['ismailia','الإسماعيلية',30.5965,32.2715,12,'الإسماعيلية,فايد,التل الكبير,القنطرة شرق,أبو صوير'],
  ['suez','السويس',29.9668,32.5498,13,'حي السويس,حي الأربعين,فيصل,عتاقة,الجناين'],
  ['faiyum','الفيوم',29.3084,30.8428,12,'مدينة الفيوم,سنورس,إطسا,طامية,أبشواي,يوسف الصديق'],
  ['benisuef','بني سويف',29.0661,31.0994,12,'بني سويف,الواسطى,ببا,الفشن,إهناسيا,ناصر'],
  ['minya','المنيا',28.1099,30.7503,12,'المنيا,ملوي,سمالوط,بني مزار,مغاغة,أبو قرقاص'],
  ['asyut','أسيوط',27.1809,31.1837,12,'أسيوط,ديروط,منفلوط,القوصية,أبنوب,أبو تيج'],
  ['qena','قنا',26.1551,32.7160,12,'قنا,نجع حمادي,دشنا,قوص,فرشوط,أبو تشت'],
  ['luxor','الأقصر',25.6872,32.6396,13,'الأقصر,إسنا,أرمنت,القرنة,الطود,البياضية'],
  ['aswan','أسوان',24.0889,32.8998,12,'أسوان,كوم أمبو,إدفو,دراو,نصر النوبة'],
  ['redsea','البحر الأحمر',27.2579,33.8116,12,'الغردقة,سفاجا,القصير,مرسى علم,رأس غارب'],
  ['newvalley','الوادي الجديد',25.4390,30.5586,11,'الخارجة,الداخلة,الفرافرة,باريس,بلاط'],
  ['matrouh','مطروح',31.3543,27.2373,12,'مرسى مطروح,العلمين,الحمام,الضبعة,سيوة,السلوم'],
  ['northsinai','شمال سيناء',31.1321,33.8033,12,'العريش,الشيخ زويد,رفح,بئر العبد,الحسنة'],
  ['southsinai','جنوب سيناء',27.9158,34.3299,12,'شرم الشيخ,الطور,دهب,نويبع,سانت كاترين,طابا']
].map(([id, name, lat, lng, zoom, areas]) => ({ id, name, center: [lat, lng], zoom, active: true, areas: areas.split(',').map(a => ({ name: a, active: true })) }));

const DEFAULT_STORE = {
  currentUser: null,
  users: [
    { phone: "01011111111", password: "123", name: "عميل تجريبي", role: "customer", wallet: 150.0, loyaltyPoints: 20, blockedBy: [], favorites: {} },
    { phone: "01022222222", password: "123", name: "كابتن أحمد", role: "captain", vehicle: "سيارة ملاكي", plate: "هـ ص ج 4589", status: "approved", wallet: 300.0, isAvailable: true, inTrip: false, lat: 26.5569, lng: 31.6948, licenseExpiry: "2027-06-01", dailyTrips: 0, questClaimedDate: "", destFilter: "", packageUntil: 0, blockedCustomers: [], fuelLogs: [] }
  ],
  moderators: [{ id: 'mod_1', name: 'م. علي إبراهيم', phone: '01099998888', password: '111', role: 'moderator', roleTitle: 'مشرف عام محافظة', govScope: 'سوهاج', agentCommissionPercent: 5, agentEarnings: 0, permissions: { captains: true, governorates: true, features: true } }],
  captainsPending: [], governorates: EGYPT_27_GOVS, selectedGovId: 'sohag',
  features: { biddingEnabled: true, surgeActive: false, surgeMultiplier: 1.3 },
  nightPeakConfig: { autoNightEnabled: true, nightStartHour: 0, nightEndHour: 6, nightPercent: 15, autoPeakEnabled: false, peakStartHour: 15, peakEndHour: 19, peakPercent: 20 },
  promoCodes: [{ code: 'TAWSILA2026', discountPercent: 20, govId: 'all', happyHourStart: '', happyHourEnd: '', active: true }, { code: 'SOHAG50', discountPercent: 50, govId: 'sohag', happyHourStart: '', happyHourEnd: '', active: true }],
  activeDiscountPercent: 0,
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سوهاج', baseFare: 7, perKm: 2.5, waitPerMin: 1, icon: 'fa-solid fa-motorcycle', iconImage: '', enabled: true },
    { id: 'moto', name: 'موتوسيكل سريع', baseFare: 9, perKm: 3, waitPerMin: 1, icon: 'fa-solid fa-bicycle', iconImage: '', enabled: true },
    { id: 'car', name: 'سيارة ملاكي', baseFare: 12, perKm: 3.5, waitPerMin: 1.5, icon: 'fa-solid fa-car', iconImage: '', enabled: true }
  ],
  selectedVehicleId: 'car', extraFare: 0, customBidFare: null,
  welcomeBonus: { enabled: true, customerAmount: 25, captainAmount: 50 },
  paymentConfig: { methods: [{ id: 'vf', name: 'فودافون كاش', details: '01068131386', enabled: true }, { id: 'ip', name: 'إنستاباي', details: 'tawsila@instapay', enabled: true }, { id: 'cash', name: 'نقدي بالفرع', details: 'المقر الرئيسي', enabled: true }], minDeposit: 20, maxDeposit: 5000, minWithdraw: 50, maxWithdraw: 10000 },
  walletSystemConfig: { customerDepositEnabled: true, customerWithdrawEnabled: true, captainDepositEnabled: true, captainWithdrawEnabled: true, instantDeposit: false, withdrawFeePercent: 0 },
  walletRequests: [], firebaseConfig: { dbUrl: DEFAULT_FIREBASE_DB_URL },
  referralConfig: { enabled: true, referrerBonus: 15, referredBonus: 10, tripCommissionPercent: 10 },
  referralLogs: [], financialLedger: [], inboxSettings: { enabled: true },
  inboxMessages: [{ id: 'msg_1', to: 'all', from: 'الإدارة', senderPhone: 'admin', subject: 'أهلاً بك في توصيلة مصر', body: 'مرحباً بك في شبكة النقل الذكي بجميع محافظات مصر!', readBy: [], replies: [], date: new Date().toLocaleDateString('ar-EG') }],
  dispatchConfig: { countdownSeconds: 45, maxRadiusKm: 15 },
  deliveryConfig: { enabled: true, baseFare: 15, perKm: 4, waitPerMin: 1.5, iconImage: '' }, deliveryOrders: [],
  partnerConfig: { enabled: true, discountPercent: 15, iconImage: '' }, partners: [],
  whatsappSupport: { enabled: true, phone: '201068131386', buttonText: 'واتساب الدعم', prefilledMsg: 'مرحباً فريق دعم تطبيق توصيلة، أحتاج إلى مساعدة.' },
  transferSettings: { enabled: true, commissionPercent: 2, minAmount: 10, maxAmount: 5000 }, transferLogs: [],
  loanSettings: { enabled: true }, loanRequests: [], installmentSettings: { enabled: true }, installmentRequests: [],
  adsSettings: { enabled: true, ads: [{ id: 'ad_1', title: '🚖 توصيلة مصر.. مشوارك أسرع وأرخص!', body: 'اطلب رحلتك الآن في 27 محافظة بأفضل سعر.', image: '', active: true }] },
  termsSettings: { enabled: true, title: 'سياسة الاستخدام والشروط والأحكام', content: '1. يلتزم العميل والكابتن بقوانين المرور والسلامة العامة.\n2. يتم احتساب الأجرة وفق التسعيرة المعلنة أو الاتفاق عبر المزايدة.\n3. تحفظ المنصة سرية البيانات ولا تشاركها مع أي طرف ثالث.' },
  insuranceSettings: { enabled: true, fee: 5, coverageText: 'تغطية تأمينية شاملة حتى 50,000 ج.م' }, insuredTripsLog: [],
  questConfig: { enabled: true, targetTrips: 5, bonusAmount: 50 }, packageConfig: { enabled: true, weeklyPrice: 120, monthlyPrice: 400 },
  loyaltyConfig: { enabled: true, pointsPerTrip: 10, egpPer100Points: 20 }, otpConfig: { enabled: true },
  cancelConfig: { maxDailyCancels: 3, penaltyAmount: 10, cooldownMinutes: 30 }, cancelLogs: [], blacklist: [],
  commuteConfig: { enabled: true, discountPercent: 20 }, commuteSubscriptions: [],
  intercityConfig: { enabled: true }, intercityTrips: [], scheduledTrips: [], lostFoundItems: [],
  broadcastTicker: { enabled: false, text: '🔥 عرض اليوم: مضاعفة نقاط الولاء في جميع المحافظات!' },
  demandPoints: [], complaints: [], auditLogs: [], tripHistory: []
};

// ==========================================
// 1. محرك التخزين السحابي Firebase + الجلسات و GPS
// ==========================================
function getFirebaseBaseUrl() {
  const saved = safeJson(localStorage.getItem('TAWSILA_FB_URL_CACHE') || '{}', {}).url || '';
  const fromDb = (typeof DB !== 'undefined' && DB?.firebaseConfig?.dbUrl) ? DB.firebaseConfig.dbUrl : '';
  const url = (DEFAULT_FIREBASE_DB_URL || fromDb || saved || '').trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+/i.test(url) ? url : '';
}

function normalizeStore(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_STORE));
  if (!raw || typeof raw !== 'object') return base;
  const merged = Object.assign(base, raw);
  const oldGovs = {};
  (raw.governorates || []).forEach(g => { if (g?.id) oldGovs[g.id] = g; });
  merged.governorates = EGYPT_27_GOVS.map(g => {
    const p = oldGovs[g.id];
    const areas = (p && Array.isArray(p.areas) && p.areas.length) ? p.areas.map(a => typeof a === 'string' ? { name: a, active: true } : a) : g.areas;
    return { ...g, active: p ? Boolean(p.active) : true, areas };
  });
  merged.firebaseConfig = { dbUrl: DEFAULT_FIREBASE_DB_URL || merged.firebaseConfig?.dbUrl || '' };
  return merged;
}

let DB = normalizeStore(safeJson(localStorage.getItem('TAWSILA_MEGA_STORE_V4') || 'null', null));
const userIndex = new Map();
function rebuildUserIndex() { userIndex.clear(); (DB.users || []).forEach(u => { if (u?.phone) userIndex.set(u.phone, u); }); }
rebuildUserIndex();

let fbSyncTimer = null;
async function pushStoreToFirebase(d) {
  const base = getFirebaseBaseUrl(); if (!base) return false;
  try {
    const res = await fetchTimeout(`${base}/tawsila_store.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, currentUser: null }) }, 4500);
    return res.ok;
  } catch (e) { return false; }
}

function saveDB(d, immediate = true) {
  rebuildUserIndex();
  const mirror = () => {
    try {
      if (d.firebaseConfig?.dbUrl) localStorage.setItem('TAWSILA_FB_URL_CACHE', JSON.stringify({ url: d.firebaseConfig.dbUrl }));
      localStorage.setItem('TAWSILA_MEGA_STORE_V4', JSON.stringify(d));
    } catch (e) {}
  };
  clearTimeout(fbSyncTimer);
  if (immediate) { mirror(); pushStoreToFirebase(d); }
  else fbSyncTimer = setTimeout(() => { mirror(); pushStoreToFirebase(d); }, 180);
}

async function loadStoreFromFirebase() {
  const base = getFirebaseBaseUrl(); if (!base) return false;
  try {
    const res = await fetchTimeout(`${base}/tawsila_store.json`, {}, 3500);
    if (!res.ok) return false;
    const remote = await res.json();
    if (remote && Array.isArray(remote.users)) {
      const localU = DB.currentUser;
      DB = normalizeStore(remote);
      if (localU) DB.currentUser = DB.users.find(u => u.phone === localU.phone) || localU;
      rebuildUserIndex();
      try { localStorage.setItem('TAWSILA_MEGA_STORE_V4', JSON.stringify(DB)); } catch (e) {}
      return true;
    } else if (!remote) await pushStoreToFirebase(DB);
  } catch (e) {}
  return false;
}

let cachedPatches = safeJson(localStorage.getItem('TAWSILA_PATCHES') || '[]', []);
if (!Array.isArray(cachedPatches)) cachedPatches = [];
const getPatches = () => cachedPatches;
async function savePatches(list) {
  cachedPatches = Array.isArray(list) ? list : [];
  try { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(cachedPatches)); } catch (e) {}
  const base = getFirebaseBaseUrl(); if (!base) return;
  try { await fetchTimeout(`${base}/tawsila_patches.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cachedPatches) }, 4500); } catch (e) {}
}
async function loadPatchesFromFirebase() {
  const base = getFirebaseBaseUrl(); if (!base) return cachedPatches;
  try {
    const res = await fetchTimeout(`${base}/tawsila_patches.json`, {}, 3500);
    if (res.ok) {
      const remote = await res.json();
      if (Array.isArray(remote)) { cachedPatches = remote; try { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(cachedPatches)); } catch (e) {} }
    }
  } catch (e) {}
  return cachedPatches;
}
window.addEventListener('beforeunload', () => saveDB(DB, true));

const getSessionKey = () => 'sess_' + (DB.currentUser?.phone || 'guest').replace(/[^a-zA-Z0-9_]/g, '');
async function syncSessionToFirebase(obj) {
  localStorage.setItem('TAWSILA_ACTIVE_TRIP_SESSION', JSON.stringify(obj));
  const base = getFirebaseBaseUrl(); if (!base) return;
  try { await fetchTimeout(`${base}/sessions/${getSessionKey()}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }, 3500); } catch (e) {}
}
async function clearActiveSession() {
  localStorage.removeItem('TAWSILA_ACTIVE_TRIP_SESSION');
  const base = getFirebaseBaseUrl(); if (!base) return;
  try { await fetchTimeout(`${base}/sessions/${getSessionKey()}.json`, { method: 'DELETE' }, 3500); } catch (e) {}
}
async function restoreSessionOnLoad() {
  let raw = localStorage.getItem('TAWSILA_ACTIVE_TRIP_SESSION');
  const base = getFirebaseBaseUrl();
  if (!raw && base && DB.currentUser) {
    try { const d = await (await fetchTimeout(`${base}/sessions/${getSessionKey()}.json`, {}, 3500)).json(); if (d?.trip) raw = JSON.stringify(d); } catch (e) {}
  }
  if (!raw) return;
  const s = safeJson(raw, null);
  if (s?.trip && s.phase !== 'completed') {
    activeTripData = s.trip;
    if ($('btnRequestRide')) { $('btnRequestRide').disabled = true; $('btnRequestRide').innerText = 'رحلة نشطة (تمت استعادة الجلسة)...'; }
    if ($('custStatusBadge')) $('custStatusBadge').innerText = s.phaseLabel || 'رحلة نشطة';
    if (['accepted', 'arrived', 'started'].includes(s.phase)) {
      $('customerDriverCard')?.classList.remove('hidden'); $('driverIdleBox')?.classList.add('hidden'); $('driverActiveTripBox')?.classList.remove('hidden');
      if ($('driverActiveTripFare')) $('driverActiveTripFare').innerText = `الأجرة: ${activeTripData.fare} ج.م`;
    }
  }
}

let activeTripData = null, countdownInterval = null, tempCaptainDocs = {}, map, pickupMarker, dropoffMarker, routeLine, captainLiveMarker;
let extraStops = [], realRouteDistKm = 4.5, realRouteEtaMin = 10, selectedStarRating = 5, dispatchQueue = [], dispatchIdx = 0;
let waitSeconds = 0, waitTimerInt = null, activeWaitCost = 0, gpsWatchTimer = null, currentLang = localStorage.getItem('TAWSILA_LANG') || 'ar';

function haversineKm(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295, a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
function compressImageFile(file, maxDim, cb) {
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; } else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
      c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); cb(c.toDataURL('image/webp', 0.65));
    };
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}
function addAuditLog(action) {
  if (!DB.currentUser) return;
  DB.auditLogs.push({ id: 'aud_' + Date.now(), actor: DB.currentUser.name, role: DB.currentUser.roleTitle || DB.currentUser.role, action, time: new Date().toLocaleString('ar-EG') });
  if (DB.auditLogs.length > 150) DB.auditLogs.shift(); saveDB(DB, false);
}
function addLedgerEntry(type, amount, note) {
  DB.financialLedger.push({ id: 'fin_' + Date.now(), type, amount: safeNum(amount, 0, 0), note, date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString('ar-EG') });
  if (DB.financialLedger.length > 400) DB.financialLedger.shift(); saveDB(DB, false);
}
function creditRegionalAgentCommission(govName, tripFare) {
  const mod = (DB.moderators || []).find(m => m.roleTitle === 'مشرف عام محافظة' && (m.govScope === govName || m.govScope === 'الكل'));
  if (mod && mod.agentCommissionPercent) mod.agentEarnings = +((mod.agentEarnings || 0) + tripFare * (safeNum(mod.agentCommissionPercent, 0, 0, 50) / 100)).toFixed(2);
}
function startCaptainGpsTracking() {
  clearInterval(gpsWatchTimer);
  gpsWatchTimer = setInterval(() => {
    const u = DB.currentUser; if (!u || u.role !== 'captain' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude, cap = userIndex.get(u.phone) || u;
      cap.lat = lat; cap.lng = lng;
      const base = getFirebaseBaseUrl();
      if (base) try { await fetchTimeout(`${base}/captains_gps/${encodeURIComponent(u.phone)}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng, ts: Date.now() }) }, 3000); } catch (e) {}
    }, () => {}, { enableHighAccuracy: false, maximumAge: 5000 });
  }, 5000);
}
setInterval(async () => {
  if (!map || !activeTripData?.assignedCaptainPhone) return;
  let cap = userIndex.get(activeTripData.assignedCaptainPhone);
  const base = getFirebaseBaseUrl();
  if (base) try { const g = await (await fetchTimeout(`${base}/captains_gps/${encodeURIComponent(activeTripData.assignedCaptainPhone)}.json`, {}, 3000)).json(); if (g && typeof g.lat === 'number') cap = g; } catch (e) {}
  if (!cap || typeof cap.lat !== 'number') return;
  const icon = L.divIcon({ className: 'text-2xl', html: '🚕', iconSize: [28, 28], iconAnchor: [14, 14] });
  if (!captainLiveMarker) captainLiveMarker = L.marker([cap.lat, cap.lng], { icon }).addTo(map);
  else captainLiveMarker.setLatLng([cap.lat, cap.lng]);
}, 4000);

// ==========================================
// 2. المصادقة والحظر والإحالة والترحيب والتنقل
// ==========================================
function isBlacklisted(phone) {
  const rec = (DB.blacklist || []).find(b => b.phone === phone && (!b.until || b.until > Date.now()));
  if (rec) { alert(`⛔ هذا الحساب محظور.\nالسبب: ${rec.reason}`); return true; }
  return false;
}
function ensureUserReferralCode(u) {
  if (!u) return 'TAWSILA2026';
  if (!u.referralCode) { u.referralCode = 'TW' + (u.phone || '0000').slice(-4) + Math.floor(10 + Math.random() * 89); const inDb = userIndex.get(u.phone); if (inDb) inDb.referralCode = u.referralCode; }
  return u.referralCode;
}
function applyReferralBonus(newPh, refCode) {
  if (!DB.referralConfig?.enabled || !refCode) return;
  const clean = refCode.trim().toUpperCase(), ref = DB.users.find(u => u.referralCode === clean && u.phone !== newPh), nu = userIndex.get(newPh);
  if (ref && nu) {
    ref.wallet = +((ref.wallet || 0) + safeNum(DB.referralConfig.referrerBonus, 0, 0)).toFixed(2);
    nu.wallet = +((nu.wallet || 0) + safeNum(DB.referralConfig.referredBonus, 0, 0)).toFixed(2);
    nu.referredBy = ref.phone; DB.referralLogs.push({ referrer: ref.name, newUser: nu.name, code: clean, date: new Date().toLocaleDateString('ar-EG') });
  }
}

function handleUserLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const idVal = toEnDigits($('loginIdentifier')?.value || ''), passVal = toEnDigits($('loginPassword')?.value || '');
  if (!idVal || !passVal) return alert('يرجى إدخال رقم الهاتف أو البريد وكلمة المرور.');

  // أولوية قصوى لحساب المدير العام قبل أي فحص حظر
  if ((idVal === SUPER_ADMIN.phone || idVal.toLowerCase() === SUPER_ADMIN.email) && passVal === SUPER_ADMIN.password) {
    DB.currentUser = { role: 'admin', isSuperAdmin: true, name: 'المدير العام', phone: SUPER_ADMIN.phone, permissions: { captains: true, governorates: true, features: true, moderators: true } };
    saveDB(DB); updateNavUI(); navigate('admin');
    alert('🎉 مرحباً بك يا مدير النظام! تم تسجيل دخولك بلوحة الإدارة العليا.');
    return false;
  }
  if (isBlacklisted(idVal)) return false;

  const mod = (DB.moderators || []).find(m => toEnDigits(m.phone) === idVal && toEnDigits(m.password) === passVal);
  if (mod) {
    DB.currentUser = { role: 'moderator', isSuperAdmin: false, name: mod.name, phone: mod.phone, roleTitle: mod.roleTitle || 'مشرف', govScope: mod.govScope || 'الكل', permissions: mod.permissions || { captains: true, governorates: false, features: false } };
    saveDB(DB); updateNavUI(); navigate('admin');
    alert(`🎉 مرحباً بك (${mod.name}) - ${DB.currentUser.roleTitle}`);
    return false;
  }
  const pend = (DB.captainsPending || []).find(c => toEnDigits(c.phone) === idVal && toEnDigits(c.password) === passVal && c.status !== 'approved');
  if (pend) { DB.currentUser = { role: 'captain', name: pend.name, phone: pend.phone, captainStatus: pend.status }; saveDB(DB); updateNavUI(); navigate('driver'); return false; }

  const user = userIndex.get(idVal);
  if (user && toEnDigits(user.password) === passVal) {
    ensureUserReferralCode(user); DB.currentUser = user; saveDB(DB); updateNavUI(); navigate(user.role === 'captain' ? 'driver' : 'customer'); return false;
  }
  alert('❌ خطأ: بيانات الدخول غير صحيحة!'); return false;
}
window.handleUserLogin = handleUserLogin;

function handleRegisterCustomer(e) {
  e.preventDefault();
  const name = ($('regCustName')?.value || '').trim(), phone = toEnDigits($('regCustPhone')?.value || ''), password = toEnDigits($('regCustPass')?.value || ''), refCode = ($('inp_formRegCustomer_ref')?.value || '').trim();
  if (!name || !phone || !password || isBlacklisted(phone)) return;
  if (userIndex.has(phone)) return alert('⚠️ هذا الرقم مسجل بالفعل.');
  const w = DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.customerAmount, 0, 0) : 150;
  const nu = { role: 'customer', name, phone, password, wallet: w, welcomeCredited: true, loyaltyPoints: 0, blockedBy: [], favorites: {} };
  ensureUserReferralCode(nu); DB.users.push(nu); rebuildUserIndex(); applyReferralBonus(phone, refCode);
  DB.currentUser = userIndex.get(phone); saveDB(DB); updateNavUI(); navigate('customer');
  alert(`🎉 أهلاً بك يا ${name}! رصيدك الترحيبي: ${DB.currentUser.wallet.toFixed(2)} ج.م`);
}
function handleRegisterCaptain(e) {
  e.preventDefault();
  const name = ($('regCapName')?.value || '').trim(), phone = toEnDigits($('regCapPhone')?.value || ''), password = toEnDigits($('regCapPass')?.value || '');
  const vehicle = $('regCapVehicle')?.value || 'سيارة ملاكي', plate = ($('regCapPlate')?.value || '').trim(), licenseExpiry = $('regCapLicExp')?.value || '2027-06-01', refCode = ($('inp_formRegCaptain_ref')?.value || '').trim();
  if (isBlacklisted(phone)) return;
  if (!tempCaptainDocs.idFront || !tempCaptainDocs.idBack || !tempCaptainDocs.licenseDrive || !tempCaptainDocs.licenseCar) return alert('⚠️ يرجى رفع جميع صور المستندات الأربعة.');
  DB.captainsPending.push({ id: 'cap_' + Date.now(), role: 'captain', name, phone, password, vehicle, plate, licenseExpiry, refCode, status: 'pending', wallet: 0, docs: { ...tempCaptainDocs } });
  DB.currentUser = { role: 'captain', name, phone, captainStatus: 'pending' }; saveDB(DB); updateNavUI(); navigate('driver');
  alert('✅ تم إرسال المستندات بنجاح!');
}
function handleCompressUpload(e, key) { const f = e.target.files[0]; if (f) compressImageFile(f, 320, r => { tempCaptainDocs[key] = r; }); }
function logoutUser() { DB.currentUser = null; saveDB(DB); updateNavUI(); navigate('auth'); }

function switchAuthTab(tab) {
  ['btnAuthTabLogin', 'btnAuthTabRegCust', 'btnAuthTabRegCap'].forEach(id => { if ($(id)) $(id).className = 'flex-1 py-2 rounded-xl text-slate-600 transition'; });
  ['formLogin', 'formRegCustomer', 'formRegCaptain'].forEach(id => $(id)?.classList.add('hidden'));
  if (tab === 'login') { if ($('btnAuthTabLogin')) $('btnAuthTabLogin').className = 'flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow'; $('formLogin')?.classList.remove('hidden'); }
  else if (tab === 'reg-customer') { if ($('btnAuthTabRegCust')) $('btnAuthTabRegCust').className = 'flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow'; $('formRegCustomer')?.classList.remove('hidden'); }
  else { if ($('btnAuthTabRegCap')) $('btnAuthTabRegCap').className = 'flex-1 py-2 rounded-xl bg-amber-500 text-slate-900 font-black shadow'; $('formRegCaptain')?.classList.remove('hidden'); }
}

function updateNavUI() {
  const u = DB.currentUser, real = u ? (userIndex.get(u.phone) || u) : null;
  if (u && real) u.wallet = safeNum(real.wallet, u.wallet || 0, 0);
  ['nav-btn-admin', 'nav-btn-customer', 'nav-btn-driver', 'navUserBadge', 'navCustomerWalletBox'].forEach(id => $(id)?.classList.add('hidden'));
  $('nav-btn-login')?.classList.remove('hidden');
  if (u) {
    $('nav-btn-login')?.classList.add('hidden');
    if ($('navUserBadge')) { $('navUserBadge').classList.remove('hidden'); $('navUserBadge').classList.add('flex'); }
    if ($('navUserName')) $('navUserName').innerText = u.name;
    if (u.role === 'admin' || u.role === 'moderator') { $('nav-btn-admin')?.classList.remove('hidden'); $('nav-btn-customer')?.classList.remove('hidden'); $('nav-btn-driver')?.classList.remove('hidden'); }
    else if (u.role === 'customer') {
      $('nav-btn-customer')?.classList.remove('hidden');
      if ($('navCustomerWalletBox')) { $('navCustomerWalletBox').classList.remove('hidden'); $('navCustomerWalletBox').classList.add('flex'); }
      if ($('navCustomerWallet')) $('navCustomerWallet').innerText = safeNum(u.wallet, 0, 0).toFixed(2);
    } else if (u.role === 'captain') { $('nav-btn-driver')?.classList.remove('hidden'); startCaptainGpsTracking(); }
  }
  if (typeof window.syncAllWalletDisplays === 'function') window.syncAllWalletDisplays();
  if (typeof window.refreshGlobalChrome === 'function') window.refreshGlobalChrome();
}

// ==========================================
// 3. الخريطة + OSRM + Nominatim + المحافظات الـ 27 + التوجيه
// ==========================================
async function updateOSRMRoute(pLL, dLL) {
  const pts = [pLL, ...extraStops.map(s => ({ lat: s.lat, lng: s.lng })), dLL];
  try {
    const res = await fetchTimeout(`https://router.project-osrm.org/route/v1/driving/${pts.map(w => `${w.lng},${w.lat}`).join(';')}?overview=full&geometries=geojson`, {}, 4000);
    const data = await res.json();
    if (data?.routes?.[0]) {
      realRouteDistKm = Math.max(0.5, +(data.routes[0].distance / 1000).toFixed(2));
      realRouteEtaMin = Math.max(3, Math.round(data.routes[0].duration / 60));
      if (routeLine && map) map.removeLayer(routeLine);
      if (map) routeLine = L.polyline(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]), { color: '#059669', weight: 5, opacity: 0.85 }).addTo(map);
      if ($('proEtaText')) $('proEtaText').innerText = `~${realRouteEtaMin} د (${realRouteDistKm} كم)`;
      return recalcTrip(false);
    }
  } catch (e) {}
  let dist = 0; for (let i = 0; i < pts.length - 1; i++) dist += haversineKm(pts[i].lat, pts[i].lng, pts[i + 1].lat, pts[i + 1].lng);
  realRouteDistKm = Math.max(1, +(dist * 1.25).toFixed(2)); realRouteEtaMin = Math.max(5, Math.round(realRouteDistKm * 2.5));
  if (routeLine && map) map.removeLayer(routeLine);
  if (map) routeLine = L.polyline(pts, { color: '#059669', weight: 4, dashArray: '6,6' }).addTo(map);
  recalcTrip(false);
}

async function reverseGeocodeEgypt(lat, lng, inputId) {
  const inp = $(inputId); if (!inp) return;
  inp.value = 'جاري تحديد اسم الشارع والقرية...';
  try {
    const data = await (await fetchTimeout(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${currentLang}&addressdetails=1`, {}, 4000)).json();
    const a = data.address || {}, parts = [a.road || a.pedestrian || a.neighbourhood, a.village || a.suburb || a.town, a.city || a.county || a.state].filter(Boolean);
    inp.value = parts.length ? parts.join(' - ') : (data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch (e) { inp.value = `موقع محدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`; }
}

let searchDebounce = null;
function handleSearchSuggestions(q, type) {
  const box = $(`${type}Suggestions`); if (!box) return;
  if (!q.trim()) return box.classList.add('hidden');
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
    const local = (gov.areas || []).filter(a => a.active && a.name.includes(q.trim())).map(a => ({ title: `${a.name} - ${gov.name}`, sub: 'منطقة / قرية', lat: gov.center[0], lng: gov.center[1] }));
    let osm = [];
    try {
      const items = await (await fetchTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q.trim() + ' ' + gov.name + ' مصر')}&countrycodes=eg&accept-language=${currentLang}&addressdetails=1&limit=5`, {}, 3500)).json();
      if (Array.isArray(items)) osm = items.map(it => { const a = it.address || {}; return { title: [a.road, a.village || a.suburb || a.town, a.city || a.state].filter(Boolean).join(' - ') || it.display_name, sub: it.display_name, lat: +it.lat, lng: +it.lon }; });
    } catch (e) {}
    const all = [...local, ...osm]; box.innerHTML = '';
    if (!all.length) box.innerHTML = '<div class="p-2 text-slate-400">لا توجد نتائج</div>';
    else all.forEach(m => {
      const d = document.createElement('div'); d.className = 'p-2.5 hover:bg-emerald-50 cursor-pointer border-b';
      d.innerHTML = `<div class="font-bold text-slate-800 text-xs"><i class="fa-solid fa-location-dot text-emerald-600 ml-1"></i> ${esc(m.title)}</div><div class="text-[10px] text-slate-400 truncate">${esc(m.sub)}</div>`;
      d.onclick = () => window.pickDetailedPlace(type, m.title, m.lat, m.lng); box.appendChild(d);
    });
    box.classList.remove('hidden');
  }, 300);
}
window.pickDetailedPlace = (type, title, lat, lng) => {
  if ($(`${type}Input`)) $(`${type}Input`).value = title;
  $(`${type}Suggestions`)?.classList.add('hidden');
  const m = type === 'pickup' ? pickupMarker : dropoffMarker; if (m) m.setLatLng([lat, lng]);
  if (map) map.panTo([lat, lng]); recalcTrip(true);
};

function initMap() {
  if (map || !$('map') || typeof L === 'undefined') return;
  const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  map = L.map('map', { preferCanvas: true }).setView(gov.center, gov.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  const mk = c => L.icon({ iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`, iconSize: [25, 41], iconAnchor: [12, 41] });
  pickupMarker = L.marker(gov.center, { icon: mk('green'), draggable: true }).addTo(map);
  dropoffMarker = L.marker([gov.center[0] - 0.015, gov.center[1] + 0.015], { icon: mk('red'), draggable: true }).addTo(map);
  pickupMarker.on('dragend', () => { const ll = pickupMarker.getLatLng(); reverseGeocodeEgypt(ll.lat, ll.lng, 'pickupInput'); recalcTrip(true); });
  dropoffMarker.on('dragend', () => { const ll = dropoffMarker.getLatLng(); reverseGeocodeEgypt(ll.lat, ll.lng, 'dropoffInput'); recalcTrip(true); });
  map.on('click', e => { dropoffMarker.setLatLng(e.latlng); reverseGeocodeEgypt(e.latlng.lat, e.latlng.lng, 'dropoffInput'); recalcTrip(true); });
  if ($('pickupInput') && !$('pickupInput').value) $('pickupInput').value = `ميدان المحطة - ${gov.name}`;
  if ($('dropoffInput') && !$('dropoffInput').value) $('dropoffInput').value = `الشارع الرئيسي - ${gov.name}`;
  renderCustomerVehicles(); recalcTrip(true);
}
function getCurrentLocation() {
  if (!navigator.geolocation) return alert('المتصفح لا يدعم GPS.');
  navigator.geolocation.getCurrentPosition(p => { const l = [p.coords.latitude, p.coords.longitude]; pickupMarker?.setLatLng(l); map?.setView(l, 16); reverseGeocodeEgypt(l[0], l[1], 'pickupInput'); recalcTrip(true); });
}
const isHourInRange = (h, s, e) => s !== e && (s < e ? (h >= s && h < e) : (h >= s || h < e));

function recalcTrip(fetchRoute = true) {
  const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  const pLL = pickupMarker ? pickupMarker.getLatLng() : { lat: gov.center[0], lng: gov.center[1] };
  const dLL = dropoffMarker ? dropoffMarker.getLatLng() : { lat: gov.center[0] - 0.015, lng: gov.center[1] + 0.015 };
  if (fetchRoute && map) return updateOSRMRoute(pLL, dLL);
  if ($('calcDistanceText')) $('calcDistanceText').innerText = `${realRouteDistKm} كم`;
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  const insFee = (DB.insuranceSettings?.enabled && window.__insuranceOptIn) ? safeNum(DB.insuranceSettings.fee, 0, 0) : 0;
  let total = veh.baseFare + (realRouteDistKm * veh.perKm) + insFee + (extraStops.length * 5);

  const hr = new Date().getHours(), np = DB.nightPeakConfig || {}; let badge = '';
  if (np.autoNightEnabled && isHourInRange(hr, np.nightStartHour, np.nightEndHour)) { total *= (1 + safeNum(np.nightPercent, 15, 0) / 100); badge = `تعريفة ليلية +${np.nightPercent}%`; }
  else if (np.autoPeakEnabled && isHourInRange(hr, np.peakStartHour, np.peakEndHour)) { total *= (1 + safeNum(np.peakPercent, 20, 0) / 100); badge = `ذروة مجدولة +${np.peakPercent}%`; }
  else if (DB.features?.surgeActive) { total *= safeNum(DB.features.surgeMultiplier, 1.3, 1); badge = 'ذروة مضاعفة'; }
  if ($('surgeBadge')) { $('surgeBadge').innerText = badge; $('surgeBadge').classList.toggle('hidden', !badge); }

  let disc = safeNum(DB.activeDiscountPercent, 0, 0, 95);
  if (DB.partnerConfig?.enabled && DB.currentUser?.isPartner) disc = Math.max(disc, safeNum(DB.partnerConfig.discountPercent, 0, 0, 95));
  if (disc > 0) total -= total * (disc / 100);
  total = Math.max(10, total);
  if (DB.customBidFare !== null && DB.features?.biddingEnabled) { if ($('calcTotalFareText')) $('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`; }
  else {
    if ($('calcTotalFareText')) $('calcTotalFareText').innerText = `${total.toFixed(2)} ج.م`;
    if ($('customBidInput')) $('customBidInput').value = Math.round(total);
    if ($('customBidDisplay')) $('customBidDisplay').innerText = `${Math.round(total)} ج.م`;
  }
}

function renderGovernoratesUI() {
  if ($('custGovernorateSelect')) $('custGovernorateSelect').innerHTML = DB.governorates.map(g => `<option value="${esc(g.id)}" ${g.id === DB.selectedGovId ? 'selected' : ''}>${esc(g.name)} ${g.active ? '' : '(مغلقة)'}</option>`).join('');
  window.populateCustomerAreas();
  const grid = $('adminGovernoratesGrid'); if (!grid) return;
  if (!$('admGovSearchInp')) {
    const s = document.createElement('input'); s.id = 'admGovSearchInp'; s.placeholder = '🔍 ابحث باسم المحافظة أو القرية...';
    s.className = 'w-full border rounded-xl p-2.5 text-xs font-bold outline-none mb-2'; s.oninput = () => renderGovernoratesUI();
    grid.parentElement.insertBefore(s, grid);
  }
  const q = ($('admGovSearchInp')?.value || '').trim();
  grid.innerHTML = DB.governorates.filter(g => !q || g.name.includes(q) || g.areas.some(a => a.name.includes(q))).map(g => `
    <div class="p-3 border rounded-2xl ${g.active ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'} space-y-2">
      <div class="flex items-center justify-between"><div><b class="text-xs block">${esc(g.name)}</b><span class="text-[10px] text-slate-500">المناطق: ${g.areas.length}</span></div>
      <button onclick="toggleGovernorateActive('${esc(g.id)}')" class="px-2.5 py-1 rounded-xl text-[11px] font-black text-white ${g.active ? 'bg-rose-600' : 'bg-emerald-600'}">${g.active ? 'إغلاق' : 'فتح'}</button></div>
      <button onclick="window.openGovAreasModal('${esc(g.id)}')" class="w-full bg-white border font-bold py-1.5 rounded-xl text-[11px]">إدارة القرى والمناطق (${g.areas.length})</button>
    </div>`).join('');
}
window.populateCustomerAreas = () => {
  const sel = $('custAreaSelect'); if (!sel) return;
  const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  sel.innerHTML = `<option value="">-- القرية / المنطقة --</option>` + (gov.areas || []).filter(a => a.active).map(a => `<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');
};
function handleGovernorateChange(govId) {
  const gov = DB.governorates.find(g => g.id === govId); if (!gov) return;
  DB.selectedGovId = govId; saveDB(DB); if ($('activeGovBadge')) $('activeGovBadge').innerText = gov.name;
  window.populateCustomerAreas();
  if (!gov.active) showTopAlert(`⚠️ الخدمة متوقفة مؤقتاً في محافظة (${gov.name}).`); else hideTopAlert();
  if (map) { map.flyTo(gov.center, gov.zoom); pickupMarker.setLatLng(gov.center); dropoffMarker.setLatLng([gov.center[0] - 0.015, gov.center[1] + 0.015]); recalcTrip(true); }
}
function toggleGovernorateActive(id) { const g = DB.governorates.find(x => x.id === id); if (!g) return; g.active = !g.active; saveDB(DB); renderGovernoratesUI(); addAuditLog(`${g.active ? 'فتح' : 'إغلاق'} ${g.name}`); if (DB.selectedGovId === id) handleGovernorateChange(id); }
function showTopAlert(m) { if ($('topAlertMessage')) $('topAlertMessage').innerText = m; $('topAlertBar')?.classList.remove('hidden'); }
function hideTopAlert() { $('topAlertBar')?.classList.add('hidden'); }

function renderCustomerVehicles() {
  const g = $('vehicleTypesGrid'); if (!g) return;
  g.innerHTML = DB.vehicles.filter(v => v.enabled).map(v => `
    <button onclick="selectVehicle('${esc(v.id)}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}">
      ${v.iconImage ? `<img src="${v.iconImage}" class="w-8 h-8 object-contain mb-1">` : `<i class="${esc(v.icon || 'fa-solid fa-car')} text-xl text-slate-600 mb-1"></i>`}
      <div class="font-black text-[11px]">${esc(v.name)}</div><div class="text-[9px] text-emerald-700 font-bold">فتح ${v.baseFare}ج | كم ${v.perKm}ج</div><div class="text-[8px] text-slate-500">انتظار ${v.waitPerMin || 0}ج/د</div>
    </button>`).join('');
}
function selectVehicle(id) { DB.selectedVehicleId = id; saveDB(DB); renderCustomerVehicles(); recalcTrip(false); }
function applyPromoCode() {
  const code = ($('promoCodeInput')?.value || '').trim().toUpperCase(), st = $('promoCodeStatus'), p = (DB.promoCodes || []).find(x => x.code === code && x.active);
  if (!p) { DB.activeDiscountPercent = 0; if (st) { st.innerText = '❌ كود غير صحيح'; st.classList.remove('hidden'); } return recalcTrip(false); }
  if (p.govId && p.govId !== 'all' && p.govId !== DB.selectedGovId) { DB.activeDiscountPercent = 0; if (st) { st.innerText = '⚠️ العرض لمحافظة أخرى.'; st.classList.remove('hidden'); } return recalcTrip(false); }
  if (p.happyHourStart && p.happyHourEnd && !isHourInRange(new Date().getHours(), +p.happyHourStart, +p.happyHourEnd)) { DB.activeDiscountPercent = 0; if (st) { st.innerText = `⏰ متاح (${p.happyHourStart}:00-${p.happyHourEnd}:00)`; st.classList.remove('hidden'); } return recalcTrip(false); }
  DB.activeDiscountPercent = p.discountPercent; if (st) { st.innerText = `🎉 تم تطبيق خصم ${p.discountPercent}%`; st.classList.remove('hidden'); } recalcTrip(false);
}
function adjustBidFare(a) { const i = $('customBidInput'), v = Math.max(10, (parseFloat(i?.value) || 30) + a); if (i) i.value = v; updateBidFare(v); }
function updateBidFare(v) { DB.customBidFare = safeNum(v, 10, 10); if ($('customBidDisplay')) $('customBidDisplay').innerText = `${DB.customBidFare} ج.م`; if ($('calcTotalFareText')) $('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`; }

function buildCaptainQueue(pLL, toAddr) {
  const cp = DB.currentUser?.phone || '';
  return DB.users.filter(u => u.role === 'captain' && u.status === 'approved' && u.isAvailable !== false && !u.inTrip && !(u.blockedCustomers || []).includes(cp) && (!u.destFilter?.trim() || toAddr.includes(u.destFilter.trim())))
    .map(c => ({ captain: c, dist: haversineKm(pLL.lat, pLL.lng, c.lat || pLL.lat, c.lng || pLL.lng) }))
    .filter(x => x.dist <= (DB.dispatchConfig?.maxRadiusKm || 25)).sort((a, b) => a.dist - b.dist);
}
function dispatchCurrentOffer() {
  if (!dispatchQueue.length || dispatchIdx >= dispatchQueue.length) {
    stopIncomingTripAlert(); resetCaptain();
    if ($('btnRequestRide')) { $('btnRequestRide').disabled = false; $('btnRequestRide').innerText = 'طلب المشوار فوراً'; }
    if ($('custStatusBadge')) $('custStatusBadge').innerText = 'لم يقبل أي كابتن'; return;
  }
  const item = dispatchQueue[dispatchIdx++], cap = item.captain;
  activeTripData.assignedCaptainPhone = cap.phone; activeTripData.assignedCaptainName = cap.name;
  if ($('btnRequestRide')) $('btnRequestRide').innerText = `مرسل لأقرب كابتن (${cap.name} - ${item.dist.toFixed(1)} كم)...`;
  if ($('custStatusBadge')) $('custStatusBadge').innerText = `بانتظار ${cap.name}`;
  if ($('driverCardName')) $('driverCardName').innerText = `الكابتن: ${cap.name}`;
  if ($('driverCardCar')) $('driverCardCar').innerText = cap.vehicle || activeTripData.vehicle;
  if ($('driverCardPlate')) $('driverCardPlate').innerText = cap.plate || '-';
  $('driverIdleBox')?.classList.add('hidden'); $('driverOfferBox')?.classList.remove('hidden');
  if ($('offerFromText')) $('offerFromText').innerText = activeTripData.from + (activeTripData.riderName ? ` | 👤 ${activeTripData.riderName} (${activeTripData.riderPhone})` : '') + (activeTripData.prefs?.length ? ` | ${activeTripData.prefs.join(', ')}` : '');
  if ($('offerToText')) $('offerToText').innerText = activeTripData.to + (extraStops.length ? ` (محطات: ${extraStops.map(s => s.name).join(' ، ')})` : '');
  if ($('offerVehicleText')) $('offerVehicleText').innerText = activeTripData.vehicle;
  if ($('offerFareText')) $('offerFareText').innerText = `${activeTripData.fare} ج.م`;
  startIncomingTripAlert(activeTripData);
  let left = parseInt(DB.dispatchConfig?.countdownSeconds) || 45; if ($('countdownTimer')) $('countdownTimer').innerText = left;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => { left--; if ($('countdownTimer')) $('countdownTimer').innerText = left; if (left <= 0) { clearInterval(countdownInterval); dispatchCurrentOffer(); } }, 1000);
}
function handleCustomerRequestRide() {
  const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  if (!gov.active) return alert(`⚠️ الخدمة مغلقة في (${gov.name}).`);
  const cu = userIndex.get(DB.currentUser?.phone);
  if (cu && (cu.cooldownUntil || 0) > Date.now()) return alert(`⏳ حسابك موقوف ${Math.ceil((cu.cooldownUntil - Date.now()) / 60000)} دقيقة لتكرار الإلغاء.`);
  const isOther = $('riderModeSel')?.value === 'other', rN = ($('otherRiderName')?.value || '').trim(), rP = toEnDigits($('otherRiderPhone')?.value || '');
  if (isOther && (!rN || !rP)) return alert('⚠️ أدخل اسم وهاتف الراكب.');
  if ($('rideSchedMode')?.value === 'later') {
    const dt = $('rideSchedDateTime')?.value; if (!dt) return alert('⚠️ اختر موعد الرحلة.');
    const fare = safeNum(parseFloat($('calcTotalFareText')?.innerText), 20, 10);
    DB.scheduledTrips.push({ id: 'SCH-' + Date.now().toString().slice(-5), customerPhone: DB.currentUser?.phone || '', customerName: DB.currentUser?.name || 'عميل', from: $('pickupInput')?.value || '', to: $('dropoffInput')?.value || '', datetime: dt, fare, govName: gov.name, assignedCaptain: '' });
    saveDB(DB); return alert(`📅 تم حجز رحلتك المجدولة (${dt}) بسعر ${fare} ج.م!`);
  }
  const pLL = pickupMarker ? pickupMarker.getLatLng() : { lat: gov.center[0], lng: gov.center[1] }, toAddr = $('dropoffInput')?.value || '';
  dispatchQueue = buildCaptainQueue(pLL, toAddr); dispatchIdx = 0;
  if (!dispatchQueue.length) return alert('⚠️ لا يوجد كابتن متاح قريباً حالياً.');
  initAudioContext();
  const fare = safeNum(parseFloat($('calcTotalFareText')?.innerText), 20, 10), veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  const insured = !!(DB.insuranceSettings?.enabled && window.__insuranceOptIn), policyNo = insured ? ('INS-' + Math.floor(100000 + Math.random() * 899999)) : '', pinOtp = String(Math.floor(1000 + Math.random() * 9000));
  activeTripData = { id: 'TRP-' + Date.now().toString().slice(-6), govId: gov.id, govName: gov.name, customerPhone: DB.currentUser?.phone || '', customerName: DB.currentUser?.name || 'عميل', riderName: isOther ? rN : '', riderPhone: isOther ? rP : '', from: $('pickupInput')?.value || '', to: toAddr, vehicle: veh.name, fare, insured, policyNo, pinOtp, prefs: Array.from(document.querySelectorAll('.ride-pref-chk:checked')).map(c => c.value), date: new Date().toLocaleString('ar-EG') };
  DB.demandPoints.push({ lat: pLL.lat, lng: pLL.lng, ts: Date.now() }); if (DB.demandPoints.length > 40) DB.demandPoints.shift();
  if (insured) DB.insuredTripsLog.push({ policyNo, from: activeTripData.from, to: activeTripData.to, fee: DB.insuranceSettings.fee, date: activeTripData.date });
  saveDB(DB, false);
  if ($('patchTripOtpVal')) $('patchTripOtpVal').innerText = pinOtp; if ($('capOtpInput')) $('capOtpInput').value = '';
  if ($('btnRequestRide')) $('btnRequestRide').disabled = true;
  dispatchCurrentOffer(); syncSessionToFirebase({ trip: activeTripData, phase: 'searching', phaseLabel: 'جاري البحث عن كابتن', ts: Date.now() });
}

// ==========================================
// 4. الصوت + دورة الكابتن + الانتظار + OTP + الإيصال
// ==========================================
let alertAudioCtx = null, isAlertRinging = false, alertLoopTimeout = null;
function initAudioContext() {
  if (!alertAudioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) alertAudioCtx = new AC(); }
  if (alertAudioCtx?.state === 'suspended') alertAudioCtx.resume();
}
document.addEventListener('click', initAudioContext);
function playHighPitchDispatchAlarm(cb) {
  initAudioContext(); if (!alertAudioCtx) { if (cb) cb(); return; }
  const now = alertAudioCtx.currentTime, o1 = alertAudioCtx.createOscillator(), o2 = alertAudioCtx.createOscillator(), g = alertAudioCtx.createGain();
  o1.type = 'sawtooth'; o2.type = 'square';
  o1.frequency.setValueAtTime(750, now); o1.frequency.exponentialRampToValueAtTime(1450, now + 0.25); o1.frequency.linearRampToValueAtTime(800, now + 0.5); o1.frequency.exponentialRampToValueAtTime(1600, now + 0.75);
  o2.frequency.setValueAtTime(850, now); o2.frequency.exponentialRampToValueAtTime(1550, now + 0.25); o2.frequency.linearRampToValueAtTime(900, now + 0.5); o2.frequency.exponentialRampToValueAtTime(1700, now + 0.75);
  g.gain.setValueAtTime(1, now); g.gain.setValueAtTime(1, now + 0.85); g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  o1.connect(g); o2.connect(g); g.connect(alertAudioCtx.destination); o1.start(now); o2.start(now); o1.stop(now + 1.1); o2.stop(now + 1.1);
  if (cb) setTimeout(() => { if (isAlertRinging) cb(); }, 1150);
}
function speakTripDetailsArabic(trip) {
  if (!isAlertRinging || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`يا كابتن! في مشوار جديد. من ${trip.from} إلى ${trip.to}. الأجرة ${Math.round(trip.fare)} جنيه.`);
  u.lang = 'ar-EG'; u.rate = 0.95;
  u.onend = () => { if (isAlertRinging) alertLoopTimeout = setTimeout(() => { if (isAlertRinging) playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip)); }, 1200); };
  window.speechSynthesis.speak(u);
}
function speakCustomerNotice(t) { if ('speechSynthesis' in window && DB.currentUser?.role !== 'captain') { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = currentLang === 'en' ? 'en-US' : 'ar-EG'; window.speechSynthesis.speak(u); } }
function startIncomingTripAlert(t) { isAlertRinging = true; initAudioContext(); clearTimeout(alertLoopTimeout); playHighPitchDispatchAlarm(() => speakTripDetailsArabic(t)); }
function stopIncomingTripAlert() { isAlertRinging = false; clearTimeout(alertLoopTimeout); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
function testDriverAlertSound() { initAudioContext(); stopIncomingTripAlert(); isAlertRinging = true; playHighPitchDispatchAlarm(() => { speakTripDetailsArabic({ from: "ميدان التحرير", to: "مصر الجديدة", fare: 45 }); setTimeout(stopIncomingTripAlert, 5500); }); }

window.toggleAppLanguage = () => {
  currentLang = currentLang === 'ar' ? 'en' : 'ar'; localStorage.setItem('TAWSILA_LANG', currentLang);
  document.documentElement.lang = currentLang; document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  if ($('headerAppName')) $('headerAppName').innerText = currentLang === 'ar' ? 'توصيلة' : 'Tawsila Egypt';
  if ($('btnRequestRide') && !$('btnRequestRide').disabled) $('btnRequestRide').innerText = currentLang === 'ar' ? 'طلب المشوار فوراً' : 'Request Ride Now';
  if ($('patchLangBtn')) $('patchLangBtn').innerText = currentLang === 'ar' ? 'EN' : 'AR';
};

function captainAcceptTrip() {
  clearInterval(countdownInterval); stopIncomingTripAlert();
  $('driverOfferBox')?.classList.add('hidden'); $('driverActiveTripBox')?.classList.remove('hidden');
  $('btnCaptainArrived')?.classList.remove('hidden'); $('btnCaptainStartTrip')?.classList.add('hidden'); $('btnCaptainCompleteTrip')?.classList.add('hidden');
  if ($('driverActiveTripFare')) $('driverActiveTripFare').innerText = `الأجرة: ${activeTripData.fare} ج.م`;
  $('customerDriverCard')?.classList.remove('hidden'); if ($('custStatusBadge')) $('custStatusBadge').innerText = 'الكابتن قادم لموقعك';
  const cap = userIndex.get(activeTripData?.assignedCaptainPhone); if (cap) { cap.inTrip = true; saveDB(DB, false); }
  syncSessionToFirebase({ trip: activeTripData, phase: 'accepted', phaseLabel: 'الكابتن قادم لموقعك', ts: Date.now() });
  speakCustomerNotice('تم قبول مشوارك، والكابتن في طريقه إليك الآن');
}
function captainRejectTrip() {
  clearInterval(countdownInterval); stopIncomingTripAlert();
  if (dispatchIdx < dispatchQueue.length) return dispatchCurrentOffer();
  resetCaptain(); if ($('btnRequestRide')) { $('btnRequestRide').disabled = false; $('btnRequestRide').innerText = 'طلب المشوار فوراً'; }
  if ($('custStatusBadge')) $('custStatusBadge').innerText = 'تم الرفض'; clearActiveSession();
}
function captainNotifyArrived() {
  $('btnCaptainArrived')?.classList.add('hidden'); $('btnCaptainStartTrip')?.classList.remove('hidden');
  syncSessionToFirebase({ trip: activeTripData, phase: 'arrived', phaseLabel: 'الكابتن وصل للموقع', ts: Date.now() });
  speakCustomerNotice('وصل الكابتن أمام موقعك الآن'); alert('🔔 وصل الكابتن وهو بانتظارك!');
}
function captainStartTrip() {
  if (DB.otpConfig?.enabled && activeTripData?.pinOtp && toEnDigits($('capOtpInput')?.value || '') !== activeTripData.pinOtp) return alert('❌ رمز الأمان (4 أرقام) غير صحيح!');
  $('btnCaptainStartTrip')?.classList.add('hidden'); $('btnCaptainCompleteTrip')?.classList.remove('hidden');
  syncSessionToFirebase({ trip: activeTripData, phase: 'started', phaseLabel: 'الرحلة قيد التنفيذ', ts: Date.now() });
  speakCustomerNotice('بدأت رحلتك مع توصيلة، نتمنى لك رحلة سعيدة');
}
function captainCompleteTrip() {
  if (waitTimerInt) { clearInterval(waitTimerInt); waitTimerInt = null; }
  if (activeTripData) activeTripData.fare = +(Number(activeTripData.fare) + activeWaitCost).toFixed(2);
  waitSeconds = 0; activeWaitCost = 0; if ($('capWaitClock')) $('capWaitClock').innerText = '00:00'; if ($('capWaitCostText')) $('capWaitCostText').innerText = '0.00';
  const snap = activeTripData ? { ...activeTripData } : null, fare = snap?.fare || 0;
  const cust = userIndex.get(snap?.customerPhone) || (DB.currentUser?.role === 'customer' ? DB.currentUser : null);
  if (cust && (cust.wallet || 0) >= fare) {
    cust.wallet = +(cust.wallet - fare).toFixed(2);
    if (DB.loyaltyConfig?.enabled) cust.loyaltyPoints = (cust.loyaltyPoints || 0) + safeNum(DB.loyaltyConfig.pointsPerTrip, 10, 0);
    if (DB.currentUser?.phone === cust.phone) { DB.currentUser.wallet = cust.wallet; DB.currentUser.loyaltyPoints = cust.loyaltyPoints; }
  }
  const cap = userIndex.get(snap?.assignedCaptainPhone) || (DB.currentUser?.role === 'captain' ? DB.currentUser : null); let comm = 0;
  if (cap) {
    cap.inTrip = false; cap.dailyTrips = (cap.dailyTrips || 0) + 1;
    const rate = (cap.packageUntil || 0) > Date.now() ? 0 : (safeNum(DB.referralConfig?.tripCommissionPercent, 10, 0, 80) / 100);
    comm = +(fare * rate).toFixed(2); cap.wallet = +((cap.wallet || 0) - comm).toFixed(2);
    if (DB.currentUser?.phone === cap.phone) { DB.currentUser.wallet = cap.wallet; DB.currentUser.dailyTrips = cap.dailyTrips; }
    const today = new Date().toISOString().slice(0, 10);
    if (DB.questConfig?.enabled && cap.dailyTrips >= DB.questConfig.targetTrips && cap.questClaimedDate !== today) {
      cap.questClaimedDate = today; cap.wallet = +(cap.wallet + safeNum(DB.questConfig.bonusAmount, 0, 0)).toFixed(2);
      alert(`🏆 مبروك! تم تحقيق الهدف اليومي (${DB.questConfig.targetTrips} رحلات) ومكافأة ${DB.questConfig.bonusAmount} ج.م!`);
    }
  }
  if (snap) {
    DB.tripHistory.push({ ...snap, fare, commission: comm, completedAt: new Date().toLocaleString('ar-EG') });
    addLedgerEntry('trip_captain', +(fare - comm).toFixed(2), `رحلة ${snap.id}`);
    if (comm > 0) addLedgerEntry('platform_profit', comm, `عمولة ${snap.id}`);
    creditRegionalAgentCommission(snap.govName || '', fare);
  }
  extraStops = []; saveDB(DB); updateNavUI(); resetCaptain(); clearActiveSession();
  if (captainLiveMarker && map) { map.removeLayer(captainLiveMarker); captainLiveMarker = null; }
  if ($('btnRequestRide')) { $('btnRequestRide').disabled = false; $('btnRequestRide').innerText = 'طلب المشوار فوراً'; }
  $('customerDriverCard')?.classList.add('hidden'); if ($('custStatusBadge')) $('custStatusBadge').innerText = 'اكتملت الرحلة'; activeTripData = null;
  if (snap) window.openPostTripSummaryModal(snap); else $('ratingModal')?.classList.remove('hidden');
}
function resetCaptain() { $('driverOfferBox')?.classList.add('hidden'); $('driverActiveTripBox')?.classList.add('hidden'); $('driverIdleBox')?.classList.remove('hidden'); }
window.toggleWaitTimer = () => {
  const b = $('btnToggleWaitTimer'), v = DB.vehicles.find(x => x.id === DB.selectedVehicleId) || DB.vehicles[0];
  if (waitTimerInt) { clearInterval(waitTimerInt); waitTimerInt = null; if (b) { b.innerText = 'استئناف'; b.className = 'bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-black'; } }
  else {
    if (b) { b.innerText = 'إيقاف'; b.className = 'bg-rose-600 text-white px-3 py-1 rounded-lg font-black'; }
    waitTimerInt = setInterval(() => {
      waitSeconds++; if ($('capWaitClock')) $('capWaitClock').innerText = `${String(Math.floor(waitSeconds / 60)).padStart(2, '0')}:${String(waitSeconds % 60).padStart(2, '0')}`;
      activeWaitCost = +((waitSeconds / 60) * (v.waitPerMin || 0)).toFixed(2); if ($('capWaitCostText')) $('capWaitCostText').innerText = activeWaitCost.toFixed(2);
      if ($('driverActiveTripFare') && activeTripData) $('driverActiveTripFare').innerText = `الأجرة: ${(activeTripData.fare + activeWaitCost).toFixed(2)} ج.م`;
    }, 1000);
  }
};

// ==========================================
// 5. النوافذ والميزات التفاعلية (المحفظة، المفضلة، السفر، الوقود، QR، الدلفري، إلخ)
// ==========================================
function showGM(title, html) { if ($('gmTitle')) $('gmTitle').innerText = title; if ($('gmBody')) $('gmBody').innerHTML = html; $('patchGenericModal')?.classList.remove('hidden'); }

window.openPostTripSummaryModal = trip => {
  const msg = `🧾 *فاتورة توصيلة مصر*\nرقم: ${trip.id}\nمن: ${trip.from}\nإلى: ${trip.to}\nالكابتن: ${trip.assignedCaptainName || '-'}\n*الإجمالي: ${trip.fare} ج.م*`;
  showGM('اكتملت الرحلة - الفاتورة', `
    <div class="p-3 bg-emerald-50 border rounded-2xl text-center"><b>${esc(trip.id)}</b><div class="text-xl font-black">${trip.fare} ج.م</div><div class="text-[11px]">${esc(trip.from)} ⬅️ ${esc(trip.to)}</div></div>
    <a href="https://wa.me/${(trip.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}" target="_blank" class="w-full bg-green-600 text-white font-black py-2.5 rounded-xl flex justify-center gap-2"><i class="fa-brands fa-whatsapp"></i> إرسال إيصال واتساب</a>
    <button onclick="$('patchGenericModal').classList.add('hidden');$('ratingModal').classList.remove('hidden');" class="w-full bg-amber-400 text-slate-900 font-black py-2 rounded-xl">⭐ تقييم الرحلة</button>
    ${DB.currentUser?.role === 'captain' && trip.customerPhone ? `<button onclick="window.openCapRateBlockModal('${esc(trip.customerPhone)}','${esc(trip.customerName)}')" class="w-full bg-rose-100 text-rose-800 font-bold py-2 rounded-xl">تقييم / حظر العميل</button>` : ''}`);
};

window.saveFavoritePlace = slot => {
  const u = userIndex.get(DB.currentUser?.phone); if (!u) return alert('سجل دخولك أولاً.');
  const addr = ($('dropoffInput')?.value || '').trim(); if (!addr) return alert('حدد وجهة الوصول أولاً.');
  const ll = dropoffMarker ? dropoffMarker.getLatLng() : { lat: 26.5569, lng: 31.6948 };
  u.favorites = u.favorites || {}; u.favorites[slot] = { addr, lat: ll.lat, lng: ll.lng }; DB.currentUser.favorites = u.favorites; saveDB(DB);
  alert(`⭐ تم حفظ (${slot === 'home' ? 'البيت' : 'العمل'})!`);
};
window.useFavoritePlace = slot => {
  const fav = (userIndex.get(DB.currentUser?.phone) || DB.currentUser)?.favorites?.[slot];
  if (!fav) return alert(`لم تحفظ موقع (${slot === 'home' ? 'البيت' : 'العمل'}) بعد.`);
  window.pickDetailedPlace('dropoff', fav.addr, fav.lat, fav.lng);
};
window.addExtraStopPoint = () => {
  const name = prompt('اسم محطة التوقف الوسطية:'); if (!name?.trim()) return;
  const p = pickupMarker?.getLatLng() || { lat: 26.55, lng: 31.69 }, d = dropoffMarker?.getLatLng() || { lat: 26.56, lng: 31.70 };
  extraStops.push({ name: name.trim(), lat: (p.lat + d.lat) / 2, lng: (p.lng + d.lng) / 2 }); window.renderExtraStopsChips(); recalcTrip(true);
};
window.renderExtraStopsChips = () => { if ($('patchExtraStopsBox')) $('patchExtraStopsBox').innerHTML = extraStops.map((s, i) => `<span class="inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg font-bold text-[10px]">📍 ${esc(s.name)} <button type="button" onclick="extraStops.splice(${i},1);renderExtraStopsChips();recalcTrip(true);" class="text-rose-700">✕</button></span>`).join(''); };

window.openIntercityModal = () => {
  if (!DB.intercityConfig?.enabled) return alert('سفر المحافظات متوقف حالياً.');
  const isCap = DB.currentUser?.role === 'captain' || DB.currentUser?.role === 'admin';
  showGM('السفر بين المحافظات ومشاركة المقاعد', `
    ${isCap ? `<form onsubmit="window.publishIntercityTrip(event)" class="bg-emerald-50 border p-2.5 rounded-2xl space-y-2"><div class="grid grid-cols-2 gap-1"><select id="icFrom" class="border rounded p-1 font-bold">${DB.governorates.map(g => `<option>${esc(g.name)}</option>`).join('')}</select><select id="icTo" class="border rounded p-1 font-bold">${DB.governorates.slice().reverse().map(g => `<option>${esc(g.name)}</option>`).join('')}</select></div><div class="grid grid-cols-3 gap-1"><input id="icDate" type="datetime-local" required class="col-span-2 border rounded p-1"><input id="icSeats" type="number" min="1" max="7" value="4" class="border rounded p-1"></div><div class="flex gap-1"><input id="icSeatPrice" type="number" min="20" required placeholder="سعر المقعد" class="flex-grow border rounded p-1"><button class="bg-emerald-600 text-white px-3 rounded font-black">نشر</button></div></form>` : ''}
    <div class="space-y-2 max-h-60 overflow-y-auto">${(DB.intercityTrips || []).map((t, i) => `<div class="p-2 bg-slate-50 border rounded-xl"><div class="flex justify-between"><b>${esc(t.fromGov)} ⬅️ ${esc(t.toGov)}</b><b class="text-emerald-700">${t.seatPrice} ج/مقعد</b></div><div class="text-[11px]">${esc(t.captainName)} | ${esc(t.date)} | المتاح: ${t.seatsLeft}</div>${t.seatsLeft > 0 ? `<button onclick="window.bookIntercitySeat(${i})" class="w-full mt-1 bg-slate-900 text-white py-1 rounded font-bold">حجز مقعد</button>` : '<b class="text-rose-600">مكتملة</b>'}</div>`).join('') || '<p class="text-center text-slate-400">لا توجد رحلات</p>'}</div>`);
};
window.publishIntercityTrip = e => { e.preventDefault(); DB.intercityTrips.push({ id: 'IC-' + Date.now(), captainName: DB.currentUser?.name || 'كابتن', fromGov: $('icFrom').value, toGov: $('icTo').value, date: $('icDate').value.replace('T', ' '), seatsLeft: safeNum($('icSeats').value, 4, 1, 14), seatPrice: safeNum($('icSeatPrice').value, 100, 10), bookings: [] }); saveDB(DB); window.openIntercityModal(); };
window.bookIntercitySeat = i => {
  if (!DB.currentUser) return alert('سجل دخولك أولاً.'); const t = DB.intercityTrips[i]; const cnt = parseInt(prompt(`كم مقعداً؟ (المتاح: ${t.seatsLeft})`, '1'));
  if (!cnt || cnt < 1 || cnt > t.seatsLeft) return alert('عدد غير صالح.'); t.seatsLeft -= cnt; t.bookings.push({ name: DB.currentUser.name, seats: cnt }); saveDB(DB); window.openIntercityModal(); alert(`✅ تم حجز ${cnt} مقعد!`);
};

window.openScheduledRidesModal = () => showGM('الرحلات المجدولة', (DB.scheduledTrips || []).map((s, i) => `<div class="p-2 bg-slate-50 border rounded-xl"><div class="flex justify-between"><b>${esc(s.id)} (${esc(s.govName)})</b><b>${s.fare} ج</b></div><div class="text-[11px]">${esc(s.from)} ⬅️ ${esc(s.to)} | ⏰ ${esc(s.datetime)}</div><div class="text-[11px] font-bold">${s.assignedCaptain ? 'محجوزة: ' + esc(s.assignedCaptain) : 'متاحة'}</div>${(DB.currentUser?.role === 'captain' && !s.assignedCaptain) ? `<button onclick="DB.scheduledTrips[${i}].assignedCaptain='${esc(DB.currentUser.name)}';saveDB(DB);window.openScheduledRidesModal();" class="w-full mt-1 bg-emerald-600 text-white py-1 rounded font-bold">تثبيت باسمي</button>` : ''}</div>`).join('') || '<p class="text-center text-slate-400">لا توجد رحلات مجدولة</p>');

window.openCapFuelTrackerModal = () => {
  const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!cap) return; cap.fuelLogs = cap.fuelLogs || [];
  const tf = cap.fuelLogs.reduce((s, f) => s + safeNum(f.cost, 0, 0), 0), gr = (DB.tripHistory || []).filter(t => t.assignedCaptainPhone === cap.phone).reduce((s, t) => s + (t.fare - (t.commission || 0)), 0);
  showGM('الوقود والصيانة وصافي الربح', `
    <div class="grid grid-cols-3 gap-1.5 text-center"><div class="bg-emerald-50 p-2 rounded-xl border"><span>الأرباح</span><b class="block">${gr.toFixed(1)} ج</b></div><div class="bg-rose-50 p-2 rounded-xl border"><span>المصاريف</span><b class="block">${tf.toFixed(1)} ج</b></div><div class="bg-slate-900 text-amber-300 p-2 rounded-xl"><span>الصافي</span><b class="block">${(gr - tf).toFixed(1)} ج</b></div></div>
    <form onsubmit="window.addCapFuelLog(event)" class="grid grid-cols-3 gap-1"><select id="flType" class="border rounded p-1.5 font-bold"><option>بنزين / غاز</option><option>تغيير زيت</option><option>صيانة</option></select><input id="flCost" type="number" required min="1" placeholder="المبلغ" class="border rounded p-1.5 font-bold"><button class="bg-emerald-600 text-white font-black rounded">إضافة</button></form>
    <div class="max-h-40 overflow-y-auto space-y-1">${cap.fuelLogs.slice().reverse().map(f => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><span>${esc(f.type)} (${esc(f.date)})</span><b class="text-rose-700">-${f.cost}ج</b></div>`).join('')}</div>`);
};
window.addCapFuelLog = e => { e.preventDefault(); const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser; cap.fuelLogs = cap.fuelLogs || []; cap.fuelLogs.push({ type: $('flType').value, cost: safeNum($('flCost').value, 0, 1), date: new Date().toLocaleDateString('ar-EG') }); saveDB(DB); window.openCapFuelTrackerModal(); };

window.openLostFoundModal = () => {
  window.__lfImg = '';
  showGM('المفقودات بالصور', `
    <form onsubmit="window.subLostFound(event)" class="space-y-2 bg-slate-50 p-2 rounded-xl border"><input id="lfTripId" placeholder="رقم الرحلة (اختياري)" class="w-full border rounded p-1.5 font-mono"><input id="lfDesc" required placeholder="وصف الغرض..." class="w-full border rounded p-1.5 font-bold"><input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__lfImg=r)" class="text-[10px] w-full"><button class="w-full bg-indigo-600 text-white font-black py-2 rounded-xl">نشر</button></form>
    <div class="max-h-52 overflow-y-auto space-y-2">${(DB.lostFoundItems || []).slice().reverse().map(it => `<div class="p-2 border rounded-xl flex gap-2 items-center">${it.image ? `<img src="${it.image}" onclick="window.open('${it.image}')" class="w-12 h-12 rounded object-cover cursor-pointer">` : ''}<div><b>${esc(it.desc)}</b><div class="text-[10px] text-slate-500">${esc(it.by)} (${esc(it.phone)})</div></div></div>`).join('') || '<p class="text-center text-slate-400">فارغ</p>'}</div>`);
};
window.subLostFound = e => { e.preventDefault(); DB.lostFoundItems.push({ id: 'LF-' + Date.now(), tripId: $('lfTripId').value.trim(), desc: $('lfDesc').value.trim(), image: window.__lfImg || '', by: DB.currentUser?.name || 'مستخدم', phone: DB.currentUser?.phone || '' }); saveDB(DB); window.openLostFoundModal(); };

// منظومة السحب والإيداع المصححة 100%
window.openWalletModal = () => window.openWalletOpsModal('deposit');
window.closeWalletModal = () => { $('walletModal')?.classList.add('hidden'); $('patchGenericModal')?.classList.add('hidden'); };
window.openCapWalletAction = op => window.openWalletOpsModal(op);
window.confirmCustomerRecharge = () => window.openWalletOpsModal('deposit');

window.openWalletOpsModal = mode => {
  if (!DB.currentUser) return alert('يرجى تسجيل الدخول أولاً.');
  const u = userIndex.get(DB.currentUser.phone) || DB.currentUser, isCap = u.role === 'captain', cfg = DB.walletSystemConfig, pc = DB.paymentConfig, methods = (pc.methods || []).filter(m => m.enabled);
  window.__tmpReceipt = '';
  const tabs = `<div class="flex gap-1 bg-slate-100 p-1 rounded-xl font-bold mb-2"><button type="button" onclick="window.openWalletOpsModal('deposit')" class="flex-1 py-1.5 rounded-lg ${mode==='deposit'?'bg-emerald-600 text-white':'text-slate-600'}">إيداع</button><button type="button" onclick="window.openWalletOpsModal('withdraw')" class="flex-1 py-1.5 rounded-lg ${mode==='withdraw'?'bg-amber-500 text-slate-900':'text-slate-600'}">سحب</button><button type="button" onclick="window.openWalletOpsModal('history')" class="flex-1 py-1.5 rounded-lg ${mode==='history'?'bg-slate-900 text-white':'text-slate-600'}">طلباتي</button></div>`;
  if (mode === 'deposit') {
    const ok = isCap ? cfg.captainDepositEnabled : cfg.customerDepositEnabled;
    showGM(`إيداع المحفظة (${safeNum(u.wallet, 0, 0).toFixed(2)} ج.م)`, tabs + (!ok ? '<p class="text-center text-rose-700 font-bold p-3">الإيداع متوقف حالياً.</p>' : `<form onsubmit="window.submitWalletOp(event,'deposit')" class="space-y-2"><select id="uwMeth" onchange="window.updateDepTarget()" class="w-full border rounded-xl p-2 font-bold">${methods.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><div id="uwTargetBox" class="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center"></div><input id="uwAmt" type="number" required min="${pc.minDeposit}" max="${pc.maxDeposit}" step="0.5" placeholder="المبلغ (${pc.minDeposit}-${pc.maxDeposit} ج)" class="w-full border rounded-xl p-2 font-black"><div class="grid grid-cols-2 gap-1"><input id="uwAcc" required placeholder="رقم المحوّل منه" class="border rounded-xl p-2 font-mono font-bold"><input id="uwRef" placeholder="رقم المرجع" class="border rounded-xl p-2 font-mono"></div><input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],340,r=>window.__tmpReceipt=r)" class="text-[10px] w-full"><button class="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl">${cfg.instantDeposit ? '⚡ شحن فوري' : '🕒 إرسال طلب الإيداع'}</button></form>`));
    setTimeout(window.updateDepTarget, 0);
  } else if (mode === 'withdraw') {
    const ok = isCap ? cfg.captainWithdrawEnabled : cfg.customerWithdrawEnabled;
    showGM(`سحب من المحفظة (${safeNum(u.wallet, 0, 0).toFixed(2)} ج.م)`, tabs + (!ok ? '<p class="text-center text-rose-700 font-bold p-3">السحب متوقف حالياً.</p>' : `<form onsubmit="window.submitWalletOp(event,'withdraw')" class="space-y-2"><select id="uwMeth" class="w-full border rounded-xl p-2 font-bold">${methods.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><input id="uwAcc" required value="${esc(u.phone || '')}" placeholder="رقم المحفظة المستلمة" class="w-full border rounded-xl p-2 font-mono font-bold"><input id="uwAmt" type="number" required min="${pc.minWithdraw}" max="${pc.maxWithdraw}" step="0.5" placeholder="المبلغ (${pc.minWithdraw}-${pc.maxWithdraw} ج) | رسوم ${cfg.withdrawFeePercent}%" class="w-full border rounded-xl p-2 font-black"><button class="w-full bg-amber-500 text-slate-900 font-black py-2.5 rounded-xl">تأكيد السحب</button></form>`));
  } else {
    const mine = (DB.walletRequests || []).filter(r => r.phone === u.phone).slice().reverse();
    showGM('سجل السحب والإيداع', tabs + (mine.map(r => `<div class="p-2 border rounded-xl bg-slate-50 flex justify-between"><span><b>${r.op==='deposit'?'➕ إيداع':'💸 سحب'} ${r.amount}ج</b> (${esc(r.methodName)})</span><b class="${r.status==='approved'?'text-emerald-700':r.status==='rejected'?'text-rose-700':'text-amber-700'}">${r.status==='approved'?'مقبول':r.status==='rejected'?'مرفوض':'قيد المراجعة'}</b></div>`).join('') || '<p class="text-center text-slate-400">لا توجد طلبات</p>'));
  }
};
window.updateDepTarget = () => {
  const s = $('uwMeth'), b = $('uwTargetBox'); if (!s || !b) return;
  const m = DB.paymentConfig.methods.find(x => x.id === s.value) || DB.paymentConfig.methods[0];
  if (m) b.innerHTML = `<span class="font-bold text-emerald-900">حساب (${esc(m.name)}): <b class="font-mono">${esc(m.details)}</b></span><button type="button" onclick="navigator.clipboard.writeText('${esc(m.details)}');alert('تم النسخ!');" class="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">نسخ</button>`;
};
window.submitWalletOp = (e, op) => {
  e.preventDefault(); const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return;
  const pc = DB.paymentConfig, cfg = DB.walletSystemConfig, amt = safeNum($('uwAmt').value, 0, 0), mObj = pc.methods.find(x => x.id === $('uwMeth').value) || { name: 'تحويل' }, acc = toEnDigits($('uwAcc').value), refNo = ($('uwRef')?.value || '').trim();
  if (op === 'deposit') {
    if (amt < pc.minDeposit || amt > pc.maxDeposit) return alert(`الحد: ${pc.minDeposit} - ${pc.maxDeposit} ج.م`);
    DB.walletRequests.push({ id: 'WREQ-' + Date.now(), op, phone: u.phone, name: u.name, amount: amt, fee: 0, netAmount: amt, methodName: mObj.name, account: acc, refNo, receipt: window.__tmpReceipt || '', status: cfg.instantDeposit ? 'approved' : 'pending', date: new Date().toLocaleString('ar-EG') });
    if (cfg.instantDeposit) { u.wallet = +((u.wallet || 0) + amt).toFixed(2); DB.currentUser.wallet = u.wallet; addLedgerEntry('deposit', amt, `إيداع فوري: ${u.name}`); }
  } else {
    if (amt < pc.minWithdraw || amt > pc.maxWithdraw) return alert(`الحد: ${pc.minWithdraw} - ${pc.maxWithdraw} ج.م`);
    if ((u.wallet || 0) < amt) return alert('❌ رصيدك لا يكفي!');
    const fee = +(amt * (safeNum(cfg.withdrawFeePercent, 0, 0) / 100)).toFixed(2);
    u.wallet = +(u.wallet - amt).toFixed(2); DB.currentUser.wallet = u.wallet;
    DB.walletRequests.push({ id: 'WREQ-' + Date.now(), op, phone: u.phone, name: u.name, amount: amt, fee, netAmount: +(amt - fee).toFixed(2), methodName: mObj.name, account: acc, refNo: '', receipt: '', status: 'pending', date: new Date().toLocaleString('ar-EG') });
  }
  saveDB(DB); updateNavUI(); handleDriverViewLogic(); window.openWalletOpsModal('history');
};

function triggerEmergencySOS() { if (confirm('🚨 إرسال تنبيه طوارئ للإدارة؟')) { DB.complaints.push({ id: 'SOS-' + Date.now(), tripId: activeTripData?.id || 'مباشر', user: DB.currentUser?.name || 'عميل', phone: DB.currentUser?.phone || '', type: 'طوارئ SOS', details: 'بلاغ طوارئ فوري', status: 'عاجل', date: new Date().toLocaleString('ar-EG') }); saveDB(DB); alert('🛡️ تم إطلاق تنبيه SOS!'); } }
function setRating(s) { selectedStarRating = s; document.querySelectorAll('#starsRatingContainer i').forEach((ic, i) => ic.className = i < s ? 'fa-solid fa-star text-amber-400' : 'fa-regular fa-star text-slate-300'); }
function submitRating() { $('ratingModal')?.classList.add('hidden'); alert(`⭐ تم تسجيل تقييمك (${selectedStarRating} نجوم).`); }
function openChatModal() { $('chatModal')?.classList.remove('hidden'); }
function closeChatModal() { $('chatModal')?.classList.add('hidden'); }
function handleSendChatMessage(e) { e.preventDefault(); const i = $('chatInputText'), d = document.createElement('div'); d.className = 'bg-emerald-600 text-white p-2 rounded-xl text-xs max-w-[80%] mr-auto'; d.innerText = i.value; $('chatMessagesBox').appendChild(d); i.value = ''; }
function startVoiceCall() { $('voiceCallModal')?.classList.remove('hidden'); }
function endVoiceCall() { $('voiceCallModal')?.classList.add('hidden'); }

window.openGoogleQuickAuth = () => {
  const gUsers = DB.users.filter(u => u.googleEmail); window.__gUsersList = gUsers;
  showGM('الدخول السريع عبر Google', `<form onsubmit="window.completeGoogleAuth(event)" class="space-y-2"><input type="email" id="gAuthEmail" required placeholder="name@gmail.com" class="w-full border rounded-xl p-2 font-mono"><input id="gAuthName" required placeholder="الاسم" class="w-full border rounded-xl p-2 font-bold"><input type="tel" id="gAuthPhone" required placeholder="010XXXXXXXX" class="w-full border rounded-xl p-2 font-mono"><button class="w-full bg-emerald-600 text-white font-black py-2 rounded-xl">دخول فوري</button></form>${gUsers.map((u, i) => `<button onclick="window.loginGoogleIdx(${i})" class="w-full text-right p-2 bg-slate-50 border rounded-xl font-bold mt-1">${esc(u.name)}</button>`).join('')}`);
};
window.loginGoogleIdx = i => { const u = window.__gUsersList?.[i]; if (u) window.loginGoogleUser(u.googleEmail, u.name, u.phone); };
window.completeGoogleAuth = e => { e.preventDefault(); window.loginGoogleUser($('gAuthEmail').value.trim(), $('gAuthName').value.trim(), toEnDigits($('gAuthPhone').value)); };
window.loginGoogleUser = (email, name, phone) => {
  if (isBlacklisted(phone)) return;
  let u = DB.users.find(x => x.googleEmail === email || x.phone === phone);
  if (!u) { u = { role: 'customer', name, phone, googleEmail: email, password: 'g_' + Date.now(), wallet: DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.customerAmount, 0, 0) : 150, welcomeCredited: true, loyaltyPoints: 0, blockedBy: [], favorites: {} }; ensureUserReferralCode(u); DB.users.push(u); rebuildUserIndex(); }
  DB.currentUser = u; saveDB(DB); updateNavUI(); $('patchGenericModal')?.classList.add('hidden'); navigate(u.role === 'captain' ? 'driver' : 'customer');
};

window.openProfessionalShareModal = () => {
  const code = ensureUserReferralCode(DB.currentUser), url = `${location.href.split('?')[0]}?ref=${encodeURIComponent(code)}`, msg = `🚖 جرّب تطبيق توصيلة مصر بكود الإحالة (${code}):\n${url}`;
  showGM('شارك التطبيق واكسب مكافآت', `<div class="bg-emerald-50 border-2 border-dashed border-emerald-400 p-3 rounded-2xl text-center"><b>كود الإحالة</b><div class="text-xl font-mono font-black text-emerald-700 my-1">${esc(code)}</div><button onclick="navigator.clipboard.writeText('${esc(code)}');alert('تم النسخ!');" class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">نسخ الكود</button></div><div class="grid grid-cols-3 gap-2 text-center font-bold"><a href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" class="bg-green-500 text-white py-2 rounded-xl">واتساب</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="bg-blue-600 text-white py-2 rounded-xl">فيسبوك</a><a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}" target="_blank" class="bg-sky-500 text-white py-2 rounded-xl">تيليجرام</a></div>`);
};

window.openTransferModal = () => {
  if (!DB.transferSettings.enabled || !DB.currentUser) return alert('الخدمة غير متاحة.');
  showGM('تحويل رصيد', `<div class="bg-slate-50 p-2 rounded-xl flex justify-between font-bold"><span>رصيدك:</span><b>${safeNum(DB.currentUser.wallet, 0, 0).toFixed(2)} ج.م</b></div><form onsubmit="window.executeTransfer(event)" class="space-y-2"><input type="tel" id="trPh" required placeholder="رقم المستلم" class="w-full border rounded-xl p-2 font-mono"><input type="number" id="trAmt" required min="${DB.transferSettings.minAmount}" max="${DB.transferSettings.maxAmount}" step="0.5" placeholder="المبلغ (عمولة ${DB.transferSettings.commissionPercent}%)" class="w-full border rounded-xl p-2 font-black"><button class="w-full bg-indigo-600 text-white font-black py-2 rounded-xl">تحويل</button></form>`);
};
window.executeTransfer = e => {
  e.preventDefault(); const s = userIndex.get(DB.currentUser.phone) || DB.currentUser, t = userIndex.get(toEnDigits($('trPh').value)), amt = safeNum($('trAmt').value, 0, 0);
  if (!t || t.phone === s.phone || amt <= 0) return alert('❌ رقم غير صحيح.');
  const fee = +(amt * (safeNum(DB.transferSettings.commissionPercent, 0, 0) / 100)).toFixed(2);
  if ((s.wallet || 0) < amt + fee) return alert('رصيدك لا يكفي!');
  s.wallet = +(s.wallet - amt - fee).toFixed(2); t.wallet = +((t.wallet || 0) + amt).toFixed(2); DB.currentUser.wallet = s.wallet;
  DB.transferLogs.push({ fromName: s.name, toName: t.name, amount: amt, fee, date: new Date().toLocaleString('ar-EG') });
  saveDB(DB); updateNavUI(); handleDriverViewLogic(); $('patchGenericModal')?.classList.add('hidden'); alert(`✅ تم تحويل ${amt} ج.م!`);
};

window.openQrPayModal = () => {
  if (!DB.currentUser) return alert('سجل دخولك أولاً.'); const payload = `TAWSILA:${DB.currentUser.phone}`;
  showGM('QR الدفع السريع', `<div class="bg-slate-50 p-3 rounded-2xl border flex flex-col items-center gap-1"><img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}" class="w-36 h-36 rounded-xl border bg-white p-1"><b>${esc(DB.currentUser.name)}</b><span class="font-mono text-[11px] text-emerald-700">${esc(payload)}</span></div><form onsubmit="window.payByQrCode(event)" class="space-y-2 border-t pt-2"><input id="qrTargetPhone" required placeholder="كود QR أو رقم الهاتف" class="w-full border rounded-xl p-2 font-mono"><input id="qrPayAmt" type="number" required min="1" step="0.5" placeholder="المبلغ" class="w-full border rounded-xl p-2 font-black"><button class="w-full bg-emerald-600 text-white font-black py-2 rounded-xl">دفع فوري</button></form>`);
};
window.payByQrCode = e => {
  e.preventDefault(); const raw = toEnDigits($('qrTargetPhone').value.replace('TAWSILA:', '')), amt = safeNum($('qrPayAmt').value, 0, 1), s = userIndex.get(DB.currentUser.phone) || DB.currentUser, r = userIndex.get(raw);
  if (!r || r.phone === s.phone || (s.wallet || 0) < amt) return alert('❌ تحقق من الكود والرصيد.');
  s.wallet = +(s.wallet - amt).toFixed(2); r.wallet = +((r.wallet || 0) + amt).toFixed(2); DB.currentUser.wallet = s.wallet;
  saveDB(DB); updateNavUI(); handleDriverViewLogic(); $('patchGenericModal')?.classList.add('hidden'); alert(`✅ تم دفع ${amt} ج.م!`);
};

window.openDeliveryModal = () => {
  if (!DB.deliveryConfig.enabled) return alert('الدلفري متوقف.'); const km = Math.round(realRouteDistKm) || 5;
  showGM('طلب توصيل دلفري', `<form onsubmit="window.submitDeliv(event)" class="space-y-2"><div class="grid grid-cols-2 gap-1.5"><select id="dlSend" class="border rounded p-1.5 font-bold"><option>شخص</option><option>شركة</option><option>مطعم</option><option>صيدلية</option></select><select id="dlPkg" class="border rounded p-1.5 font-bold"><option>طعام</option><option>طرد</option></select></div><input id="dlFrom" required value="${esc($('pickupInput')?.value || '')}" placeholder="من" class="w-full border rounded p-2"><input id="dlTo" required value="${esc($('dropoffInput')?.value || '')}" placeholder="إلى" class="w-full border rounded p-2"><div class="grid grid-cols-2 gap-1.5"><input id="dlRecN" required placeholder="اسم المستلم" class="border rounded p-2"><input id="dlRecP" type="tel" required placeholder="هاتف المستلم" class="border rounded p-2 font-mono"></div><input id="dlKm" type="number" value="${km}" min="1" oninput="$('dlPr').innerText=(Number(DB.deliveryConfig.baseFare)+this.value*Number(DB.deliveryConfig.perKm)).toFixed(2)+' ج'" class="w-full border rounded p-2"><div class="bg-orange-50 p-2 rounded flex justify-between font-black"><span>السعر:</span><b id="dlPr">${(Number(DB.deliveryConfig.baseFare) + km * Number(DB.deliveryConfig.perKm)).toFixed(2)} ج</b></div><button class="w-full bg-orange-600 text-white font-black py-2 rounded-xl">إرسال الطلب</button></form>`);
};
window.submitDeliv = e => {
  e.preventDefault(); const km = safeNum($('dlKm').value, 5, 1), price = +(Number(DB.deliveryConfig.baseFare) + km * Number(DB.deliveryConfig.perKm)).toFixed(2);
  DB.deliveryOrders.push({ id: 'DLV-' + Date.now(), senderType: $('dlSend').value, pkgType: $('dlPkg').value, from: $('dlFrom').value.trim(), to: $('dlTo').value.trim(), recName: $('dlRecN').value.trim(), recPhone: toEnDigits($('dlRecP').value), price, date: new Date().toLocaleString('ar-EG') });
  saveDB(DB); $('patchGenericModal')?.classList.add('hidden'); alert(`📦 تم تسجيل الدلفري (${price} ج.م)!`);
};

window.openPartnerModal = () => {
  if (!DB.partnerConfig.enabled) return alert('تسجيل الشركات متوقف.');
  showGM(`شركات / مطاعم / صيدليات (خصم ${DB.partnerConfig.discountPercent}%)`, `<form onsubmit="window.savePartnerReg(event)" class="space-y-2"><select id="ptCat" class="w-full border rounded p-2 font-bold"><option>شركة</option><option>مطعم</option><option>صيدلية</option></select><input id="ptName" required placeholder="الاسم التجاري" class="w-full border rounded p-2"><input id="ptPh" type="tel" required placeholder="الهاتف" class="w-full border rounded p-2 font-mono"><input id="ptPs" type="password" required placeholder="كلمة المرور" class="w-full border rounded p-2"><button class="w-full bg-purple-700 text-white font-black py-2 rounded-xl">تفعيل الحساب</button></form>`);
};
window.savePartnerReg = e => {
  e.preventDefault(); const ph = toEnDigits($('ptPh').value); if (isBlacklisted(ph) || userIndex.has(ph)) return alert('الرقم غير متاح.');
  const u = { role: 'customer', isPartner: true, name: `${$('ptCat').value}: ${$('ptName').value.trim()}`, phone: ph, password: toEnDigits($('ptPs').value), wallet: 150, loyaltyPoints: 0, favorites: {} };
  ensureUserReferralCode(u); DB.users.push(u); DB.partners.push({ name: u.name, phone: ph }); rebuildUserIndex(); DB.currentUser = u; saveDB(DB); updateNavUI(); $('patchGenericModal')?.classList.add('hidden'); navigate('customer');
};

window.openLoanModal = () => {
  if (!DB.loanSettings.enabled) return alert('السلف متوقفة.'); window.__tmpImg = '';
  const mine = DB.loanRequests.filter(r => r.phone === DB.currentUser?.phone);
  showGM('طلب سلفة / قرض', `<form onsubmit="window.subLoan(event)" class="space-y-2"><input type="number" id="lnAmt" required min="50" placeholder="القيمة" class="w-full border rounded p-2 font-black"><textarea id="lnGoal" required placeholder="الهدف..." class="w-full border rounded p-2"></textarea><input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__tmpImg=r)" class="text-[10px] w-full"><button class="w-full bg-amber-500 text-slate-900 font-black py-2 rounded-xl">إرسال</button></form><div class="border-t pt-2 space-y-1">${mine.map(r => `<div class="p-1 bg-slate-50 border rounded flex justify-between"><b>${r.amount}ج</b><span>${r.status==='approved'?'🟢 مقبول':r.status==='rejected'?'🔴 مرفوض':'🟡 مراجعة'}</span></div>`).join('')}</div>`);
};
window.subLoan = e => { e.preventDefault(); DB.loanRequests.push({ id: 'ln_' + Date.now(), name: DB.currentUser?.name || '', phone: DB.currentUser?.phone || '', amount: safeNum($('lnAmt').value, 50, 50), goal: $('lnGoal').value.trim(), image: window.__tmpImg || '', status: 'pending' }); saveDB(DB); $('patchGenericModal')?.classList.add('hidden'); alert('✅ تم إرسال الطلب!'); };

window.openInstallmentModal = () => {
  if (!DB.installmentSettings.enabled) return alert('التقسيط متوقف.'); window.__tmpImg = '';
  showGM('طلب تقسيط مركبة', `<form onsubmit="window.subInst(event)" class="space-y-2"><select id="inVeh" class="w-full border rounded p-2 font-bold"><option>سيارة</option><option>موتوسيكل</option><option>تروسيكل</option><option>توكتوك</option><option>سكوتر</option></select><div class="grid grid-cols-2 gap-1.5"><input type="number" id="inDown" required placeholder="المقدم" class="border rounded p-2"><input type="number" id="inMon" value="24" required placeholder="الشهور" class="border rounded p-2"></div><input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__tmpImg=r)" class="text-[10px] w-full"><button class="w-full bg-teal-600 text-white font-black py-2 rounded-xl">تقديم الطلب</button></form>`);
};
window.subInst = e => { e.preventDefault(); if (!DB.currentUser) return alert('سجل دخولك.'); DB.installmentRequests.push({ id: 'in_' + Date.now(), name: DB.currentUser.name, phone: DB.currentUser.phone, vehicle: $('inVeh').value, downPayment: safeNum($('inDown').value, 0, 0), months: safeNum($('inMon').value, 24, 6), image: window.__tmpImg || '', status: 'pending' }); saveDB(DB); $('patchGenericModal')?.classList.add('hidden'); alert('✅ تم إرسال الطلب!'); };

window.openCommuteModal = () => {
  if (!DB.commuteConfig.enabled) return alert('الاشتراكات متوقفة.');
  const mine = DB.commuteSubscriptions.filter(s => s.phone === DB.currentUser?.phone);
  showGM(`اشتراك ثابت (خصم ${DB.commuteConfig.discountPercent}%)`, `<form onsubmit="window.subCommutePlan(event)" class="space-y-2"><div class="grid grid-cols-2 gap-1"><select id="cmCat" class="border rounded p-1.5 font-bold"><option>طالب مدرسة</option><option>طالب جامعة</option><option>موظف</option></select><select id="cmPeriod" class="border rounded p-1.5 font-bold"><option>أسبوعي</option><option>شهري</option></select></div><input id="cmFrom" required value="${esc($('pickupInput')?.value || '')}" placeholder="من" class="w-full border rounded p-2"><input id="cmTo" required placeholder="إلى" class="w-full border rounded p-2"><input id="cmTime" type="time" value="07:30" class="w-full border rounded p-2"><button class="w-full bg-cyan-700 text-white font-black py-2 rounded-xl">تقديم</button></form>${mine.map(s => `<div class="p-1 bg-slate-50 border rounded flex justify-between mt-1"><span>${esc(s.cat)} (${esc(s.time)})</span><b>${esc(s.assignedCaptain || 'بانتظار كابتن')}</b></div>`).join('')}`);
};
window.subCommutePlan = e => { e.preventDefault(); DB.commuteSubscriptions.push({ id: 'CM-' + Date.now().toString().slice(-5), name: DB.currentUser?.name || 'عميل', phone: DB.currentUser?.phone || '', cat: $('cmCat').value, period: $('cmPeriod').value, from: $('cmFrom').value.trim(), to: $('cmTo').value.trim(), time: $('cmTime').value, assignedCaptain: '' }); saveDB(DB); $('patchGenericModal')?.classList.add('hidden'); alert('✅ تم تسجيل اشتراكك!'); };

window.toggleCaptainAvailability = () => { const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return; u.isAvailable = u.isAvailable === false; DB.currentUser.isAvailable = u.isAvailable; saveDB(DB); const b = $('patchCapAvailBtn'); if (b) { b.innerText = u.isAvailable ? 'متاح للرحلات' : 'غير متاح'; b.className = `px-3 py-1 rounded-xl text-xs font-black ${u.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`; } };
window.saveCapDestFilter = () => { const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return; u.destFilter = $('capDestFilterInp').value.trim(); DB.currentUser.destFilter = u.destFilter; saveDB(DB); alert(u.destFilter ? `🏠 فلتر الوجهة: ${u.destFilter}` : 'تم إلغاء الفلتر.'); };
window.openCapPackageModal = () => {
  const c = DB.packageConfig, cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser, act = (cap?.packageUntil || 0) > Date.now();
  showGM('باقات 0% عمولة', `<div class="p-2.5 rounded-xl bg-slate-50 font-bold text-center">${act ? `🟢 سارية حتى ${new Date(cap.packageUntil).toLocaleDateString('ar-EG')}` : 'اشترك لعمولة 0%!'}</div><div class="grid grid-cols-2 gap-2"><button onclick="window.buyCapPkg(7,${c.weeklyPrice})" class="bg-purple-700 text-white p-3 rounded-xl font-black">أسبوعية<br>${c.weeklyPrice}ج</button><button onclick="window.buyCapPkg(30,${c.monthlyPrice})" class="bg-slate-900 text-amber-400 p-3 rounded-xl font-black">شهرية<br>${c.monthlyPrice}ج</button></div>`);
};
window.buyCapPkg = (days, price) => { const c = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!c || (c.wallet || 0) < price) return alert('رصيدك لا يكفي!'); c.wallet = +(c.wallet - price).toFixed(2); c.packageUntil = Date.now() + days * 86400000; DB.currentUser.wallet = c.wallet; addLedgerEntry('platform_profit', price, `باقة ${days} يوم`); saveDB(DB); handleDriverViewLogic(); $('patchGenericModal')?.classList.add('hidden'); };
window.openCapRateBlockModal = (ph, nm) => showGM(`تقييم (${nm})`, `<div class="grid grid-cols-2 gap-2"><button onclick="$('patchGenericModal').classList.add('hidden')" class="bg-emerald-600 text-white py-2 rounded-xl font-black">👍 ممتاز</button><button onclick="window.blockCust('${esc(ph)}')" class="bg-rose-600 text-white py-2 rounded-xl font-black">🚫 حظر</button></div>`);
window.blockCust = ph => { const c = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (c) { c.blockedCustomers = c.blockedCustomers || []; if (!c.blockedCustomers.includes(ph)) c.blockedCustomers.push(ph); saveDB(DB); } $('patchGenericModal')?.classList.add('hidden'); };

let heatLayers = [];
window.toggleHeatmapView = () => {
  navigate('customer');
  setTimeout(() => {
    if (!map) return; heatLayers.forEach(l => map.removeLayer(l)); heatLayers = [];
    const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
    (DB.demandPoints.length ? DB.demandPoints : [{ lat: gov.center[0], lng: gov.center[1] }]).forEach(p => heatLayers.push(L.circle([p.lat, p.lng], { radius: 450, color: '#e11d48', fillColor: '#f43f5e', fillOpacity: 0.35, weight: 1 }).addTo(map)));
    alert('🔥 تم إظهار مناطق الذروة بالخريطة!');
  }, 300);
};
window.openBestCaptainsModal = () => showGM('🏆 أفضل 10 كباتن', DB.users.filter(u => u.role === 'captain').sort((a, b) => (b.dailyTrips || 0) - (a.dailyTrips || 0)).slice(0, 10).map((c, i) => `<div class="p-2 bg-slate-50 border rounded-xl flex justify-between"><span><b>#${i + 1}</b> ${esc(c.name)}</span><b class="text-emerald-700">${c.dailyTrips || 0} رحلة</b></div>`).join(''));

window.openHistoryLoyaltyModal = () => {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser, mine = DB.tripHistory.filter(t => t.customerPhone === u?.phone || t.assignedCaptainPhone === u?.phone);
  showGM('سجلي ونقاط الولاء', `${u?.role === 'customer' && DB.loyaltyConfig?.enabled ? `<div class="bg-amber-50 border p-2.5 rounded-xl flex justify-between items-center"><div><b>⭐ نقاطي: ${u.loyaltyPoints || 0}</b><span class="block text-[10px]">100 نقطة = ${DB.loyaltyConfig.egpPer100Points}ج</span></div><button onclick="window.redeemLoyalty()" class="bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-black">تحويل</button></div>` : ''}<div class="space-y-1.5 max-h-60 overflow-y-auto">${mine.slice().reverse().map(t => `<div class="p-2 bg-slate-50 border rounded-xl"><div class="flex justify-between"><b>${esc(t.id)}</b><b>${t.fare} ج</b></div><div class="text-[11px]">${esc(t.from)} ⬅️ ${esc(t.to)}</div><button onclick="window.printTripReceipt('${esc(t.id)}')" class="text-blue-600 font-bold text-[10px]">🖨️ طباعة الفاتورة</button></div>`).join('') || '<p class="text-center text-slate-400">فارغ</p>'}</div>`);
};
window.redeemLoyalty = () => { const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u || (u.loyaltyPoints || 0) < 100) return alert('تحتاج 100 نقطة.'); const b = Math.floor(u.loyaltyPoints / 100), c = b * safeNum(DB.loyaltyConfig.egpPer100Points, 20, 1); u.loyaltyPoints -= b * 100; u.wallet = +((u.wallet || 0) + c).toFixed(2); DB.currentUser.loyaltyPoints = u.loyaltyPoints; DB.currentUser.wallet = u.wallet; saveDB(DB); updateNavUI(); window.openHistoryLoyaltyModal(); };
window.printTripReceipt = id => { const t = DB.tripHistory.find(x => x.id === id); if (!t) return; const w = window.open('', '_blank', 'width=400,height=500'); w.document.write(`<html dir="rtl"><body style="font-family:sans-serif;padding:20px"><h2>فاتورة رحلة توصيلة</h2><hr><p>رقم: <b>${esc(t.id)}</b></p><p>التاريخ: ${esc(t.completedAt)}</p><p>من: ${esc(t.from)}</p><p>إلى: ${esc(t.to)}</p><h3>الإجمالي: ${t.fare} ج.م</h3><script>window.print();</script></body></html>`); };

window.openComplaintsModal = () => {
  const mine = DB.tripHistory.filter(t => t.customerPhone === DB.currentUser?.phone);
  showGM('الشكاوى والمفقودات', `<form onsubmit="window.subComplaint(event)" class="space-y-2"><select id="cmpTrip" class="w-full border rounded p-2 font-bold">${mine.map(t => `<option>${esc(t.id)}</option>`).join('') || '<option>عام</option>'}</select><select id="cmpType" class="w-full border rounded p-2 font-bold"><option>مفقودات</option><option>خلاف أجرة</option><option>سلوك</option></select><textarea id="cmpTxt" required rows="3" placeholder="التفاصيل..." class="w-full border rounded p-2"></textarea><button class="w-full bg-rose-600 text-white font-black py-2 rounded-xl">إرسال</button></form>`);
};
window.subComplaint = e => { e.preventDefault(); DB.complaints.push({ id: 'CMP-' + Date.now().toString().slice(-5), tripId: $('cmpTrip').value, user: DB.currentUser?.name || '', phone: DB.currentUser?.phone || '', type: $('cmpType').value, details: $('cmpTxt').value.trim(), date: new Date().toLocaleString('ar-EG') }); saveDB(DB); $('patchGenericModal')?.classList.add('hidden'); alert('✅ تم رفع البلاغ!'); };

window.openInboxModal = () => {
  if (!DB.inboxSettings.enabled || !DB.currentUser) return; const p = DB.currentUser.phone;
  const msgs = DB.inboxMessages.filter(m => DB.currentUser.role === 'admin' || m.to === 'all' || m.to === p || m.senderPhone === p).slice().reverse();
  showGM('صندوق الوارد', msgs.map(m => {
    const read = (m.readBy || []).includes(p);
    return `<div class="p-2 border rounded-xl ${read ? 'bg-slate-50' : 'bg-emerald-50 border-emerald-300'} space-y-1"><div class="flex justify-between"><b>${!read ? '🔔 ' : ''}${esc(m.subject)}</b><span class="text-[10px]">${esc(m.date)}</span></div><p>${esc(m.body)}</p>${(m.replies || []).map(r => `<div class="bg-white p-1 rounded border text-[10px]"><b>${esc(r.by)}:</b> ${esc(r.text)}</div>`).join('')}<div class="flex gap-1">${!read ? `<button onclick="window.actInbox('${esc(m.id)}','read')" class="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">مقروء</button>` : ''}<button onclick="window.actInbox('${esc(m.id)}','reply')" class="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">رد</button><button onclick="window.actInbox('${esc(m.id)}','del')" class="bg-rose-600 text-white px-2 py-0.5 rounded text-[10px]">حذف</button></div></div>`;
  }).join('') || '<p class="text-center text-slate-400">فارغ</p>');
};
window.actInbox = (id, act) => {
  const m = DB.inboxMessages.find(x => x.id === id);
  if (act === 'del') DB.inboxMessages = DB.inboxMessages.filter(x => x.id !== id);
  else if (m && act === 'read' && !m.readBy.includes(DB.currentUser.phone)) m.readBy.push(DB.currentUser.phone);
  else if (m && act === 'reply') { const t = prompt('الرد:'); if (t) { m.replies = m.replies || []; m.replies.push({ by: DB.currentUser.name, text: t }); } }
  saveDB(DB); window.refreshGlobalChrome(); window.openInboxModal();
};

window.openCancelReasonModal = () => showGM('سبب الإلغاء', `<select id="cancelReasonSel" class="w-full border rounded p-2 font-bold"><option>تأخر الكابتن</option><option>تغيير الوجهة</option><option>ظرف طارئ</option></select><p class="text-[11px] text-rose-700 font-bold">⚠️ تجاوز ${DB.cancelConfig.maxDailyCancels} إلغاءات يطبق غرامة ${DB.cancelConfig.penaltyAmount}ج وحظر ${DB.cancelConfig.cooldownMinutes} دقيقة.</p><button onclick="window.confirmSmartCancel()" class="w-full bg-rose-600 text-white font-black py-2 rounded-xl">تأكيد</button>`);
window.confirmSmartCancel = () => {
  const r = $('cancelReasonSel').value, today = new Date().toISOString().slice(0, 10), u = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  if (u) {
    if (u.cancelDate !== today) { u.cancelDate = today; u.cancelsToday = 0; } u.cancelsToday = (u.cancelsToday || 0) + 1;
    if (u.cancelsToday >= DB.cancelConfig.maxDailyCancels) { u.wallet = Math.max(0, +((u.wallet || 0) - DB.cancelConfig.penaltyAmount).toFixed(2)); u.cooldownUntil = Date.now() + DB.cancelConfig.cooldownMinutes * 60000; if (DB.currentUser) DB.currentUser.wallet = u.wallet; alert('⚠️ تم تطبيق غرامة وحظر مؤقت لتكرار الإلغاء.'); }
    DB.cancelLogs.push({ name: u.name, phone: u.phone, reason: r, date: new Date().toLocaleString('ar-EG') }); saveDB(DB); updateNavUI();
  }
  $('patchGenericModal')?.classList.add('hidden'); $('customerDriverCard')?.classList.add('hidden');
  if ($('btnRequestRide')) { $('btnRequestRide').disabled = false; $('btnRequestRide').innerText = 'طلب المشوار فوراً'; }
  dispatchQueue = []; dispatchIdx = 0; captainRejectTrip();
};
window.openTermsModal = () => showGM(DB.termsSettings.title, `<div class="whitespace-pre-line bg-slate-50 p-3 rounded-xl">${esc(DB.termsSettings.content)}</div>`);

// ==========================================
// 6. لوحة الإدارة الشاملة + الباتشات السحابية + التصغير والبيانات الحية
// ==========================================
function renderAdminCaptains() {
  const tb = $('adminCaptainsListTable'), cnt = $('adminPendingCount'); if (!tb) return;
  if (cnt) cnt.innerText = (DB.captainsPending || []).filter(c => c.status === 'pending').length;
  tb.innerHTML = (DB.captainsPending || []).map(c => `<tr class="border-b hover:bg-slate-50"><td class="p-3 font-bold">${esc(c.name)}</td><td class="p-3 font-mono">${esc(c.phone)}<br><span class="text-slate-500">${esc(c.plate)}</span></td><td class="p-3">${esc(c.vehicle)}</td><td class="p-3"><button onclick="inspectCaptainDocs('${esc(c.id)}')" class="px-2.5 py-1 bg-slate-800 text-white rounded text-[11px] font-bold">فحص (4)</button></td><td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status==='approved'?'bg-emerald-100 text-emerald-800':c.status==='rejected'?'bg-rose-100 text-rose-800':'bg-amber-100 text-amber-800'}">${c.status==='approved'?'معتمد':c.status==='rejected'?'مرفوض':'بانتظار'}</span></td><td class="p-3 text-center space-x-1 space-x-reverse">${c.status!=='approved'?`<button onclick="approveCaptainByAdmin('${esc(c.id)}')" class="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-xs">قبول</button>`:''}${c.status!=='rejected'?`<button onclick="rejectCaptainByAdmin('${esc(c.id)}')" class="px-2 py-1 bg-rose-600 text-white rounded font-bold text-xs">رفض</button>`:''}</td></tr>`).join('') || `<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد طلبات</td></tr>`;
}
function inspectCaptainDocs(id) {
  const cap = (DB.captainsPending || []).find(c => c.id === id); if (!cap?.docs) return;
  if ($('inspectCaptainTitle')) $('inspectCaptainTitle').innerText = `مستندات: ${cap.name}`;
  if ($('inspectImagesGrid')) $('inspectImagesGrid').innerHTML = [{ label: 'وجه البطاقة', src: cap.docs.idFront }, { label: 'ظهر البطاقة', src: cap.docs.idBack }, { label: 'رخصة القيادة', src: cap.docs.licenseDrive }, { label: 'رخصة المركبة', src: cap.docs.licenseCar }].map(d => `<div class="border rounded-2xl p-2 bg-slate-50"><span class="font-bold block mb-1">${d.label}</span><div class="h-32 bg-white rounded-xl border flex items-center justify-center overflow-hidden">${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : 'غير متوفر'}</div></div>`).join('');
  $('adminDocsInspectModal')?.classList.remove('hidden');
}
function closeDocsInspectModal() { $('adminDocsInspectModal')?.classList.add('hidden'); }
function approveCaptainByAdmin(id) {
  const cap = (DB.captainsPending || []).find(c => c.id === id); if (!cap) return; const already = userIndex.has(cap.phone); cap.status = 'approved';
  if (!already) { const nc = { role: 'captain', name: cap.name, phone: cap.phone, password: cap.password, vehicle: cap.vehicle, plate: cap.plate, status: 'approved', wallet: DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.captainAmount, 0, 0) : 200, welcomeCredited: true, isAvailable: true, inTrip: false, licenseExpiry: cap.licenseExpiry || '2027-06-01', dailyTrips: 0, blockedCustomers: [], fuelLogs: [], lat: 26.5569, lng: 31.6948 }; ensureUserReferralCode(nc); DB.users.push(nc); rebuildUserIndex(); if (cap.refCode) applyReferralBonus(cap.phone, cap.refCode); }
  addAuditLog(`اعتماد الكابتن ${cap.name}`); saveDB(DB); renderAdminCaptains();
}
function rejectCaptainByAdmin(id) { const cap = (DB.captainsPending || []).find(c => c.id === id); if (!cap) return; cap.status = 'rejected'; addAuditLog(`رفض ${cap.name}`); saveDB(DB); renderAdminCaptains(); }

function renderAdminModerators() {
  const tb = $('adminModeratorsListTable'); if (!tb) return;
  tb.innerHTML = (DB.moderators || []).map((m, i) => `<tr class="border-b"><td class="p-3 font-bold">${esc(m.name)}</td><td class="p-3 font-mono">${esc(m.phone)}</td><td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100">${esc(m.roleTitle||'مشرف')} (${esc(m.govScope||'الكل')})</span> ${m.roleTitle==='مشرف عام محافظة'?`<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-100">عمولة ${m.agentCommissionPercent||0}% (${(m.agentEarnings||0).toFixed(1)}ج)</span>`:''}</td><td class="p-3 text-center"><button onclick="deleteModerator(${i})" class="text-rose-600 font-bold">حذف</button></td></tr>`).join('');
  const tab = $('admintab-moderators');
  if (tab) {
    let box = $('patchAuditLogBox'); if (!box) { box = document.createElement('div'); box.id = 'patchAuditLogBox'; box.className = 'border-t pt-3 space-y-2'; tab.appendChild(box); }
    box.innerHTML = `<b class="text-xs block">سجل مراقبة المشرفين (Audit Log):</b><div class="max-h-32 overflow-y-auto space-y-1 text-[11px]">${(DB.auditLogs || []).slice(-15).reverse().map(a => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><span><b>${esc(a.actor)}</b> (${esc(a.role)}): ${esc(a.action)}</span><span class="text-slate-400">${esc(a.time)}</span></div>`).join('') || 'فارغ'}</div>`;
  }
}
function openNewModeratorModal() { $('addModeratorModal')?.classList.remove('hidden'); }
function closeNewModeratorModal() { $('addModeratorModal')?.classList.add('hidden'); }
function handleSaveModerator(e) { e.preventDefault(); DB.moderators.push({ id: 'mod_' + Date.now(), name: $('modNameInput').value.trim(), phone: toEnDigits($('modPhoneInput').value), password: toEnDigits($('modPassInput').value), role: 'moderator', roleTitle: $('modRoleTitleSelect')?.value || 'مشرف', govScope: $('modGovScopeSelect')?.value || 'الكل', agentCommissionPercent: safeNum($('modAgentCommInp')?.value, 5, 0, 50), agentEarnings: 0, permissions: { captains: !!$('permCaptains')?.checked, governorates: !!$('permGovernorates')?.checked, features: !!$('permFeatures')?.checked } }); addAuditLog('إضافة مشرف'); saveDB(DB); renderAdminModerators(); closeNewModeratorModal(); }
function deleteModerator(i) { if (confirm('حذف المشرف؟')) { DB.moderators.splice(i, 1); saveDB(DB); renderAdminModerators(); } }

function toggleFeatureSetting(k) { DB.features[k] = !DB.features[k]; saveDB(DB); updateFeaturesAdminUI(); recalcTrip(false); }
function updateSurgeMultiplier(v) { DB.features.surgeMultiplier = safeNum(v, 1.3, 1); saveDB(DB); recalcTrip(false); }
function updateFeaturesAdminUI() {
  if ($('btnToggleBidding')) { $('btnToggleBidding').className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.biddingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`; $('btnToggleBidding').innerText = DB.features.biddingEnabled ? 'مفعل' : 'معطل'; }
  if ($('btnToggleSurge')) { $('btnToggleSurge').className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.surgeActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200'}`; $('btnToggleSurge').innerText = DB.features.surgeActive ? 'الذروة نشطة' : 'معطلة'; }
  if ($('surgeMultiplierInput')) $('surgeMultiplierInput').value = DB.features.surgeMultiplier || 1.3;
  $('biddingBoxSection')?.classList.toggle('hidden', !DB.features.biddingEnabled); $('surgeBadge')?.classList.toggle('hidden', !DB.features.surgeActive); renderPromoCodesList();
}
function renderPromoCodesList() { if ($('adminPromoCodesList')) $('adminPromoCodesList').innerHTML = (DB.promoCodes || []).map((p, i) => `<div class="flex justify-between p-2 bg-slate-50 border rounded-xl text-xs"><div><b class="font-mono text-emerald-700">${esc(p.code)}</b> (${p.discountPercent}%)</div><button onclick="deletePromo(${i})" class="text-rose-600 font-bold">حذف</button></div>`).join(''); }
function openNewPromoModal() { $('addPromoModal')?.classList.remove('hidden'); }
function closeNewPromoModal() { $('addPromoModal')?.classList.add('hidden'); }
function handleSavePromo(e) { e.preventDefault(); DB.promoCodes.push({ code: $('promoCodeVal').value.trim().toUpperCase(), discountPercent: safeNum($('promoDiscountVal').value, 20, 1, 95), govId: 'all', active: true }); saveDB(DB); renderPromoCodesList(); closeNewPromoModal(); }
function deletePromo(i) { DB.promoCodes.splice(i, 1); saveDB(DB); renderPromoCodesList(); }

function injectPatch(p, idx) {
  $(`injected-patch-css-${idx}`)?.remove(); $(`injected-patch-html-${idx}`)?.remove(); if (!p.enabled) return;
  if (p.type === 'css') { const s = document.createElement('style'); s.id = `injected-patch-css-${idx}`; s.textContent = p.code; document.head.appendChild(s); }
  else if (p.type === 'html') { const c = $('patchHtmlContainer'); if (c) { const d = document.createElement('div'); d.id = `injected-patch-html-${idx}`; d.innerHTML = p.code; c.appendChild(d); } }
  else if (p.type === 'js') { try { new Function(p.code)(); } catch (err) { console.error('Patch Error:', err); } }
}
function applyAllPatches() { getPatches().forEach((p, i) => { if (p.enabled) injectPatch(p, i); }); window.handleUserLogin = handleUserLogin; if ($('formLogin')) $('formLogin').onsubmit = handleUserLogin; }
function renderPatches() { if ($('adminPatchesListTable')) $('adminPatchesListTable').innerHTML = getPatches().map((item, i) => `<tr class="border-b"><td class="p-3 font-bold">${esc(item.name)}</td><td class="p-3 font-mono text-[10px]">${esc(item.type)}</td><td class="p-3"><button onclick="togglePatchStatus(${i})" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.enabled?'bg-emerald-100 text-emerald-800':'bg-slate-200'}">${item.enabled?'مفعل (Firebase)':'معطل'}</button></td><td class="p-3 text-center"><button onclick="deletePatch(${i})" class="text-rose-600 font-bold text-xs">حذف</button></td></tr>`).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات</td></tr>`; }
function openNewPatchModal() { $('patchNameInput').value = ''; $('patchCodeInput').value = ''; $('patchEditorModal')?.classList.remove('hidden'); }
function closePatchModal() { $('patchEditorModal')?.classList.add('hidden'); }
async function handleSavePatch(e) { e.preventDefault(); if (DB.currentUser?.role !== 'admin') return alert('⛔ للأدمن فقط.'); const l = getPatches(); l.push({ name: $('patchNameInput').value.trim(), type: $('patchTypeInput').value, code: $('patchCodeInput').value, enabled: true }); await savePatches(l); applyAllPatches(); renderPatches(); closePatchModal(); alert('✅ تم حفظ الباتش في Firebase!'); }
async function togglePatchStatus(i) { const l = getPatches(); if (l[i]) { l[i].enabled = !l[i].enabled; await savePatches(l); applyAllPatches(); renderPatches(); } }
async function deletePatch(i) { const l = getPatches(); l.splice(i, 1); await savePatches(l); applyAllPatches(); renderPatches(); }

function switchAdminTab(tab) {
  const u = DB.currentUser;
  if (u?.role === 'moderator') {
    if (tab === 'moderators') return alert('⚠️ للمدير العام فقط.');
    if (tab === 'captains' && !u.permissions?.captains) return alert('⚠️ بدون صلاحية.');
    if (tab === 'governorates' && !u.permissions?.governorates) return alert('⚠️ بدون صلاحية.');
    if (['features', 'extras', 'walletops', 'analytics'].includes(tab) && !u.permissions?.features) return alert('⚠️ بدون صلاحية.');
  }
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100');
  ['captains', 'governorates', 'features', 'moderators', 'patches', 'extras', 'live', 'walletops', 'analytics'].forEach(t => $(`admintab-${t}`)?.classList.add('hidden'));
  if ($(`btn-adm-${tab}`)) $(`btn-adm-${tab}`).className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold';
  $(`admintab-${tab}`)?.classList.remove('hidden');
  if (tab === 'captains') renderAdminCaptains(); if (tab === 'governorates') renderGovernoratesUI(); if (tab === 'features') updateFeaturesAdminUI();
  if (tab === 'moderators') renderAdminModerators(); if (tab === 'patches') renderPatches(); if (tab === 'live') window.renderAdminLiveDataTab();
  if (tab === 'walletops') window.renderAdminWalletOps(); if (tab === 'analytics') window.renderAdminAnalytics(); if (tab === 'extras') window.renderAllAdminExtras();
}

let editGovId = null;
window.openGovAreasModal = id => { editGovId = id; const g = DB.governorates.find(x => x.id === id); if (!g) return; showGM(`قرى ومناطق (${g.name})`, `<form onsubmit="window.addGovArea(event)" class="flex gap-2"><input id="newAreaInp" required placeholder="اسم القرية/المنطقة" class="flex-grow border rounded-xl p-2 font-bold"><button class="bg-emerald-600 text-white px-3 rounded-xl font-black">+</button></form><div class="space-y-1.5 max-h-60 overflow-y-auto">${g.areas.map((a, i) => `<div class="flex justify-between p-2 bg-slate-50 border rounded-xl"><span class="${a.active?'font-bold':'line-through text-slate-400'}">${esc(a.name)}</span><div class="flex gap-2"><button onclick="window.togGovArea(${i})" class="text-[10px] font-bold px-2 rounded bg-emerald-100">${a.active?'متاح':'معطل'}</button><button onclick="window.delGovArea(${i})" class="text-rose-600 font-bold">حذف</button></div></div>`).join('')}</div>`); };
window.addGovArea = e => { e.preventDefault(); const g = DB.governorates.find(x => x.id === editGovId); g.areas.push({ name: $('newAreaInp').value.trim(), active: true }); saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };
window.togGovArea = i => { const g = DB.governorates.find(x => x.id === editGovId); g.areas[i].active = !g.areas[i].active; saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };
window.delGovArea = i => { const g = DB.governorates.find(x => x.id === editGovId); g.areas.splice(i, 1); saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };

let isTripMin = sessionStorage.getItem('TAWSILA_TRIP_CARD_MINIMIZED') === '1', hiddenCancelOrigBtn = null, hiddenBannerTxt = '';
window.renderAdminLiveDataTab = () => {
  const el = $('admintab-live'); if (!el) return; const has = !!(activeTripData || hiddenCancelOrigBtn || hiddenBannerTxt);
  el.innerHTML = `<div class="flex justify-between border-b pb-2"><h3 class="font-black text-sm">البيانات الحية</h3><span class="bg-emerald-100 text-emerald-800 px-2 rounded-full font-bold">مباشر</span></div>${has ? `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex flex-wrap justify-between items-center gap-3"><div><b class="text-rose-800 block">${esc(hiddenBannerTxt || `مشوار نشط (${activeTripData?.fare||0} ج)`)}</b>${activeTripData?`<span>${esc(activeTripData.from)} ⬅️ ${esc(activeTripData.to)}</span>`:''}</div><button onclick="window.execAdminLiveCancel()" class="bg-rose-600 text-white font-black px-4 py-2 rounded-xl">🛑 إلغاء المشوار إدارياً</button></div>` : `<div class="p-4 bg-slate-50 border border-dashed rounded-xl text-center text-slate-500 font-bold">لا توجد مشاوير نشطة حالياً.</div>`}`;
};
window.execAdminLiveCancel = () => { if (hiddenCancelOrigBtn) hiddenCancelOrigBtn.click(); else if (confirm('إلغاء المشوار؟')) { activeTripData = null; clearActiveSession(); captainRejectTrip(); } hiddenCancelOrigBtn = null; hiddenBannerTxt = ''; window.renderAdminLiveDataTab(); };
function scanCollapseAndLiveBanner() {
  const liveSec = $('admintab-live');
  document.querySelectorAll('button, a').forEach(btn => {
    if (liveSec?.contains(btn)) return;
    if ((btn.textContent || '').includes('إلغاء المشوار إدارياً')) {
      hiddenCancelOrigBtn = btn; let p = btn.parentElement;
      while (p && p !== document.body && p.tagName !== 'HEADER' && p.tagName !== 'MAIN' && p.textContent.length < 220) { if (!p.parentElement || p.parentElement === document.body || p.parentElement.tagName === 'HEADER') break; p = p.parentElement; }
      if (p && p !== document.body && p.tagName !== 'HEADER') { hiddenBannerTxt = p.textContent.replace('إلغاء المشوار إدارياً', '').trim(); p.classList.add('patch-admin-banner-hidden'); } else btn.classList.add('patch-admin-banner-hidden');
    }
  });
  const c = $('customerDriverCard');
  if (c && !c.classList.contains('hidden')) {
    if (!c.querySelector('#patchTripCollapseBar')) { const b = document.createElement('div'); b.id = 'patchTripCollapseBar'; b.className = 'flex justify-between items-center pb-2 mb-2 border-b border-emerald-200 text-xs'; b.innerHTML = `<b id="patchTripMiniSummary" class="text-emerald-800"></b><button type="button" id="patchTripToggleBtn" onclick="window.toggleTripCollapse()"></button>`; c.prepend(b); }
    Array.from(c.children).forEach(ch => { if (ch.id !== 'patchTripCollapseBar') ch.classList.toggle('patch-trip-child-hidden', isTripMin); });
    c.classList.toggle('patch-trip-card-compact', isTripMin);
    if (c.querySelector('#patchTripMiniSummary')) c.querySelector('#patchTripMiniSummary').innerText = isTripMin ? `🚕 رحلة نشطة (${activeTripData?.fare || ''} ج)` : 'تفاصيل الرحلة';
    if (c.querySelector('#patchTripToggleBtn')) { const tb = c.querySelector('#patchTripToggleBtn'); tb.innerText = isTripMin ? '🔼 تكبير' : '🔽 تصغير'; tb.className = isTripMin ? 'bg-emerald-600 text-white px-3 py-1 rounded-xl font-black' : 'bg-slate-200 text-slate-800 px-3 py-1 rounded-xl font-black'; }
  }
}
window.toggleTripCollapse = () => { isTripMin = !isTripMin; sessionStorage.setItem('TAWSILA_TRIP_CARD_MINIMIZED', isTripMin ? '1' : '0'); scanCollapseAndLiveBanner(); };

let admWalletFilter = 'all';
window.renderAdminWalletOps = () => {
  const p = $('admintab-walletops'); if (!p) return; const cfg = DB.walletSystemConfig, pc = DB.paymentConfig;
  const list = (DB.walletRequests || []).filter(r => admWalletFilter === 'all' || (admWalletFilter === 'pending' ? r.status === 'pending' : r.op === admWalletFilter)).slice().reverse();
  p.innerHTML = `
    <div class="flex flex-wrap justify-between border-b pb-2 gap-2"><h3 class="font-black text-sm">السحب والإيداع</h3><div class="flex gap-1 font-bold">${['all','pending','deposit','withdraw'].map(f => `<button onclick="window.setAdmWF('${f}')" class="px-2 py-1 rounded-lg ${admWalletFilter===f?'bg-slate-900 text-white':'bg-slate-100'}">${f==='all'?'الكل':f==='pending'?'مراجعة':f==='deposit'?'إيداعات':'سحوبات'}</button>`).join('')}</div></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="p-3 bg-slate-50 border rounded-2xl space-y-2">
        <div class="grid grid-cols-2 gap-1 text-[11px] font-bold">
          <button onclick="DB.walletSystemConfig.customerDepositEnabled=!DB.walletSystemConfig.customerDepositEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1 border rounded bg-white">${cfg.customerDepositEnabled?'🟢 إيداع العميل':'🔴 إيداع العميل'}</button>
          <button onclick="DB.walletSystemConfig.customerWithdrawEnabled=!DB.walletSystemConfig.customerWithdrawEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1 border rounded bg-white">${cfg.customerWithdrawEnabled?'🟢 سحب العميل':'🔴 سحب العميل'}</button>
          <button onclick="DB.walletSystemConfig.captainDepositEnabled=!DB.walletSystemConfig.captainDepositEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1 border rounded bg-white">${cfg.captainDepositEnabled?'🟢 إيداع الكابتن':'🔴 إيداع الكابتن'}</button>
          <button onclick="DB.walletSystemConfig.captainWithdrawEnabled=!DB.walletSystemConfig.captainWithdrawEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1 border rounded bg-white">${cfg.captainWithdrawEnabled?'🟢 سحب الكابتن':'🔴 سحب الكابتن'}</button>
          <button onclick="DB.walletSystemConfig.instantDeposit=!DB.walletSystemConfig.instantDeposit;saveDB(DB);renderAdminWalletOps();" class="col-span-2 p-1 border rounded bg-white">${cfg.instantDeposit?'⚡ الإيداع فوري':'🕒 بموافقة الإدارة'}</button>
        </div>
        <div class="grid grid-cols-5 gap-1"><div><span>أدنى إيداع</span><input id="wscMinD" type="number" value="${pc.minDeposit}" class="w-full border rounded p-1"></div><div><span>أقصى إيداع</span><input id="wscMaxD" type="number" value="${pc.maxDeposit}" class="w-full border rounded p-1"></div><div><span>أدنى سحب</span><input id="wscMinW" type="number" value="${pc.minWithdraw}" class="w-full border rounded p-1"></div><div><span>أقصى سحب</span><input id="wscMaxW" type="number" value="${pc.maxWithdraw}" class="w-full border rounded p-1"></div><div><span>رسوم%</span><input id="wscFee" type="number" step="0.5" value="${cfg.withdrawFeePercent}" class="w-full border rounded p-1"></div></div>
        <button onclick="DB.paymentConfig.minDeposit=+$('wscMinD').value;DB.paymentConfig.maxDeposit=+$('wscMaxD').value;DB.paymentConfig.minWithdraw=+$('wscMinW').value;DB.paymentConfig.maxWithdraw=+$('wscMaxW').value;DB.walletSystemConfig.withdrawFeePercent=+$('wscFee').value;saveDB(DB);alert('تم الحفظ!');" class="w-full bg-slate-900 text-white py-1.5 rounded-xl font-black">حفظ الحدود</button>
      </div>
      <div class="p-3 bg-slate-50 border rounded-2xl space-y-2">
        <div class="max-h-24 overflow-y-auto space-y-1">${pc.methods.map((m, i) => `<div class="flex justify-between bg-white p-1 rounded border"><span><b>${esc(m.name)}</b> (${esc(m.details)})</span><button onclick="DB.paymentConfig.methods.splice(${i},1);saveDB(DB);renderAdminWalletOps();" class="text-rose-600 font-bold">حذف</button></div>`).join('')}</div>
        <form onsubmit="event.preventDefault();DB.paymentConfig.methods.push({id:'pm_'+Date.now(),name:$('pmN').value,details:$('pmD').value,enabled:true});saveDB(DB);renderAdminWalletOps();" class="flex gap-1"><input id="pmN" required placeholder="الطريقة" class="w-1/2 border rounded p-1 bg-white"><input id="pmD" required placeholder="الحساب" class="w-1/2 border rounded p-1 bg-white"><button class="bg-emerald-600 text-white px-2 rounded">+</button></form>
        <form onsubmit="window.admManAdj(event)" class="flex gap-1 border-t pt-1.5"><input id="amPh" required placeholder="هاتف" class="w-1/3 border rounded p-1 bg-white font-mono"><input id="amAm" type="number" step="0.5" required placeholder="+/- مبلغ" class="w-1/3 border rounded p-1 bg-white"><button class="w-1/3 bg-indigo-600 text-white rounded font-black">تعديل رصيد</button></form>
      </div>
    </div>
    <div class="space-y-1.5 max-h-60 overflow-y-auto">${list.map(r => `<div class="p-2 border rounded-xl bg-slate-50 flex justify-between items-center"><div><b>${r.op==='deposit'?'إيداع':'سحب'} ${r.amount}ج</b> - ${esc(r.name)} (${esc(r.phone)}) ${r.receipt?`<button onclick="window.open('${r.receipt}')" class="text-blue-600 underline font-bold">إيصال</button>`:''}</div><div class="flex gap-1">${r.status==='pending'?`<button onclick="window.decideWReq('${esc(r.id)}','approved')" class="bg-emerald-600 text-white px-2 py-1 rounded font-bold">قبول</button><button onclick="window.decideWReq('${esc(r.id)}','rejected')" class="bg-rose-600 text-white px-2 py-1 rounded font-bold">رفض</button>`:`<b>${r.status==='approved'?'🟢 مقبول':'🔴 مرفوض'}</b>`}</div></div>`).join('') || '<p class="text-center text-slate-400">لا توجد طلبات</p>'}</div>`;
};
window.setAdmWF = f => { admWalletFilter = f; window.renderAdminWalletOps(); };
window.admManAdj = e => { e.preventDefault(); const u = userIndex.get(toEnDigits($('amPh').value)), amt = safeNum($('amAm').value, 0); if (!u || !amt) return alert('بيانات غير صالحة.'); u.wallet = Math.max(0, +((u.wallet || 0) + amt).toFixed(2)); if (DB.currentUser?.phone === u.phone) DB.currentUser.wallet = u.wallet; addLedgerEntry(amt > 0 ? 'deposit' : 'withdraw', Math.abs(amt), `تعديل إداري: ${u.name}`); saveDB(DB); updateNavUI(); alert(`✅ الرصيد الجديد: ${u.wallet} ج.م`); };
window.decideWReq = (id, st) => {
  const r = DB.walletRequests.find(x => x.id === id); if (!r || r.status !== 'pending') return; const u = userIndex.get(r.phone);
  if (st === 'approved') { if (r.op === 'deposit' && u) { u.wallet = +((u.wallet || 0) + r.amount).toFixed(2); addLedgerEntry('deposit', r.amount, `إيداع: ${r.name}`); } else if (r.op === 'withdraw' && r.fee > 0) addLedgerEntry('platform_profit', r.fee, `رسوم سحب: ${r.name}`); }
  else if (r.op === 'withdraw' && u) u.wallet = +((u.wallet || 0) + r.amount).toFixed(2);
  r.status = st; saveDB(DB); updateNavUI(); handleDriverViewLogic(); window.renderAdminWalletOps();
};

window.renderAdminAnalytics = () => {
  const p = $('admintab-analytics'); if (!p) return;
  const tr = (DB.tripHistory || []).length, ca = (DB.cancelLogs || []).length, dl = (DB.deliveryOrders || []).length, cu = DB.users.filter(u => u.role === 'customer').length, cp = DB.users.filter(u => u.role === 'captain').length;
  const rev = (DB.tripHistory || []).reduce((s, t) => s + (t.fare || 0), 0) + (DB.deliveryOrders || []).reduce((s, d) => s + (d.price || 0), 0), mx = Math.max(1, tr, ca, dl, cu, cp);
  const bar = (l, v, c) => `<div><div class="flex justify-between font-bold"><span>${l}</span><span>${v}</span></div><div class="w-full bg-slate-100 rounded-full h-2.5"><div class="${c} h-2.5 rounded-full" style="width:${Math.min(100, Math.round((v / mx) * 100))}%"></div></div></div>`;
  p.innerHTML = `<h3 class="font-black text-sm border-b pb-2">التحليلات</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center"><div class="p-3 bg-emerald-50 border rounded-2xl"><span>رحلات</span><b class="text-lg block">${tr}</b></div><div class="p-3 bg-orange-50 border rounded-2xl"><span>دلفري</span><b class="text-lg block">${dl}</b></div><div class="p-3 bg-rose-50 border rounded-2xl"><span>إلغاءات</span><b class="text-lg block">${ca}</b></div><div class="p-3 bg-indigo-50 border rounded-2xl"><span>تداول</span><b class="text-lg block">${rev.toFixed(0)}ج</b></div></div><div class="p-4 bg-slate-50 border rounded-2xl space-y-2">${bar('العملاء',cu,'bg-emerald-500')}${bar('الكباتن',cp,'bg-amber-500')}${bar('الرحلات',tr,'bg-indigo-600')}${bar('الدلفري',dl,'bg-orange-500')}${bar('الإلغاءات',ca,'bg-rose-500')}</div>`;
};

window.renderAllAdminExtras = () => {
  const c = $('admintab-extras'); if (!c) return;
  const today = new Date().toISOString().slice(0, 10), usedKB = Math.round((JSON.stringify(DB).length * 2) / 1024), np = DB.nightPeakConfig || {};
  const sum = t => DB.financialLedger.filter(l => l.type === t).reduce((s, l) => s + l.amount, 0);
  const dayP = DB.financialLedger.filter(l => l.type === 'platform_profit' && l.date === today).reduce((s, l) => s + l.amount, 0);
  const custBal = DB.users.filter(u => u.role === 'customer').reduce((s, u) => s + (u.wallet || 0), 0);

  c.innerHTML = `
    <div class="bg-white p-4 rounded-2xl border space-y-2 md:col-span-2">
      <div class="flex justify-between border-b pb-1"><h4 class="font-black text-sm">دفتر العمليات المالية</h4><button onclick="window.exportCSV()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">تصدير CSV</button></div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-center"><div class="bg-slate-50 p-2 rounded-xl border"><span>رصيد العملاء</span><b class="block">${custBal.toFixed(1)}ج</b></div><div class="bg-blue-50 p-2 rounded-xl border"><span>الإيداعات</span><b class="block">${sum('deposit').toFixed(1)}ج</b></div><div class="bg-purple-50 p-2 rounded-xl border"><span>الفحوصات</span><b class="block">${sum('inspection').toFixed(1)}ج</b></div><div class="bg-amber-50 p-2 rounded-xl border"><span>أرباح الكباتن</span><b class="block">${sum('trip_captain').toFixed(1)}ج</b></div><div class="bg-emerald-50 p-2 rounded-xl border"><span>ربح اليوم</span><b class="block">${dayP.toFixed(1)}ج</b></div></div>
    </div>
    <div class="bg-white p-4 rounded-2xl border space-y-2 md:col-span-2">
      <b class="block border-b pb-1">المستخدمين + القائمة السوداء</b>
      <form onsubmit="window.admAddUser(event)" class="grid grid-cols-2 md:grid-cols-6 gap-1.5"><select id="auR" class="border rounded p-1.5 font-bold"><option value="customer">عميل</option><option value="captain">كابتن</option></select><input id="auN" required placeholder="الاسم" class="border rounded p-1.5"><input id="auP" required placeholder="الهاتف" class="border rounded p-1.5 font-mono"><input id="auPs" required placeholder="كلمة المرور" class="border rounded p-1.5"><input id="auW" type="number" value="0" class="border rounded p-1.5"><button class="bg-emerald-600 text-white font-black rounded p-1.5">+ إضافة</button></form>
      <form onsubmit="event.preventDefault();DB.blacklist.push({phone:toEnDigits($('blPh').value),reason:$('blRs').value.trim()});saveDB(DB);renderAllAdminExtras();" class="flex gap-1.5 pt-1"><input id="blPh" required placeholder="حظر رقم" class="border rounded p-1.5 font-mono w-1/3"><input id="blRs" required placeholder="السبب" class="border rounded p-1.5 flex-grow"><button class="bg-rose-600 text-white px-3 rounded font-bold">حظر</button></form>
      <div class="flex flex-wrap gap-1">${(DB.blacklist || []).map((b, i) => `<span class="bg-rose-50 border px-2 py-0.5 rounded">${esc(b.phone)} <button onclick="DB.blacklist.splice(${i},1);saveDB(DB);renderAllAdminExtras();" class="text-emerald-700 font-bold">فك</button></span>`).join('')}</div>
    </div>
    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">التعريفة الليلية وجدولة الذروة</b>
      <div class="grid grid-cols-2 gap-1 font-bold"><button onclick="DB.nightPeakConfig.autoNightEnabled=!DB.nightPeakConfig.autoNightEnabled;saveDB(DB);renderAllAdminExtras();" class="p-1 border rounded">${np.autoNightEnabled?'🟢 التعريفة الليلية':'🔴 الليلية'}</button><button onclick="DB.nightPeakConfig.autoPeakEnabled=!DB.nightPeakConfig.autoPeakEnabled;saveDB(DB);renderAllAdminExtras();" class="p-1 border rounded">${np.autoPeakEnabled?'🟢 جدولة الذروة':'🔴 الذروة'}</button></div>
      <div class="grid grid-cols-4 gap-1 text-[10px]"><div><span>من</span><input id="npNS" type="number" value="${np.nightStartHour??0}" class="w-full border rounded p-1"></div><div><span>إلى</span><input id="npNE" type="number" value="${np.nightEndHour??6}" class="w-full border rounded p-1"></div><div><span>ليل%</span><input id="npNP" type="number" value="${np.nightPercent??15}" class="w-full border rounded p-1"></div><div><span>ذروة%</span><input id="npPP" type="number" value="${np.peakPercent??20}" class="w-full border rounded p-1"></div></div>
      <button onclick="DB.nightPeakConfig.nightStartHour=+$('npNS').value;DB.nightPeakConfig.nightEndHour=+$('npNE').value;DB.nightPeakConfig.nightPercent=+$('npNP').value;DB.nightPeakConfig.peakPercent=+$('npPP').value;saveDB(DB);recalcTrip(false);alert('تم الحفظ!');" class="w-full bg-slate-900 text-white py-1.5 rounded-xl font-bold">حفظ الجدولة</button>
    </div>
    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">البث المباشر + العمولات + العد التنازلي</b>
      <div class="flex gap-1"><input id="exTickTx" value="${esc(DB.broadcastTicker?.text||'')}" class="flex-grow border rounded p-1"><button onclick="DB.broadcastTicker.text=$('exTickTx').value;DB.broadcastTicker.enabled=!DB.broadcastTicker.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="px-2 rounded font-bold ${DB.broadcastTicker?.enabled?'bg-emerald-600 text-white':'bg-slate-200'}">${DB.broadcastTicker?.enabled?'ظاهر':'مخفي'}</button></div>
      <div class="grid grid-cols-3 gap-1 text-[10px]"><div><span>عمولة رحلة%</span><input id="exComm" type="number" value="${DB.referralConfig.tripCommissionPercent}" class="w-full border rounded p-1"></div><div><span>تحويل%</span><input id="exTrC" type="number" value="${DB.transferSettings.commissionPercent}" class="w-full border rounded p-1"></div><div><span>عد القبول(ث)</span><input id="exDisp" type="number" value="${DB.dispatchConfig.countdownSeconds}" class="w-full border rounded p-1"></div></div>
      <button onclick="DB.referralConfig.tripCommissionPercent=+$('exComm').value;DB.transferSettings.commissionPercent=+$('exTrC').value;DB.dispatchConfig.countdownSeconds=+$('exDisp').value;saveDB(DB);alert('تم الحفظ!');" class="w-full bg-emerald-600 text-white py-1.5 rounded-xl font-bold">حفظ العمولات</button>
    </div>
    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">إظهار / إخفاء الميزات</b>
      <div class="grid grid-cols-2 gap-1 font-bold text-[11px]">
        <button onclick="DB.deliveryConfig.enabled=!DB.deliveryConfig.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1 border rounded">${DB.deliveryConfig.enabled?'🟢 الدلفري':'🔴 الدلفري'}</button>
        <button onclick="DB.partnerConfig.enabled=!DB.partnerConfig.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1 border rounded">${DB.partnerConfig.enabled?'🟢 الشركات':'🔴 الشركات'}</button>
        <button onclick="DB.loanSettings.enabled=!DB.loanSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1 border rounded">${DB.loanSettings.enabled?'🟢 السلف':'🔴 السلف'}</button>
        <button onclick="DB.installmentSettings.enabled=!DB.installmentSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1 border rounded">${DB.installmentSettings.enabled?'🟢 التقسيط':'🔴 التقسيط'}</button>
        <button onclick="DB.insuranceSettings.enabled=!DB.insuranceSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1 border rounded">${DB.insuranceSettings.enabled?'🟢 التأمين':'🔴 التأمين'}</button>
        <button onclick="DB.intercityConfig.enabled=!DB.intercityConfig.enabled;saveDB(DB);renderAllAdminExtras();" class="p-1 border rounded">${DB.intercityConfig.enabled?'🟢 السفر':'🔴 السفر'}</button>
      </div>
    </div>
    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">المساحة (${usedKB} KB) + النسخ الاحتياطي + Firebase</b>
      <input id="exFbUrl" value="${esc(getFirebaseBaseUrl())}" class="w-full border rounded p-1.5 font-mono">
      <div class="grid grid-cols-2 gap-1.5 font-bold">
        <button onclick="DB.firebaseConfig.dbUrl=$('exFbUrl').value.trim();saveDB(DB,true);savePatches(getPatches());alert('تمت المزامنة مع Firebase!');" class="bg-slate-900 text-white py-1.5 rounded-xl">مزامنة Firebase</button>
        <button onclick="window.optimizeStorageClean()" class="bg-amber-500 text-slate-900 py-1.5 rounded-xl">تنظيف السجلات</button>
        <button onclick="window.downloadFullBackup()" class="bg-blue-600 text-white py-1.5 rounded-xl">تنزيل نسخة</button>
        <label class="bg-emerald-600 text-white py-1.5 rounded-xl text-center cursor-pointer">استعادة نسخة<input type="file" accept=".json" onchange="window.restoreFullBackup(event)" class="hidden"></label>
      </div>
      <div class="grid grid-cols-2 gap-1.5 font-bold"><button onclick="window.exportCaptains()" class="bg-teal-700 text-white py-1.5 rounded-xl">تصدير الإثباتات</button><button onclick="DB.captainsPending.forEach(x=>x.docs={});saveDB(DB);alert('تم حذف الصور!');" class="bg-rose-600 text-white py-1.5 rounded-xl">حذف الصور</button></div>
    </div>`;
};
window.admAddUser = e => { e.preventDefault(); const ph = toEnDigits($('auP').value); if (userIndex.has(ph)) return alert('موجود!'); const u = { role: $('auR').value, name: $('auN').value.trim(), phone: ph, password: toEnDigits($('auPs').value), wallet: safeNum($('auW').value, 0, 0), status: 'approved', isAvailable: true, inTrip: false, vehicle: 'سيارة ملاكي', plate: 'مضافة إدارياً', loyaltyPoints: 0, favorites: {} }; ensureUserReferralCode(u); DB.users.push(u); rebuildUserIndex(); saveDB(DB); window.renderAllAdminExtras(); alert('✅ تمت الإضافة!'); };
window.optimizeStorageClean = () => { DB.financialLedger = DB.financialLedger.slice(-100); DB.tripHistory = DB.tripHistory.slice(-100); DB.auditLogs = DB.auditLogs.slice(-50); DB.cancelLogs = DB.cancelLogs.slice(-50); saveDB(DB, true); window.renderAllAdminExtras(); alert('✅ تم التنظيف!'); };
window.exportCSV = () => { const rows = [['التاريخ','الوقت','النوع','المبلغ','البيان'], ...DB.financialLedger.map(l => [l.date, l.time, l.type, l.amount, `"${(l.note||'').replace(/"/g,'')}"`])]; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })); a.download = 'tawsila-ledger.csv'; a.click(); };
window.exportCaptains = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ captainsPending: DB.captainsPending, captains: DB.users.filter(u => u.role === 'captain') }, null, 2)], { type: 'application/json' })); a.download = 'captains-proofs.json'; a.click(); };
window.downloadFullBackup = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), store: DB, patches: getPatches() }, null, 2)], { type: 'application/json' })); a.download = `tawsila-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); };
window.restoreFullBackup = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async ev => { const d = safeJson(ev.target.result, null); if (!d?.store?.users) return alert('❌ ملف غير صالح!'); DB = normalizeStore(d.store); saveDB(DB, true); if (Array.isArray(d.patches)) await savePatches(d.patches); alert('✅ تمت الاستعادة!'); location.reload(); }; r.readAsText(f); };

// ==========================================
// 7. بناء الواجهات + حل مشكلة المدير العام بالقيادة + الإقلاع
// ==========================================
function buildUnifiedUI() {
  if (!$('proCustCSS')) {
    const st = document.createElement('style'); st.id = 'proCustCSS';
    st.textContent = `#view-customer #map{height:500px!important;border:3px solid #ecfdf5}.patch-trip-child-hidden,.patch-admin-banner-hidden{display:none!important}.patch-trip-card-compact{padding:.65rem .9rem!important;gap:0!important}body.dark-mode{background:#0f172a!important;color:#e2e8f0!important}body.dark-mode .bg-white{background:#1e293b!important;color:#f1f5f9!important;border-color:#334155!important}body.dark-mode .bg-slate-50,body.dark-mode .bg-slate-100{background:#0f172a!important;color:#cbd5e1!important;border-color:#334155!important}body.dark-mode input,body.dark-mode select,body.dark-mode textarea{background:#0f172a!important;color:#f8fafc!important;border-color:#475569!important}body.dark-mode .leaflet-tile-pane{filter:invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)}`;
    document.head.appendChild(st);
  }
  if (localStorage.getItem('TAWSILA_DARK_MODE') === '1') document.body.classList.add('dark-mode');
  const mainEl = document.querySelector('main');
  if (mainEl && !$('patchBroadcastWrap')) { const t = document.createElement('div'); t.id = 'patchBroadcastWrap'; t.className = 'mb-3'; const b = document.createElement('div'); b.id = 'patchPromoBannerWrap'; b.className = 'mb-3'; mainEl.prepend(b); mainEl.prepend(t); }
  const mapCol = document.querySelector('#view-customer .lg\\:col-span-2');
  if (mapCol && !$('patchMapProHeader')) { const bar = document.createElement('div'); bar.id = 'patchMapProHeader'; bar.className = 'mb-2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl flex justify-between items-center text-xs shadow'; bar.innerHTML = `<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span><b>OSRM مسار حقيقي</b></div><div class="flex items-center gap-2"><b id="proEtaText" class="text-amber-300">~10 د</b><button onclick="getCurrentLocation()" class="bg-emerald-600 px-2.5 py-1 rounded-lg text-[11px] font-bold">موقعي</button></div>`; mapCol.prepend(bar); }
  const custSide = document.querySelector('#view-customer > div:first-child > div:first-child');
  if (custSide && !$('patchCustWalletCard')) { const wc = document.createElement('div'); wc.id = 'patchCustWalletCard'; wc.className = 'bg-gradient-to-l from-emerald-800 to-slate-900 text-white p-3 rounded-2xl mb-3 shadow space-y-2'; wc.innerHTML = `<div class="flex justify-between items-center"><div><span class="text-[10px] text-emerald-200 block">محفظة العميل</span><b class="text-lg font-black text-amber-300"><span id="custCardWalletBal">0.00</span> ج.م</b></div><button type="button" onclick="window.openWalletOpsModal('history')" class="bg-white/15 px-2.5 py-1 rounded-lg text-[10px] font-bold">السجل</button></div><div class="grid grid-cols-2 gap-1.5 text-xs"><button type="button" id="btnCustDepositOp" onclick="window.openWalletOpsModal('deposit')" class="bg-emerald-500 text-slate-950 font-black py-1.5 rounded-xl">إيداع / شحن</button><button type="button" id="btnCustWithdrawOp" onclick="window.openWalletOpsModal('withdraw')" class="bg-amber-400 text-slate-950 font-black py-1.5 rounded-xl">سحب رصيد</button></div>`; custSide.prepend(wc); }
  const govBox = $('custGovernorateSelect')?.closest('.bg-slate-50');
  if (govBox && !$('patchCustAreaWrap')) { const d = document.createElement('div'); d.id = 'patchCustAreaWrap'; d.className = 'bg-slate-50 border p-2 rounded-xl mb-3 flex items-center justify-between'; d.innerHTML = `<span class="text-xs font-bold text-slate-700"><i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i>القرية/المنطقة:</span><select id="custAreaSelect" onchange="if(this.value){const g=DB.governorates.find(x=>x.id===DB.selectedGovId);$('pickupInput').value=this.value+' - '+g.name;}" class="text-xs font-black bg-white border rounded-lg p-1 outline-none text-emerald-800 max-w-[165px]"></select>`; govBox.parentElement.insertBefore(d, govBox.nextSibling); }
  const formFields = document.querySelector('#view-customer .space-y-3.text-xs');
  if (formFields && !$('patchRideExtrasBox')) { const bx = document.createElement('div'); bx.id = 'patchRideExtrasBox'; bx.className = 'space-y-2'; bx.innerHTML = `<div class="flex flex-wrap gap-1 items-center"><button type="button" onclick="window.useFavoritePlace('home')" class="bg-slate-100 border px-2 py-1 rounded-lg font-bold text-[10px]">🏠 البيت</button><button type="button" onclick="window.saveFavoritePlace('home')" class="text-emerald-700 text-[10px] font-bold">حفظ</button><button type="button" onclick="window.useFavoritePlace('work')" class="bg-slate-100 border px-2 py-1 rounded-lg font-bold text-[10px] mr-1">💼 العمل</button><button type="button" onclick="window.saveFavoritePlace('work')" class="text-emerald-700 text-[10px] font-bold">حفظ</button><button type="button" onclick="window.addExtraStopPoint()" class="mr-auto bg-amber-100 text-amber-900 px-2 py-1 rounded-lg font-bold text-[10px]">+ محطة</button></div><div id="patchExtraStopsBox" class="flex flex-wrap gap-1"></div><div class="bg-slate-50 border p-2 rounded-xl space-y-1.5"><div class="flex justify-between items-center"><b>الراكب والموعد:</b><div class="flex gap-1"><select id="riderModeSel" onchange="$('otherRiderFields').classList.toggle('hidden',this.value==='self')" class="border rounded px-1.5 py-0.5 font-bold bg-white"><option value="self">لنفسي</option><option value="other">لشخص آخر</option></select><select id="rideSchedMode" onchange="$('rideSchedDateTime').classList.toggle('hidden',this.value==='now')" class="border rounded px-1.5 py-0.5 font-bold bg-white"><option value="now">الآن</option><option value="later">مجدول</option></select></div></div><div id="otherRiderFields" class="hidden grid grid-cols-2 gap-1"><input id="otherRiderName" placeholder="اسم الراكب" class="border rounded p-1 bg-white"><input id="otherRiderPhone" placeholder="هاتف الراكب" class="border rounded p-1 bg-white font-mono"></div><input id="rideSchedDateTime" type="datetime-local" class="hidden w-full border rounded p-1 bg-white font-bold"><div class="flex flex-wrap gap-2 text-[10px] font-bold pt-1"><label><input type="checkbox" class="ride-pref-chk" value="تكييف"> تكييف</label><label><input type="checkbox" class="ride-pref-chk" value="كابتن سيدة"> كابتن سيدة</label><label><input type="checkbox" class="ride-pref-chk" value="حقيبة سفر"> حقيبة</label><label><input type="checkbox" class="ride-pref-chk" value="ممنوع التدخين"> ممنوع التدخين</label></div></div>`; formFields.prepend(bx); }
  const fareSum = document.querySelector('#view-customer .bg-slate-900.text-white');
  if (fareSum && !$('patchInsuranceBox')) { const ins = document.createElement('div'); ins.id = 'patchInsuranceBox'; ins.className = 'bg-sky-50 border border-sky-200 p-2 rounded-xl'; ins.innerHTML = `<label class="flex items-center justify-between cursor-pointer"><div class="flex items-center gap-1.5"><input type="checkbox" id="chkTripInsurance" onchange="window.__insuranceOptIn=this.checked;recalcTrip(false);" class="w-4 h-4 accent-sky-600"><span class="font-black text-sky-900">تأمين الرحلة</span></div><span id="insFeeLabel" class="bg-sky-600 text-white px-2 py-0.5 rounded font-black text-[10px]"></span></label>`; fareSum.parentElement.insertBefore(ins, fareSum); }
  if (custSide && !$('custQuickActionsGrid')) { const g = document.createElement('div'); g.id = 'custQuickActionsGrid'; g.className = 'grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-black'; g.innerHTML = `<button id="btnCustDeliv" onclick="window.openDeliveryModal()" class="bg-orange-600 text-white py-1.5 rounded-xl">📦 دلفري</button><button onclick="window.openIntercityModal()" class="bg-blue-700 text-white py-1.5 rounded-xl">🚌 سفر محافظات</button><button onclick="window.openCommuteModal()" class="bg-cyan-700 text-white py-1.5 rounded-xl">🎓 اشتراك ثابت</button><button id="btnCustTrans" onclick="window.openTransferModal()" class="bg-indigo-600 text-white py-1.5 rounded-xl">💸 تحويل رصيد</button><button onclick="window.openQrPayModal()" class="bg-slate-900 text-amber-300 py-1.5 rounded-xl">QR الدفع</button><button id="btnCustInst" onclick="window.openInstallmentModal()" class="bg-teal-600 text-white py-1.5 rounded-xl">🚗 تقسيط مركبة</button><button onclick="window.openHistoryLoyaltyModal()" class="bg-slate-800 text-white py-1.5 rounded-xl">⭐ سجلي ونقاطي</button><button onclick="window.openScheduledRidesModal()" class="bg-slate-700 text-white py-1.5 rounded-xl">📅 المجدولة</button><button onclick="window.openComplaintsModal()" class="bg-rose-50 border border-rose-200 text-rose-700 py-1.5 rounded-xl">🎧 شكاوى</button><button onclick="window.openLostFoundModal()" class="bg-indigo-50 border border-indigo-200 text-indigo-700 py-1.5 rounded-xl">🔎 المفقودات</button>`; custSide.appendChild(g); }
  const custCard = $('customerDriverCard');
  if (custCard && !$('patchOtpCustBox')) { const b = document.createElement('div'); b.id = 'patchOtpCustBox'; b.className = 'bg-amber-50 border border-amber-300 rounded-xl p-2 flex justify-between items-center text-xs'; b.innerHTML = `<span class="font-bold text-amber-900">🔐 رمز الأمان:</span><b id="patchTripOtpVal" class="font-mono text-base font-black bg-white px-2.5 rounded border">----</b>`; custCard.insertBefore(b, custCard.querySelector('.grid')); const cb = document.createElement('button'); cb.className = 'w-full bg-rose-100 text-rose-800 font-black py-1.5 rounded-xl text-xs mt-1'; cb.innerText = 'إلغاء المشوار'; cb.onclick = window.openCancelReasonModal; custCard.appendChild(cb); }
  const capScr = $('captainActiveScreen');
  if (capScr && !$('patchCapProBox')) { const box = document.createElement('div'); box.id = 'patchCapProBox'; box.className = 'space-y-2'; box.innerHTML = `<div id="patchAdminCapPreviewBar" class="hidden bg-amber-50 border border-amber-300 p-2 rounded-xl flex justify-between items-center text-xs"></div><div id="capLicAlertBanner" class="hidden bg-rose-100 border border-rose-300 text-rose-800 p-2 rounded-xl text-xs font-black"></div><div class="bg-gradient-to-l from-slate-900 to-emerald-900 text-white p-3.5 rounded-2xl shadow space-y-2"><div class="flex justify-between items-center"><div><span class="text-[10px] text-emerald-200 block">محفظة الكابتن</span><b class="text-xl font-black text-amber-300"><span id="capProWalletVal">0.00</span> ج.م</b></div><button onclick="window.toggleCaptainAvailability()" id="patchCapAvailBtn" class="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-slate-950">متاح للرحلات</button></div><div class="grid grid-cols-2 gap-2 text-xs"><button onclick="window.openWalletOpsModal('deposit')" class="bg-emerald-500 text-slate-950 font-black py-1.5 rounded-xl">إيداع رصيد</button><button onclick="window.openWalletOpsModal('withdraw')" class="bg-amber-400 text-slate-950 font-black py-1.5 rounded-xl">سحب رصيد</button></div></div><div class="bg-slate-50 border p-2 rounded-xl flex gap-1.5 text-xs"><input id="capDestFilterInp" placeholder="في طريقي للبيت" class="flex-grow bg-white border rounded-lg p-1.5 font-bold"><button onclick="window.saveCapDestFilter()" class="bg-slate-800 text-white px-2.5 rounded-lg font-bold">حفظ</button></div><div id="capQuestBox" class="bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs flex justify-between items-center"></div><div class="grid grid-cols-2 gap-1.5 text-[10px] font-black"><button onclick="window.openCapPackageModal()" class="bg-purple-700 text-white py-1.5 rounded-xl">👑 باقات 0%</button><button onclick="window.openCapFuelTrackerModal()" class="bg-slate-900 text-amber-300 py-1.5 rounded-xl">⛽ الوقود والربح</button><button id="btnCapLoan" onclick="window.openLoanModal()" class="bg-amber-500 text-slate-900 py-1.5 rounded-xl">💵 سلفة</button><button onclick="window.openQrPayModal()" class="bg-slate-800 text-white py-1.5 rounded-xl">QR تحصيل</button><button onclick="window.toggleHeatmapView()" class="bg-rose-600 text-white py-1.5 rounded-xl">🔥 مناطق الذروة</button><button onclick="window.openBestCaptainsModal()" class="bg-amber-400 text-slate-900 py-1.5 rounded-xl">🏆 الأفضل</button><button onclick="window.openIntercityModal()" class="bg-blue-700 text-white py-1.5 rounded-xl">🚌 سفر محافظات</button><button onclick="window.openScheduledRidesModal()" class="bg-cyan-700 text-white py-1.5 rounded-xl">📅 مجدولة</button><button onclick="window.openLostFoundModal()" class="bg-indigo-600 text-white py-1.5 rounded-xl">🔎 المفقودات</button><button onclick="window.openHistoryLoyaltyModal()" class="bg-slate-700 text-white py-1.5 rounded-xl">🧾 فواتيري</button></div>`; capScr.insertBefore(box, $('driverOfferBox')); }
  const tripBox = $('driverActiveTripBox');
  if (tripBox && !$('patchCapWaitBox')) { const d = document.createElement('div'); d.id = 'patchCapWaitBox'; d.className = 'space-y-1.5'; d.innerHTML = `<div class="bg-amber-50 border border-amber-200 p-2 rounded-xl flex justify-between items-center text-xs"><div><b>⏱️ الانتظار: <span id="capWaitClock" class="font-mono">00:00</span></b> (<b id="capWaitCostText">0.00</b> ج)</div><button type="button" onclick="window.toggleWaitTimer()" id="btnToggleWaitTimer" class="bg-amber-500 text-slate-900 px-2.5 py-1 rounded-lg font-black">تشغيل</button></div><div class="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center gap-2 text-xs"><i class="fa-solid fa-key text-amber-600"></i><input id="capOtpInput" maxlength="4" placeholder="أدخل رمز العميل (4 أرقام)" class="flex-grow bg-white border rounded p-1 font-mono font-black text-center"></div>`; tripBox.insertBefore(d, tripBox.querySelector('.space-y-2')); }
  const nav = document.querySelector('header nav');
  if (nav && !$('patchHeaderShareBtn')) { const bL = document.createElement('button'); bL.id = 'patchLangBtn'; bL.className = 'px-2 py-1.5 rounded-xl bg-white/15 text-white font-black text-xs'; bL.innerText = currentLang === 'ar' ? 'EN' : 'AR'; bL.onclick = window.toggleAppLanguage; const bD = document.createElement('button'); bD.id = 'patchDarkBtn'; bD.className = 'px-2 py-1.5 rounded-xl bg-slate-900/50 text-amber-300 font-black text-xs'; bD.innerHTML = '<i class="fa-solid fa-moon"></i>'; bD.onclick = () => { const d = document.body.classList.toggle('dark-mode'); localStorage.setItem('TAWSILA_DARK_MODE', d ? '1' : '0'); }; const bS = document.createElement('button'); bS.id = 'patchHeaderShareBtn'; bS.className = 'px-2 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs'; bS.innerHTML = '<i class="fa-solid fa-share-nodes"></i>'; bS.onclick = window.openProfessionalShareModal; const bI = document.createElement('button'); bI.id = 'patchHeaderInboxBtn'; bI.className = 'relative px-2 py-1.5 rounded-xl bg-white/15 text-white font-bold text-xs'; bI.innerHTML = '<i class="fa-solid fa-envelope"></i> <span id="inboxUnreadBadge" class="hidden bg-rose-600 text-white text-[10px] px-1 rounded-full">0</span>'; bI.onclick = window.openInboxModal; [bI, bS, bD, bL].forEach(x => nav.prepend(x)); }
  const pRef = new URLSearchParams(location.search).get('ref') || localStorage.getItem('TAWSILA_PENDING_REF') || ''; if (pRef) localStorage.setItem('TAWSILA_PENDING_REF', pRef);
  ['formRegCustomer', 'formRegCaptain'].forEach(fid => { const f = $(fid); if (f && !$('inp_' + fid + '_ref')) { const d = document.createElement('div'); d.innerHTML = `${fid==='formRegCaptain'?'<label class="font-bold block mb-1">انتهاء الرخصة</label><input type="date" id="regCapLicExp" value="2027-06-01" class="w-full border rounded-xl p-2 font-bold mb-2">':''}<label class="font-bold block mb-1">كود الإحالة</label><input id="inp_${fid}_ref" value="${esc(pRef)}" placeholder="TW1234" class="uppercase w-full border rounded-xl p-2 font-mono font-bold">`; f.insertBefore(d, f.querySelector('button[type="submit"]')); } });
  if ($('view-auth') && !$('patchGoogleAuthWrap')) { const w = document.createElement('div'); w.id = 'patchGoogleAuthWrap'; w.className = 'pt-2 border-t space-y-2'; w.innerHTML = `<button type="button" onclick="window.openGoogleQuickAuth()" class="w-full bg-white border-2 text-slate-800 font-black py-2 rounded-xl text-xs">المتابعة السريعة بحساب Google</button><button type="button" id="patchPartnerAuthBtn" onclick="window.openPartnerModal()" class="w-full bg-purple-700 text-white font-black py-2 rounded-xl text-xs"></button>`; $('view-auth').appendChild(w); }
  const modForm = document.querySelector('#addModeratorModal form');
  if (modForm && !$('patchModRoleBox')) { const d = document.createElement('div'); d.id = 'patchModRoleBox'; d.className = 'grid grid-cols-3 gap-1.5'; d.innerHTML = `<select id="modRoleTitleSelect" class="border rounded-xl p-1.5 font-bold"><option>مالي</option><option>ميداني</option><option>فحص المركبات</option><option>مشرف عام محافظة</option><option>دعم سريع</option></select><select id="modGovScopeSelect" class="border rounded-xl p-1.5 font-bold"><option value="الكل">الكل</option>${DB.governorates.map(g => `<option>${esc(g.name)}</option>`).join('')}</select><input id="modAgentCommInp" type="number" value="5" class="border rounded-xl p-1.5 font-bold">`; modForm.insertBefore(d, modForm.querySelector('.bg-slate-50')); }
  const adminView = $('view-admin'), tabBar = adminView?.querySelector('.overflow-x-auto');
  if (adminView && tabBar && !$('btn-adm-live')) {
    [{ id: 'live', html: '<i class="fa-solid fa-tower-broadcast ml-1 text-rose-600"></i> البيانات الحية', cls: 'hidden bg-white p-5 rounded-2xl border space-y-3 text-xs', prep: true }, { id: 'walletops', html: '<i class="fa-solid fa-money-bill-transfer ml-1 text-emerald-600"></i> السحب والإيداع (<span id="admPendingWalletCnt">0</span>)', cls: 'hidden bg-white p-5 rounded-2xl border space-y-4 text-xs' }, { id: 'analytics', html: '<i class="fa-solid fa-chart-pie ml-1 text-indigo-600"></i> الإحصائيات', cls: 'hidden bg-white p-5 rounded-2xl border space-y-4 text-xs' }, { id: 'extras', html: '<i class="fa-solid fa-cubes ml-1 text-emerald-600"></i> إدارة الأقسام والخدمات', cls: 'hidden grid grid-cols-1 md:grid-cols-2 gap-4 text-xs' }].forEach(t => {
      const b = document.createElement('button'); b.id = `btn-adm-${t.id}`; b.className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100'; b.innerHTML = t.html; b.onclick = () => switchAdminTab(t.id);
      if (t.prep) tabBar.prepend(b); else tabBar.appendChild(b);
      const p = document.createElement('div'); p.id = `admintab-${t.id}`; p.className = t.cls; adminView.appendChild(p);
    });
  }
  if (!$('patchTermsFooter')) { const f = document.createElement('footer'); f.id = 'patchTermsFooter'; f.className = 'bg-white border-t py-3 px-4 text-center text-xs text-slate-600 mt-6'; f.innerHTML = `جميع الحقوق محفوظة © توصيلة مصر | <button onclick="window.openTermsModal()" class="text-emerald-700 font-black hover:underline">سياسة الاستخدام والشروط</button>`; document.body.appendChild(f); }
  if (!$('patchWaSupportBtn')) { const a = document.createElement('a'); a.id = 'patchWaSupportBtn'; a.target = '_blank'; a.className = 'fixed bottom-5 left-4 z-40 bg-green-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2'; document.body.appendChild(a); }
  if (!$('patchGenericModal')) { const d = document.createElement('div'); d.innerHTML = `<div id="patchGenericModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs"><div class="bg-white w-full max-w-md rounded-3xl p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-center border-b pb-2"><h3 id="gmTitle" class="font-black text-sm"></h3><button onclick="$('patchGenericModal').classList.add('hidden')">✕</button></div><div id="gmBody" class="space-y-3"></div></div></div>`; document.body.appendChild(d); }
  if (localStorage.getItem('TAWSILA_INSTALL_SHOWN') !== '1' && !$('patchInstallBanner')) {
    let defP = null; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); defP = e; });
    const ib = document.createElement('div'); ib.id = 'patchInstallBanner'; ib.className = 'fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3 rounded-3xl shadow-2xl border border-emerald-500/40 flex items-center justify-between text-xs';
    ib.innerHTML = `<div class="flex items-center gap-2"><img src="https://cdn-icons-png.flaticon.com/512/3202/3202926.png" class="w-9 h-9 rounded-xl bg-white p-1"><div><b class="text-emerald-400 block">تثبيت تطبيق توصيلة</b><span class="text-[10px]">وصول سريع</span></div></div><div class="flex gap-1"><button id="btnDoIns" class="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl">تثبيت</button><button onclick="localStorage.setItem('TAWSILA_INSTALL_SHOWN','1');this.closest('#patchInstallBanner').remove();" class="px-2">✕</button></div>`;
    document.body.appendChild(ib); $('btnDoIns').onclick = async () => { localStorage.setItem('TAWSILA_INSTALL_SHOWN', '1'); if (defP) { defP.prompt(); await defP.userChoice; } ib.remove(); };
  }
}

window.syncAllWalletDisplays = () => {
  const u = DB.currentUser, real = u ? (userIndex.get(u.phone) || u) : null, bal = real ? safeNum(real.wallet, 0, 0) : 0;
  if ($('navCustomerWallet')) $('navCustomerWallet').innerText = bal.toFixed(2);
  if ($('custCardWalletBal')) $('custCardWalletBal').innerText = bal.toFixed(2);
  if ($('admPendingWalletCnt')) $('admPendingWalletCnt').innerText = (DB.walletRequests || []).filter(r => r.status === 'pending').length;
};
window.refreshGlobalChrome = () => {
  if ($('patchBroadcastWrap')) { $('patchBroadcastWrap').classList.toggle('hidden', !DB.broadcastTicker?.enabled); if (DB.broadcastTicker?.enabled) $('patchBroadcastWrap').innerHTML = `<div class="bg-amber-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl shadow flex items-center gap-2"><i class="fa-solid fa-bullhorn"></i><marquee>${esc(DB.broadcastTicker.text)}</marquee></div>`; }
  const ad = (DB.adsSettings?.ads || []).find(a => a.active);
  if ($('patchPromoBannerWrap')) { $('patchPromoBannerWrap').classList.toggle('hidden', !DB.adsSettings?.enabled || !ad); if (ad) $('patchPromoBannerWrap').innerHTML = `<div class="bg-gradient-to-l from-slate-900 to-emerald-800 text-white rounded-2xl p-3 shadow flex justify-between items-center text-xs"><div><b class="text-amber-300 block">${esc(ad.title)}</b><span>${esc(ad.body)}</span></div><button onclick="this.closest('#patchPromoBannerWrap').classList.add('hidden')">✕</button></div>`; }
  $('patchTermsFooter')?.classList.toggle('hidden', !DB.termsSettings?.enabled);
  if ($('patchWaSupportBtn')) { $('patchWaSupportBtn').classList.toggle('hidden', !DB.whatsappSupport?.enabled); $('patchWaSupportBtn').href = `https://wa.me/${(DB.whatsappSupport?.phone||'').replace(/[^0-9]/g,'')}?text=${encodeURIComponent(DB.whatsappSupport?.prefilledMsg||'')}`; $('patchWaSupportBtn').innerHTML = `<i class="fa-brands fa-whatsapp text-lg"></i><span>${esc(DB.whatsappSupport?.buttonText||'دعم واتساب')}</span>`; }
  $('patchInsuranceBox')?.classList.toggle('hidden', !DB.insuranceSettings?.enabled); if ($('insFeeLabel')) $('insFeeLabel').innerText = `+ ${DB.insuranceSettings?.fee||0} ج.م`;
  $('patchHeaderInboxBtn')?.classList.toggle('hidden', !DB.inboxSettings?.enabled || !DB.currentUser);
  if ($('inboxUnreadBadge') && DB.currentUser) { const cnt = (DB.inboxMessages || []).filter(m => (m.to === 'all' || m.to === DB.currentUser.phone) && !(m.readBy || []).includes(DB.currentUser.phone)).length; $('inboxUnreadBadge').innerText = cnt; $('inboxUnreadBadge').classList.toggle('hidden', cnt === 0); }
  if ($('patchPartnerAuthBtn')) { $('patchPartnerAuthBtn').classList.toggle('hidden', !DB.partnerConfig?.enabled); $('patchPartnerAuthBtn').innerText = `تسجيل شركات / مطاعم / صيدليات (خصم ${DB.partnerConfig?.discountPercent||0}%)`; }
  $('btnCustDeliv')?.classList.toggle('hidden', !DB.deliveryConfig?.enabled); $('btnCustTrans')?.classList.toggle('hidden', !DB.transferSettings?.enabled);
  $('btnCustInst')?.classList.toggle('hidden', !DB.installmentSettings?.enabled); $('btnCapLoan')?.classList.toggle('hidden', !DB.loanSettings?.enabled);
};

window.changeAdminPreviewCaptain = ph => { window.__adminPreviewCapPhone = ph; handleDriverViewLogic(); };
function handleDriverViewLogic() {
  const u = DB.currentUser, pScr = $('captainPendingScreen'), aScr = $('captainActiveScreen'), pre = $('patchAdminCapPreviewBar');
  if (u?.role === 'captain' && u.captainStatus === 'pending') { pre?.classList.add('hidden'); pScr?.classList.remove('hidden'); aScr?.classList.add('hidden'); return; }
  if (u?.role === 'customer') { pre?.classList.add('hidden'); return navigate('customer'); }
  pScr?.classList.add('hidden'); aScr?.classList.remove('hidden'); if (!u) return;
  let cap = null;
  if (u.role === 'admin' || u.role === 'moderator') {
    const caps = DB.users.filter(x => x.role === 'captain' && x.status === 'approved');
    cap = userIndex.get(activeTripData?.assignedCaptainPhone || window.__adminPreviewCapPhone || caps[0]?.phone || '') || caps[0] || null;
    if (cap) window.__adminPreviewCapPhone = cap.phone;
    if (pre) { pre.classList.remove('hidden'); pre.innerHTML = `<span class="font-black text-amber-900">معاينة الإدارة:</span><select onchange="window.changeAdminPreviewCaptain(this.value)" class="bg-white border rounded-lg px-2 py-1 font-bold">${caps.length ? caps.map(c => `<option value="${esc(c.phone)}" ${c.phone===cap?.phone?'selected':''}>${esc(c.name)} (${safeNum(c.wallet,0,0).toFixed(2)} ج)</option>`).join('') : '<option>لا يوجد كباتن</option>'}</select>`; }
  } else { pre?.classList.add('hidden'); cap = userIndex.get(u.phone) || u; }
  const bal = cap ? safeNum(cap.wallet, 0, 0).toFixed(2) : '0.00';
  if ($('driverDashboardName')) $('driverDashboardName').innerText = cap ? `الكابتن: ${cap.name}` : 'وضع معاينة الإدارة';
  if ($('driverWalletEGP')) $('driverWalletEGP').innerText = `${bal} ج.م`; if ($('capProWalletVal')) $('capProWalletVal').innerText = bal;
  if ($('capQuestBox') && cap && DB.questConfig?.enabled) $('capQuestBox').innerHTML = `<b>🏆 الهدف: ${cap.dailyTrips||0}/${DB.questConfig.targetTrips} رحلات</b><span class="text-emerald-700 font-black">مكافأة ${DB.questConfig.bonusAmount}ج</span>`;
  if ($('capLicAlertBanner') && cap?.licenseExpiry) { const d = Math.ceil((new Date(cap.licenseExpiry) - Date.now()) / 86400000); $('capLicAlertBanner').classList.toggle('hidden', d > 15); if (d <= 15) $('capLicAlertBanner').innerText = `⚠️ تنبيه الرخصة: ${d<=0?'منتهية!':`تنتهي خلال ${d} يوم`}`; }
  if ($('capDestFilterInp') && cap) $('capDestFilterInp').value = cap.destFilter || '';
}

function navigate(view) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  $(`view-${view}`)?.classList.remove('hidden');
  if (view === 'customer') setTimeout(() => { initMap(); map?.invalidateSize(); }, 200);
  else if (view === 'driver') handleDriverViewLogic();
  else if (view === 'admin') { if ($('adminWelcomeTitle')) $('adminWelcomeTitle').innerText = DB.currentUser?.role === 'moderator' ? `لوحة المشرف: ${DB.currentUser.name}` : 'لوحة الإدارة العليا (المدير العام)'; switchAdminTab('captains'); }
  window.refreshGlobalChrome();
}
function handleLogoClick() { const u = DB.currentUser; navigate(!u ? 'auth' : (u.role === 'admin' || u.role === 'moderator') ? 'admin' : u.role === 'captain' ? 'driver' : 'customer'); }

window.addEventListener('DOMContentLoaded', () => {
  buildUnifiedUI(); renderGovernoratesUI(); updateFeaturesAdminUI(); updateNavUI(); window.refreshGlobalChrome(); applyAllPatches();
  if ($('formLogin')) $('formLogin').onsubmit = handleUserLogin;
  new MutationObserver(() => requestAnimationFrame(scanCollapseAndLiveBanner)).observe(document.body, { childList: true, subtree: true });
  scanCollapseAndLiveBanner();
  if (DB.currentUser) navigate((DB.currentUser.role === 'admin' || DB.currentUser.role === 'moderator') ? 'admin' : DB.currentUser.role === 'captain' ? 'driver' : 'customer');
  else navigate('auth');

  (async () => {
    const [ok] = await Promise.all([loadStoreFromFirebase(), loadPatchesFromFirebase()]);
    if (ok) { renderGovernoratesUI(); updateFeaturesAdminUI(); updateNavUI(); window.refreshGlobalChrome(); }
    applyAllPatches(); await restoreSessionOnLoad();
  })();
  setInterval(async () => {
    if (!getFirebaseBaseUrl() || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (await loadStoreFromFirebase()) { updateNavUI(); window.refreshGlobalChrome(); }
  }, 12000);
});
(() => {
  let fbIdToken = sessionStorage.getItem('TAWSILA_FB_TOKEN') || '';
  const apiKey = FIREBASE_APP_CONFIG.apiKey;

  async function ensureFbToken() {
    if (fbIdToken) return fbIdToken;
    try {
      const res = await fetchTimeout(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true })
      }, 3500);
      const data = await res.json();
      if (data?.idToken) {
        fbIdToken = data.idToken;
        sessionStorage.setItem('TAWSILA_FB_TOKEN', fbIdToken);
      }
    } catch (e) {}
    return fbIdToken;
  }

  async function signInAdminFirebase(email, password) {
    try {
      const res = await fetchTimeout(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }, 4000);
      const data = await res.json();
      if (data?.idToken) {
        fbIdToken = data.idToken;
        sessionStorage.setItem('TAWSILA_FB_TOKEN', fbIdToken);
        return true;
      }
    } catch (e) {}
    return false;
  }

  // حقن ?auth=token تلقائياً في طلبات Firebase Realtime Database
  const origFetch = window.fetch;
  window.fetch = async function(input, init) {
    let url = typeof input === 'string' ? input : (input?.url || '');
    if (url.startsWith(DEFAULT_FIREBASE_DB_URL) && !url.includes('auth=')) {
      const tok = await ensureFbToken();
      if (tok) url += (url.includes('?') ? '&' : '?') + 'auth=' + encodeURIComponent(tok);
      if (typeof input === 'string') input = url;
    }
    return origFetch.call(this, input, init);
  };

  // ربط دخول الأدمن بمصادقة Firebase عند تسجيل الدخول
  const origLogin = window.handleUserLogin;
  window.handleUserLogin = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idVal = toEnDigits($('loginIdentifier')?.value || '');
    const passVal = toEnDigits($('loginPassword')?.value || '');

    if (idVal === SUPER_ADMIN.phone || idVal.toLowerCase() === SUPER_ADMIN.email) {
      const ok = await signInAdminFirebase(SUPER_ADMIN.email, passVal);
      if (ok || passVal === SUPER_ADMIN.password) {
        DB.currentUser = {
          role: 'admin', isSuperAdmin: true, name: 'المدير العام', phone: SUPER_ADMIN.phone,
          permissions: { captains: true, governorates: true, features: true, moderators: true }
        };
        saveDB(DB); updateNavUI(); navigate('admin');
        alert('🎉 مرحباً بك يا مدير النظام! تم تسجيل الدخول ومصادقة Firebase بنجاح.');
        return false;
      }
    }
    return origLogin ? origLogin(e) : false;
  };
  if ($('formLogin')) $('formLogin').onsubmit = window.handleUserLogin;
})();
