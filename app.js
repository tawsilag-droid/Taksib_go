/**
 * تطبيق توصيلة مصر - المحرك الموحد السحابي (Firebase-First Super App)
 * الإصدار الكامل: تخزين أساسي على Firebase للبيانات والباتشات + OSRM متعدد المحطات
 * + حماية من XSS والتحقق الصارم من المدخلات + جميع الباتشات والميزات الـ 60+.
 */

// 1) ضع رابط Firebase Realtime Database هنا ليظل محفوظاً حتى بعد مسح بيانات المتصفح
const DEFAULT_FIREBASE_DB_URL = "https://tawsila-37a80-default-rtdb.firebaseio.com/"; // مثال: "https://tawsila-app-default-rtdb.firebaseio.com"

const SUPER_ADMIN = {
  phone: "01068131386",
  email: "tawsilag@gmail.com",
  password: "0000"
};

// دوال الحماية الأمنية والتحقق من المدخلات
function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeNum(val, fallback = 0, min = -Infinity, max = Infinity) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : fallback;
  } catch (e) { return fallback; }
}

const EGYPT_27_GOVS = [
  { id: 'sohag', name: 'سوهاج', center: [26.5569, 31.6948], zoom: 13, areas: ['مدينة سوهاج', 'أخميم', 'جرجا', 'طهطا', 'طما', 'المراغة', 'البلينا', 'دار السلام'] },
  { id: 'cairo', name: 'القاهرة', center: [30.0444, 31.2357], zoom: 12, areas: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'شبرا', 'حلوان', 'التجمع الخامس'] },
  { id: 'giza', name: 'الجيزة', center: [30.0131, 31.2089], zoom: 12, areas: ['الدقي', 'المهندسين', 'الهرم', 'فيصل', '6 أكتوبر', 'الشيخ زايد', 'البدرشين'] },
  { id: 'alex', name: 'الإسكندرية', center: [31.2001, 29.9187], zoom: 12, areas: ['سموحة', 'سيدي جابر', 'المنتزه', 'العجمي', 'محطة الرمل', 'برج العرب'] },
  { id: 'qalyubia', name: 'القليوبية', center: [30.4660, 31.1848], zoom: 12, areas: ['بنها', 'شبرا الخيمة', 'قليوب', 'القناطر الخيرية', 'طوخ', 'الخانكة'] },
  { id: 'sharqia', name: 'الشرقية', center: [30.5765, 31.5041], zoom: 12, areas: ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'أبو حماد'] },
  { id: 'dakahlia', name: 'الدقهلية', center: [31.0409, 31.3785], zoom: 12, areas: ['المنصورة', 'طلخا', 'ميت غمر', 'السنبلاوين', 'دكرنس', 'بلقاس'] },
  { id: 'gharbia', name: 'الغربية', center: [30.7865, 31.0004], zoom: 12, areas: ['طنطا', 'المحلة الكبرى', 'زفتى', 'كفر الزيات', 'السنطة', 'سمنود'] },
  { id: 'monufia', name: 'المنوفية', center: [30.5503, 31.0106], zoom: 12, areas: ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'قويسنا', 'الباجور'] },
  { id: 'beheira', name: 'البحيرة', center: [31.0422, 30.4667], zoom: 12, areas: ['دمنهور', 'كفر الدوار', 'إيتاي البارود', 'كوم حمادة', 'رشيد', 'أبو المطامير'] },
  { id: 'kafrelsheikh', name: 'كفر الشيخ', center: [31.1107, 30.9388], zoom: 12, areas: ['كفر الشيخ', 'دسوق', 'بيلا', 'فوه', 'سيدي سالم', 'الحامول'] },
  { id: 'damietta', name: 'دمياط', center: [31.4175, 31.8144], zoom: 12, areas: ['دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا', 'كفر سعد'] },
  { id: 'portsaid', name: 'بورسعيد', center: [31.2653, 32.3019], zoom: 13, areas: ['حي الشرق', 'حي العرب', 'حي الضواحي', 'بورفؤاد', 'حي الزهور'] },
  { id: 'ismailia', name: 'الإسماعيلية', center: [30.5965, 32.2715], zoom: 12, areas: ['الإسماعيلية', 'فايد', 'التل الكبير', 'القنطرة شرق', 'أبو صوير'] },
  { id: 'suez', name: 'السويس', center: [29.9668, 32.5498], zoom: 13, areas: ['حي السويس', 'حي الأربعين', 'فيصل', 'عتاقة', 'الجناين'] },
  { id: 'faiyum', name: 'الفيوم', center: [29.3084, 30.8428], zoom: 12, areas: ['مدينة الفيوم', 'سنورس', 'إطسا', 'طامية', 'أبشواي', 'يوسف الصديق'] },
  { id: 'benisuef', name: 'بني سويف', center: [29.0661, 31.0994], zoom: 12, areas: ['بني سويف', 'الواسطى', 'ببا', 'الفشن', 'إهناسيا', 'ناصر'] },
  { id: 'minya', name: 'المنيا', center: [28.1099, 30.7503], zoom: 12, areas: ['المنيا', 'ملوي', 'سمالوط', 'بني مزار', 'مغاغة', 'أبو قرقاص'] },
  { id: 'asyut', name: 'أسيوط', center: [27.1809, 31.1837], zoom: 12, areas: ['أسيوط', 'ديروط', 'منفلوط', 'القوصية', 'أبنوب', 'أبو تيج'] },
  { id: 'qena', name: 'قنا', center: [26.1551, 32.7160], zoom: 12, areas: ['قنا', 'نجع حمادي', 'دشنا', 'قوص', 'فرشوط', 'أبو تشت'] },
  { id: 'luxor', name: 'الأقصر', center: [25.6872, 32.6396], zoom: 13, areas: ['الأقصر', 'إسنا', 'أرمنت', 'القرنة', 'الطود', 'البياضية'] },
  { id: 'aswan', name: 'أسوان', center: [24.0889, 32.8998], zoom: 12, areas: ['أسوان', 'كوم أمبو', 'إدفو', 'دراو', 'نصر النوبة'] },
  { id: 'redsea', name: 'البحر الأحمر', center: [27.2579, 33.8116], zoom: 12, areas: ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'رأس غارب'] },
  { id: 'newvalley', name: 'الوادي الجديد', center: [25.4390, 30.5586], zoom: 11, areas: ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط'] },
  { id: 'matrouh', name: 'مطروح', center: [31.3543, 27.2373], zoom: 12, areas: ['مرسى مطروح', 'العلمين', 'الحمام', 'الضبعة', 'سيوة', 'السلوم'] },
  { id: 'northsinai', name: 'شمال سيناء', center: [31.1321, 33.8033], zoom: 12, areas: ['العريش', 'الشيخ زويد', 'رفح', 'بئر العبد', 'الحسنة'] },
  { id: 'southsinai', name: 'جنوب سيناء', center: [27.9158, 34.3299], zoom: 12, areas: ['شرم الشيخ', 'الطور', 'دهب', 'نويبع', 'سانت كاترين', 'طابا'] }
].map(g => ({ ...g, active: true, areas: g.areas.map(a => ({ name: a, active: true })) }));

const DEFAULT_STORE = {
  currentUser: null,
  users: [
    { phone: "01011111111", password: "123", name: "عميل تجريبي", role: "customer", wallet: 150.0, loyaltyPoints: 20, blockedBy: [], favorites: {} },
    { phone: "01022222222", password: "123", name: "كابتن أحمد", role: "captain", vehicle: "سيارة ملاكي", plate: "هـ ص ج 4589", status: "approved", wallet: 300.0, isAvailable: true, inTrip: false, lat: 26.5569, lng: 31.6948, licenseExpiry: "2027-06-01", dailyTrips: 0, questClaimedDate: "", destFilter: "", packageUntil: 0, blockedCustomers: [], fuelLogs: [], nextOilKm: 5000 }
  ],
  moderators: [
    { id: 'mod_1', name: 'م. علي إبراهيم', phone: '01099998888', password: '111', role: 'moderator', roleTitle: 'مشرف عام محافظة', govScope: 'سوهاج', agentCommissionPercent: 5, agentEarnings: 0, permissions: { captains: true, governorates: true, features: true } }
  ],
  captainsPending: [],
  governorates: EGYPT_27_GOVS,
  selectedGovId: 'sohag',
  features: { biddingEnabled: true, surgeActive: false, surgeMultiplier: 1.3 },
  nightPeakConfig: { autoNightEnabled: true, nightStartHour: 0, nightEndHour: 6, nightPercent: 15, autoPeakEnabled: false, peakStartHour: 15, peakEndHour: 19, peakPercent: 20 },
  promoCodes: [
    { code: 'TAWSILA2026', discountPercent: 20, govId: 'all', happyHourStart: '', happyHourEnd: '', active: true },
    { code: 'SOHAG50', discountPercent: 50, govId: 'sohag', happyHourStart: '', happyHourEnd: '', active: true }
  ],
  activeDiscountPercent: 0,
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سوهاج', baseFare: 7.0, perKm: 2.5, waitPerMin: 1.0, icon: 'fa-solid fa-motorcycle', iconImage: '', enabled: true },
    { id: 'moto', name: 'موتوسيكل سريع', baseFare: 9.0, perKm: 3.0, waitPerMin: 1.0, icon: 'fa-solid fa-bicycle', iconImage: '', enabled: true },
    { id: 'car', name: 'سيارة ملاكي', baseFare: 12.0, perKm: 3.5, waitPerMin: 1.5, icon: 'fa-solid fa-car', iconImage: '', enabled: true }
  ],
  selectedVehicleId: 'car',
  extraFare: 0,
  customBidFare: null,
  welcomeBonus: { enabled: true, customerAmount: 25, captainAmount: 50 },
  paymentConfig: {
    methods: [
      { id: 'vf', name: 'فودافون كاش', details: '01068131386', enabled: true },
      { id: 'ip', name: 'إنستاباي', details: 'tawsila@instapay', enabled: true },
      { id: 'cash', name: 'نقدي بالفرع', details: 'المقر الرئيسي', enabled: true }
    ],
    minDeposit: 20, maxDeposit: 5000, minWithdraw: 50, maxWithdraw: 10000
  },
  walletSystemConfig: { customerDepositEnabled: true, customerWithdrawEnabled: true, captainDepositEnabled: true, captainWithdrawEnabled: true, instantDeposit: false, withdrawFeePercent: 0 },
  walletRequests: [],
  firebaseConfig: { dbUrl: DEFAULT_FIREBASE_DB_URL },
  referralConfig: { enabled: true, referrerBonus: 15, referredBonus: 10, tripCommissionPercent: 10 },
  referralLogs: [],
  financialLedger: [],
  inboxSettings: { enabled: true },
  inboxMessages: [{ id: 'msg_1', to: 'all', from: 'الإدارة', senderPhone: 'admin', subject: 'أهلاً بك في توصيلة مصر', body: 'مرحباً بك في شبكة النقل الذكي بجميع محافظات مصر!', readBy: [], replies: [], date: new Date().toLocaleDateString('ar-EG') }],
  captainWalletLogs: [],
  dispatchConfig: { countdownSeconds: 45, maxRadiusKm: 15 },
  deliveryConfig: { enabled: true, baseFare: 15, perKm: 4, waitPerMin: 1.5, iconImage: '' },
  deliveryOrders: [],
  partnerConfig: { enabled: true, discountPercent: 15, iconImage: '' },
  partners: [],
  whatsappSupport: { enabled: true, phone: '201068131386', buttonText: 'واتساب الدعم', prefilledMsg: 'مرحباً فريق دعم تطبيق توصيلة، أحتاج إلى مساعدة.' },
  transferSettings: { enabled: true, commissionPercent: 2, minAmount: 10, maxAmount: 5000 },
  transferLogs: [],
  loanSettings: { enabled: true },
  loanRequests: [],
  installmentSettings: { enabled: true },
  installmentRequests: [],
  adsSettings: { enabled: true, ads: [{ id: 'ad_1', title: '🚖 توصيلة مصر.. مشوارك أسرع وأرخص!', body: 'اطلب رحلتك الآن في 27 محافظة بأفضل سعر.', ctaText: '', ctaUrl: '', image: '', active: true }] },
  termsSettings: { enabled: true, title: 'سياسة الاستخدام والشروط والأحكام', content: '1. يلتزم العميل والكابتن بقوانين المرور والسلامة العامة.\n2. يتم احتساب الأجرة وفق التسعيرة المعلنة أو الاتفاق عبر المزايدة.\n3. تحفظ المنصة سرية البيانات ولا تشاركها مع أي طرف ثالث.' },
  insuranceSettings: { enabled: true, fee: 5, coverageText: 'تغطية تأمينية شاملة حتى 50,000 ج.م' },
  insuredTripsLog: [],
  questConfig: { enabled: true, targetTrips: 5, bonusAmount: 50 },
  packageConfig: { enabled: true, weeklyPrice: 120, monthlyPrice: 400 },
  loyaltyConfig: { enabled: true, pointsPerTrip: 10, egpPer100Points: 20 },
  otpConfig: { enabled: true },
  cancelConfig: { maxDailyCancels: 3, penaltyAmount: 10, cooldownMinutes: 30 },
  cancelLogs: [],
  blacklist: [],
  commuteConfig: { enabled: true, discountPercent: 20 },
  commuteSubscriptions: [],
  intercityConfig: { enabled: true },
  intercityTrips: [],
  scheduledTrips: [],
  lostFoundItems: [],
  broadcastTicker: { enabled: false, text: '🔥 عرض اليوم: مضاعفة نقاط الولاء في جميع المحافظات!' },
  demandPoints: [],
  complaints: [],
  auditLogs: [],
  tripHistory: []
};

// ==========================================
// 1. محرك التخزين الأساسي على Firebase (للبيانات والباتشات والجلسات)
// ==========================================
function getFirebaseBaseUrl() {
  const saved = safeJsonParse(localStorage.getItem('TAWSILA_FB_URL_CACHE') || '{}', {}).url || '';
  const fromDb = (typeof DB !== 'undefined' && DB?.firebaseConfig?.dbUrl) ? DB.firebaseConfig.dbUrl : '';
  const url = (DEFAULT_FIREBASE_DB_URL || fromDb || saved || '').trim().replace(/\/+$/, '');
  return /^https:\/\/[a-z0-9.-]+/i.test(url) ? url : '';
}

function normalizeStore(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_STORE));
  if (!raw || typeof raw !== 'object') return base;
  const merged = Object.assign(base, raw);
  const oldGovs = {};
  (raw.governorates || []).forEach(g => { if (g && g.id) oldGovs[g.id] = g; });
  merged.governorates = EGYPT_27_GOVS.map(g => {
    const prev = oldGovs[g.id];
    const areas = (prev && Array.isArray(prev.areas) && prev.areas.length)
      ? prev.areas.map(a => typeof a === 'string' ? { name: a, active: true } : a)
      : g.areas;
    return { ...g, active: prev ? Boolean(prev.active) : true, areas };
  });
  if (!merged.firebaseConfig) merged.firebaseConfig = { dbUrl: getFirebaseBaseUrl() };
  else if (DEFAULT_FIREBASE_DB_URL) merged.firebaseConfig.dbUrl = DEFAULT_FIREBASE_DB_URL;
  return merged;
}

let DB = normalizeStore(safeJsonParse(localStorage.getItem('TAWSILA_MEGA_STORE_V4') || 'null', null));
const userIndex = new Map();
function rebuildUserIndex() {
  userIndex.clear();
  (DB.users || []).forEach(u => { if (u && u.phone) userIndex.set(u.phone, u); });
}
rebuildUserIndex();

// الحفاظ على الجلسة الشخصية للمستخدم محلياً فقط، والبيانات + الباتشات سحابياً في Firebase
let fbSyncTimer = null;
async function pushStoreToFirebase(storeData) {
  const base = getFirebaseBaseUrl();
  if (!base) return false;
  try {
    // لا نخزن currentUser في السحابة المشتركة حتى لا يتداخل تسجيل دخول المستخدمين ببعضهم
    const cloudCopy = Object.assign({}, storeData, { currentUser: null });
    const res = await fetch(`${base}/tawsila_store.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cloudCopy)
    });
    return res.ok;
  } catch (e) { return false; }
}

function saveDB(d, immediate = true) {
  rebuildUserIndex();
  const persistLocalMirror = () => {
    try {
      if (d.firebaseConfig?.dbUrl) localStorage.setItem('TAWSILA_FB_URL_CACHE', JSON.stringify({ url: d.firebaseConfig.dbUrl }));
      localStorage.setItem('TAWSILA_MEGA_STORE_V4', JSON.stringify(d));
    } catch (e) { console.warn('Local cache full'); }
  };
  if (immediate) {
    clearTimeout(fbSyncTimer);
    persistLocalMirror();
    pushStoreToFirebase(d);
  } else {
    clearTimeout(fbSyncTimer);
    fbSyncTimer = setTimeout(() => { persistLocalMirror(); pushStoreToFirebase(d); }, 180);
  }
}

async function loadStoreFromFirebase() {
  const base = getFirebaseBaseUrl();
  if (!base) return false;
  try {
    const res = await fetch(`${base}/tawsila_store.json`);
    if (!res.ok) return false;
    const remote = await res.json();
    if (remote && typeof remote === 'object' && Array.isArray(remote.users)) {
      const localUser = DB.currentUser;
      DB = normalizeStore(remote);
      // استعادة بيانات المستخدم الحالي المحدّثة من السحابة
      if (localUser) {
        const fresh = DB.users.find(u => u.phone === localUser.phone);
        DB.currentUser = fresh || localUser;
      }
      rebuildUserIndex();
      try { localStorage.setItem('TAWSILA_MEGA_STORE_V4', JSON.stringify(DB)); } catch (e) {}
      return true;
    } else if (!remote) {
      // أول تشغيل على Firebase فارغ: نرفع البنية الأساسية للسحابة فوراً
      await pushStoreToFirebase(DB);
    }
  } catch (e) { console.warn('Firebase offline fallback active'); }
  return false;
}

// تخزين الباتشات في Firebase حتى لا تحذف عند مسح بيانات المتصفح
let cachedPatches = safeJsonParse(localStorage.getItem('TAWSILA_PATCHES') || '[]', []);
if (!Array.isArray(cachedPatches)) cachedPatches = [];

function getPatches() { return cachedPatches; }
async function savePatches(list) {
  cachedPatches = Array.isArray(list) ? list : [];
  try { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(cachedPatches)); } catch (e) {}
  const base = getFirebaseBaseUrl();
  if (!base) return;
  try {
    await fetch(`${base}/tawsila_patches.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cachedPatches)
    });
  } catch (e) {}
}

async function loadPatchesFromFirebase() {
  const base = getFirebaseBaseUrl();
  if (!base) return cachedPatches;
  try {
    const res = await fetch(`${base}/tawsila_patches.json`);
    if (res.ok) {
      const remote = await res.json();
      if (Array.isArray(remote)) {
        cachedPatches = remote;
        try { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(cachedPatches)); } catch (e) {}
      }
    }
  } catch (e) {}
  return cachedPatches;
}

window.addEventListener('beforeunload', () => saveDB(DB, true));

// مزامنة الجلسات + GPS اللحظي
function getSessionKey() {
  return 'sess_' + (DB.currentUser?.phone || 'guest').replace(/[^a-zA-Z0-9_]/g, '');
}
async function syncSessionToFirebase(sessionObj) {
  localStorage.setItem('TAWSILA_ACTIVE_TRIP_SESSION', JSON.stringify(sessionObj));
  const base = getFirebaseBaseUrl();
  if (!base) return;
  try {
    await fetch(`${base}/sessions/${getSessionKey()}.json`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sessionObj)
    });
  } catch (e) {}
}
async function clearActiveSession() {
  localStorage.removeItem('TAWSILA_ACTIVE_TRIP_SESSION');
  const base = getFirebaseBaseUrl();
  if (!base) return;
  try { await fetch(`${base}/sessions/${getSessionKey()}.json`, { method: 'DELETE' }); } catch (e) {}
}
async function restoreSessionOnLoad() {
  let raw = localStorage.getItem('TAWSILA_ACTIVE_TRIP_SESSION');
  const base = getFirebaseBaseUrl();
  if (!raw && base && DB.currentUser) {
    try {
      const res = await fetch(`${base}/sessions/${getSessionKey()}.json`);
      const data = await res.json();
      if (data && data.trip) raw = JSON.stringify(data);
    } catch (e) {}
  }
  if (!raw) return;
  const s = safeJsonParse(raw, null);
  if (s && s.trip && s.phase !== 'completed') {
    activeTripData = s.trip;
    const btn = document.getElementById('btnRequestRide');
    if (btn) { btn.disabled = true; btn.innerText = 'رحلة نشطة (تمت استعادة الجلسة)...'; }
    const st = document.getElementById('custStatusBadge');
    if (st) st.innerText = s.phaseLabel || 'رحلة نشطة';
    if (['accepted', 'arrived', 'started'].includes(s.phase)) {
      document.getElementById('customerDriverCard')?.classList.remove('hidden');
      document.getElementById('driverIdleBox')?.classList.add('hidden');
      document.getElementById('driverActiveTripBox')?.classList.remove('hidden');
      const fEl = document.getElementById('driverActiveTripFare');
      if (fEl) fEl.innerText = `الأجرة: ${activeTripData.fare} ج.م`;
    }
  }
}

// متغيرات التشغيل العامة
let activeTripData = null, countdownInterval = null, tempCaptainDocs = {};
let map, pickupMarker, dropoffMarker, routeLine, captainLiveMarker;
let extraStops = []; // محطات التوقف الإضافية (Multi-stop)
let realRouteDistKm = 4.5, realRouteEtaMin = 10, selectedStarRating = 5;
let dispatchQueue = [], dispatchIdx = 0;
let waitSeconds = 0, waitTimerInt = null, activeWaitCost = 0, gpsWatchTimer = null;
let currentLang = localStorage.getItem('TAWSILA_LANG') || 'ar';

// أدوات مساعدة عامة
function haversineKm(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function compressImageFile(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; }
      else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/webp', 0.65));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function addAuditLog(action) {
  if (!DB.currentUser) return;
  DB.auditLogs.push({ id: 'aud_' + Date.now(), actor: DB.currentUser.name, role: DB.currentUser.roleTitle || DB.currentUser.role, action, time: new Date().toLocaleString('ar-EG') });
  if (DB.auditLogs.length > 150) DB.auditLogs.shift();
  saveDB(DB, false);
}

function addLedgerEntry(type, amount, note) {
  DB.financialLedger.push({ id: 'fin_' + Date.now(), type, amount: safeNum(amount, 0, 0), note, date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString('ar-EG') });
  if (DB.financialLedger.length > 400) DB.financialLedger.shift();
  saveDB(DB, false);
}

function creditRegionalAgentCommission(govName, tripFare) {
  const mod = (DB.moderators || []).find(m => m.roleTitle === 'مشرف عام محافظة' && (m.govScope === govName || m.govScope === 'الكل'));
  if (!mod || !mod.agentCommissionPercent) return;
  const cut = +(tripFare * (safeNum(mod.agentCommissionPercent, 0, 0, 50) / 100)).toFixed(2);
  mod.agentEarnings = +((mod.agentEarnings || 0) + cut).toFixed(2);
}

// بث GPS اللحظي للكابتن وتتبع الخريطة
function startCaptainGpsTracking() {
  clearInterval(gpsWatchTimer);
  gpsWatchTimer = setInterval(() => {
    const u = DB.currentUser;
    if (!u || u.role !== 'captain' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      const cap = userIndex.get(u.phone) || u;
      cap.lat = lat; cap.lng = lng;
      const base = getFirebaseBaseUrl();
      if (base) {
        try {
          await fetch(`${base}/captains_gps/${encodeURIComponent(u.phone)}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng, ts: Date.now() })
          });
        } catch (e) {}
      }
    }, () => {}, { enableHighAccuracy: false, maximumAge: 5000 });
  }, 5000);
}

setInterval(async () => {
  if (!map || !activeTripData || !activeTripData.assignedCaptainPhone) return;
  let cap = userIndex.get(activeTripData.assignedCaptainPhone);
  const base = getFirebaseBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/captains_gps/${encodeURIComponent(activeTripData.assignedCaptainPhone)}.json`);
      const g = await res.json();
      if (g && typeof g.lat === 'number') cap = { lat: g.lat, lng: g.lng };
    } catch (e) {}
  }
  if (!cap || typeof cap.lat !== 'number') return;
  const icon = L.divIcon({ className: 'text-2xl', html: '🚕', iconSize: [28, 28], iconAnchor: [14, 14] });
  if (!captainLiveMarker) captainLiveMarker = L.marker([cap.lat, cap.lng], { icon }).addTo(map);
  else captainLiveMarker.setLatLng([cap.lat, cap.lng]);
}, 4000);

// ==========================================
// 2. المصادقة والحظر والإحالة والترحيب والتنقل العلوي
// ==========================================
function isBlacklisted(phone) {
  const rec = (DB.blacklist || []).find(b => b.phone === phone && (!b.until || b.until > Date.now()));
  if (rec) { alert(`⛔ هذا الحساب محظور.\nالسبب: ${rec.reason}`); return true; }
  return false;
}

function ensureUserReferralCode(user) {
  if (!user) return 'TAWSILA2026';
  if (!user.referralCode) {
    user.referralCode = 'TW' + (user.phone || '0000').slice(-4) + Math.floor(10 + Math.random() * 89);
    const inDb = userIndex.get(user.phone);
    if (inDb) inDb.referralCode = user.referralCode;
  }
  return user.referralCode;
}

function applyReferralBonus(newUserPhone, refCode) {
  if (!DB.referralConfig?.enabled || !refCode) return;
  const clean = refCode.trim().toUpperCase();
  const referrer = DB.users.find(u => u.referralCode === clean && u.phone !== newUserPhone);
  const newUser = userIndex.get(newUserPhone);
  if (referrer && newUser) {
    referrer.wallet = +((referrer.wallet || 0) + safeNum(DB.referralConfig.referrerBonus, 0, 0)).toFixed(2);
    newUser.wallet = +((newUser.wallet || 0) + safeNum(DB.referralConfig.referredBonus, 0, 0)).toFixed(2);
    newUser.referredBy = referrer.phone;
    DB.referralLogs.push({ referrer: referrer.name, newUser: newUser.name, code: clean, date: new Date().toLocaleDateString('ar-EG') });
  }
}

function handleUserLogin(e) {
  e.preventDefault();
  const idVal = document.getElementById('loginIdentifier').value.trim();
  const passVal = document.getElementById('loginPassword').value.trim();
  if (isBlacklisted(idVal)) return;

  if ((idVal === SUPER_ADMIN.phone || idVal.toLowerCase() === SUPER_ADMIN.email) && passVal === SUPER_ADMIN.password) {
    DB.currentUser = { role: 'admin', isSuperAdmin: true, name: 'المدير العام', phone: SUPER_ADMIN.phone, permissions: { captains: true, governorates: true, features: true, moderators: true } };
    saveDB(DB); updateNavUI(); navigate('admin');
    return alert('🎉 مرحباً بك يا مدير النظام! تم تسجيل دخولك بلوحة الإدارة العليا.');
  }

  const mod = (DB.moderators || []).find(m => m.phone === idVal && m.password === passVal);
  if (mod) {
    DB.currentUser = { role: 'moderator', isSuperAdmin: false, name: mod.name, phone: mod.phone, roleTitle: mod.roleTitle || 'مشرف', govScope: mod.govScope || 'الكل', permissions: mod.permissions };
    saveDB(DB); updateNavUI(); navigate('admin');
    return alert(`🎉 مرحباً بك (${mod.name}) - ${DB.currentUser.roleTitle}`);
  }

  const pendingCap = (DB.captainsPending || []).find(c => c.phone === idVal && c.password === passVal && c.status !== 'approved');
  if (pendingCap) {
    DB.currentUser = { role: 'captain', name: pendingCap.name, phone: pendingCap.phone, captainStatus: pendingCap.status };
    saveDB(DB); updateNavUI(); navigate('driver'); return;
  }

  const user = userIndex.get(idVal);
  if (user && user.password === passVal) {
    ensureUserReferralCode(user);
    DB.currentUser = user;
    saveDB(DB); updateNavUI();
    navigate(user.role === 'captain' ? 'driver' : 'customer'); return;
  }
  alert('❌ خطأ: بيانات الدخول غير صحيحة!');
}

function handleRegisterCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('regCustName').value.trim();
  const phone = document.getElementById('regCustPhone').value.trim();
  const password = document.getElementById('regCustPass').value.trim();
  const refCode = document.getElementById('inp_formRegCustomer_ref')?.value.trim() || '';
  if (isBlacklisted(phone)) return;
  if (userIndex.has(phone)) return alert('⚠️ هذا الرقم مسجل بالفعل، يرجى تسجيل الدخول.');

  const welcomeAmt = DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.customerAmount, 0, 0) : 150;
  const newUser = { role: 'customer', name, phone, password, wallet: welcomeAmt, welcomeCredited: true, loyaltyPoints: 0, blockedBy: [], favorites: {} };
  ensureUserReferralCode(newUser);
  DB.users.push(newUser); rebuildUserIndex();
  applyReferralBonus(phone, refCode);
  DB.currentUser = userIndex.get(phone);
  saveDB(DB); updateNavUI(); navigate('customer');
  alert(`🎉 أهلاً بك يا ${name}! رصيدك الترحيبي: ${DB.currentUser.wallet.toFixed(2)} ج.م`);
}

function handleRegisterCaptain(e) {
  e.preventDefault();
  const name = document.getElementById('regCapName').value.trim();
  const phone = document.getElementById('regCapPhone').value.trim();
  const password = document.getElementById('regCapPass').value.trim();
  const vehicle = document.getElementById('regCapVehicle').value;
  const plate = document.getElementById('regCapPlate').value.trim();
  const licenseExpiry = document.getElementById('regCapLicExp')?.value || '2027-06-01';
  const refCode = document.getElementById('inp_formRegCaptain_ref')?.value.trim() || '';
  if (isBlacklisted(phone)) return;
  if (!tempCaptainDocs.idFront || !tempCaptainDocs.idBack || !tempCaptainDocs.licenseDrive || !tempCaptainDocs.licenseCar) {
    return alert('⚠️ يرجى رفع جميع صور المستندات الأربعة المطلوبة.');
  }
  DB.captainsPending.push({ id: 'cap_' + Date.now(), role: 'captain', name, phone, password, vehicle, plate, licenseExpiry, refCode, status: 'pending', wallet: 0.0, docs: { ...tempCaptainDocs } });
  DB.currentUser = { role: 'captain', name, phone, captainStatus: 'pending' };
  saveDB(DB); updateNavUI(); navigate('driver');
  alert('✅ تم إرسال المستندات بنجاح! طلبك قيد مراجعة الإدارة.');
}

function handleCompressUpload(event, key) {
  const file = event.target.files[0];
  if (file) compressImageFile(file, 320, res => { tempCaptainDocs[key] = res; });
}

function logoutUser() { DB.currentUser = null; saveDB(DB); updateNavUI(); navigate('auth'); }

function switchAuthTab(tab) {
  ['btnAuthTabLogin', 'btnAuthTabRegCust', 'btnAuthTabRegCap'].forEach(id => { const el = document.getElementById(id); if (el) el.className = 'flex-1 py-2 rounded-xl text-slate-600 transition'; });
  ['formLogin', 'formRegCustomer', 'formRegCaptain'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  if (tab === 'login') { document.getElementById('btnAuthTabLogin').className = 'flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow'; document.getElementById('formLogin').classList.remove('hidden'); }
  else if (tab === 'reg-customer') { document.getElementById('btnAuthTabRegCust').className = 'flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow'; document.getElementById('formRegCustomer').classList.remove('hidden'); }
  else { document.getElementById('btnAuthTabRegCap').className = 'flex-1 py-2 rounded-xl bg-amber-500 text-slate-900 font-black shadow'; document.getElementById('formRegCaptain').classList.remove('hidden'); }
}

function updateNavUI() {
  const u = DB.currentUser;
  const realUser = u ? (userIndex.get(u.phone) || u) : null;
  if (u && realUser) u.wallet = safeNum(realUser.wallet, u.wallet || 0, 0);

  ['nav-btn-admin', 'nav-btn-customer', 'nav-btn-driver', 'navUserBadge', 'navCustomerWalletBox'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  document.getElementById('nav-btn-login')?.classList.remove('hidden');

  if (u) {
    document.getElementById('nav-btn-login')?.classList.add('hidden');
    document.getElementById('navUserBadge')?.classList.remove('hidden');
    document.getElementById('navUserBadge')?.classList.add('flex');
    const nameEl = document.getElementById('navUserName'); if (nameEl) nameEl.innerText = u.name;

    if (u.role === 'admin' || u.role === 'moderator') {
      document.getElementById('nav-btn-admin')?.classList.remove('hidden');
      document.getElementById('nav-btn-customer')?.classList.remove('hidden');
      document.getElementById('nav-btn-driver')?.classList.remove('hidden');
    } else if (u.role === 'customer') {
      document.getElementById('nav-btn-customer')?.classList.remove('hidden');
      const nb = document.getElementById('navCustomerWalletBox');
      if (nb) { nb.classList.remove('hidden'); nb.classList.add('flex'); }
      const wEl = document.getElementById('navCustomerWallet'); if (wEl) wEl.innerText = safeNum(u.wallet, 0, 0).toFixed(2);
    } else if (u.role === 'captain') {
      document.getElementById('nav-btn-driver')?.classList.remove('hidden');
      startCaptainGpsTracking();
    }
  }
  if (typeof window.syncAllWalletDisplays === 'function') window.syncAllWalletDisplays();
  if (typeof window.refreshGlobalChrome === 'function') window.refreshGlobalChrome();
}

// ==========================================
// 3. الخريطة + OSRM متعدد المحطات + Nominatim + التعريفة الليلية وعروض المحافظات
// ==========================================
async function updateOSRMRoute(pLatLng, dLatLng) {
  const waypoints = [pLatLng, ...extraStops.map(s => ({ lat: s.lat, lng: s.lng })), dLatLng];
  const coordStr = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data && data.routes && data.routes[0]) {
      realRouteDistKm = Math.max(0.5, +(data.routes[0].distance / 1000).toFixed(2));
      realRouteEtaMin = Math.max(3, Math.round(data.routes[0].duration / 60));
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      if (routeLine && map) map.removeLayer(routeLine);
      if (map) routeLine = L.polyline(coords, { color: '#059669', weight: 5, opacity: 0.85 }).addTo(map);
      const etaEl = document.getElementById('proEtaText');
      if (etaEl) etaEl.innerText = `~${realRouteEtaMin} دقيقة (${realRouteDistKm} كم)`;
      recalcTrip(false);
      return;
    }
  } catch (e) {}
  let totalDist = 0;
  for (let i = 0; i < waypoints.length - 1; i++) totalDist += haversineKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
  realRouteDistKm = Math.max(1, +(totalDist * 1.25).toFixed(2));
  realRouteEtaMin = Math.max(5, Math.round(realRouteDistKm * 2.5));
  if (routeLine && map) map.removeLayer(routeLine);
  if (map) routeLine = L.polyline(waypoints, { color: '#059669', weight: 4, dashArray: '6,6' }).addTo(map);
  recalcTrip(false);
}

async function reverseGeocodeEgypt(lat, lng, inputId) {
  const inp = document.getElementById(inputId); if (!inp) return;
  inp.value = 'جاري تحديد اسم الشارع والقرية...';
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${currentLang}&addressdetails=1`);
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.road || a.pedestrian || a.neighbourhood, a.village || a.suburb || a.town, a.city || a.county || a.state].filter(Boolean);
    inp.value = parts.length ? parts.join(' - ') : (data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  } catch (e) { inp.value = `موقع محدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`; }
}

let searchDebounce = null;
function handleSearchSuggestions(q, type) {
  const box = document.getElementById(`${type}Suggestions`); if (!box) return;
  if (!q.trim()) { box.classList.add('hidden'); return; }
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
    const localMatches = (gov.areas || []).filter(a => a.active && a.name.includes(q.trim())).map(a => ({ title: `${a.name} - ${gov.name}`, sub: 'منطقة / قرية', lat: gov.center[0], lng: gov.center[1] }));
    let osmMatches = [];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q.trim() + ' ' + gov.name + ' مصر')}&countrycodes=eg&accept-language=${currentLang}&addressdetails=1&limit=5`);
      const items = await res.json();
      if (Array.isArray(items)) {
        osmMatches = items.map(it => {
          const a = it.address || {};
          const title = [a.road, a.village || a.suburb || a.town, a.city || a.state].filter(Boolean).join(' - ') || it.display_name;
          return { title, sub: it.display_name, lat: parseFloat(it.lat), lng: parseFloat(it.lon) };
        });
      }
    } catch (e) {}
    const all = [...localMatches, ...osmMatches];
    box.innerHTML = '';
    if (!all.length) { box.innerHTML = '<div class="p-2 text-slate-400">لا توجد نتائج مطابقة</div>'; }
    else {
      all.forEach(m => {
        const div = document.createElement('div');
        div.className = 'p-2.5 hover:bg-emerald-50 cursor-pointer border-b';
        div.innerHTML = `<div class="font-bold text-slate-800 text-xs"><i class="fa-solid fa-location-dot text-emerald-600 ml-1"></i> ${esc(m.title)}</div><div class="text-[10px] text-slate-400 truncate">${esc(m.sub)}</div>`;
        div.onclick = () => window.pickDetailedPlace(type, m.title, m.lat, m.lng);
        box.appendChild(div);
      });
    }
    box.classList.remove('hidden');
  }, 300);
}

window.pickDetailedPlace = function(type, title, lat, lng) {
  document.getElementById(`${type}Input`).value = title;
  document.getElementById(`${type}Suggestions`).classList.add('hidden');
  const m = type === 'pickup' ? pickupMarker : dropoffMarker;
  if (m) m.setLatLng([lat, lng]);
  if (map) map.panTo([lat, lng]);
  recalcTrip(true);
};

function initMap() {
  if (map) return;
  const mapContainer = document.getElementById('map'); if (!mapContainer) return;
  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  map = L.map('map', { preferCanvas: true }).setView(activeGov.center, activeGov.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  const pIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const dIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  pickupMarker = L.marker(activeGov.center, { icon: pIcon, draggable: true }).addTo(map);
  dropoffMarker = L.marker([activeGov.center[0] - 0.015, activeGov.center[1] + 0.015], { icon: dIcon, draggable: true }).addTo(map);
  pickupMarker.on('dragend', () => { const ll = pickupMarker.getLatLng(); reverseGeocodeEgypt(ll.lat, ll.lng, 'pickupInput'); recalcTrip(true); });
  dropoffMarker.on('dragend', () => { const ll = dropoffMarker.getLatLng(); reverseGeocodeEgypt(ll.lat, ll.lng, 'dropoffInput'); recalcTrip(true); });
  map.on('click', e => { dropoffMarker.setLatLng(e.latlng); reverseGeocodeEgypt(e.latlng.lat, e.latlng.lng, 'dropoffInput'); recalcTrip(true); });
  document.getElementById('pickupInput').value = `ميدان المحطة - ${activeGov.name}`;
  document.getElementById('dropoffInput').value = `الشارع الرئيسي - ${activeGov.name}`;
  renderCustomerVehicles();
  recalcTrip(true);
}

function getCurrentLocation() {
  if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع.');
  navigator.geolocation.getCurrentPosition(p => {
    const loc = [p.coords.latitude, p.coords.longitude];
    if (pickupMarker) pickupMarker.setLatLng(loc);
    if (map) map.setView(loc, 16);
    reverseGeocodeEgypt(loc[0], loc[1], 'pickupInput');
    recalcTrip(true);
  });
}

function isHourInRange(h, start, end) {
  if (start === end) return false;
  return start < end ? (h >= start && h < end) : (h >= start || h < end);
}

function recalcTrip(fetchRoute = true) {
  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  const pLatLng = pickupMarker ? pickupMarker.getLatLng() : { lat: activeGov.center[0], lng: activeGov.center[1] };
  const dLatLng = dropoffMarker ? dropoffMarker.getLatLng() : { lat: activeGov.center[0] - 0.015, lng: activeGov.center[1] + 0.015 };
  if (fetchRoute && map) { updateOSRMRoute(pLatLng, dLatLng); return; }

  document.getElementById('calcDistanceText').innerText = `${realRouteDistKm} كم`;
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  const insFee = (DB.insuranceSettings?.enabled && window.__insuranceOptIn) ? safeNum(DB.insuranceSettings.fee, 0, 0) : 0;
  const stopFee = extraStops.length * 5;
  let total = veh.baseFare + (realRouteDistKm * veh.perKm) + insFee + stopFee;

  // التسعيرة الليلية التلقائية وجدولة الذروة
  const hr = new Date().getHours();
  const np = DB.nightPeakConfig || {};
  let autoBadge = '';
  if (np.autoNightEnabled && isHourInRange(hr, np.nightStartHour, np.nightEndHour)) {
    total *= (1 + safeNum(np.nightPercent, 15, 0) / 100);
    autoBadge = `تعريفة ليلية +${np.nightPercent}%`;
  } else if (np.autoPeakEnabled && isHourInRange(hr, np.peakStartHour, np.peakEndHour)) {
    total *= (1 + safeNum(np.peakPercent, 20, 0) / 100);
    autoBadge = `ذروة مجدولة +${np.peakPercent}%`;
  } else if (DB.features.surgeActive) {
    total *= safeNum(DB.features.surgeMultiplier, 1.3, 1);
    autoBadge = 'ذروة مضاعفة';
  }
  const sb = document.getElementById('surgeBadge');
  if (sb) { sb.innerText = autoBadge; sb.classList.toggle('hidden', !autoBadge); }

  let disc = safeNum(DB.activeDiscountPercent, 0, 0, 95);
  if (DB.partnerConfig?.enabled && DB.currentUser?.isPartner) disc = Math.max(disc, safeNum(DB.partnerConfig.discountPercent, 0, 0, 95));
  if (disc > 0) total -= (total * (disc / 100));
  total = Math.max(10, total);

  if (DB.customBidFare !== null && DB.features.biddingEnabled) {
    document.getElementById('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`;
  } else {
    document.getElementById('calcTotalFareText').innerText = `${total.toFixed(2)} ج.م`;
    const bi = document.getElementById('customBidInput'); if (bi) bi.value = Math.round(total);
    const bd = document.getElementById('customBidDisplay'); if (bd) bd.innerText = `${Math.round(total)} ج.م`;
  }
}

// ==========================================
// 4. المحافظات الـ 27 + العروض الجغرافية + طلب المشوار وتمريره
// ==========================================
function renderGovernoratesUI() {
  const select = document.getElementById('custGovernorateSelect');
  if (select) select.innerHTML = DB.governorates.map(g => `<option value="${esc(g.id)}" ${g.id === DB.selectedGovId ? 'selected' : ''}>${esc(g.name)} ${g.active ? '' : '(مغلقة)'}</option>`).join('');
  window.populateCustomerAreas();

  const grid = document.getElementById('adminGovernoratesGrid'); if (!grid) return;
  if (!document.getElementById('admGovSearchInp')) {
    const s = document.createElement('input'); s.id = 'admGovSearchInp'; s.placeholder = '🔍 ابحث باسم المحافظة أو القرية...';
    s.className = 'w-full border rounded-xl p-2.5 text-xs font-bold outline-none mb-2'; s.oninput = () => renderGovernoratesUI();
    grid.parentElement.insertBefore(s, grid);
  }
  const q = (document.getElementById('admGovSearchInp')?.value || '').trim();
  const list = DB.governorates.filter(g => !q || g.name.includes(q) || g.areas.some(a => a.name.includes(q)));
  grid.innerHTML = list.map(g => `
    <div class="p-3 border rounded-2xl ${g.active ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'} space-y-2">
      <div class="flex items-center justify-between">
        <div><b class="text-xs text-slate-800 block">${esc(g.name)}</b><span class="text-[10px] font-bold text-slate-500">القرى والمناطق: ${g.areas.length}</span></div>
        <button onclick="toggleGovernorateActive('${esc(g.id)}')" class="px-2.5 py-1 rounded-xl text-[11px] font-black text-white ${g.active ? 'bg-rose-600' : 'bg-emerald-600'}">${g.active ? 'إغلاق' : 'فتح'}</button>
      </div>
      <button onclick="window.openGovAreasModal('${esc(g.id)}')" class="w-full bg-white border border-slate-300 text-slate-800 font-bold py-1.5 rounded-xl text-[11px]">إدارة القرى والمناطق (${g.areas.length})</button>
    </div>
  `).join('');
}

window.populateCustomerAreas = function() {
  const sel = document.getElementById('custAreaSelect'); if (!sel) return;
  const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  sel.innerHTML = `<option value="">-- القرية / المنطقة --</option>` + (gov.areas || []).filter(a => a.active).map(a => `<option value="${esc(a.name)}">${esc(a.name)}</option>`).join('');
};

function handleGovernorateChange(govId) {
  const gov = DB.governorates.find(g => g.id === govId); if (!gov) return;
  DB.selectedGovId = govId; saveDB(DB);
  document.getElementById('activeGovBadge').innerText = gov.name;
  window.populateCustomerAreas();
  if (!gov.active) showTopAlert(`⚠️ الخدمة متوقفة مؤقتاً في محافظة (${gov.name}).`); else hideTopAlert();
  if (map) { map.flyTo(gov.center, gov.zoom); pickupMarker.setLatLng(gov.center); dropoffMarker.setLatLng([gov.center[0] - 0.015, gov.center[1] + 0.015]); recalcTrip(true); }
}

function toggleGovernorateActive(govId) {
  const gov = DB.governorates.find(g => g.id === govId); if (!gov) return;
  gov.active = !gov.active; saveDB(DB); renderGovernoratesUI(); addAuditLog(`${gov.active ? 'فتح' : 'إغلاق'} محافظة ${gov.name}`);
  if (DB.selectedGovId === govId) handleGovernorateChange(govId);
}
function showTopAlert(msg) { const b = document.getElementById('topAlertBar'); document.getElementById('topAlertMessage').innerText = msg; b.classList.remove('hidden'); }
function hideTopAlert() { document.getElementById('topAlertBar').classList.add('hidden'); }

function renderCustomerVehicles() {
  const g = document.getElementById('vehicleTypesGrid'); if (!g) return;
  g.innerHTML = DB.vehicles.filter(v => v.enabled).map(v => `
    <button onclick="selectVehicle('${esc(v.id)}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}">
      ${v.iconImage ? `<img src="${v.iconImage}" class="w-8 h-8 object-contain mb-1">` : `<i class="${esc(v.icon || 'fa-solid fa-car')} text-xl text-slate-600 mb-1"></i>`}
      <div class="font-black text-[11px]">${esc(v.name)}</div>
      <div class="text-[9px] text-emerald-700 font-bold">فتح ${v.baseFare}ج | كم ${v.perKm}ج</div>
      <div class="text-[8px] text-slate-500">انتظار ${v.waitPerMin || 0}ج/د</div>
    </button>
  `).join('');
}

function selectVehicle(id) { DB.selectedVehicleId = id; saveDB(DB); renderCustomerVehicles(); recalcTrip(false); }

function applyPromoCode() {
  const code = document.getElementById('promoCodeInput').value.trim().toUpperCase();
  const statusEl = document.getElementById('promoCodeStatus');
  const p = DB.promoCodes.find(x => x.code === code && x.active);
  if (!p) { DB.activeDiscountPercent = 0; statusEl.innerText = '❌ كود غير صحيح أو منتهي'; statusEl.classList.remove('hidden'); return recalcTrip(false); }
  if (p.govId && p.govId !== 'all' && p.govId !== DB.selectedGovId) {
    DB.activeDiscountPercent = 0; statusEl.innerText = '⚠️ هذا العرض مخصص لمحافظة أخرى.'; statusEl.classList.remove('hidden'); return recalcTrip(false);
  }
  if (p.happyHourStart && p.happyHourEnd) {
    const hr = new Date().getHours();
    if (!isHourInRange(hr, parseInt(p.happyHourStart), parseInt(p.happyHourEnd))) {
      DB.activeDiscountPercent = 0; statusEl.innerText = `⏰ الكود متاح فقط في الساعة السعيدة (${p.happyHourStart}:00 - ${p.happyHourEnd}:00).`; statusEl.classList.remove('hidden'); return recalcTrip(false);
    }
  }
  DB.activeDiscountPercent = p.discountPercent;
  statusEl.innerText = `🎉 تم تطبيق كود الخصم (${p.discountPercent}%)`; statusEl.classList.remove('hidden'); recalcTrip(false);
}

function adjustBidFare(amt) { const inp = document.getElementById('customBidInput'); const val = Math.max(10, (parseFloat(inp.value) || 30) + amt); inp.value = val; updateBidFare(val); }
function updateBidFare(val) { DB.customBidFare = safeNum(val, 10, 10); document.getElementById('customBidDisplay').innerText = `${DB.customBidFare} ج.م`; document.getElementById('calcTotalFareText').innerText = `${DB.customBidFare} ج.م`; }

function buildCaptainQueue(pLatLng, toAddress) {
  const custPhone = DB.currentUser?.phone || '';
  return DB.users.filter(u => {
    if (u.role !== 'captain' || u.status !== 'approved' || u.isAvailable === false || u.inTrip) return false;
    if (Array.isArray(u.blockedCustomers) && u.blockedCustomers.includes(custPhone)) return false;
    if (u.destFilter && u.destFilter.trim() && !toAddress.includes(u.destFilter.trim())) return false;
    return true;
  }).map(c => ({ captain: c, dist: haversineKm(pLatLng.lat, pLatLng.lng, c.lat || pLatLng.lat, c.lng || pLatLng.lng) }))
    .filter(x => x.dist <= (DB.dispatchConfig?.maxRadiusKm || 25)).sort((a, b) => a.dist - b.dist);
}

function dispatchCurrentOffer() {
  if (!dispatchQueue.length || dispatchIdx >= dispatchQueue.length) {
    stopIncomingTripAlert(); resetCaptain();
    const btn = document.getElementById('btnRequestRide'); if (btn) { btn.disabled = false; btn.innerText = 'طلب المشوار فوراً'; }
    const st = document.getElementById('custStatusBadge'); if (st) st.innerText = 'لم يقبل أي كابتن، حاول مجدداً';
    return;
  }
  const item = dispatchQueue[dispatchIdx++], cap = item.captain;
  activeTripData.assignedCaptainPhone = cap.phone; activeTripData.assignedCaptainName = cap.name;
  document.getElementById('btnRequestRide').innerText = `مرسل لأقرب كابتن (${cap.name} - ${item.dist.toFixed(1)} كم)...`;
  document.getElementById('custStatusBadge').innerText = `بانتظار رد ${cap.name}`;
  document.getElementById('driverCardName').innerText = `الكابتن: ${cap.name}`;
  document.getElementById('driverCardCar').innerText = cap.vehicle || activeTripData.vehicle;
  document.getElementById('driverCardPlate').innerText = cap.plate || 'غير محدد';
  document.getElementById('driverIdleBox')?.classList.add('hidden');
  document.getElementById('driverOfferBox')?.classList.remove('hidden');
  const riderInfo = activeTripData.riderName ? ` | 👤 الراكب: ${activeTripData.riderName} (${activeTripData.riderPhone})` : '';
  const prefsInfo = activeTripData.prefs?.length ? ` | ⚙️ ${activeTripData.prefs.join(', ')}` : '';
  document.getElementById('offerFromText').innerText = activeTripData.from + riderInfo + prefsInfo;
  document.getElementById('offerToText').innerText = activeTripData.to + (extraStops.length ? ` (محطات: ${extraStops.map(s => s.name).join(' ، ')})` : '');
  document.getElementById('offerVehicleText').innerText = activeTripData.vehicle;
  document.getElementById('offerFareText').innerText = `${activeTripData.fare} ج.م`;
  startIncomingTripAlert(activeTripData);

  let timeLeft = parseInt(DB.dispatchConfig?.countdownSeconds) || 45;
  const timerEl = document.getElementById('countdownTimer'); if (timerEl) timerEl.innerText = timeLeft;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--; if (timerEl) timerEl.innerText = timeLeft;
    if (timeLeft <= 0) { clearInterval(countdownInterval); dispatchCurrentOffer(); }
  }, 1000);
}

function handleCustomerRequestRide() {
  const activeGov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
  if (!activeGov.active) return alert(`⚠️ الخدمة مغلقة حالياً في محافظة (${activeGov.name}).`);
  const cu = userIndex.get(DB.currentUser?.phone);
  if (cu && (cu.cooldownUntil || 0) > Date.now()) {
    return alert(`⏳ حسابك موقوف مؤقتاً لمدة ${Math.ceil((cu.cooldownUntil - Date.now()) / 60000)} دقيقة بسبب تكرار الإلغاء.`);
  }
  const isOther = document.getElementById('riderModeSel')?.value === 'other';
  const rName = document.getElementById('otherRiderName')?.value.trim() || '';
  const rPhone = document.getElementById('otherRiderPhone')?.value.trim() || '';
  if (isOther && (!rName || !rPhone)) return alert('⚠️ أدخل اسم ورقم هاتف الراكب الفعلي.');

  // التحقق من الحجز المجدول لموعد لاحق
  const schedMode = document.getElementById('rideSchedMode')?.value;
  const schedDT = document.getElementById('rideSchedDateTime')?.value;
  if (schedMode === 'later') {
    if (!schedDT) return alert('⚠️ اختر تاريخ وساعة الرحلة المجدولة.');
    const fare = safeNum(parseFloat(document.getElementById('calcTotalFareText').innerText), 20, 10);
    DB.scheduledTrips.push({
      id: 'SCH-' + Date.now().toString().slice(-5), customerPhone: DB.currentUser?.phone || '', customerName: DB.currentUser?.name || 'عميل',
      from: document.getElementById('pickupInput').value, to: document.getElementById('dropoffInput').value,
      datetime: schedDT, fare, govName: activeGov.name, assignedCaptain: ''
    });
    saveDB(DB);
    return alert(`📅 تم حجز رحلتك المجدولة بنجاح لموعد (${schedDT}) بسعر ${fare} ج.م!`);
  }

  const pLatLng = pickupMarker ? pickupMarker.getLatLng() : { lat: activeGov.center[0], lng: activeGov.center[1] };
  const toAddr = document.getElementById('dropoffInput').value;
  dispatchQueue = buildCaptainQueue(pLatLng, toAddr);
  dispatchIdx = 0;
  if (!dispatchQueue.length) return alert('⚠️ لا يوجد كابتن متاح مطابق لنطاقك حالياً.');

  initAudioContext();
  const fare = safeNum(parseFloat(document.getElementById('calcTotalFareText').innerText), 20, 10);
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  const insured = !!(DB.insuranceSettings?.enabled && window.__insuranceOptIn);
  const policyNo = insured ? ('INS-' + Math.floor(100000 + Math.random() * 899999)) : '';
  const pinOtp = String(Math.floor(1000 + Math.random() * 9000));
  const prefs = Array.from(document.querySelectorAll('.ride-pref-chk:checked')).map(c => c.value);

  activeTripData = {
    id: 'TRP-' + Date.now().toString().slice(-6), govId: activeGov.id, govName: activeGov.name,
    customerPhone: DB.currentUser?.phone || '', customerName: DB.currentUser?.name || 'عميل',
    riderName: isOther ? rName : '', riderPhone: isOther ? rPhone : '',
    from: document.getElementById('pickupInput').value, to: toAddr,
    vehicle: veh.name, fare, insured, policyNo, pinOtp, prefs,
    date: new Date().toLocaleString('ar-EG')
  };

  DB.demandPoints.push({ lat: pLatLng.lat, lng: pLatLng.lng, ts: Date.now() });
  if (DB.demandPoints.length > 40) DB.demandPoints.shift();
  if (insured) DB.insuredTripsLog.push({ policyNo, from: activeTripData.from, to: activeTripData.to, fee: DB.insuranceSettings.fee, date: activeTripData.date });
  saveDB(DB, false);

  const otpEl = document.getElementById('patchTripOtpVal'); if (otpEl) otpEl.innerText = pinOtp;
  const otpInp = document.getElementById('capOtpInput'); if (otpInp) otpInp.value = '';
  document.getElementById('btnRequestRide').disabled = true;
  dispatchCurrentOffer();
  syncSessionToFirebase({ trip: activeTripData, phase: 'searching', phaseLabel: 'جاري البحث عن كابتن', ts: Date.now() });
}
// ==========================================
// 5. محرك الصوت + نطق إشعارات العميل + الترجمة السريعة AR/EN
// ==========================================
let alertAudioCtx = null, isAlertRinging = false, alertLoopTimeout = null;

function initAudioContext() {
  if (!alertAudioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) alertAudioCtx = new AC();
  }
  if (alertAudioCtx && alertAudioCtx.state === 'suspended') alertAudioCtx.resume();
}
document.addEventListener('click', initAudioContext);

function playHighPitchDispatchAlarm(cb) {
  initAudioContext();
  if (!alertAudioCtx) { if (cb) cb(); return; }
  const now = alertAudioCtx.currentTime;
  const o1 = alertAudioCtx.createOscillator(), o2 = alertAudioCtx.createOscillator(), g = alertAudioCtx.createGain();
  o1.type = 'sawtooth'; o2.type = 'square';
  o1.frequency.setValueAtTime(750, now); o1.frequency.exponentialRampToValueAtTime(1450, now + 0.25);
  o1.frequency.linearRampToValueAtTime(800, now + 0.5); o1.frequency.exponentialRampToValueAtTime(1600, now + 0.75);
  o2.frequency.setValueAtTime(850, now); o2.frequency.exponentialRampToValueAtTime(1550, now + 0.25);
  o2.frequency.linearRampToValueAtTime(900, now + 0.5); o2.frequency.exponentialRampToValueAtTime(1700, now + 0.75);
  g.gain.setValueAtTime(1.0, now); g.gain.setValueAtTime(1.0, now + 0.85); g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  o1.connect(g); o2.connect(g); g.connect(alertAudioCtx.destination);
  o1.start(now); o2.start(now); o1.stop(now + 1.1); o2.stop(now + 1.1);
  if (cb) setTimeout(() => { if (isAlertRinging) cb(); }, 1150);
}

function speakTripDetailsArabic(trip) {
  if (!isAlertRinging || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`يا كابتن! في مشوار جديد واصلك. الركوب من: ${trip.from}. والجهة إلى: ${trip.to}. والأجرة: ${Math.round(trip.fare)} جنيه مصري.`);
  u.lang = 'ar-EG'; u.rate = 0.95; u.pitch = 1.1; u.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.find(v => v.lang === 'ar-EG') || voices.find(v => v.lang.startsWith('ar'));
  if (ar) u.voice = ar;
  u.onend = () => { if (isAlertRinging) alertLoopTimeout = setTimeout(() => { if (isAlertRinging) playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip)); }, 1200); };
  window.speechSynthesis.speak(u);
}

function speakCustomerNotice(text) {
  if (!('speechSynthesis' in window) || DB.currentUser?.role === 'captain') return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentLang === 'en' ? 'en-US' : 'ar-EG';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function startIncomingTripAlert(trip) { isAlertRinging = true; initAudioContext(); clearTimeout(alertLoopTimeout); playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip)); }
function stopIncomingTripAlert() { isAlertRinging = false; clearTimeout(alertLoopTimeout); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
function testDriverAlertSound() {
  initAudioContext(); stopIncomingTripAlert(); isAlertRinging = true;
  playHighPitchDispatchAlarm(() => { speakTripDetailsArabic({ from: "ميدان التحرير", to: "مصر الجديدة", fare: 45 }); setTimeout(stopIncomingTripAlert, 6000); });
}

window.toggleAppLanguage = function() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  localStorage.setItem('TAWSILA_LANG', currentLang);
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  const mapTxt = {
    ar: { app: 'توصيلة', req: 'طلب المشوار فوراً', pick: 'مكان الركوب', drop: 'جهة الوصول' },
    en: { app: 'Tawsila Egypt', req: 'Request Ride Now', pick: 'Pickup Location', drop: 'Dropoff Destination' }
  }[currentLang];
  const hn = document.getElementById('headerAppName'); if (hn) hn.innerText = mapTxt.app;
  const br = document.getElementById('btnRequestRide'); if (br && !br.disabled) br.innerText = mapTxt.req;
  const lb = document.getElementById('patchLangBtn'); if (lb) lb.innerText = currentLang === 'ar' ? 'EN' : 'AR';
};

// ==========================================
// 6. دورة الكابتن الكاملة + الانتظار + OTP + الإيصال عبر واتساب
// ==========================================
function captainAcceptTrip() {
  clearInterval(countdownInterval); stopIncomingTripAlert();
  document.getElementById('driverOfferBox')?.classList.add('hidden');
  document.getElementById('driverActiveTripBox')?.classList.remove('hidden');
  document.getElementById('btnCaptainArrived')?.classList.remove('hidden');
  document.getElementById('btnCaptainStartTrip')?.classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip')?.classList.add('hidden');
  document.getElementById('driverActiveTripFare').innerText = `الأجرة: ${activeTripData.fare} ج.م`;
  document.getElementById('customerDriverCard')?.classList.remove('hidden');
  document.getElementById('custStatusBadge').innerText = 'الكابتن قادم لموقعك';
  const cap = userIndex.get(activeTripData?.assignedCaptainPhone);
  if (cap) { cap.inTrip = true; saveDB(DB, false); }
  syncSessionToFirebase({ trip: activeTripData, phase: 'accepted', phaseLabel: 'الكابتن قادم لموقعك', ts: Date.now() });
  speakCustomerNotice(currentLang === 'en' ? 'Your captain accepted the ride and is on the way' : 'تم قبول مشوارك، والكابتن في طريقه إليك الآن');
}

function captainRejectTrip() {
  clearInterval(countdownInterval); stopIncomingTripAlert();
  if (dispatchIdx < dispatchQueue.length) { dispatchCurrentOffer(); return; }
  resetCaptain();
  const btn = document.getElementById('btnRequestRide'); if (btn) { btn.disabled = false; btn.innerText = 'طلب المشوار فوراً'; }
  const st = document.getElementById('custStatusBadge'); if (st) st.innerText = 'تم الرفض، جرب ثانية';
  clearActiveSession();
}

function captainNotifyArrived() {
  document.getElementById('btnCaptainArrived')?.classList.add('hidden');
  document.getElementById('btnCaptainStartTrip')?.classList.remove('hidden');
  syncSessionToFirebase({ trip: activeTripData, phase: 'arrived', phaseLabel: 'الكابتن وصل للموقع', ts: Date.now() });
  speakCustomerNotice(currentLang === 'en' ? 'Your captain has arrived' : 'وصل الكابتن أمام موقعك الآن');
  alert('🔔 إشعار للعميل: وصل الكابتن وهو بانتظارك!');
}

function captainStartTrip() {
  if (DB.otpConfig?.enabled && activeTripData?.pinOtp) {
    const entered = (document.getElementById('capOtpInput')?.value || '').trim();
    if (entered !== activeTripData.pinOtp) return alert('❌ رمز أمان المشوار (4 أرقام) غير صحيح! اطلب الرمز من العميل.');
  }
  document.getElementById('btnCaptainStartTrip')?.classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip')?.classList.remove('hidden');
  syncSessionToFirebase({ trip: activeTripData, phase: 'started', phaseLabel: 'الرحلة قيد التنفيذ', ts: Date.now() });
  speakCustomerNotice(currentLang === 'en' ? 'Your trip has started' : 'بدأت رحلتك مع توصيلة، نتمنى لك رحلة سعيدة');
}

function captainCompleteTrip() {
  if (waitTimerInt) { clearInterval(waitTimerInt); waitTimerInt = null; }
  if (activeTripData) activeTripData.fare = +(Number(activeTripData.fare) + activeWaitCost).toFixed(2);
  waitSeconds = 0; activeWaitCost = 0;
  const clk = document.getElementById('capWaitClock'); if (clk) clk.innerText = '00:00';
  const wct = document.getElementById('capWaitCostText'); if (wct) wct.innerText = '0.00';

  const tripSnap = activeTripData ? { ...activeTripData } : null;
  const fare = tripSnap?.fare || 0;
  const cust = userIndex.get(tripSnap?.customerPhone) || (DB.currentUser?.role === 'customer' ? DB.currentUser : null);
  if (cust && (cust.wallet || 0) >= fare) {
    cust.wallet = +(cust.wallet - fare).toFixed(2);
    if (DB.loyaltyConfig?.enabled) cust.loyaltyPoints = (cust.loyaltyPoints || 0) + safeNum(DB.loyaltyConfig.pointsPerTrip, 10, 0);
    if (DB.currentUser && DB.currentUser.phone === cust.phone) {
      DB.currentUser.wallet = cust.wallet;
      DB.currentUser.loyaltyPoints = cust.loyaltyPoints;
    }
  }

  const cap = userIndex.get(tripSnap?.assignedCaptainPhone) || (DB.currentUser?.role === 'captain' ? DB.currentUser : null);
  let comm = 0;
  if (cap) {
    cap.inTrip = false;
    cap.dailyTrips = (cap.dailyTrips || 0) + 1;
    const hasPkg = (cap.packageUntil || 0) > Date.now();
    const rate = hasPkg ? 0 : (safeNum(DB.referralConfig?.tripCommissionPercent, 10, 0, 80) / 100);
    comm = +(fare * rate).toFixed(2);
    cap.wallet = +((cap.wallet || 0) - comm).toFixed(2);
    if (DB.currentUser && DB.currentUser.phone === cap.phone) { DB.currentUser.wallet = cap.wallet; DB.currentUser.dailyTrips = cap.dailyTrips; }
    const today = new Date().toISOString().slice(0, 10);
    if (DB.questConfig?.enabled && cap.dailyTrips >= DB.questConfig.targetTrips && cap.questClaimedDate !== today) {
      cap.questClaimedDate = today;
      cap.wallet = +(cap.wallet + safeNum(DB.questConfig.bonusAmount, 0, 0)).toFixed(2);
      alert(`🏆 مبروك! تم تحقيق الهدف اليومي (${DB.questConfig.targetTrips} رحلات) وإضافة مكافأة ${DB.questConfig.bonusAmount} ج.م!`);
    }
  }

  if (tripSnap) {
    DB.tripHistory.push({ ...tripSnap, fare, commission: comm, completedAt: new Date().toLocaleString('ar-EG') });
    addLedgerEntry('trip_captain', +(fare - comm).toFixed(2), `رحلة ${tripSnap.id}`);
    if (comm > 0) addLedgerEntry('platform_profit', comm, `عمولة رحلة ${tripSnap.id}`);
    creditRegionalAgentCommission(tripSnap.govName || '', fare);
  }

  extraStops = [];
  saveDB(DB); updateNavUI(); resetCaptain(); clearActiveSession();
  if (captainLiveMarker && map) { map.removeLayer(captainLiveMarker); captainLiveMarker = null; }
  const btnReq = document.getElementById('btnRequestRide'); if (btnReq) { btnReq.disabled = false; btnReq.innerText = 'طلب المشوار فوراً'; }
  document.getElementById('customerDriverCard')?.classList.add('hidden');
  document.getElementById('custStatusBadge').innerText = 'اكتملت الرحلة';
  activeTripData = null;

  if (tripSnap) window.openPostTripSummaryModal(tripSnap);
  else document.getElementById('ratingModal')?.classList.remove('hidden');
}

function resetCaptain() {
  document.getElementById('driverOfferBox')?.classList.add('hidden');
  document.getElementById('driverActiveTripBox')?.classList.add('hidden');
  document.getElementById('driverIdleBox')?.classList.remove('hidden');
}

window.toggleWaitTimer = function() {
  const btn = document.getElementById('btnToggleWaitTimer');
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  if (waitTimerInt) {
    clearInterval(waitTimerInt); waitTimerInt = null;
    btn.innerText = 'استئناف'; btn.className = 'bg-amber-500 text-slate-900 px-3 py-1 rounded-lg font-black';
  } else {
    btn.innerText = 'إيقاف'; btn.className = 'bg-rose-600 text-white px-3 py-1 rounded-lg font-black';
    waitTimerInt = setInterval(() => {
      waitSeconds++;
      const m = Math.floor(waitSeconds / 60), s = waitSeconds % 60;
      document.getElementById('capWaitClock').innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      activeWaitCost = +((waitSeconds / 60) * (veh.waitPerMin || 0)).toFixed(2);
      document.getElementById('capWaitCostText').innerText = activeWaitCost.toFixed(2);
      if (activeTripData) document.getElementById('driverActiveTripFare').innerText = `الأجرة: ${(activeTripData.fare + activeWaitCost).toFixed(2)} ج.م`;
    }, 1000);
  }
};

// ==========================================
// 7. النوافذ المشتركة والميزات المضافة (المفضلة، التوقفات، السفر، المفقودات، الوقود، السحب/الإيداع، QR)
// ==========================================
function showGM(title, html) {
  document.getElementById('gmTitle').innerText = title;
  document.getElementById('gmBody').innerHTML = html;
  document.getElementById('patchGenericModal').classList.remove('hidden');
}

window.openPostTripSummaryModal = function(trip) {
  const waMsg = `🧾 *فاتورة رحلة توصيلة مصر*\nرقم الرحلة: ${trip.id}\nمن: ${trip.from}\nإلى: ${trip.to}\nالكابتن: ${trip.assignedCaptainName || '-'}\n${trip.policyNo ? `بوليصة التأمين: ${trip.policyNo}\n` : ''}*الإجمالي: ${trip.fare} ج.م*\nشكراً لاستخدامك تطبيق توصيلة!`;
  const waHref = `https://wa.me/${(trip.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMsg)}`;
  showGM('اكتملت الرحلة - الفاتورة والتقييم', `
    <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-center">
      <b class="text-emerald-800 text-sm block">تم إنهاء المشوار (${esc(trip.id)})</b>
      <div class="text-xl font-black text-slate-900">${trip.fare} ج.م</div>
      <div class="text-[11px] text-slate-600">${esc(trip.from)} ⬅️ ${esc(trip.to)}</div>
    </div>
    <a href="${waHref}" target="_blank" class="w-full bg-green-600 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2">
      <i class="fa-brands fa-whatsapp text-base"></i> إرسال إيصال الرحلة عبر واتساب
    </a>
    <button onclick="document.getElementById('patchGenericModal').classList.add('hidden');document.getElementById('ratingModal').classList.remove('hidden');" class="w-full bg-amber-400 text-slate-900 font-black py-2 rounded-xl">⭐ تقييم الرحلة الآن</button>
    ${DB.currentUser?.role === 'captain' && trip.customerPhone ? `<button onclick="window.openCapRateBlockModal('${esc(trip.customerPhone)}','${esc(trip.customerName)}')" class="w-full bg-rose-100 text-rose-800 font-bold py-2 rounded-xl">تقييم أو حظر العميل</button>` : ''}
  `);
};

// الأماكن المفضلة (البيت / العمل) + تعدد المحطات (Multi-stop)
window.saveFavoritePlace = function(slot) {
  const u = userIndex.get(DB.currentUser?.phone);
  if (!u) return alert('سجل دخولك أولاً لحفظ الأماكن المفضلة.');
  const addr = document.getElementById('dropoffInput')?.value.trim();
  if (!addr) return alert('حدد وجهة الوصول أولاً لحفظها.');
  const ll = dropoffMarker ? dropoffMarker.getLatLng() : { lat: 26.5569, lng: 31.6948 };
  u.favorites = u.favorites || {};
  u.favorites[slot] = { addr, lat: ll.lat, lng: ll.lng };
  DB.currentUser.favorites = u.favorites;
  saveDB(DB);
  alert(`⭐ تم حفظ "${addr}" كموقع (${slot === 'home' ? 'البيت' : 'العمل'})!`);
};
window.useFavoritePlace = function(slot) {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  const fav = u?.favorites?.[slot];
  if (!fav) return alert(`لم تقم بحفظ موقع (${slot === 'home' ? 'البيت' : 'العمل'}) بعد. حدده في خانة الوصول ثم اضغط حفظ.`);
  window.pickDetailedPlace('dropoff', fav.addr, fav.lat, fav.lng);
};
window.addExtraStopPoint = function() {
  const name = prompt('اكتب اسم محطة التوقف الوسطية (مثال: أمام الصيدلية أو ATM):');
  if (!name || !name.trim()) return;
  const pLL = pickupMarker ? pickupMarker.getLatLng() : { lat: 26.55, lng: 31.69 };
  const dLL = dropoffMarker ? dropoffMarker.getLatLng() : { lat: 26.56, lng: 31.70 };
  extraStops.push({ name: name.trim(), lat: (pLL.lat + dLL.lat) / 2, lng: (pLL.lng + dLL.lng) / 2 });
  window.renderExtraStopsChips();
  recalcTrip(true);
};
window.renderExtraStopsChips = function() {
  const box = document.getElementById('patchExtraStopsBox'); if (!box) return;
  box.innerHTML = extraStops.map((s, i) => `<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg font-bold text-[10px]">📍 ${esc(s.name)} <button type="button" onclick="extraStops.splice(${i},1);renderExtraStopsChips();recalcTrip(true);" class="text-rose-700 font-black">✕</button></span>`).join('');
};

// رحلات السفر بين المحافظات ومشاركة المقاعد (Intercity Carpooling)
window.openIntercityModal = function() {
  if (!DB.intercityConfig?.enabled) return alert('رحلات السفر بين المحافظات متوقفة حالياً.');
  const isCap = DB.currentUser?.role === 'captain' || DB.currentUser?.role === 'admin';
  showGM('السفر بين المحافظات ومشاركة المقاعد', `
    ${isCap ? `
      <form onsubmit="window.publishIntercityTrip(event)" class="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl space-y-2">
        <b class="block text-emerald-900">نشر رحلة سفر جديدة (للكباتن):</b>
        <div class="grid grid-cols-2 gap-1.5">
          <select id="icFrom" class="border rounded-lg p-1.5 font-bold">${DB.governorates.map(g => `<option>${esc(g.name)}</option>`).join('')}</select>
          <select id="icTo" class="border rounded-lg p-1.5 font-bold">${DB.governorates.slice().reverse().map(g => `<option>${esc(g.name)}</option>`).join('')}</select>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          <input id="icDate" type="datetime-local" required class="col-span-2 border rounded-lg p-1 font-bold">
          <input id="icSeats" type="number" min="1" max="7" value="4" required placeholder="مقاعد" class="border rounded-lg p-1 font-bold">
        </div>
        <div class="flex gap-1.5">
          <input id="icSeatPrice" type="number" min="20" required placeholder="سعر المقعد (ج.م)" class="flex-grow border rounded-lg p-1.5 font-bold">
          <button class="bg-emerald-600 text-white px-3 rounded-lg font-black">نشر</button>
        </div>
      </form>` : ''}
    <div class="space-y-2 max-h-60 overflow-y-auto">
      ${(DB.intercityTrips || []).map((t, i) => `
        <div class="p-2.5 bg-slate-50 border rounded-xl space-y-1">
          <div class="flex justify-between"><b>${esc(t.fromGov)} ⬅️ ${esc(t.toGov)}</b><b class="text-emerald-700">${t.seatPrice} ج/مقعد</b></div>
          <div class="text-[11px] text-slate-600">الكابتن: ${esc(t.captainName)} | الموعد: ${esc(t.date)} | المتاح: <b>${t.seatsLeft} مقاعد</b></div>
          ${t.seatsLeft > 0 ? `<button onclick="window.bookIntercitySeat(${i})" class="w-full bg-slate-900 text-white py-1.5 rounded-lg font-bold">حجز مقعد (أو مقاعد)</button>` : '<span class="text-rose-600 font-bold">مكتملة</span>'}
        </div>
      `).join('') || '<p class="text-center text-slate-400 py-4">لا توجد رحلات سفر منشورة حالياً</p>'}
    </div>
  `);
};
window.publishIntercityTrip = function(e) {
  e.preventDefault();
  DB.intercityTrips.push({
    id: 'IC-' + Date.now(), captainName: DB.currentUser?.name || 'كابتن', captainPhone: DB.currentUser?.phone || '',
    fromGov: document.getElementById('icFrom').value, toGov: document.getElementById('icTo').value,
    date: document.getElementById('icDate').value.replace('T', ' '), seatsLeft: safeNum(document.getElementById('icSeats').value, 4, 1, 14),
    seatPrice: safeNum(document.getElementById('icSeatPrice').value, 100, 10), bookings: []
  });
  saveDB(DB); window.openIntercityModal();
};
window.bookIntercitySeat = function(idx) {
  if (!DB.currentUser) return alert('سجل دخولك أولاً.');
  const t = DB.intercityTrips[idx]; if (!t || t.seatsLeft < 1) return;
  const cnt = parseInt(prompt(`كم مقعداً تريد حجزه؟ (المتاح: ${t.seatsLeft})`, '1'));
  if (!cnt || cnt < 1 || cnt > t.seatsLeft) return alert('عدد مقاعد غير صالح.');
  t.seatsLeft -= cnt;
  t.bookings.push({ name: DB.currentUser.name, phone: DB.currentUser.phone, seats: cnt });
  saveDB(DB); window.openIntercityModal();
  alert(`✅ تم حجز ${cnt} مقعد في رحلة ${t.fromGov} ⬅️ ${t.toGov} (الإجمالي: ${cnt * t.seatPrice} ج.م)!`);
};

// الرحلات المجدولة مسبقاً (حجز مسبق + قبول من الكابتن)
window.openScheduledRidesModal = function() {
  const list = DB.scheduledTrips || [];
  showGM('الرحلات المجدولة مسبقاً', list.length ? list.map((s, i) => `
    <div class="p-2.5 bg-slate-50 border rounded-xl space-y-1">
      <div class="flex justify-between"><b>${esc(s.id)} (${esc(s.govName)})</b><b class="text-emerald-700">${s.fare} ج.م</b></div>
      <div class="text-[11px]">من: ${esc(s.from)} ⬅️ إلى: ${esc(s.to)}</div>
      <div class="text-[11px] text-blue-700 font-bold">⏰ الموعد: ${esc(s.datetime)} | الحالة: ${s.assignedCaptain ? 'محجوزة لـ ' + esc(s.assignedCaptain) : 'متاحة للكباتن'}</div>
      ${(DB.currentUser?.role === 'captain' && !s.assignedCaptain) ? `<button onclick="DB.scheduledTrips[${i}].assignedCaptain='${esc(DB.currentUser.name)}';saveDB(DB);window.openScheduledRidesModal();" class="w-full bg-emerald-600 text-white py-1 rounded-lg font-bold">تثبيت الرحلة المجدولة باسمي</button>` : ''}
    </div>
  `).join('') : '<p class="text-center text-slate-400 py-4">لا توجد رحلات مجدولة حالياً</p>');
};

// دفتر مصاريف الوقود والصيانة وصافي الربح للكابتن
window.openCapFuelTrackerModal = function() {
  const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  if (!cap) return;
  cap.fuelLogs = cap.fuelLogs || [];
  const totalFuel = cap.fuelLogs.reduce((s, f) => s + safeNum(f.cost, 0, 0), 0);
  const grossEarnings = (DB.tripHistory || []).filter(t => t.assignedCaptainPhone === cap.phone).reduce((s, t) => s + (t.fare - (t.commission || 0)), 0);
  const netProfit = +(grossEarnings - totalFuel).toFixed(2);
  showGM('دفتر الوقود والصيانة وصافي الربح', `
    <div class="grid grid-cols-3 gap-1.5 text-center">
      <div class="bg-emerald-50 p-2 rounded-xl border"><span>أرباح الرحلات</span><b class="block text-emerald-700">${grossEarnings.toFixed(1)} ج</b></div>
      <div class="bg-rose-50 p-2 rounded-xl border"><span>الوقود والصيانة</span><b class="block text-rose-700">${totalFuel.toFixed(1)} ج</b></div>
      <div class="bg-slate-900 text-amber-300 p-2 rounded-xl"><span>صافي الربح</span><b class="block">${netProfit} ج</b></div>
    </div>
    <form onsubmit="window.addCapFuelLog(event)" class="grid grid-cols-3 gap-1.5">
      <select id="flType" class="border rounded-lg p-1.5 font-bold"><option>بنزين / غاز</option><option>تغيير زيت</option><option>صيانة وقطع غيار</option></select>
      <input id="flCost" type="number" required min="1" placeholder="التكلفة (ج.م)" class="border rounded-lg p-1.5 font-bold">
      <button class="bg-emerald-600 text-white font-black rounded-lg">إضافة</button>
    </form>
    <div class="max-h-40 overflow-y-auto space-y-1">${cap.fuelLogs.slice().reverse().map(f => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><span>${esc(f.type)} (${esc(f.date)})</span><b class="text-rose-700">- ${f.cost} ج.م</b></div>`).join('')}</div>
  `);
};
window.addCapFuelLog = function(e) {
  e.preventDefault();
  const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  cap.fuelLogs = cap.fuelLogs || [];
  cap.fuelLogs.push({ type: document.getElementById('flType').value, cost: safeNum(document.getElementById('flCost').value, 0, 1), date: new Date().toLocaleDateString('ar-EG') });
  saveDB(DB); window.openCapFuelTrackerModal();
};

// المفقودات الذكي بالصور (Lost & Found Photo Board)
window.openLostFoundModal = function() {
  window.__lfImg = '';
  showGM('لوحة المفقودات بالصور (Lost & Found)', `
    <form onsubmit="window.subLostFound(event)" class="space-y-2 bg-slate-50 p-2.5 rounded-xl border">
      <input id="lfTripId" placeholder="رقم الرحلة (اختياري)" class="w-full border rounded-lg p-1.5 font-mono font-bold">
      <input id="lfDesc" required placeholder="وصف الغرض المفقود / المعثور عليه..." class="w-full border rounded-lg p-1.5 font-bold">
      <input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__lfImg=r)" class="text-[10px] w-full">
      <button class="w-full bg-indigo-600 text-white font-black py-2 rounded-xl">نشر في سجل المفقودات</button>
    </form>
    <div class="max-h-52 overflow-y-auto space-y-2">
      ${(DB.lostFoundItems || []).slice().reverse().map(it => `
        <div class="p-2 border rounded-xl bg-white flex gap-2 items-center">
          ${it.image ? `<img src="${it.image}" onclick="window.open('${it.image}')" class="w-14 h-14 rounded-lg object-cover border cursor-pointer">` : ''}
          <div class="flex-grow"><b>${esc(it.desc)}</b><div class="text-[10px] text-slate-500">بواسطة: ${esc(it.by)} (${esc(it.phone)}) ${it.tripId ? `• رحلة ${esc(it.tripId)}` : ''}</div></div>
        </div>
      `).join('') || '<p class="text-center text-slate-400">لا توجد مفقودات منشورة</p>'}
    </div>
  `);
};
window.subLostFound = function(e) {
  e.preventDefault();
  DB.lostFoundItems.push({ id: 'LF-' + Date.now(), tripId: document.getElementById('lfTripId').value.trim(), desc: document.getElementById('lfDesc').value.trim(), image: window.__lfImg || '', by: DB.currentUser?.name || 'مستخدم', phone: DB.currentUser?.phone || '' });
  saveDB(DB); window.openLostFoundModal();
};

// السحب والإيداع المطور (عميل + كابتن)
window.openWalletModal = function() { window.openWalletOpsModal('deposit'); };
window.closeWalletModal = function() { document.getElementById('walletModal')?.classList.add('hidden'); document.getElementById('patchGenericModal')?.classList.add('hidden'); };
window.openCapWalletAction = function(op) { window.openWalletOpsModal(op); };
window.confirmCustomerRecharge = function() { window.openWalletOpsModal('deposit'); };

window.openWalletOpsModal = function(mode) {
  if (!DB.currentUser) return alert('يرجى تسجيل الدخول أولاً.');
  const realUser = userIndex.get(DB.currentUser.phone) || DB.currentUser;
  const isCap = realUser.role === 'captain';
  const cfg = DB.walletSystemConfig, pc = DB.paymentConfig;
  const methods = (pc.methods || []).filter(m => m.enabled);
  window.__tmpReceipt = '';

  const tabs = `
    <div class="flex gap-1 bg-slate-100 p-1 rounded-xl font-bold mb-2">
      <button type="button" onclick="window.openWalletOpsModal('deposit')" class="flex-1 py-1.5 rounded-lg ${mode==='deposit'?'bg-emerald-600 text-white':'text-slate-600'}">إيداع</button>
      <button type="button" onclick="window.openWalletOpsModal('withdraw')" class="flex-1 py-1.5 rounded-lg ${mode==='withdraw'?'bg-amber-500 text-slate-900':'text-slate-600'}">سحب</button>
      <button type="button" onclick="window.openWalletOpsModal('history')" class="flex-1 py-1.5 rounded-lg ${mode==='history'?'bg-slate-900 text-white':'text-slate-600'}">طلباتي</button>
    </div>`;

  if (mode === 'deposit') {
    const allowed = isCap ? cfg.captainDepositEnabled : cfg.customerDepositEnabled;
    showGM(`إيداع المحفظة (${safeNum(realUser.wallet, 0, 0).toFixed(2)} ج.م)`, tabs + (!allowed ? '<p class="text-center text-rose-700 font-bold p-3">الإيداع متوقف حالياً.</p>' : `
      <form onsubmit="window.submitWalletOp(event,'deposit')" class="space-y-2">
        <select id="uwMeth" onchange="window.updateDepTarget()" class="w-full border rounded-xl p-2 font-bold">${methods.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select>
        <div id="uwTargetBox" class="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center"></div>
        <input id="uwAmt" type="number" required min="${pc.minDeposit}" max="${pc.maxDeposit}" step="0.5" placeholder="المبلغ (${pc.minDeposit} - ${pc.maxDeposit} ج.م)" class="w-full border rounded-xl p-2 font-black">
        <div class="grid grid-cols-2 gap-1.5"><input id="uwAcc" required placeholder="رقم المحوّل منه" class="border rounded-xl p-2 font-mono font-bold"><input id="uwRef" placeholder="رقم المرجع" class="border rounded-xl p-2 font-mono"></div>
        <input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],340,r=>window.__tmpReceipt=r)" class="text-[10px] w-full">
        <button class="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl">${cfg.instantDeposit ? '⚡ شحن فوري' : '🕒 إرسال طلب الإيداع'}</button>
      </form>`));
    setTimeout(window.updateDepTarget, 0);
  } else if (mode === 'withdraw') {
    const allowed = isCap ? cfg.captainWithdrawEnabled : cfg.customerWithdrawEnabled;
    showGM(`سحب من المحفظة (${safeNum(realUser.wallet, 0, 0).toFixed(2)} ج.م)`, tabs + (!allowed ? '<p class="text-center text-rose-700 font-bold p-3">السحب متوقف حالياً.</p>' : `
      <form onsubmit="window.submitWalletOp(event,'withdraw')" class="space-y-2">
        <select id="uwMeth" class="w-full border rounded-xl p-2 font-bold">${methods.map(m => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select>
        <input id="uwAcc" required value="${esc(realUser.phone || '')}" placeholder="رقم المحفظة المستلمة" class="w-full border rounded-xl p-2 font-mono font-bold">
        <input id="uwAmt" type="number" required min="${pc.minWithdraw}" max="${pc.maxWithdraw}" step="0.5" placeholder="المبلغ (${pc.minWithdraw} - ${pc.maxWithdraw} ج.م) | رسوم ${cfg.withdrawFeePercent}%" class="w-full border rounded-xl p-2 font-black">
        <button class="w-full bg-amber-500 text-slate-900 font-black py-2.5 rounded-xl">تأكيد طلب السحب</button>
      </form>`));
  } else {
    const mine = (DB.walletRequests || []).filter(r => r.phone === realUser.phone).slice().reverse();
    showGM('سجل السحب والإيداع', tabs + (mine.map(r => `<div class="p-2 border rounded-xl bg-slate-50 flex justify-between"><span><b>${r.op==='deposit'?'➕ إيداع':'💸 سحب'} ${r.amount}ج</b> (${esc(r.methodName)})</span><b class="${r.status==='approved'?'text-emerald-700':r.status==='rejected'?'text-rose-700':'text-amber-700'}">${r.status==='approved'?'مقبول':r.status==='rejected'?'مرفوض':'قيد المراجعة'}</b></div>`).join('') || '<p class="text-center text-slate-400">لا توجد طلبات</p>'));
  }
};
window.updateDepTarget = function() {
  const s = document.getElementById('uwMeth'), b = document.getElementById('uwTargetBox'); if (!s || !b) return;
  const m = DB.paymentConfig.methods.find(x => x.id === s.value) || DB.paymentConfig.methods[0];
  if (m) b.innerHTML = `<span class="font-bold text-emerald-900">حساب (${esc(m.name)}): <b class="font-mono">${esc(m.details)}</b></span><button type="button" onclick="navigator.clipboard.writeText('${esc(m.details)}');alert('تم النسخ!');" class="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">نسخ</button>`;
};
window.submitWalletOp = function(e, op) {
  e.preventDefault();
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return;
  const pc = DB.paymentConfig, cfg = DB.walletSystemConfig;
  const amt = safeNum(document.getElementById('uwAmt').value, 0, 0);
  const mObj = pc.methods.find(x => x.id === document.getElementById('uwMeth').value) || { name: 'تحويل' };
  const acc = document.getElementById('uwAcc').value.trim(), refNo = document.getElementById('uwRef')?.value.trim() || '';
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

// التقييم + الشات + المكالمة + SOS + الإلغاء الذكي
function triggerEmergencySOS() {
  if (confirm('🚨 هل أنت في حالة طوارئ؟ سيتم إرسال إشعار فوري للإدارة.')) {
    DB.complaints.push({ id: 'SOS-' + Date.now(), tripId: activeTripData?.id || 'مباشر', user: DB.currentUser?.name || 'عميل', phone: DB.currentUser?.phone || '', type: 'طوارئ SOS', details: 'بلاغ طوارئ فوري أثناء الرحلة', status: 'عاجل', date: new Date().toLocaleString('ar-EG') });
    saveDB(DB); alert('🛡️ تم إطلاق تنبيه الأمان SOS وإبلاغ الإدارة فوراً!');
  }
}
function setRating(stars) { selectedStarRating = stars; document.querySelectorAll('#starsRatingContainer i').forEach((ic, i) => { ic.className = i < stars ? 'fa-solid fa-star text-amber-400' : 'fa-regular fa-star text-slate-300'; }); }
function submitRating() { document.getElementById('ratingModal')?.classList.add('hidden'); alert(`⭐ تم تسجيل تقييمك (${selectedStarRating} نجوم).`); }
function openChatModal() { document.getElementById('chatModal')?.classList.remove('hidden'); }
function closeChatModal() { document.getElementById('chatModal')?.classList.add('hidden'); }
function handleSendChatMessage(e) {
  e.preventDefault(); const inp = document.getElementById('chatInputText');
  const d = document.createElement('div'); d.className = 'bg-emerald-600 text-white p-2 rounded-xl text-xs max-w-[80%] mr-auto'; d.innerText = inp.value;
  document.getElementById('chatMessagesBox').appendChild(d); inp.value = '';
}
function startVoiceCall() { document.getElementById('voiceCallModal')?.classList.remove('hidden'); }
function endVoiceCall() { document.getElementById('voiceCallModal')?.classList.add('hidden'); }
// ==========================================
// 8. بقية المودالات التفاعلية (التحويل، الدلفري، QR، السلف، التقسيط، الاشتراكات، الوارد، الشكاوى، الإلغاء، الكباتن، جوجل)
// ==========================================
window.openGoogleQuickAuth = function() {
  const gUsers = DB.users.filter(u => u.googleEmail);
  showGM('تسجيل الدخول عبر Google', `
    <form onsubmit="window.completeGoogleAuth(event)" class="space-y-2">
      <input type="email" id="gAuthEmail" required placeholder="name@gmail.com" class="w-full border rounded-xl p-2 font-mono font-bold">
      <input type="text" id="gAuthName" required placeholder="الاسم الظاهر" class="w-full border rounded-xl p-2 font-bold">
      <input type="tel" id="gAuthPhone" required placeholder="010XXXXXXXX" class="w-full border rounded-xl p-2 font-mono font-bold">
      <button type="submit" class="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl">دخول فوري</button>
    </form>
    ${gUsers.map((u, i) => `<button onclick="window.loginGoogleIdx(${i})" class="w-full text-right p-2 bg-slate-50 border rounded-xl font-bold mt-1">${esc(u.name)} (${esc(u.googleEmail)})</button>`).join('')}
  `);
  window.__gUsersList = gUsers;
};
window.loginGoogleIdx = function(i) { const u = window.__gUsersList?.[i]; if (u) window.loginGoogleUser(u.googleEmail, u.name, u.phone); };
window.completeGoogleAuth = function(e) { e.preventDefault(); window.loginGoogleUser(document.getElementById('gAuthEmail').value.trim(), document.getElementById('gAuthName').value.trim(), document.getElementById('gAuthPhone').value.trim()); };
window.loginGoogleUser = function(email, name, phone) {
  if (isBlacklisted(phone)) return;
  let u = DB.users.find(x => x.googleEmail === email || x.phone === phone);
  if (!u) {
    const bonus = DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.customerAmount, 0, 0) : 150;
    u = { role: 'customer', name, phone, googleEmail: email, password: 'g_' + Date.now(), wallet: bonus, welcomeCredited: true, loyaltyPoints: 0, blockedBy: [], favorites: {} };
    ensureUserReferralCode(u); DB.users.push(u); rebuildUserIndex();
  }
  DB.currentUser = u; saveDB(DB); updateNavUI();
  document.getElementById('patchGenericModal').classList.add('hidden');
  navigate(u.role === 'captain' ? 'driver' : 'customer');
};

window.openProfessionalShareModal = function() {
  const code = ensureUserReferralCode(DB.currentUser);
  const url = `${window.location.href.split('?')[0]}?ref=${encodeURIComponent(code)}`;
  const msg = `🚖 جرّب تطبيق توصيلة مصر! سجل بكود الإحالة (${code}) واحصل على مكافأة ترحيبية:\n${url}`;
  showGM('شارك تطبيق توصيلة واكسب مكافآت', `
    <div class="bg-emerald-50 border-2 border-dashed border-emerald-400 p-3 rounded-2xl text-center">
      <span class="font-bold text-slate-600 block">كود الإحالة الخاص بك</span>
      <b class="text-xl font-mono text-emerald-700 block my-1">${esc(code)}</b>
      <button onclick="navigator.clipboard.writeText('${esc(code)}');alert('تم نسخ الكود!');" class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">نسخ الكود</button>
    </div>
    <div class="flex gap-1.5"><input readonly value="${esc(url)}" class="flex-grow bg-slate-100 border rounded-xl p-2 font-mono text-[10px]"><button onclick="navigator.clipboard.writeText('${esc(url)}');alert('تم نسخ الرابط!');" class="bg-slate-800 text-white px-3 rounded-xl font-bold">نسخ</button></div>
    <div class="grid grid-cols-3 gap-2 text-center font-bold">
      <a href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" class="bg-green-500 text-white py-2 rounded-xl">واتساب</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="bg-blue-600 text-white py-2 rounded-xl">فيسبوك</a>
      <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}" target="_blank" class="bg-sky-500 text-white py-2 rounded-xl">تيليجرام</a>
    </div>
  `);
};

window.openTransferModal = function() {
  if (!DB.transferSettings.enabled) return alert('تحويل الرصيد متوقف حالياً.');
  if (!DB.currentUser) return alert('يرجى تسجيل الدخول أولاً.');
  showGM('تحويل رصيد لمستخدم آخر', `
    <div class="bg-slate-50 p-2 rounded-xl flex justify-between font-bold"><span>رصيدك:</span><b class="text-emerald-700">${safeNum(DB.currentUser.wallet, 0, 0).toFixed(2)} ج.م</b></div>
    <form onsubmit="window.executeTransfer(event)" class="space-y-2">
      <input type="tel" id="trPh" required placeholder="رقم هاتف المستلم" class="w-full border rounded-xl p-2 font-mono font-bold">
      <input type="number" id="trAmt" required min="${DB.transferSettings.minAmount}" max="${DB.transferSettings.maxAmount}" step="0.5" placeholder="المبلغ (العمولة ${DB.transferSettings.commissionPercent}%)" class="w-full border rounded-xl p-2 font-black">
      <button type="submit" class="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl">تأكيد التحويل</button>
    </form>
  `);
};
window.executeTransfer = function(e) {
  e.preventDefault();
  const s = userIndex.get(DB.currentUser.phone) || DB.currentUser;
  const t = userIndex.get(document.getElementById('trPh').value.trim());
  const amt = safeNum(document.getElementById('trAmt').value, 0, 0);
  if (!t || t.phone === s.phone || amt <= 0) return alert('❌ رقم المستلم أو المبلغ غير صحيح.');
  const fee = +(amt * (safeNum(DB.transferSettings.commissionPercent, 0, 0) / 100)).toFixed(2);
  if ((s.wallet || 0) < amt + fee) return alert(`رصيدك غير كافٍ (المطلوب ${amt + fee} ج.م).`);
  s.wallet = +(s.wallet - amt - fee).toFixed(2); t.wallet = +((t.wallet || 0) + amt).toFixed(2);
  DB.currentUser.wallet = s.wallet;
  DB.transferLogs.push({ fromName: s.name, toName: t.name, amount: amt, fee, date: new Date().toLocaleString('ar-EG') });
  saveDB(DB); updateNavUI(); handleDriverViewLogic();
  document.getElementById('patchGenericModal').classList.add('hidden');
  alert(`✅ تم تحويل ${amt} ج.م إلى ${t.name}!`);
};

window.openQrPayModal = function() {
  if (!DB.currentUser) return alert('يرجى تسجيل الدخول.');
  const payload = `TAWSILA:${DB.currentUser.phone}`;
  const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(payload)}`;
  showGM('QR الدفع والتحصيل السريع', `
    <div class="bg-slate-50 p-3 rounded-2xl border flex flex-col items-center gap-1 text-center">
      <img src="${imgUrl}" class="w-36 h-36 rounded-xl border bg-white p-1">
      <b>${esc(DB.currentUser.name)}</b><span class="font-mono text-[11px] text-emerald-700">${esc(payload)}</span>
    </div>
    <form onsubmit="window.payByQrCode(event)" class="space-y-2 border-t pt-2">
      <input id="qrTargetPhone" required placeholder="كود QR أو رقم الهاتف" class="w-full border rounded-xl p-2 font-mono font-bold">
      <input id="qrPayAmt" type="number" required min="1" step="0.5" placeholder="المبلغ (ج.م)" class="w-full border rounded-xl p-2 font-black">
      <button type="submit" class="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl">دفع فوري من المحفظة</button>
    </form>
  `);
};
window.payByQrCode = function(e) {
  e.preventDefault();
  const raw = document.getElementById('qrTargetPhone').value.trim().replace('TAWSILA:', '');
  const amt = safeNum(document.getElementById('qrPayAmt').value, 0, 1);
  const sender = userIndex.get(DB.currentUser.phone) || DB.currentUser;
  const receiver = userIndex.get(raw);
  if (!receiver || receiver.phone === sender.phone) return alert('❌ كود QR أو رقم المستلم غير صحيح.');
  if ((sender.wallet || 0) < amt) return alert('❌ رصيد محفظتك غير كافٍ.');
  sender.wallet = +(sender.wallet - amt).toFixed(2); receiver.wallet = +((receiver.wallet || 0) + amt).toFixed(2);
  DB.currentUser.wallet = sender.wallet; saveDB(DB); updateNavUI(); handleDriverViewLogic();
  document.getElementById('patchGenericModal').classList.add('hidden');
  alert(`✅ تم دفع ${amt} ج.م إلى ${receiver.name} عبر QR بنجاح!`);
};

window.openDeliveryModal = function() {
  if (!DB.deliveryConfig.enabled) return alert('الدلفري مخفي حالياً.');
  const kmDef = Math.round(realRouteDistKm) || 5;
  showGM('طلب توصيل دلفري (طعام / طرد)', `
    <form onsubmit="window.submitDeliv(event)" class="space-y-2">
      <div class="grid grid-cols-2 gap-2"><select id="dlSend" class="border rounded-xl p-2 font-bold"><option>شخص</option><option>شركة</option><option>مطعم</option><option>صيدلية</option></select><select id="dlPkg" class="border rounded-xl p-2 font-bold"><option>طعام</option><option>طرد / مستندات</option></select></div>
      <input id="dlFrom" required value="${esc(document.getElementById('pickupInput')?.value || '')}" placeholder="من" class="w-full border rounded-xl p-2 font-bold">
      <input id="dlTo" required value="${esc(document.getElementById('dropoffInput')?.value || '')}" placeholder="إلى" class="w-full border rounded-xl p-2 font-bold">
      <div class="grid grid-cols-2 gap-2"><input id="dlRecN" required placeholder="اسم المستلم" class="border rounded-xl p-2 font-bold"><input id="dlRecP" type="tel" required placeholder="هاتف المستلم" class="border rounded-xl p-2 font-mono font-bold"></div>
      <input id="dlKm" type="number" value="${kmDef}" min="1" oninput="document.getElementById('dlPr').innerText=(Number(DB.deliveryConfig.baseFare)+this.value*Number(DB.deliveryConfig.perKm)).toFixed(2)+' ج.م'" class="w-full border rounded-xl p-2 font-bold">
      <div class="bg-orange-50 p-2 rounded-xl flex justify-between font-black"><span>السعر:</span><b id="dlPr" class="text-orange-700">${(Number(DB.deliveryConfig.baseFare) + kmDef * Number(DB.deliveryConfig.perKm)).toFixed(2)} ج.م</b></div>
      <button type="submit" class="w-full bg-orange-600 text-white font-black py-2.5 rounded-xl">إرسال طلب الدلفري</button>
    </form>
  `);
};
window.submitDeliv = function(e) {
  e.preventDefault();
  const km = safeNum(document.getElementById('dlKm').value, 5, 1);
  const price = +(Number(DB.deliveryConfig.baseFare) + km * Number(DB.deliveryConfig.perKm)).toFixed(2);
  DB.deliveryOrders.push({ id: 'DLV-' + Date.now(), senderType: document.getElementById('dlSend').value, pkgType: document.getElementById('dlPkg').value, from: document.getElementById('dlFrom').value.trim(), to: document.getElementById('dlTo').value.trim(), recName: document.getElementById('dlRecN').value.trim(), recPhone: document.getElementById('dlRecP').value.trim(), price, date: new Date().toLocaleString('ar-EG') });
  saveDB(DB); document.getElementById('patchGenericModal').classList.add('hidden');
  alert(`📦 تم تسجيل طلب الدلفري بسعر ${price} ج.م!`);
};

window.openPartnerModal = function() {
  if (!DB.partnerConfig.enabled) return alert('تسجيل الشركات مخفي حالياً.');
  showGM(`تسجيل شركة / مطعم / صيدلية (خصم ${DB.partnerConfig.discountPercent}%)`, `
    <form onsubmit="window.savePartnerReg(event)" class="space-y-2">
      <select id="ptCat" class="w-full border rounded-xl p-2 font-bold"><option>شركة</option><option>مطعم</option><option>صيدلية</option></select>
      <input id="ptName" required placeholder="الاسم التجاري" class="w-full border rounded-xl p-2 font-bold">
      <input id="ptPh" type="tel" required placeholder="رقم الهاتف للدخول" class="w-full border rounded-xl p-2 font-mono font-bold">
      <input id="ptPs" type="password" required placeholder="كلمة المرور" class="w-full border rounded-xl p-2 font-mono font-bold">
      <button type="submit" class="w-full bg-purple-700 text-white font-black py-2.5 rounded-xl">تفعيل الحساب الدائم</button>
    </form>
  `);
};
window.savePartnerReg = function(e) {
  e.preventDefault(); const ph = document.getElementById('ptPh').value.trim();
  if (isBlacklisted(ph) || userIndex.has(ph)) return alert('الرقم غير متاح أو مسجل مسبقاً!');
  const u = { role: 'customer', isPartner: true, name: `${document.getElementById('ptCat').value}: ${document.getElementById('ptName').value.trim()}`, phone: ph, password: document.getElementById('ptPs').value.trim(), wallet: 150, loyaltyPoints: 0, favorites: {} };
  ensureUserReferralCode(u); DB.users.push(u); DB.partners.push({ name: u.name, phone: ph }); rebuildUserIndex();
  DB.currentUser = u; saveDB(DB); updateNavUI(); document.getElementById('patchGenericModal').classList.add('hidden'); navigate('customer');
};

window.openLoanModal = function() {
  if (!DB.loanSettings.enabled) return alert('السلف مخفية حالياً.');
  window.__tmpImg = '';
  const mine = DB.loanRequests.filter(r => r.phone === DB.currentUser?.phone);
  showGM('طلب سلفة أو قرض للكابتن', `
    <form onsubmit="window.subLoan(event)" class="space-y-2">
      <input type="number" id="lnAmt" required min="50" placeholder="القيمة (ج.م)" class="w-full border rounded-xl p-2 font-black">
      <textarea id="lnGoal" required placeholder="الهدف من السلفة..." class="w-full border rounded-xl p-2 font-bold"></textarea>
      <input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__tmpImg=r);" class="text-[10px] w-full">
      <button type="submit" class="w-full bg-amber-500 text-slate-900 font-black py-2 rounded-xl">إرسال الطلب</button>
    </form>
    <div class="border-t pt-2 space-y-1">${mine.map(r => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><b>${r.amount} ج.م</b><span>${r.status === 'approved' ? '🟢 مقبول' : r.status === 'rejected' ? '🔴 مرفوض' : '🟡 قيد المراجعة'}</span></div>`).join('')}</div>
  `);
};
window.subLoan = function(e) {
  e.preventDefault(); if (!DB.currentUser) return;
  DB.loanRequests.push({ id: 'ln_' + Date.now(), name: DB.currentUser.name, phone: DB.currentUser.phone, amount: safeNum(document.getElementById('lnAmt').value, 50, 50), goal: document.getElementById('lnGoal').value.trim(), image: window.__tmpImg || '', status: 'pending' });
  saveDB(DB); document.getElementById('patchGenericModal').classList.add('hidden'); alert('✅ تم إرسال طلب السلفة للإدارة!');
};

window.openInstallmentModal = function() {
  if (!DB.installmentSettings.enabled) return alert('تقسيط المركبات مخفي حالياً.');
  window.__tmpImg = '';
  showGM('طلب تقسيط مركبة', `
    <form onsubmit="window.subInst(event)" class="space-y-2">
      <select id="inVeh" class="w-full border rounded-xl p-2 font-bold"><option>سيارة</option><option>موتوسيكل</option><option>تروسيكل</option><option>توكتوك</option><option>سكوتر</option></select>
      <div class="grid grid-cols-2 gap-2"><input type="number" id="inDown" required placeholder="المقدم (ج.م)" class="border rounded-xl p-2 font-bold"><input type="number" id="inMon" value="24" required placeholder="الشهور" class="border rounded-xl p-2 font-bold"></div>
      <input type="file" accept="image/*" onchange="if(this.files[0])compressImageFile(this.files[0],320,r=>window.__tmpImg=r);" class="text-[10px] w-full">
      <button type="submit" class="w-full bg-teal-600 text-white font-black py-2 rounded-xl">إرسال طلب التقسيط</button>
    </form>
  `);
};
window.subInst = function(e) {
  e.preventDefault(); if (!DB.currentUser) return alert('سجل دخولك أولاً.');
  DB.installmentRequests.push({ id: 'in_' + Date.now(), name: DB.currentUser.name, phone: DB.currentUser.phone, vehicle: document.getElementById('inVeh').value, downPayment: safeNum(document.getElementById('inDown').value, 0, 0), months: safeNum(document.getElementById('inMon').value, 24, 6), image: window.__tmpImg || '', status: 'pending' });
  saveDB(DB); document.getElementById('patchGenericModal').classList.add('hidden'); alert('✅ تم إرسال طلب التقسيط للمراجعة!');
};

window.openCommuteModal = function() {
  if (!DB.commuteConfig.enabled) return alert('الاشتراكات الثابتة متوقفة.');
  const mine = DB.commuteSubscriptions.filter(s => s.phone === DB.currentUser?.phone);
  showGM(`اشتراك مشوار ثابت (خصم ${DB.commuteConfig.discountPercent}%)`, `
    <form onsubmit="window.subCommutePlan(event)" class="space-y-2">
      <div class="grid grid-cols-2 gap-1.5"><select id="cmCat" class="border rounded-xl p-2 font-bold"><option>طالب مدرسة</option><option>طالب جامعة</option><option>موظف</option></select><select id="cmPeriod" class="border rounded-xl p-2 font-bold"><option>أسبوعي (6 أيام)</option><option>شهري (24 يوم)</option></select></div>
      <input id="cmFrom" required value="${esc(document.getElementById('pickupInput')?.value || '')}" placeholder="نقطة الانطلاق" class="w-full border rounded-xl p-2 font-bold">
      <input id="cmTo" required placeholder="المدرسة / الجامعة / العمل" class="w-full border rounded-xl p-2 font-bold">
      <input id="cmTime" type="time" value="07:30" class="w-full border rounded-xl p-2 font-bold">
      <button class="w-full bg-cyan-700 text-white font-black py-2 rounded-xl">تقديم الطلب</button>
    </form>
    <div class="border-t pt-2 space-y-1">${mine.map(s => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><span>${esc(s.cat)} (${esc(s.time)})</span><b>${esc(s.assignedCaptain || 'بانتظار كابتن')}</b></div>`).join('')}</div>
  `);
};
window.subCommutePlan = function(e) {
  e.preventDefault();
  DB.commuteSubscriptions.push({ id: 'CM-' + Date.now().toString().slice(-5), name: DB.currentUser?.name || 'عميل', phone: DB.currentUser?.phone || '', cat: document.getElementById('cmCat').value, period: document.getElementById('cmPeriod').value, from: document.getElementById('cmFrom').value.trim(), to: document.getElementById('cmTo').value.trim(), time: document.getElementById('cmTime').value, assignedCaptain: '' });
  saveDB(DB); document.getElementById('patchGenericModal').classList.add('hidden'); alert('✅ تم تسجيل اشتراكك الثابت!');
};

window.toggleCaptainAvailability = function() {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return;
  u.isAvailable = u.isAvailable === false; DB.currentUser.isAvailable = u.isAvailable; saveDB(DB);
  const b = document.getElementById('patchCapAvailBtn');
  if (b) { b.innerText = u.isAvailable ? 'متاح للرحلات' : 'غير متاح'; b.className = `px-3 py-1.5 rounded-xl text-xs font-black ${u.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`; }
};
window.saveCapDestFilter = function() {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u) return;
  u.destFilter = document.getElementById('capDestFilterInp').value.trim(); DB.currentUser.destFilter = u.destFilter; saveDB(DB);
  alert(u.destFilter ? `🏠 سيتم توجيه الطلبات المتجهة إلى "${u.destFilter}" فقط.` : 'تم إلغاء فلتر الوجهة.');
};
window.openCapPackageModal = function() {
  const cfg = DB.packageConfig; const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  const active = (cap?.packageUntil || 0) > Date.now();
  showGM('باقات الكباتن (عمولة 0%)', `
    <div class="p-3 rounded-xl ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50'} font-bold text-center">${active ? `🟢 سارية حتى ${new Date(cap.packageUntil).toLocaleDateString('ar-EG')}` : 'اشترك الآن لعمولة 0% طوال المدة!'}</div>
    <div class="grid grid-cols-2 gap-2">
      <button onclick="window.buyCapPkg(7,${cfg.weeklyPrice})" class="bg-purple-700 text-white p-3 rounded-xl font-black">أسبوعية<br>${cfg.weeklyPrice} ج.م</button>
      <button onclick="window.buyCapPkg(30,${cfg.monthlyPrice})" class="bg-slate-900 text-amber-400 p-3 rounded-xl font-black">شهرية<br>${cfg.monthlyPrice} ج.م</button>
    </div>
  `);
};
window.buyCapPkg = function(days, price) {
  const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!cap) return;
  if ((cap.wallet || 0) < price) return alert('رصيد محفظتك غير كافٍ!');
  cap.wallet = +(cap.wallet - price).toFixed(2); cap.packageUntil = Date.now() + days * 86400000;
  DB.currentUser.wallet = cap.wallet; DB.currentUser.packageUntil = cap.packageUntil;
  addLedgerEntry('platform_profit', price, `اشتراك باقة ${days} يوم: ${cap.name}`);
  saveDB(DB); handleDriverViewLogic(); document.getElementById('patchGenericModal').classList.add('hidden');
};
window.openCapRateBlockModal = function(custPhone, custName) {
  showGM(`تقييم العميل (${custName})`, `<div class="grid grid-cols-2 gap-2"><button onclick="document.getElementById('patchGenericModal').classList.add('hidden')" class="bg-emerald-600 text-white py-2.5 rounded-xl font-black">👍 عميل ممتاز</button><button onclick="window.blockCust('${esc(custPhone)}')" class="bg-rose-600 text-white py-2.5 rounded-xl font-black">🚫 حظر العميل</button></div>`);
};
window.blockCust = function(ph) {
  const cap = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  if (cap) { cap.blockedCustomers = cap.blockedCustomers || []; if (!cap.blockedCustomers.includes(ph)) cap.blockedCustomers.push(ph); saveDB(DB); }
  document.getElementById('patchGenericModal').classList.add('hidden'); alert('تم حظر العميل.');
};

let heatLayers = [];
window.toggleHeatmapView = function() {
  navigate('customer');
  setTimeout(() => {
    if (!map) return;
    heatLayers.forEach(l => map.removeLayer(l)); heatLayers = [];
    const gov = DB.governorates.find(g => g.id === DB.selectedGovId) || DB.governorates[0];
    const pts = DB.demandPoints.length ? DB.demandPoints : [{ lat: gov.center[0], lng: gov.center[1] }, { lat: gov.center[0] + 0.008, lng: gov.center[1] - 0.006 }];
    pts.forEach(p => heatLayers.push(L.circle([p.lat, p.lng], { radius: 450, color: '#e11d48', fillColor: '#f43f5e', fillOpacity: 0.35, weight: 1 }).addTo(map)));
    alert('🔥 تم إظهار مناطق الطلب المرتفع على الخريطة!');
  }, 300);
};
window.openBestCaptainsModal = function() {
  const caps = DB.users.filter(u => u.role === 'captain').sort((a, b) => (b.dailyTrips || 0) - (a.dailyTrips || 0)).slice(0, 10);
  showGM('🏆 لوحة شرف أفضل الكباتن', caps.map((c, i) => `<div class="p-2 bg-slate-50 border rounded-xl flex justify-between"><span><b>#${i + 1}</b> ${esc(c.name)}</span><b class="text-emerald-700">${c.dailyTrips || 0} رحلة</b></div>`).join(''));
};

window.openHistoryLoyaltyModal = function() {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  const mine = DB.tripHistory.filter(t => t.customerPhone === u?.phone || t.assignedCaptainPhone === u?.phone);
  showGM('سجل الرحلات ونقاط الولاء', `
    ${u?.role === 'customer' && DB.loyaltyConfig?.enabled ? `<div class="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex justify-between items-center"><div><b>⭐ نقاطي: ${u.loyaltyPoints || 0}</b><span class="block text-[10px]">كل 100 نقطة = ${DB.loyaltyConfig.egpPer100Points} ج.م</span></div><button onclick="window.redeemLoyalty()" class="bg-amber-500 text-slate-900 px-3 py-1.5 rounded-xl font-black">تحويل</button></div>` : ''}
    <div class="space-y-2 max-h-64 overflow-y-auto">${mine.slice().reverse().map(t => `<div class="p-2 bg-slate-50 border rounded-xl"><div class="flex justify-between"><b>${esc(t.id)}</b><b class="text-emerald-700">${t.fare} ج.م</b></div><div class="text-[11px]">${esc(t.from)} ⬅️ ${esc(t.to)}</div><div class="flex justify-between text-[10px] text-slate-400"><span>${esc(t.completedAt)}</span><button onclick="window.printTripReceipt('${esc(t.id)}')" class="text-blue-600 font-bold">🖨️ فاتورة</button></div></div>`).join('') || '<p class="text-center text-slate-400">لا توجد رحلات</p>'}</div>
  `);
};
window.redeemLoyalty = function() {
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser; if (!u || (u.loyaltyPoints || 0) < 100) return alert('تحتاج 100 نقطة على الأقل.');
  const blocks = Math.floor(u.loyaltyPoints / 100), cash = blocks * safeNum(DB.loyaltyConfig.egpPer100Points, 20, 1);
  u.loyaltyPoints -= blocks * 100; u.wallet = +((u.wallet || 0) + cash).toFixed(2);
  DB.currentUser.loyaltyPoints = u.loyaltyPoints; DB.currentUser.wallet = u.wallet;
  saveDB(DB); updateNavUI(); window.openHistoryLoyaltyModal();
};
window.printTripReceipt = function(id) {
  const t = DB.tripHistory.find(x => x.id === id); if (!t) return;
  const w = window.open('', '_blank', 'width=400,height=500');
  w.document.write(`<html dir="rtl"><body style="font-family:sans-serif;padding:20px"><h2>فاتورة رحلة توصيلة</h2><hr><p>رقم: <b>${esc(t.id)}</b></p><p>التاريخ: ${esc(t.completedAt)}</p><p>الركوب: ${esc(t.from)}</p><p>الوجهة: ${esc(t.to)}</p>${t.policyNo ? `<p>بوليصة التأمين: ${esc(t.policyNo)}</p>` : ''}<h3>الإجمالي: ${t.fare} ج.م</h3><script>window.print();</script></body></html>`);
};

window.openComplaintsModal = function() {
  const mine = DB.tripHistory.filter(t => t.customerPhone === DB.currentUser?.phone);
  showGM('الشكاوى والمفقودات', `
    <form onsubmit="window.subComplaint(event)" class="space-y-2">
      <select id="cmpTrip" class="w-full border rounded-xl p-2 font-bold">${mine.map(t => `<option value="${esc(t.id)}">${esc(t.id)}</option>`).join('') || '<option value="عام">بلاغ عام</option>'}</select>
      <select id="cmpType" class="w-full border rounded-xl p-2 font-bold"><option>مفقودات</option><option>خلاف على الأجرة</option><option>شكوى سلوك</option></select>
      <textarea id="cmpTxt" required rows="3" placeholder="التفاصيل..." class="w-full border rounded-xl p-2 font-bold"></textarea>
      <button class="w-full bg-rose-600 text-white font-black py-2 rounded-xl">إرسال للدعم السريع</button>
    </form>
  `);
};
window.subComplaint = function(e) {
  e.preventDefault();
  DB.complaints.push({ id: 'CMP-' + Date.now().toString().slice(-5), tripId: document.getElementById('cmpTrip').value, user: DB.currentUser?.name || 'مستخدم', phone: DB.currentUser?.phone || '', type: document.getElementById('cmpType').value, details: document.getElementById('cmpTxt').value.trim(), status: 'مفتوحة', date: new Date().toLocaleString('ar-EG') });
  saveDB(DB); document.getElementById('patchGenericModal').classList.add('hidden'); alert('✅ تم رفع البلاغ!');
};

window.openInboxModal = function() {
  if (!DB.inboxSettings.enabled || !DB.currentUser) return;
  const p = DB.currentUser.phone;
  const msgs = DB.inboxMessages.filter(m => DB.currentUser.role === 'admin' || m.to === 'all' || m.to === p || m.senderPhone === p).slice().reverse();
  showGM('صندوق الوارد', msgs.map(m => {
    const read = (m.readBy || []).includes(p);
    return `<div class="p-2.5 border rounded-xl ${read ? 'bg-slate-50' : 'bg-emerald-50 border-emerald-300'} space-y-1"><div class="flex justify-between"><b>${!read ? '🔔 ' : ''}${esc(m.subject)}</b><span class="text-[10px] text-slate-400">${esc(m.date)}</span></div><p>${esc(m.body)}</p>${(m.replies || []).map(r => `<div class="bg-white p-1 rounded border text-[10px]"><b>${esc(r.by)}:</b> ${esc(r.text)}</div>`).join('')}<div class="flex gap-1.5">${!read ? `<button onclick="window.actInbox('${esc(m.id)}','read')" class="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">مقروء</button>` : ''}<button onclick="window.actInbox('${esc(m.id)}','reply')" class="bg-blue-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">رد</button><button onclick="window.actInbox('${esc(m.id)}','del')" class="bg-rose-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">حذف</button></div></div>`;
  }).join('') || '<p class="text-center text-slate-400">الصندوق فارغ</p>');
};
window.actInbox = function(id, act) {
  const m = DB.inboxMessages.find(x => x.id === id);
  if (act === 'del') DB.inboxMessages = DB.inboxMessages.filter(x => x.id !== id);
  else if (m && act === 'read' && !m.readBy.includes(DB.currentUser.phone)) m.readBy.push(DB.currentUser.phone);
  else if (m && act === 'reply') { const t = prompt('الرد:'); if (t) { m.replies = m.replies || []; m.replies.push({ by: DB.currentUser.name, text: t }); } }
  saveDB(DB); window.refreshGlobalChrome(); window.openInboxModal();
};

window.openCancelReasonModal = function() {
  showGM('سبب إلغاء المشوار', `
    <select id="cancelReasonSel" class="w-full border rounded-xl p-2 font-bold"><option>تأخر الكابتن</option><option>تغيير الوجهة</option><option>ظرف طارئ</option></select>
    <p class="text-[11px] text-rose-700 font-bold">⚠️ تجاوز ${DB.cancelConfig.maxDailyCancels} إلغاءات يومياً يطبق غرامة ${DB.cancelConfig.penaltyAmount} ج.م وحظر ${DB.cancelConfig.cooldownMinutes} دقيقة.</p>
    <button onclick="window.confirmSmartCancel()" class="w-full bg-rose-600 text-white font-black py-2 rounded-xl">تأكيد الإلغاء</button>
  `);
};
window.confirmSmartCancel = function() {
  const reason = document.getElementById('cancelReasonSel').value, today = new Date().toISOString().slice(0, 10);
  const u = userIndex.get(DB.currentUser?.phone) || DB.currentUser;
  if (u) {
    if (u.cancelDate !== today) { u.cancelDate = today; u.cancelsToday = 0; }
    u.cancelsToday = (u.cancelsToday || 0) + 1;
    if (u.cancelsToday >= DB.cancelConfig.maxDailyCancels) {
      u.wallet = Math.max(0, +((u.wallet || 0) - DB.cancelConfig.penaltyAmount).toFixed(2));
      u.cooldownUntil = Date.now() + DB.cancelConfig.cooldownMinutes * 60000;
      if (DB.currentUser) DB.currentUser.wallet = u.wallet;
      alert(`⚠️ تم خصم غرامة ${DB.cancelConfig.penaltyAmount} ج.م وتطبيق حظر مؤقت لتكرار الإلغاء.`);
    }
    DB.cancelLogs.push({ name: u.name, phone: u.phone, reason, date: new Date().toLocaleString('ar-EG') });
    saveDB(DB); updateNavUI();
  }
  document.getElementById('patchGenericModal').classList.add('hidden');
  document.getElementById('customerDriverCard')?.classList.add('hidden');
  const btn = document.getElementById('btnRequestRide'); if (btn) { btn.disabled = false; btn.innerText = 'طلب المشوار فوراً'; }
  dispatchQueue = []; dispatchIdx = 0; captainRejectTrip();
};

window.openTermsModal = function() { showGM(DB.termsSettings.title, `<div class="whitespace-pre-line bg-slate-50 p-3 rounded-xl leading-relaxed">${esc(DB.termsSettings.content)}</div>`); };

// ==========================================
// 9. لوحة الإدارة + الباتشات السحابية + التصغير والبيانات الحية + مراقب المساحة
// ==========================================
function renderAdminCaptains() {
  const tb = document.getElementById('adminCaptainsListTable'), cnt = document.getElementById('adminPendingCount'); if (!tb) return;
  if (cnt) cnt.innerText = DB.captainsPending.filter(c => c.status === 'pending').length;
  tb.innerHTML = DB.captainsPending.map(c => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold">${esc(c.name)}</td><td class="p-3 font-mono">${esc(c.phone)}<br><span class="text-slate-500">${esc(c.plate)}</span></td><td class="p-3">${esc(c.vehicle)}</td>
      <td class="p-3"><button onclick="inspectCaptainDocs('${esc(c.id)}')" class="px-2.5 py-1 bg-slate-800 text-white rounded text-[11px] font-bold">فحص (4)</button></td>
      <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">${c.status === 'approved' ? 'معتمد' : c.status === 'rejected' ? 'مرفوض' : 'بانتظار'}</span></td>
      <td class="p-3 text-center space-x-1 space-x-reverse">${c.status !== 'approved' ? `<button onclick="approveCaptainByAdmin('${esc(c.id)}')" class="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-xs">قبول</button>` : ''}${c.status !== 'rejected' ? `<button onclick="rejectCaptainByAdmin('${esc(c.id)}')" class="px-2 py-1 bg-rose-600 text-white rounded font-bold text-xs">رفض</button>` : ''}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد طلبات</td></tr>`;
}

function inspectCaptainDocs(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId); if (!cap || !cap.docs) return;
  document.getElementById('inspectCaptainTitle').innerText = `مستندات: ${cap.name}`;
  const list = [{ label: 'بطاقة وجه', src: cap.docs.idFront }, { label: 'بطاقة ظهر', src: cap.docs.idBack }, { label: 'رخصة قيادة', src: cap.docs.licenseDrive }, { label: 'رخصة مركبة', src: cap.docs.licenseCar }];
  document.getElementById('inspectImagesGrid').innerHTML = list.map(d => `<div class="border rounded-2xl p-2 bg-slate-50"><span class="font-bold block mb-1">${d.label}</span><div class="h-32 bg-white rounded-xl border flex items-center justify-center overflow-hidden">${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : '<span class="text-slate-400">غير متوفر</span>'}</div></div>`).join('');
  document.getElementById('adminDocsInspectModal').classList.remove('hidden');
}
function closeDocsInspectModal() { document.getElementById('adminDocsInspectModal').classList.add('hidden'); }

function approveCaptainByAdmin(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId); if (!cap) return;
  const already = userIndex.has(cap.phone); cap.status = 'approved';
  if (!already) {
    const w = DB.welcomeBonus?.enabled ? safeNum(DB.welcomeBonus.captainAmount, 0, 0) : 200;
    const newC = { role: 'captain', name: cap.name, phone: cap.phone, password: cap.password, vehicle: cap.vehicle, plate: cap.plate, status: 'approved', wallet: w, welcomeCredited: true, isAvailable: true, inTrip: false, licenseExpiry: cap.licenseExpiry || '2027-06-01', dailyTrips: 0, blockedCustomers: [], fuelLogs: [], lat: 26.5569, lng: 31.6948 };
    ensureUserReferralCode(newC); DB.users.push(newC); rebuildUserIndex();
    if (cap.refCode) applyReferralBonus(cap.phone, cap.refCode);
  }
  addAuditLog(`اعتماد الكابتن ${cap.name}`); saveDB(DB); renderAdminCaptains();
}
function rejectCaptainByAdmin(capId) { const cap = DB.captainsPending.find(c => c.id === capId); if (!cap) return; cap.status = 'rejected'; addAuditLog(`رفض الكابتن ${cap.name}`); saveDB(DB); renderAdminCaptains(); }

function renderAdminModerators() {
  const tb = document.getElementById('adminModeratorsListTable'); if (!tb) return;
  tb.innerHTML = DB.moderators.map((m, i) => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold">${esc(m.name)}</td><td class="p-3 font-mono">${esc(m.phone)}</td>
      <td class="p-3 space-x-1 space-x-reverse"><span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100">${esc(m.roleTitle || 'مشرف')} (${esc(m.govScope || 'الكل')})</span>${m.roleTitle === 'مشرف عام محافظة' ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">عمولة ${m.agentCommissionPercent || 0}% (أرباح: ${(m.agentEarnings || 0).toFixed(1)} ج)</span>` : ''}</td>
      <td class="p-3 text-center"><button onclick="deleteModerator(${i})" class="text-rose-600 font-bold">حذف</button></td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا يوجد مشرفين</td></tr>`;
  const tab = document.getElementById('admintab-moderators');
  if (tab) {
    let box = document.getElementById('patchAuditLogBox');
    if (!box) { box = document.createElement('div'); box.id = 'patchAuditLogBox'; box.className = 'border-t pt-3 space-y-2'; tab.appendChild(box); }
    box.innerHTML = `<b class="text-xs block">سجل مراقبة المشرفين (Audit Log):</b><div class="max-h-32 overflow-y-auto space-y-1 text-[11px]">${DB.auditLogs.slice(-15).reverse().map(a => `<div class="p-1.5 bg-slate-50 border rounded flex justify-between"><span><b>${esc(a.actor)}</b> (${esc(a.role)}): ${esc(a.action)}</span><span class="text-slate-400">${esc(a.time)}</span></div>`).join('') || '<p class="text-slate-400">فارغ</p>'}</div>`;
  }
}
function openNewModeratorModal() { document.getElementById('addModeratorModal').classList.remove('hidden'); }
function closeNewModeratorModal() { document.getElementById('addModeratorModal').classList.add('hidden'); }
function handleSaveModerator(e) {
  e.preventDefault();
  DB.moderators.push({
    id: 'mod_' + Date.now(), name: document.getElementById('modNameInput').value.trim(), phone: document.getElementById('modPhoneInput').value.trim(), password: document.getElementById('modPassInput').value.trim(),
    role: 'moderator', roleTitle: document.getElementById('modRoleTitleSelect')?.value || 'مشرف', govScope: document.getElementById('modGovScopeSelect')?.value || 'الكل',
    agentCommissionPercent: safeNum(document.getElementById('modAgentCommInp')?.value, 5, 0, 50), agentEarnings: 0,
    permissions: { captains: document.getElementById('permCaptains').checked, governorates: document.getElementById('permGovernorates').checked, features: document.getElementById('permFeatures').checked }
  });
  addAuditLog('إضافة مشرف جديد'); saveDB(DB); renderAdminModerators(); closeNewModeratorModal();
}
function deleteModerator(i) { if (confirm('حذف المشرف؟')) { DB.moderators.splice(i, 1); saveDB(DB); renderAdminModerators(); } }

function toggleFeatureSetting(k) { DB.features[k] = !DB.features[k]; saveDB(DB); updateFeaturesAdminUI(); recalcTrip(false); }
function updateSurgeMultiplier(v) { DB.features.surgeMultiplier = safeNum(v, 1.3, 1); saveDB(DB); recalcTrip(false); }
function updateFeaturesAdminUI() {
  const b1 = document.getElementById('btnToggleBidding'), b2 = document.getElementById('btnToggleSurge'), sInp = document.getElementById('surgeMultiplierInput');
  if (b1) { b1.className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.biddingEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`; b1.innerText = DB.features.biddingEnabled ? 'مفعل' : 'معطل'; }
  if (b2) { b2.className = `px-3 py-1 rounded-lg text-xs font-bold ${DB.features.surgeActive ? 'bg-rose-100 text-rose-800' : 'bg-slate-200'}`; b2.innerText = DB.features.surgeActive ? 'الذروة نشطة' : 'معطلة'; }
  if (sInp) sInp.value = DB.features.surgeMultiplier || 1.3;
  document.getElementById('biddingBoxSection')?.classList.toggle('hidden', !DB.features.biddingEnabled);
  document.getElementById('surgeBadge')?.classList.toggle('hidden', !DB.features.surgeActive);
  renderPromoCodesList();
}
function renderPromoCodesList() {
  const c = document.getElementById('adminPromoCodesList'); if (!c) return;
  c.innerHTML = DB.promoCodes.map((p, i) => `<div class="flex justify-between p-2 bg-slate-50 border rounded-xl text-xs"><div><b class="font-mono text-emerald-700">${esc(p.code)}</b> <span>(${p.discountPercent}% | ${esc(p.govId || 'all')})</span></div><button onclick="deletePromo(${i})" class="text-rose-600 font-bold">حذف</button></div>`).join('');
}
function openNewPromoModal() { document.getElementById('addPromoModal').classList.remove('hidden'); }
function closeNewPromoModal() { document.getElementById('addPromoModal').classList.add('hidden'); }
function handleSavePromo(e) {
  e.preventDefault();
  DB.promoCodes.push({ code: document.getElementById('promoCodeVal').value.trim().toUpperCase(), discountPercent: safeNum(document.getElementById('promoDiscountVal').value, 20, 1, 95), govId: document.getElementById('promoGovSel')?.value || 'all', happyHourStart: document.getElementById('promoHhStart')?.value || '', happyHourEnd: document.getElementById('promoHhEnd')?.value || '', active: true });
  saveDB(DB); renderPromoCodesList(); closeNewPromoModal();
}
function deletePromo(i) { DB.promoCodes.splice(i, 1); saveDB(DB); renderPromoCodesList(); }

// محرك الباتشات المحفوظة سحابياً في Firebase
function injectPatch(p, idx) {
  document.getElementById(`injected-patch-css-${idx}`)?.remove();
  document.getElementById(`injected-patch-html-${idx}`)?.remove();
  if (!p.enabled) return;
  if (p.type === 'css') { const s = document.createElement('style'); s.id = `injected-patch-css-${idx}`; s.textContent = p.code; document.head.appendChild(s); }
  else if (p.type === 'html') { const c = document.getElementById('patchHtmlContainer'); if (c) { const d = document.createElement('div'); d.id = `injected-patch-html-${idx}`; d.innerHTML = p.code; c.appendChild(d); } }
  else if (p.type === 'js') { try { new Function(p.code)(); } catch (err) { console.error('Patch Error:', err); } }
}
function applyAllPatches() { getPatches().forEach((p, i) => { if (p.enabled) injectPatch(p, i); }); }
function renderPatches() {
  const tb = document.getElementById('adminPatchesListTable'); if (!tb) return;
  tb.innerHTML = getPatches().map((item, i) => `<tr class="border-b"><td class="p-3 font-bold">${esc(item.name)}</td><td class="p-3 font-mono text-[10px]">${esc(item.type)}</td><td class="p-3"><button onclick="togglePatchStatus(${i})" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}">${item.enabled ? 'مفعل (Firebase)' : 'معطل'}</button></td><td class="p-3 text-center"><button onclick="deletePatch(${i})" class="text-rose-600 font-bold text-xs">حذف</button></td></tr>`).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات إضافية</td></tr>`;
}
function openNewPatchModal() { document.getElementById('patchNameInput').value = ''; document.getElementById('patchCodeInput').value = ''; document.getElementById('patchEditorModal').classList.remove('hidden'); }
function closePatchModal() { document.getElementById('patchEditorModal').classList.add('hidden'); }
async function handleSavePatch(e) {
  e.preventDefault();
  if (DB.currentUser?.role !== 'admin') return alert('⛔ إضافة الباتشات مقتصرة على المدير العام فقط.');
  const list = getPatches();
  list.push({ name: document.getElementById('patchNameInput').value.trim(), type: document.getElementById('patchTypeInput').value, code: document.getElementById('patchCodeInput').value, enabled: true });
  await savePatches(list); applyAllPatches(); renderPatches(); closePatchModal();
  alert('✅ تم حفظ الباتش في Firebase وحقنه بنجاح (لن يُحذف عند مسح المتصفح)!');
}
async function togglePatchStatus(i) { const list = getPatches(); if (list[i]) { list[i].enabled = !list[i].enabled; await savePatches(list); applyAllPatches(); renderPatches(); } }
async function deletePatch(i) { const list = getPatches(); list.splice(i, 1); await savePatches(list); applyAllPatches(); renderPatches(); }

function switchAdminTab(tab) {
  const u = DB.currentUser;
  if (u && u.role === 'moderator') {
    if (tab === 'moderators') return alert('⚠️ إدارة المشرفين للمدير العام فقط.');
    if (tab === 'captains' && !u.permissions.captains) return alert('⚠️ لا تملك صلاحية الكباتن.');
    if (tab === 'governorates' && !u.permissions.governorates) return alert('⚠️ لا تملك صلاحية المحافظات.');
    if (['features', 'extras', 'walletops', 'analytics'].includes(tab) && !u.permissions.features) return alert('⚠️ لا تملك صلاحية المالية والأدوات.');
  }
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100');
  ['captains', 'governorates', 'features', 'moderators', 'patches', 'extras', 'live', 'walletops', 'analytics'].forEach(t => document.getElementById(`admintab-${t}`)?.classList.add('hidden'));
  const btn = document.getElementById(`btn-adm-${tab}`);
  if (btn) btn.className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold';
  document.getElementById(`admintab-${tab}`)?.classList.remove('hidden');
  if (tab === 'captains') renderAdminCaptains();
  if (tab === 'governorates') renderGovernoratesUI();
  if (tab === 'features') updateFeaturesAdminUI();
  if (tab === 'moderators') renderAdminModerators();
  if (tab === 'patches') renderPatches();
  if (tab === 'live') window.renderAdminLiveDataTab();
  if (tab === 'walletops') window.renderAdminWalletOps();
  if (tab === 'analytics') window.renderAdminAnalytics();
  if (tab === 'extras') window.renderAllAdminExtras();
}

// القرى والمناطق + البيانات الحية + تصغير بطاقة الرحلة
let editGovId = null;
window.openGovAreasModal = function(govId) {
  editGovId = govId; const gov = DB.governorates.find(g => g.id === govId); if (!gov) return;
  showGM(`قرى ومناطق (${gov.name})`, `
    <form onsubmit="window.addGovArea(event)" class="flex gap-2"><input id="newAreaInp" required placeholder="اسم القرية أو المنطقة" class="flex-grow border rounded-xl p-2 font-bold"><button class="bg-emerald-600 text-white px-3 rounded-xl font-black">+</button></form>
    <div class="space-y-1.5 max-h-60 overflow-y-auto">${gov.areas.map((a, i) => `<div class="flex justify-between p-2 bg-slate-50 border rounded-xl"><span class="${a.active ? 'font-bold' : 'line-through text-slate-400'}">${esc(a.name)}</span><div class="flex gap-2"><button onclick="window.togGovArea(${i})" class="text-[10px] font-bold px-2 rounded bg-emerald-100">${a.active ? 'متاح' : 'معطل'}</button><button onclick="window.delGovArea(${i})" class="text-rose-600 font-bold">حذف</button></div></div>`).join('')}</div>
  `);
};
window.addGovArea = function(e) { e.preventDefault(); const g = DB.governorates.find(x => x.id === editGovId); g.areas.push({ name: document.getElementById('newAreaInp').value.trim(), active: true }); saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };
window.togGovArea = function(i) { const g = DB.governorates.find(x => x.id === editGovId); g.areas[i].active = !g.areas[i].active; saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };
window.delGovArea = function(i) { const g = DB.governorates.find(x => x.id === editGovId); g.areas.splice(i, 1); saveDB(DB); renderGovernoratesUI(); window.openGovAreasModal(editGovId); };

let isTripMin = sessionStorage.getItem('TAWSILA_TRIP_CARD_MINIMIZED') === '1';
let hiddenCancelOrigBtn = null, hiddenBannerTxt = '';
window.renderAdminLiveDataTab = function() {
  const el = document.getElementById('admintab-live'); if (!el) return;
  const hasTrip = !!(activeTripData || hiddenCancelOrigBtn || hiddenBannerTxt);
  el.innerHTML = `
    <div class="flex justify-between items-center border-b pb-2"><h3 class="font-black text-sm"><i class="fa-solid fa-tower-broadcast text-rose-600 ml-1"></i> البيانات الحية</h3><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">مباشر</span></div>
    ${hasTrip ? `<div class="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex flex-wrap justify-between items-center gap-3"><div><b class="text-rose-800 block">${esc(hiddenBannerTxt || `مشوار نشط (${activeTripData?.fare || 0} ج.م)`)}</b>${activeTripData ? `<span class="text-slate-700 font-bold">من: ${esc(activeTripData.from)} ⬅️ إلى: ${esc(activeTripData.to)}</span>` : ''}</div><button onclick="window.execAdminLiveCancel()" class="bg-rose-600 text-white font-black px-4 py-2 rounded-xl shadow">🛑 إلغاء المشوار إدارياً</button></div>` : `<div class="p-4 bg-slate-50 border border-dashed rounded-xl text-center text-slate-500 font-bold">لا توجد مشاوير نشطة حالياً.</div>`}
  `;
};
window.execAdminLiveCancel = function() {
  if (hiddenCancelOrigBtn) hiddenCancelOrigBtn.click();
  else if (confirm('إلغاء المشوار النشط إدارياً؟')) { activeTripData = null; clearActiveSession(); captainRejectTrip(); }
  hiddenCancelOrigBtn = null; hiddenBannerTxt = ''; window.renderAdminLiveDataTab();
};
function scanCollapseAndLiveBanner() {
  const liveSec = document.getElementById('admintab-live');
  document.querySelectorAll('button, a').forEach(btn => {
    if (liveSec && liveSec.contains(btn)) return;
    if ((btn.textContent || '').includes('إلغاء المشوار إدارياً')) {
      hiddenCancelOrigBtn = btn;
      let p = btn.parentElement;
      while (p && p !== document.body && p.tagName !== 'HEADER' && p.tagName !== 'MAIN' && p.textContent.length < 220) {
        if (!p.parentElement || p.parentElement === document.body || p.parentElement.tagName === 'HEADER') break;
        p = p.parentElement;
      }
      if (p && p !== document.body && p.tagName !== 'HEADER') { hiddenBannerTxt = p.textContent.replace('إلغاء المشوار إدارياً', '').trim(); p.classList.add('patch-admin-banner-hidden'); }
      else btn.classList.add('patch-admin-banner-hidden');
    }
  });
  const custCard = document.getElementById('customerDriverCard');
  if (custCard && !custCard.classList.contains('hidden')) {
    if (!custCard.querySelector('#patchTripCollapseBar')) {
      const bar = document.createElement('div'); bar.id = 'patchTripCollapseBar';
      bar.className = 'flex justify-between items-center pb-2 mb-2 border-b border-emerald-200 text-xs';
      bar.innerHTML = `<b id="patchTripMiniSummary" class="text-emerald-800"></b><button type="button" id="patchTripToggleBtn" onclick="window.toggleTripCollapse()"></button>`;
      custCard.prepend(bar);
    }
    Array.from(custCard.children).forEach(c => { if (c.id !== 'patchTripCollapseBar') c.classList.toggle('patch-trip-child-hidden', isTripMin); });
    custCard.classList.toggle('patch-trip-card-compact', isTripMin);
    const ms = custCard.querySelector('#patchTripMiniSummary'), tb = custCard.querySelector('#patchTripToggleBtn');
    if (ms) ms.innerText = isTripMin ? `🚕 رحلة نشطة (${activeTripData?.fare || ''} ج.م)` : 'تفاصيل الرحلة النشطة';
    if (tb) { tb.innerText = isTripMin ? '🔼 تكبير' : '🔽 تصغير'; tb.className = isTripMin ? 'bg-emerald-600 text-white px-3 py-1 rounded-xl font-black' : 'bg-slate-200 text-slate-800 px-3 py-1 rounded-xl font-black'; }
  }
}
window.toggleTripCollapse = function() { isTripMin = !isTripMin; sessionStorage.setItem('TAWSILA_TRIP_CARD_MINIMIZED', isTripMin ? '1' : '0'); scanCollapseAndLiveBanner(); };

// ==========================================
// 10. تبويبات الإدارة المضافة (السحب والإيداع + الإحصائيات + الخدمات الشاملة + منظف المساحة + النسخ الاحتياطي)
// ==========================================
let admWalletFilter = 'all';
window.renderAdminWalletOps = function() {
  const p = document.getElementById('admintab-walletops'); if (!p) return;
  const cfg = DB.walletSystemConfig, pc = DB.paymentConfig;
  const list = DB.walletRequests.filter(r => admWalletFilter === 'all' || (admWalletFilter === 'pending' ? r.status === 'pending' : r.op === admWalletFilter)).slice().reverse();
  p.innerHTML = `
    <div class="flex flex-wrap justify-between items-center border-b pb-2 gap-2">
      <h3 class="font-black text-sm">إدارة منظومة السحب والإيداع</h3>
      <div class="flex gap-1 font-bold">${['all','pending','deposit','withdraw'].map(f => `<button onclick="window.setAdmWF('${f}')" class="px-2.5 py-1 rounded-lg ${admWalletFilter===f?'bg-slate-900 text-white':'bg-slate-100'}">${f==='all'?'الكل':f==='pending'?'قيد المراجعة':f==='deposit'?'إيداعات':'سحوبات'}</button>`).join('')}</div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="p-3 bg-slate-50 border rounded-2xl space-y-2">
        <div class="grid grid-cols-2 gap-1 text-[11px] font-bold">
          <button onclick="DB.walletSystemConfig.customerDepositEnabled=!DB.walletSystemConfig.customerDepositEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1.5 rounded border bg-white">${cfg.customerDepositEnabled?'🟢 إيداع العميل':'🔴 إيداع العميل'}</button>
          <button onclick="DB.walletSystemConfig.customerWithdrawEnabled=!DB.walletSystemConfig.customerWithdrawEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1.5 rounded border bg-white">${cfg.customerWithdrawEnabled?'🟢 سحب العميل':'🔴 سحب العميل'}</button>
          <button onclick="DB.walletSystemConfig.captainDepositEnabled=!DB.walletSystemConfig.captainDepositEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1.5 rounded border bg-white">${cfg.captainDepositEnabled?'🟢 إيداع الكابتن':'🔴 إيداع الكابتن'}</button>
          <button onclick="DB.walletSystemConfig.captainWithdrawEnabled=!DB.walletSystemConfig.captainWithdrawEnabled;saveDB(DB);renderAdminWalletOps();" class="p-1.5 rounded border bg-white">${cfg.captainWithdrawEnabled?'🟢 سحب الكابتن':'🔴 سحب الكابتن'}</button>
          <button onclick="DB.walletSystemConfig.instantDeposit=!DB.walletSystemConfig.instantDeposit;saveDB(DB);renderAdminWalletOps();" class="col-span-2 p-1.5 rounded border bg-white">${cfg.instantDeposit?'⚡ الإيداع فوري تلقائي':'🕒 الإيداع بموافقة الإدارة'}</button>
        </div>
        <div class="grid grid-cols-5 gap-1">
          <div><span class="text-[10px]">أدنى إيداع</span><input id="wscMinD" type="number" value="${pc.minDeposit}" class="w-full border rounded p-1"></div>
          <div><span class="text-[10px]">أقصى إيداع</span><input id="wscMaxD" type="number" value="${pc.maxDeposit}" class="w-full border rounded p-1"></div>
          <div><span class="text-[10px]">أدنى سحب</span><input id="wscMinW" type="number" value="${pc.minWithdraw}" class="w-full border rounded p-1"></div>
          <div><span class="text-[10px]">أقصى سحب</span><input id="wscMaxW" type="number" value="${pc.maxWithdraw}" class="w-full border rounded p-1"></div>
          <div><span class="text-[10px]">رسوم%</span><input id="wscFee" type="number" step="0.5" value="${cfg.withdrawFeePercent}" class="w-full border rounded p-1"></div>
        </div>
        <button onclick="DB.paymentConfig.minDeposit=+document.getElementById('wscMinD').value;DB.paymentConfig.maxDeposit=+document.getElementById('wscMaxD').value;DB.paymentConfig.minWithdraw=+document.getElementById('wscMinW').value;DB.paymentConfig.maxWithdraw=+document.getElementById('wscMaxW').value;DB.walletSystemConfig.withdrawFeePercent=+document.getElementById('wscFee').value;saveDB(DB);alert('تم الحفظ!');" class="w-full bg-slate-900 text-white py-1.5 rounded-xl font-black">حفظ الحدود</button>
      </div>
      <div class="p-3 bg-slate-50 border rounded-2xl space-y-2">
        <div class="max-h-24 overflow-y-auto space-y-1">${pc.methods.map((m, i) => `<div class="flex justify-between bg-white p-1 rounded border"><span><b>${esc(m.name)}</b> (${esc(m.details)})</span><button onclick="DB.paymentConfig.methods.splice(${i},1);saveDB(DB);renderAdminWalletOps();" class="text-rose-600 font-bold">حذف</button></div>`).join('')}</div>
        <form onsubmit="event.preventDefault();DB.paymentConfig.methods.push({id:'pm_'+Date.now(),name:document.getElementById('pmN').value,details:document.getElementById('pmD').value,enabled:true});saveDB(DB);renderAdminWalletOps();" class="flex gap-1"><input id="pmN" required placeholder="الطريقة" class="w-1/2 border rounded p-1 bg-white"><input id="pmD" required placeholder="الحساب" class="w-1/2 border rounded p-1 bg-white"><button class="bg-emerald-600 text-white px-2 rounded">+</button></form>
        <form onsubmit="window.admManAdj(event)" class="flex gap-1 border-t pt-1.5"><input id="amPh" required placeholder="هاتف المستخدم" class="w-1/3 border rounded p-1 bg-white font-mono"><input id="amAm" type="number" step="0.5" required placeholder="+/- مبلغ" class="w-1/3 border rounded p-1 bg-white"><button class="w-1/3 bg-indigo-600 text-white rounded font-black">تعديل رصيد</button></form>
      </div>
    </div>
    <div class="space-y-1.5 max-h-60 overflow-y-auto">${list.map(r => `<div class="p-2.5 border rounded-xl bg-slate-50 flex flex-wrap justify-between items-center gap-2"><div><b>${r.op==='deposit'?'إيداع':'سحب'} ${r.amount}ج</b> - ${esc(r.name)} (${esc(r.phone)}) • ${esc(r.methodName)} (${esc(r.account)}) ${r.receipt ? `<button onclick="window.open('${r.receipt}')" class="text-blue-600 underline font-bold mr-1">إيصال</button>` : ''}</div><div class="flex gap-1">${r.status==='pending'?`<button onclick="window.decideWReq('${esc(r.id)}','approved')" class="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold">قبول</button><button onclick="window.decideWReq('${esc(r.id)}','rejected')" class="bg-rose-600 text-white px-2.5 py-1 rounded-lg font-bold">رفض</button>`:`<span class="font-bold">${r.status==='approved'?'🟢 مقبول':'🔴 مرفوض'}</span>`}</div></div>`).join('') || '<p class="text-center text-slate-400">لا توجد طلبات</p>'}</div>
  `;
};
window.setAdmWF = function(f) { admWalletFilter = f; window.renderAdminWalletOps(); };
window.admManAdj = function(e) {
  e.preventDefault(); const u = userIndex.get(document.getElementById('amPh').value.trim()), amt = safeNum(document.getElementById('amAm').value, 0);
  if (!u || !amt) return alert('بيانات غير صالحة.');
  u.wallet = Math.max(0, +((u.wallet || 0) + amt).toFixed(2));
  if (DB.currentUser?.phone === u.phone) DB.currentUser.wallet = u.wallet;
  addLedgerEntry(amt > 0 ? 'deposit' : 'withdraw', Math.abs(amt), `تعديل إداري: ${u.name}`);
  saveDB(DB); updateNavUI(); alert(`✅ الرصيد الجديد لـ ${u.name}: ${u.wallet} ج.م`);
};
window.decideWReq = function(id, st) {
  const r = DB.walletRequests.find(x => x.id === id); if (!r || r.status !== 'pending') return;
  const u = userIndex.get(r.phone);
  if (st === 'approved') {
    if (r.op === 'deposit' && u) { u.wallet = +((u.wallet || 0) + r.amount).toFixed(2); addLedgerEntry('deposit', r.amount, `إيداع معتمد: ${r.name}`); }
    else if (r.op === 'withdraw' && r.fee > 0) addLedgerEntry('platform_profit', r.fee, `رسوم سحب: ${r.name}`);
  } else if (r.op === 'withdraw' && u) {
    u.wallet = +((u.wallet || 0) + r.amount).toFixed(2);
  }
  r.status = st; saveDB(DB); updateNavUI(); handleDriverViewLogic(); window.renderAdminWalletOps();
};

window.renderAdminAnalytics = function() {
  const p = document.getElementById('admintab-analytics'); if (!p) return;
  const trips = DB.tripHistory.length, cancels = DB.cancelLogs.length, deliv = DB.deliveryOrders.length;
  const custs = DB.users.filter(u => u.role === 'customer').length, caps = DB.users.filter(u => u.role === 'captain').length;
  const rev = DB.tripHistory.reduce((s, t) => s + (t.fare || 0), 0) + DB.deliveryOrders.reduce((s, d) => s + (d.price || 0), 0);
  const maxB = Math.max(1, trips, cancels, deliv, custs, caps);
  const bar = (lbl, v, col) => `<div class="space-y-1"><div class="flex justify-between font-bold"><span>${lbl}</span><span>${v}</span></div><div class="w-full bg-slate-100 rounded-full h-2.5"><div class="${col} h-2.5 rounded-full" style="width:${Math.min(100, Math.round((v / maxB) * 100))}%"></div></div></div>`;
  p.innerHTML = `
    <h3 class="font-black text-sm border-b pb-2">التحليلات والرسوم البيانية</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
      <div class="p-3 bg-emerald-50 border rounded-2xl"><span>رحلات مكتملة</span><b class="text-lg block">${trips}</b></div>
      <div class="p-3 bg-orange-50 border rounded-2xl"><span>طلبات دلفري</span><b class="text-lg block">${deliv}</b></div>
      <div class="p-3 bg-rose-50 border rounded-2xl"><span>الإلغاءات</span><b class="text-lg block">${cancels}</b></div>
      <div class="p-3 bg-indigo-50 border rounded-2xl"><span>حجم التداول</span><b class="text-lg block">${rev.toFixed(0)} ج.م</b></div>
    </div>
    <div class="p-4 bg-slate-50 border rounded-2xl space-y-2">${bar('العملاء', custs, 'bg-emerald-500')}${bar('الكباتن', caps, 'bg-amber-500')}${bar('الرحلات', trips, 'bg-indigo-600')}${bar('الدلفري', deliv, 'bg-orange-500')}${bar('الإلغاءات', cancels, 'bg-rose-500')}</div>
  `;
};

window.renderAllAdminExtras = function() {
  const c = document.getElementById('admintab-extras'); if (!c) return;
  const today = new Date().toISOString().slice(0, 10);
  const custBal = DB.users.filter(u => u.role === 'customer').reduce((s, u) => s + (u.wallet || 0), 0);
  const depSum = DB.financialLedger.filter(l => l.type === 'deposit').reduce((s, l) => s + l.amount, 0);
  const insSum = DB.financialLedger.filter(l => l.type === 'inspection').reduce((s, l) => s + l.amount, 0);
  const capSum = DB.financialLedger.filter(l => l.type === 'trip_captain').reduce((s, l) => s + l.amount, 0);
  const dayPlat = DB.financialLedger.filter(l => l.type === 'platform_profit' && l.date === today).reduce((s, l) => s + l.amount, 0);
  const usedKB = Math.round((JSON.stringify(DB).length * 2) / 1024);
  const np = DB.nightPeakConfig;

  c.innerHTML = `
    <div class="bg-white p-4 rounded-2xl border space-y-2 md:col-span-2">
      <div class="flex justify-between border-b pb-1"><h4 class="font-black text-sm">دفتر العمليات المالية</h4><button onclick="window.exportCSV()" class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">تصدير CSV</button></div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
        <div class="bg-slate-50 p-2 rounded-xl border"><span>رصيد العملاء</span><b class="block">${custBal.toFixed(1)} ج</b></div>
        <div class="bg-blue-50 p-2 rounded-xl border"><span>الإيداعات</span><b class="block">${depSum.toFixed(1)} ج</b></div>
        <div class="bg-purple-50 p-2 rounded-xl border"><span>الفحوصات</span><b class="block">${insSum.toFixed(1)} ج</b></div>
        <div class="bg-amber-50 p-2 rounded-xl border"><span>أرباح الكباتن</span><b class="block">${capSum.toFixed(1)} ج</b></div>
        <div class="bg-emerald-50 p-2 rounded-xl border"><span>ربح اليوم</span><b class="block">${dayPlat.toFixed(1)} ج</b></div>
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border space-y-2 md:col-span-2">
      <b class="block border-b pb-1">إدارة المستخدمين + القائمة السوداء</b>
      <form onsubmit="window.admAddUser(event)" class="grid grid-cols-2 md:grid-cols-6 gap-1.5">
        <select id="auR" class="border rounded p-1.5 font-bold"><option value="customer">عميل</option><option value="captain">كابتن</option></select>
        <input id="auN" required placeholder="الاسم" class="border rounded p-1.5"><input id="auP" required placeholder="الهاتف" class="border rounded p-1.5 font-mono">
        <input id="auPs" required placeholder="كلمة المرور" class="border rounded p-1.5"><input id="auW" type="number" value="0" class="border rounded p-1.5">
        <button class="bg-emerald-600 text-white font-black rounded p-1.5">+ إضافة</button>
      </form>
      <form onsubmit="event.preventDefault();DB.blacklist.push({phone:document.getElementById('blPh').value.trim(),reason:document.getElementById('blRs').value.trim()});saveDB(DB);renderAllAdminExtras();" class="flex gap-1.5 pt-1">
        <input id="blPh" required placeholder="حظر رقم هاتف" class="border rounded p-1.5 font-mono w-1/3"><input id="blRs" required placeholder="السبب" class="border rounded p-1.5 flex-grow"><button class="bg-rose-600 text-white px-3 rounded font-bold">حظر</button>
      </form>
      <div class="flex flex-wrap gap-1">${DB.blacklist.map((b, i) => `<span class="bg-rose-50 border px-2 py-0.5 rounded">${esc(b.phone)} <button onclick="DB.blacklist.splice(${i},1);saveDB(DB);renderAllAdminExtras();" class="text-emerald-700 font-bold">فك</button></span>`).join('')}</div>
    </div>

    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">التسعيرة الليلية وجدولة الذروة التلقائية</b>
      <div class="grid grid-cols-2 gap-1.5 font-bold">
        <button onclick="DB.nightPeakConfig.autoNightEnabled=!DB.nightPeakConfig.autoNightEnabled;saveDB(DB);renderAllAdminExtras();" class="p-1.5 border rounded-lg">${np.autoNightEnabled?'🟢 التعريفة الليلية':'🔴 التعريفة الليلية'}</button>
        <button onclick="DB.nightPeakConfig.autoPeakEnabled=!DB.nightPeakConfig.autoPeakEnabled;saveDB(DB);renderAllAdminExtras();" class="p-1.5 border rounded-lg">${np.autoPeakEnabled?'🟢 جدولة الذروة':'🔴 جدولة الذروة'}</button>
      </div>
      <div class="grid grid-cols-4 gap-1 text-[10px]">
        <div><span>ليل من</span><input id="npNS" type="number" value="${np.nightStartHour}" class="w-full border rounded p-1"></div>
        <div><span>إلى</span><input id="npNE" type="number" value="${np.nightEndHour}" class="w-full border rounded p-1"></div>
        <div><span>زيادة%</span><input id="npNP" type="number" value="${np.nightPercent}" class="w-full border rounded p-1"></div>
        <div><span>ذروة%</span><input id="npPP" type="number" value="${np.peakPercent}" class="w-full border rounded p-1"></div>
      </div>
      <button onclick="DB.nightPeakConfig.nightStartHour=+document.getElementById('npNS').value;DB.nightPeakConfig.nightEndHour=+document.getElementById('npNE').value;DB.nightPeakConfig.nightPercent=+document.getElementById('npNP').value;DB.nightPeakConfig.peakPercent=+document.getElementById('npPP').value;saveDB(DB);recalcTrip(false);alert('تم الحفظ!');" class="w-full bg-slate-900 text-white py-1.5 rounded-xl font-bold">حفظ الجدولة</button>
    </div>

    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">شريط البث المباشر + العمولات + الترحيب</b>
      <div class="flex gap-1"><input id="exTickTx" value="${esc(DB.broadcastTicker.text)}" class="flex-grow border rounded p-1.5"><button onclick="DB.broadcastTicker.text=document.getElementById('exTickTx').value;DB.broadcastTicker.enabled=!DB.broadcastTicker.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="px-2.5 rounded font-bold ${DB.broadcastTicker.enabled?'bg-emerald-600 text-white':'bg-slate-200'}">${DB.broadcastTicker.enabled?'ظاهر':'مخفي'}</button></div>
      <div class="grid grid-cols-3 gap-1 text-[10px]">
        <div><span>عمولة رحلة%</span><input id="exComm" type="number" value="${DB.referralConfig.tripCommissionPercent}" class="w-full border rounded p-1 font-bold"></div>
        <div><span>تحويل%</span><input id="exTrC" type="number" value="${DB.transferSettings.commissionPercent}" class="w-full border rounded p-1 font-bold"></div>
        <div><span>عد القبول(ث)</span><input id="exDisp" type="number" value="${DB.dispatchConfig.countdownSeconds}" class="w-full border rounded p-1 font-bold"></div>
      </div>
      <button onclick="DB.referralConfig.tripCommissionPercent=+document.getElementById('exComm').value;DB.transferSettings.commissionPercent=+document.getElementById('exTrC').value;DB.dispatchConfig.countdownSeconds=+document.getElementById('exDisp').value;saveDB(DB);alert('تم الحفظ!');" class="w-full bg-emerald-600 text-white py-1.5 rounded-xl font-bold">حفظ العمولات</button>
    </div>

    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">إظهار / إخفاء الميزات</b>
      <div class="grid grid-cols-2 gap-1 font-bold text-[11px]">
        <button onclick="DB.deliveryConfig.enabled=!DB.deliveryConfig.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1.5 border rounded">${DB.deliveryConfig.enabled?'🟢 الدلفري':'🔴 الدلفري'}</button>
        <button onclick="DB.partnerConfig.enabled=!DB.partnerConfig.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1.5 border rounded">${DB.partnerConfig.enabled?'🟢 الشركات':'🔴 الشركات'}</button>
        <button onclick="DB.loanSettings.enabled=!DB.loanSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1.5 border rounded">${DB.loanSettings.enabled?'🟢 السلف':'🔴 السلف'}</button>
        <button onclick="DB.installmentSettings.enabled=!DB.installmentSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1.5 border rounded">${DB.installmentSettings.enabled?'🟢 التقسيط':'🔴 التقسيط'}</button>
        <button onclick="DB.insuranceSettings.enabled=!DB.insuranceSettings.enabled;saveDB(DB);refreshGlobalChrome();renderAllAdminExtras();" class="p-1.5 border rounded">${DB.insuranceSettings.enabled?'🟢 التأمين':'🔴 التأمين'}</button>
        <button onclick="DB.intercityConfig.enabled=!DB.intercityConfig.enabled;saveDB(DB);renderAllAdminExtras();" class="p-1.5 border rounded">${DB.intercityConfig.enabled?'🟢 السفر بين المحافظات':'🔴 السفر'}</button>
      </div>
    </div>

    <div class="bg-white p-4 rounded-2xl border space-y-2">
      <b class="block border-b pb-1">مراقب المساحة (${usedKB} KB) + النسخ الاحتياطي + Firebase</b>
      <input id="exFbUrl" value="${esc(getFirebaseBaseUrl())}" placeholder="https://your-app.firebaseio.com" class="w-full border rounded p-1.5 font-mono">
      <div class="grid grid-cols-2 gap-1.5 font-bold">
        <button onclick="DB.firebaseConfig.dbUrl=document.getElementById('exFbUrl').value.trim();saveDB(DB,true);savePatches(getPatches());alert('تم ربط ومزامنة Firebase للبيانات والباتشات!');" class="bg-slate-900 text-white py-1.5 rounded-xl">حفظ ومزامنة Firebase</button>
        <button onclick="window.optimizeStorageClean()" class="bg-amber-500 text-slate-900 py-1.5 rounded-xl">تنظيف السجلات القديمة</button>
        <button onclick="window.downloadFullBackup()" class="bg-blue-600 text-white py-1.5 rounded-xl">تنزيل نسخة احتياطية</button>
        <label class="bg-emerald-600 text-white py-1.5 rounded-xl text-center cursor-pointer">استعادة نسخة<input type="file" accept=".json" onchange="window.restoreFullBackup(event)" class="hidden"></label>
      </div>
      <div class="grid grid-cols-2 gap-1.5 font-bold pt-1">
        <button onclick="window.exportCaptains()" class="bg-teal-700 text-white py-1.5 rounded-xl">تصدير إثباتات الكباتن</button>
        <button onclick="DB.captainsPending.forEach(x=>x.docs={});saveDB(DB);alert('تم حذف الصور!');" class="bg-rose-600 text-white py-1.5 rounded-xl">حذف صور الإثباتات</button>
      </div>
    </div>
  `;
};

window.admAddUser = function(e) {
  e.preventDefault(); const ph = document.getElementById('auP').value.trim();
  if (userIndex.has(ph)) return alert('الرقم موجود!');
  const u = { role: document.getElementById('auR').value, name: document.getElementById('auN').value.trim(), phone: ph, password: document.getElementById('auPs').value.trim(), wallet: safeNum(document.getElementById('auW').value, 0, 0), status: 'approved', isAvailable: true, inTrip: false, vehicle: 'سيارة ملاكي', plate: 'مضافة إدارياً', loyaltyPoints: 0, favorites: {} };
  ensureUserReferralCode(u); DB.users.push(u); rebuildUserIndex(); saveDB(DB); window.renderAllAdminExtras(); alert('✅ تمت الإضافة!');
};
window.optimizeStorageClean = function() {
  if (DB.financialLedger.length > 100) DB.financialLedger = DB.financialLedger.slice(-100);
  if (DB.tripHistory.length > 100) DB.tripHistory = DB.tripHistory.slice(-100);
  if (DB.auditLogs.length > 50) DB.auditLogs = DB.auditLogs.slice(-50);
  if (DB.cancelLogs.length > 50) DB.cancelLogs = DB.cancelLogs.slice(-50);
  saveDB(DB, true); window.renderAllAdminExtras(); alert('✅ تم ضغط وتنظيف السجلات القديمة وتحسين السرعة!');
};
window.exportCSV = function() {
  const rows = [['التاريخ','الوقت','النوع','المبلغ','البيان'], ...DB.financialLedger.map(l => [l.date, l.time, l.type, l.amount, `"${(l.note||'').replace(/"/g,'')}"`])];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })); a.download = 'tawsila-ledger.csv'; a.click();
};
window.exportCaptains = function() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ captainsPending: DB.captainsPending, captains: DB.users.filter(u => u.role === 'captain') }, null, 2)], { type: 'application/json' })); a.download = 'captains-proofs.json'; a.click();
};
window.downloadFullBackup = function() {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), store: DB, patches: getPatches() }, null, 2)], { type: 'application/json' })); a.download = `tawsila-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
};
window.restoreFullBackup = function(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async ev => {
    const data = safeJsonParse(ev.target.result, null);
    if (!data?.store?.users) return alert('❌ ملف غير صالح!');
    DB = normalizeStore(data.store); saveDB(DB, true);
    if (Array.isArray(data.patches)) await savePatches(data.patches);
    alert('✅ تمت الاستعادة بنجاح ومزامنتها مع Firebase!'); location.reload();
  };
  r.readAsText(f);
};

// ==========================================
// 11. بناء الواجهات المدمجة + حل مشكلة المدير العام بالقيادة + التنقل والإقلاع
// ==========================================
function buildUnifiedUI() {
  if (!document.getElementById('proCustCSS')) {
    const st = document.createElement('style'); st.id = 'proCustCSS';
    st.textContent = `
      #view-customer #map { height: 500px !important; border: 3px solid #ecfdf5; }
      .patch-trip-child-hidden, .patch-admin-banner-hidden { display: none !important; }
      .patch-trip-card-compact { padding: 0.65rem 0.9rem !important; gap: 0 !important; }
      body.dark-mode { background-color: #0f172a !important; color: #e2e8f0 !important; }
      body.dark-mode .bg-white { background-color: #1e293b !important; color: #f1f5f9 !important; border-color: #334155 !important; }
      body.dark-mode .bg-slate-50, body.dark-mode .bg-slate-100 { background-color: #0f172a !important; color: #cbd5e1 !important; border-color: #334155 !important; }
      body.dark-mode input, body.dark-mode select, body.dark-mode textarea { background-color: #0f172a !important; color: #f8fafc !important; border-color: #475569 !important; }
      body.dark-mode .leaflet-tile-pane { filter: invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%); }
    `;
    document.head.appendChild(st);
  }
  if (localStorage.getItem('TAWSILA_DARK_MODE') === '1') document.body.classList.add('dark-mode');

  const mainEl = document.querySelector('main');
  if (mainEl && !document.getElementById('patchBroadcastWrap')) {
    const t = document.createElement('div'); t.id = 'patchBroadcastWrap'; t.className = 'mb-3';
    const b = document.createElement('div'); b.id = 'patchPromoBannerWrap'; b.className = 'mb-3';
    mainEl.prepend(b); mainEl.prepend(t);
  }

  const mapCol = document.querySelector('#view-customer .lg\\:col-span-2');
  if (mapCol && !document.getElementById('patchMapProHeader')) {
    const bar = document.createElement('div'); bar.id = 'patchMapProHeader';
    bar.className = 'mb-2 bg-slate-900 text-white px-3.5 py-2 rounded-2xl flex justify-between items-center text-xs shadow';
    bar.innerHTML = `<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span><b>OSRM مسار حقيقي</b></div><div class="flex items-center gap-2"><b id="proEtaText" class="text-amber-300">~10 د</b><button onclick="getCurrentLocation()" class="bg-emerald-600 px-2.5 py-1 rounded-lg text-[11px] font-bold">موقعي</button></div>`;
    mapCol.prepend(bar);
  }

  const custSide = document.querySelector('#view-customer > div:first-child > div:first-child');
  if (custSide && !document.getElementById('patchCustWalletCard')) {
    const wc = document.createElement('div'); wc.id = 'patchCustWalletCard';
    wc.className = 'bg-gradient-to-l from-emerald-800 to-slate-900 text-white p-3 rounded-2xl mb-3 shadow space-y-2';
    wc.innerHTML = `<div class="flex justify-between items-center"><div><span class="text-[10px] text-emerald-200 block">محفظة العميل</span><b class="text-lg font-black text-amber-300"><span id="custCardWalletBal">0.00</span> ج.م</b></div><button type="button" onclick="window.openWalletOpsModal('history')" class="bg-white/15 px-2.5 py-1 rounded-lg text-[10px] font-bold">السجل</button></div><div class="grid grid-cols-2 gap-1.5 text-xs"><button type="button" id="btnCustDepositOp" onclick="window.openWalletOpsModal('deposit')" class="bg-emerald-500 text-slate-950 font-black py-1.5 rounded-xl">إيداع / شحن</button><button type="button" id="btnCustWithdrawOp" onclick="window.openWalletOpsModal('withdraw')" class="bg-amber-400 text-slate-950 font-black py-1.5 rounded-xl">سحب رصيد</button></div>`;
    custSide.prepend(wc);
  }

  const govBox = document.getElementById('custGovernorateSelect')?.closest('.bg-slate-50');
  if (govBox && !document.getElementById('patchCustAreaWrap')) {
    const d = document.createElement('div'); d.id = 'patchCustAreaWrap';
    d.className = 'bg-slate-50 border p-2 rounded-xl mb-3 flex items-center justify-between';
    d.innerHTML = `<span class="text-xs font-bold text-slate-700"><i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i>القرية/المنطقة:</span><select id="custAreaSelect" onchange="if(this.value){const g=DB.governorates.find(x=>x.id===DB.selectedGovId);document.getElementById('pickupInput').value=this.value+' - '+g.name;}" class="text-xs font-black bg-white border rounded-lg p-1 outline-none text-emerald-800 max-w-[165px]"></select>`;
    govBox.parentElement.insertBefore(d, govBox.nextSibling);
  }

  const formFields = document.querySelector('#view-customer .space-y-3.text-xs');
  if (formFields && !document.getElementById('patchRideExtrasBox')) {
    const bx = document.createElement('div'); bx.id = 'patchRideExtrasBox'; bx.className = 'space-y-2';
    bx.innerHTML = `
      <div class="flex flex-wrap gap-1 items-center">
        <button type="button" onclick="window.useFavoritePlace('home')" class="bg-slate-100 border px-2 py-1 rounded-lg font-bold text-[10px]">🏠 البيت</button>
        <button type="button" onclick="window.saveFavoritePlace('home')" class="text-emerald-700 text-[10px] font-bold">حفظ</button>
        <button type="button" onclick="window.useFavoritePlace('work')" class="bg-slate-100 border px-2 py-1 rounded-lg font-bold text-[10px] mr-1">💼 العمل</button>
        <button type="button" onclick="window.saveFavoritePlace('work')" class="text-emerald-700 text-[10px] font-bold">حفظ</button>
        <button type="button" onclick="window.addExtraStopPoint()" class="mr-auto bg-amber-100 text-amber-900 px-2 py-1 rounded-lg font-bold text-[10px]">+ محطة توقف</button>
      </div>
      <div id="patchExtraStopsBox" class="flex flex-wrap gap-1"></div>
      <div class="bg-slate-50 border p-2 rounded-xl space-y-1.5">
        <div class="flex justify-between items-center"><b>الراكب والموعد:</b><div class="flex gap-1"><select id="riderModeSel" onchange="document.getElementById('otherRiderFields').classList.toggle('hidden',this.value==='self')" class="border rounded px-1.5 py-0.5 font-bold bg-white"><option value="self">لنفسي</option><option value="other">لشخص آخر</option></select><select id="rideSchedMode" onchange="document.getElementById('rideSchedDateTime').classList.toggle('hidden',this.value==='now')" class="border rounded px-1.5 py-0.5 font-bold bg-white"><option value="now">الآن</option><option value="later">حجز مجدول</option></select></div></div>
        <div id="otherRiderFields" class="hidden grid grid-cols-2 gap-1"><input id="otherRiderName" placeholder="اسم الراكب" class="border rounded p-1 bg-white"><input id="otherRiderPhone" placeholder="هاتف الراكب" class="border rounded p-1 bg-white font-mono"></div>
        <input id="rideSchedDateTime" type="datetime-local" class="hidden w-full border rounded p-1 bg-white font-bold">
        <div class="flex flex-wrap gap-2 text-[10px] font-bold pt-1">
          <label><input type="checkbox" class="ride-pref-chk" value="تكييف"> تكييف</label>
          <label><input type="checkbox" class="ride-pref-chk" value="كابتن سيدة"> كابتن سيدة</label>
          <label><input type="checkbox" class="ride-pref-chk" value="حقيبة سفر"> حقيبة سفر</label>
          <label><input type="checkbox" class="ride-pref-chk" value="ممنوع التدخين"> ممنوع التدخين</label>
        </div>
      </div>
    `;
    formFields.prepend(bx);
  }

  const fareSum = document.querySelector('#view-customer .bg-slate-900.text-white');
  if (fareSum && !document.getElementById('patchInsuranceBox')) {
    const ins = document.createElement('div'); ins.id = 'patchInsuranceBox'; ins.className = 'bg-sky-50 border border-sky-200 p-2 rounded-xl';
    ins.innerHTML = `<label class="flex items-center justify-between cursor-pointer"><div class="flex items-center gap-1.5"><input type="checkbox" id="chkTripInsurance" onchange="window.__insuranceOptIn=this.checked;recalcTrip(false);" class="w-4 h-4 accent-sky-600"><span class="font-black text-sky-900">تأمين الرحلة</span></div><span id="insFeeLabel" class="bg-sky-600 text-white px-2 py-0.5 rounded font-black text-[10px]"></span></label>`;
    fareSum.parentElement.insertBefore(ins, fareSum);
  }

  if (custSide && !document.getElementById('custQuickActionsGrid')) {
    const g = document.createElement('div'); g.id = 'custQuickActionsGrid'; g.className = 'grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-black';
    g.innerHTML = `
      <button id="btnCustDeliv" onclick="window.openDeliveryModal()" class="bg-orange-600 text-white py-1.5 rounded-xl">📦 دلفري</button>
      <button onclick="window.openIntercityModal()" class="bg-blue-700 text-white py-1.5 rounded-xl">🚌 سفر محافظات</button>
      <button onclick="window.openCommuteModal()" class="bg-cyan-700 text-white py-1.5 rounded-xl">🎓 اشتراك ثابت</button>
      <button id="btnCustTrans" onclick="window.openTransferModal()" class="bg-indigo-600 text-white py-1.5 rounded-xl">💸 تحويل رصيد</button>
      <button onclick="window.openQrPayModal()" class="bg-slate-900 text-amber-300 py-1.5 rounded-xl">QR الدفع</button>
      <button id="btnCustInst" onclick="window.openInstallmentModal()" class="bg-teal-600 text-white py-1.5 rounded-xl">🚗 تقسيط مركبة</button>
      <button onclick="window.openHistoryLoyaltyModal()" class="bg-slate-800 text-white py-1.5 rounded-xl">⭐ سجلي ونقاطي</button>
      <button onclick="window.openScheduledRidesModal()" class="bg-slate-700 text-white py-1.5 rounded-xl">📅 المجدولة</button>
      <button onclick="window.openComplaintsModal()" class="bg-rose-50 border border-rose-200 text-rose-700 py-1.5 rounded-xl">🎧 شكاوى</button>
      <button onclick="window.openLostFoundModal()" class="bg-indigo-50 border border-indigo-200 text-indigo-700 py-1.5 rounded-xl">🔎 المفقودات</button>
    `;
    custSide.appendChild(g);
  }

  const custCard = document.getElementById('customerDriverCard');
  if (custCard && !document.getElementById('patchOtpCustBox')) {
    const b = document.createElement('div'); b.id = 'patchOtpCustBox'; b.className = 'bg-amber-50 border border-amber-300 rounded-xl p-2 flex justify-between items-center text-xs';
    b.innerHTML = `<span class="font-bold text-amber-900">🔐 رمز الأمان:</span><b id="patchTripOtpVal" class="font-mono text-base font-black bg-white px-2.5 rounded border">----</b>`;
    custCard.insertBefore(b, custCard.querySelector('.grid'));
    const cb = document.createElement('button'); cb.className = 'w-full bg-rose-100 text-rose-800 font-black py-1.5 rounded-xl text-xs mt-1';
    cb.innerText = 'إلغاء المشوار'; cb.onclick = window.openCancelReasonModal; custCard.appendChild(cb);
  }

  // شاشة الكابتن
  const capScreen = document.getElementById('captainActiveScreen');
  if (capScreen && !document.getElementById('patchCapProBox')) {
    const box = document.createElement('div'); box.id = 'patchCapProBox'; box.className = 'space-y-2';
    box.innerHTML = `
      <div id="patchAdminCapPreviewBar" class="hidden bg-amber-50 border border-amber-300 p-2 rounded-xl flex justify-between items-center text-xs"></div>
      <div id="capLicAlertBanner" class="hidden bg-rose-100 border border-rose-300 text-rose-800 p-2 rounded-xl text-xs font-black"></div>
      <div class="bg-gradient-to-l from-slate-900 to-emerald-900 text-white p-3.5 rounded-2xl shadow space-y-2">
        <div class="flex justify-between items-center"><div><span class="text-[10px] text-emerald-200 block">محفظة الكابتن</span><b class="text-xl font-black text-amber-300"><span id="capProWalletVal">0.00</span> ج.م</b></div><button onclick="window.toggleCaptainAvailability()" id="patchCapAvailBtn" class="px-3 py-1 rounded-xl text-xs font-black bg-emerald-500 text-slate-950">متاح للرحلات</button></div>
        <div class="grid grid-cols-2 gap-2 text-xs"><button onclick="window.openWalletOpsModal('deposit')" class="bg-emerald-500 text-slate-950 font-black py-1.5 rounded-xl">إيداع رصيد</button><button onclick="window.openWalletOpsModal('withdraw')" class="bg-amber-400 text-slate-950 font-black py-1.5 rounded-xl">سحب رصيد</button></div>
      </div>
      <div class="bg-slate-50 border p-2 rounded-xl flex gap-1.5 text-xs"><input id="capDestFilterInp" placeholder="في طريقي للبيت (اسم المنطقة)" class="flex-grow bg-white border rounded-lg p-1.5 font-bold"><button onclick="window.saveCapDestFilter()" class="bg-slate-800 text-white px-2.5 rounded-lg font-bold">حفظ</button></div>
      <div id="capQuestBox" class="bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs flex justify-between items-center"></div>
      <div class="grid grid-cols-2 gap-1.5 text-[10px] font-black">
        <button onclick="window.openCapPackageModal()" class="bg-purple-700 text-white py-1.5 rounded-xl">👑 باقات 0% عمولة</button>
        <button onclick="window.openCapFuelTrackerModal()" class="bg-slate-900 text-amber-300 py-1.5 rounded-xl">⛽ الوقود وصافي الربح</button>
        <button id="btnCapLoan" onclick="window.openLoanModal()" class="bg-amber-500 text-slate-900 py-1.5 rounded-xl">💵 طلب سلفة</button>
        <button onclick="window.openQrPayModal()" class="bg-slate-800 text-white py-1.5 rounded-xl">QR تحصيل</button>
        <button onclick="window.toggleHeatmapView()" class="bg-rose-600 text-white py-1.5 rounded-xl">🔥 مناطق الذروة</button>
        <button onclick="window.openBestCaptainsModal()" class="bg-amber-400 text-slate-900 py-1.5 rounded-xl">🏆 أفضل الكباتن</button>
        <button onclick="window.openIntercityModal()" class="bg-blue-700 text-white py-1.5 rounded-xl">🚌 سفر محافظات</button>
        <button onclick="window.openScheduledRidesModal()" class="bg-cyan-700 text-white py-1.5 rounded-xl">📅 مجدولة</button>
        <button onclick="window.openLostFoundModal()" class="bg-indigo-600 text-white py-1.5 rounded-xl">🔎 المفقودات</button>
        <button onclick="window.openHistoryLoyaltyModal()" class="bg-slate-700 text-white py-1.5 rounded-xl">🧾 فواتيري</button>
      </div>
    `;
    capScreen.insertBefore(box, document.getElementById('driverOfferBox'));
  }

  const tripBox = document.getElementById('driverActiveTripBox');
  if (tripBox && !document.getElementById('patchCapWaitBox')) {
    const d = document.createElement('div'); d.id = 'patchCapWaitBox'; d.className = 'space-y-1.5';
    d.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 p-2 rounded-xl flex justify-between items-center text-xs"><div><b>⏱️ الانتظار: <span id="capWaitClock" class="font-mono">00:00</span></b> (<b id="capWaitCostText">0.00</b> ج)</div><button type="button" onclick="window.toggleWaitTimer()" id="btnToggleWaitTimer" class="bg-amber-500 text-slate-900 px-2.5 py-1 rounded-lg font-black">تشغيل</button></div>
      <div class="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center gap-2 text-xs"><i class="fa-solid fa-key text-amber-600"></i><input id="capOtpInput" maxlength="4" placeholder="أدخل رمز العميل (4 أرقام)" class="flex-grow bg-white border rounded p-1 font-mono font-black text-center"></div>
    `;
    tripBox.insertBefore(d, tripBox.querySelector('.space-y-2'));
  }

  const nav = document.querySelector('header nav');
  if (nav && !document.getElementById('patchHeaderShareBtn')) {
    const bL = document.createElement('button'); bL.id = 'patchLangBtn'; bL.className = 'px-2 py-1.5 rounded-xl bg-white/15 text-white font-black text-xs'; bL.innerText = currentLang === 'ar' ? 'EN' : 'AR'; bL.onclick = window.toggleAppLanguage;
    const bD = document.createElement('button'); bD.id = 'patchDarkBtn'; bD.className = 'px-2 py-1.5 rounded-xl bg-slate-900/50 text-amber-300 font-black text-xs'; bD.innerHTML = '<i class="fa-solid fa-moon"></i>';
    bD.onclick = () => { const isD = document.body.classList.toggle('dark-mode'); localStorage.setItem('TAWSILA_DARK_MODE', isD ? '1' : '0'); };
    const bS = document.createElement('button'); bS.id = 'patchHeaderShareBtn'; bS.className = 'px-2 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs'; bS.innerHTML = '<i class="fa-solid fa-share-nodes"></i>'; bS.onclick = window.openProfessionalShareModal;
    const bI = document.createElement('button'); bI.id = 'patchHeaderInboxBtn'; bI.className = 'relative px-2 py-1.5 rounded-xl bg-white/15 text-white font-bold text-xs'; bI.innerHTML = '<i class="fa-solid fa-envelope"></i> <span id="inboxUnreadBadge" class="hidden bg-rose-600 text-white text-[10px] px-1 rounded-full">0</span>'; bI.onclick = window.openInboxModal;
    [bI, bS, bD, bL].forEach(x => nav.prepend(x));
  }

  const pRef = new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('TAWSILA_PENDING_REF') || '';
  if (pRef) localStorage.setItem('TAWSILA_PENDING_REF', pRef);
  ['formRegCustomer', 'formRegCaptain'].forEach(fid => {
    const f = document.getElementById(fid);
    if (f && !document.getElementById('inp_' + fid + '_ref')) {
      const d = document.createElement('div');
      d.innerHTML = `${fid === 'formRegCaptain' ? '<label class="font-bold block mb-1">انتهاء الرخصة</label><input type="date" id="regCapLicExp" value="2027-06-01" class="w-full border rounded-xl p-2 font-bold mb-2">' : ''}<label class="font-bold block mb-1">كود الإحالة (اختياري)</label><input id="inp_${fid}_ref" value="${esc(pRef)}" placeholder="TW1234" class="uppercase w-full border rounded-xl p-2 font-mono font-bold">`;
      f.insertBefore(d, f.querySelector('button[type="submit"]'));
    }
  });

  const authBox = document.getElementById('view-auth');
  if (authBox && !document.getElementById('patchGoogleAuthWrap')) {
    const w = document.createElement('div'); w.id = 'patchGoogleAuthWrap'; w.className = 'pt-2 border-t space-y-2';
    w.innerHTML = `<button type="button" onclick="window.openGoogleQuickAuth()" class="w-full bg-white border-2 text-slate-800 font-black py-2 rounded-xl text-xs">المتابعة السريعة بحساب Google</button><button type="button" id="patchPartnerAuthBtn" onclick="window.openPartnerModal()" class="w-full bg-purple-700 text-white font-black py-2 rounded-xl text-xs"></button>`;
    authBox.appendChild(w);
  }

  const modForm = document.querySelector('#addModeratorModal form');
  if (modForm && !document.getElementById('patchModRoleBox')) {
    const d = document.createElement('div'); d.id = 'patchModRoleBox'; d.className = 'grid grid-cols-3 gap-1.5';
    d.innerHTML = `<select id="modRoleTitleSelect" class="border rounded-xl p-1.5 font-bold"><option>مالي</option><option>ميداني</option><option>فحص المركبات</option><option>مشرف عام محافظة</option><option>دعم سريع</option></select><select id="modGovScopeSelect" class="border rounded-xl p-1.5 font-bold"><option value="الكل">الكل</option>${DB.governorates.map(g => `<option>${esc(g.name)}</option>`).join('')}</select><input id="modAgentCommInp" type="number" value="5" placeholder="عمولة%" class="border rounded-xl p-1.5 font-bold">`;
    modForm.insertBefore(d, modForm.querySelector('.bg-slate-50'));
  }

  const adminView = document.getElementById('view-admin'), tabBar = adminView?.querySelector('.overflow-x-auto');
  if (adminView && tabBar && !document.getElementById('btn-adm-live')) {
    const tabs = [
      { id: 'live', html: '<i class="fa-solid fa-tower-broadcast ml-1 text-rose-600"></i> البيانات الحية', cls: 'hidden bg-white p-5 rounded-2xl border space-y-3 text-xs', prep: true },
      { id: 'walletops', html: '<i class="fa-solid fa-money-bill-transfer ml-1 text-emerald-600"></i> السحب والإيداع (<span id="admPendingWalletCnt">0</span>)', cls: 'hidden bg-white p-5 rounded-2xl border space-y-4 text-xs' },
      { id: 'analytics', html: '<i class="fa-solid fa-chart-pie ml-1 text-indigo-600"></i> الإحصائيات', cls: 'hidden bg-white p-5 rounded-2xl border space-y-4 text-xs' },
      { id: 'extras', html: '<i class="fa-solid fa-cubes ml-1 text-emerald-600"></i> إدارة الأقسام والخدمات', cls: 'hidden grid grid-cols-1 md:grid-cols-2 gap-4 text-xs' }
    ];
    tabs.forEach(t => {
      const b = document.createElement('button'); b.id = `btn-adm-${t.id}`; b.className = 'admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100'; b.innerHTML = t.html; b.onclick = () => switchAdminTab(t.id);
      if (t.prep) tabBar.prepend(b); else tabBar.appendChild(b);
      const p = document.createElement('div'); p.id = `admintab-${t.id}`; p.className = t.cls; adminView.appendChild(p);
    });
  }

  if (!document.getElementById('patchTermsFooter')) {
    const f = document.createElement('footer'); f.id = 'patchTermsFooter'; f.className = 'bg-white border-t py-3 px-4 text-center text-xs text-slate-600 mt-6';
    f.innerHTML = `جميع الحقوق محفوظة © توصيلة مصر | <button onclick="window.openTermsModal()" class="text-emerald-700 font-black hover:underline">سياسة الاستخدام والشروط</button>`;
    document.body.appendChild(f);
  }
  if (!document.getElementById('patchWaSupportBtn')) {
    const a = document.createElement('a'); a.id = 'patchWaSupportBtn'; a.target = '_blank';
    a.className = 'fixed bottom-5 left-4 z-40 bg-green-500 text-white font-black text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2';
    document.body.appendChild(a);
  }
  if (!document.getElementById('patchGenericModal')) {
    const d = document.createElement('div');
    d.innerHTML = `<div id="patchGenericModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs"><div class="bg-white w-full max-w-md rounded-3xl p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-center border-b pb-2"><h3 id="gmTitle" class="font-black text-sm"></h3><button onclick="document.getElementById('patchGenericModal').classList.add('hidden')">✕</button></div><div id="gmBody" class="space-y-3"></div></div></div>`;
    document.body.appendChild(d);
  }
  if (localStorage.getItem('TAWSILA_INSTALL_SHOWN') !== '1' && !document.getElementById('patchInstallBanner')) {
    let defP = null; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); defP = e; });
    const ib = document.createElement('div'); ib.id = 'patchInstallBanner'; ib.className = 'fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3 rounded-3xl shadow-2xl border border-emerald-500/40 flex items-center justify-between text-xs';
    ib.innerHTML = `<div class="flex items-center gap-2"><img src="https://cdn-icons-png.flaticon.com/512/3202/3202926.png" class="w-9 h-9 rounded-xl bg-white p-1"><div><b class="text-emerald-400 block">تثبيت تطبيق توصيلة</b><span class="text-[10px]">وصول سريع من الهاتف</span></div></div><div class="flex gap-1"><button id="btnDoIns" class="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-xl">تثبيت</button><button onclick="localStorage.setItem('TAWSILA_INSTALL_SHOWN','1');this.closest('#patchInstallBanner').remove();" class="px-2">✕</button></div>`;
    document.body.appendChild(ib);
    document.getElementById('btnDoIns').onclick = async () => { localStorage.setItem('TAWSILA_INSTALL_SHOWN', '1'); if (defP) { defP.prompt(); await defP.userChoice; } ib.remove(); };
  }
}

window.syncAllWalletDisplays = function() {
  const u = DB.currentUser, realUser = u ? (userIndex.get(u.phone) || u) : null;
  const bal = realUser ? safeNum(realUser.wallet, 0, 0) : 0;
  const nb = document.getElementById('navCustomerWallet'); if (nb) nb.innerText = bal.toFixed(2);
  const cb = document.getElementById('custCardWalletBal'); if (cb) cb.innerText = bal.toFixed(2);
  const wc = document.getElementById('admPendingWalletCnt'); if (wc) wc.innerText = DB.walletRequests.filter(r => r.status === 'pending').length;
};

window.refreshGlobalChrome = function() {
  const tk = document.getElementById('patchBroadcastWrap');
  if (tk) {
    tk.classList.toggle('hidden', !DB.broadcastTicker?.enabled);
    if (DB.broadcastTicker?.enabled) tk.innerHTML = `<div class="bg-amber-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl shadow flex items-center gap-2"><i class="fa-solid fa-bullhorn"></i><marquee>${esc(DB.broadcastTicker.text)}</marquee></div>`;
  }
  const adWrap = document.getElementById('patchPromoBannerWrap'), ad = DB.adsSettings.ads.find(a => a.active);
  if (adWrap) {
    adWrap.classList.toggle('hidden', !DB.adsSettings.enabled || !ad);
    if (ad) adWrap.innerHTML = `<div class="bg-gradient-to-l from-slate-900 to-emerald-800 text-white rounded-2xl p-3 shadow flex justify-between items-center text-xs"><div><b class="text-amber-300 block">${esc(ad.title)}</b><span>${esc(ad.body)}</span></div><button onclick="this.closest('#patchPromoBannerWrap').classList.add('hidden')">✕</button></div>`;
  }
  document.getElementById('patchTermsFooter')?.classList.toggle('hidden', !DB.termsSettings.enabled);
  const wa = document.getElementById('patchWaSupportBtn');
  if (wa) { wa.classList.toggle('hidden', !DB.whatsappSupport.enabled); wa.href = `https://wa.me/${(DB.whatsappSupport.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(DB.whatsappSupport.prefilledMsg || '')}`; wa.innerHTML = `<i class="fa-brands fa-whatsapp text-lg"></i><span>${esc(DB.whatsappSupport.buttonText)}</span>`; }
  document.getElementById('patchInsuranceBox')?.classList.toggle('hidden', !DB.insuranceSettings.enabled);
  if (document.getElementById('insFeeLabel')) document.getElementById('insFeeLabel').innerText = `+ ${DB.insuranceSettings.fee} ج.م`;
  const ib = document.getElementById('patchHeaderInboxBtn'), badge = document.getElementById('inboxUnreadBadge');
  if (ib) ib.classList.toggle('hidden', !DB.inboxSettings.enabled || !DB.currentUser);
  if (badge && DB.currentUser) { const cnt = DB.inboxMessages.filter(m => (m.to === 'all' || m.to === DB.currentUser.phone) && !(m.readBy || []).includes(DB.currentUser.phone)).length; badge.innerText = cnt; badge.classList.toggle('hidden', cnt === 0); }
  const pb = document.getElementById('patchPartnerAuthBtn');
  if (pb) { pb.classList.toggle('hidden', !DB.partnerConfig.enabled); pb.innerText = `تسجيل شركات / مطاعم / صيدليات (خصم ${DB.partnerConfig.discountPercent}%)`; }
  document.getElementById('btnCustDeliv')?.classList.toggle('hidden', !DB.deliveryConfig.enabled);
  document.getElementById('btnCustTrans')?.classList.toggle('hidden', !DB.transferSettings.enabled);
  document.getElementById('btnCustInst')?.classList.toggle('hidden', !DB.installmentSettings.enabled);
  document.getElementById('btnCapLoan')?.classList.toggle('hidden', !DB.loanSettings.enabled);
};

// حل مشكلة ظهور "الكابتن: المدير العام / 300.00" في شاشة الكابتن
window.changeAdminPreviewCaptain = function(phone) { window.__adminPreviewCapPhone = phone; handleDriverViewLogic(); };
function handleDriverViewLogic() {
  const u = DB.currentUser, pScr = document.getElementById('captainPendingScreen'), aScr = document.getElementById('captainActiveScreen');
  const nameEl = document.getElementById('driverDashboardName'), walEl = document.getElementById('driverWalletEGP'), proWal = document.getElementById('capProWalletVal'), preBar = document.getElementById('patchAdminCapPreviewBar');
  if (u && u.role === 'captain' && u.captainStatus === 'pending') { preBar?.classList.add('hidden'); pScr?.classList.remove('hidden'); aScr?.classList.add('hidden'); return; }
  if (u && u.role === 'customer') { preBar?.classList.add('hidden'); return navigate('customer'); }
  pScr?.classList.add('hidden'); aScr?.classList.remove('hidden');
  if (!u) return;

  let cap = null;
  if (u.role === 'admin' || u.role === 'moderator') {
    const caps = DB.users.filter(x => x.role === 'captain' && x.status === 'approved');
    const pref = activeTripData?.assignedCaptainPhone || window.__adminPreviewCapPhone || caps[0]?.phone || '';
    cap = userIndex.get(pref) || caps[0] || null;
    if (cap) window.__adminPreviewCapPhone = cap.phone;
    if (preBar) {
      preBar.classList.remove('hidden');
      preBar.innerHTML = `<span class="font-black text-amber-900">معاينة الإدارة:</span><select onchange="window.changeAdminPreviewCaptain(this.value)" class="bg-white border rounded-lg px-2 py-1 font-bold">${caps.length ? caps.map(c => `<option value="${esc(c.phone)}" ${c.phone===cap?.phone?'selected':''}>${esc(c.name)} (${safeNum(c.wallet,0,0).toFixed(2)} ج)</option>`).join('') : '<option>لا يوجد كباتن</option>'}</select>`;
    }
  } else {
    preBar?.classList.add('hidden');
    cap = userIndex.get(u.phone) || u;
  }

  const bal = cap ? safeNum(cap.wallet, 0, 0).toFixed(2) : '0.00';
  if (nameEl) nameEl.innerText = cap ? `الكابتن: ${cap.name}` : 'وضع معاينة الإدارة (اختر كابتن)';
  if (walEl) walEl.innerText = `${bal} ج.م`;
  if (proWal) proWal.innerText = bal;

  const qb = document.getElementById('capQuestBox');
  if (qb && cap && DB.questConfig?.enabled) qb.innerHTML = `<b>🏆 الهدف اليومي: ${cap.dailyTrips || 0} / ${DB.questConfig.targetTrips} رحلات</b><span class="text-emerald-700 font-black">مكافأة: ${DB.questConfig.bonusAmount} ج</span>`;
  const lb = document.getElementById('capLicAlertBanner');
  if (lb && cap?.licenseExpiry) {
    const d = Math.ceil((new Date(cap.licenseExpiry) - Date.now()) / 86400000);
    lb.classList.toggle('hidden', d > 15);
    if (d <= 15) lb.innerText = `⚠️ تنبيه الرخصة: ${d <= 0 ? 'منتهية الصلاحية!' : `تنتهي خلال ${d} يوم (${cap.licenseExpiry})`}`;
  }
  const df = document.getElementById('capDestFilterInp'); if (df && cap) df.value = cap.destFilter || '';
}

function navigate(view) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  if (view === 'customer') setTimeout(() => { initMap(); if (map) map.invalidateSize(); }, 200);
  else if (view === 'driver') handleDriverViewLogic();
  else if (view === 'admin') {
    const u = DB.currentUser;
    document.getElementById('adminWelcomeTitle').innerText = (u && u.role === 'moderator') ? `لوحة المشرف: ${u.name} (${u.roleTitle || ''})` : 'لوحة الإدارة العليا (المدير العام)';
    switchAdminTab('captains');
  }
  window.refreshGlobalChrome();
}

function handleLogoClick() {
  const u = DB.currentUser;
  if (!u) navigate('auth');
  else if (u.role === 'admin' || u.role === 'moderator') navigate('admin');
  else if (u.role === 'captain') navigate('driver');
  else navigate('customer');
}

// الإقلاع والمزامنة السحابية الدائمة من Firebase عند التشغيل
window.addEventListener('DOMContentLoaded', async () => {
  await loadStoreFromFirebase();
  await loadPatchesFromFirebase();
  buildUnifiedUI();
  renderGovernoratesUI();
  updateFeaturesAdminUI();
  updateNavUI();
  window.refreshGlobalChrome();
  applyAllPatches();
  await restoreSessionOnLoad();

  new MutationObserver(() => requestAnimationFrame(scanCollapseAndLiveBanner)).observe(document.body, { childList: true, subtree: true });
  scanCollapseAndLiveBanner();

  // مزامنة خلفية ذكية كل 12 ثانية عند الاتصال بـ Firebase دون مقاطعة الكتابة في الحقول
  setInterval(async () => {
    if (!getFirebaseBaseUrl() || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    const synced = await loadStoreFromFirebase();
    if (synced) { updateNavUI(); window.refreshGlobalChrome(); }
  }, 12000);

  if (DB.currentUser) {
    if (DB.currentUser.role === 'admin' || DB.currentUser.role === 'moderator') navigate('admin');
    else if (DB.currentUser.role === 'captain') navigate('driver');
    else navigate('customer');
  } else {
    navigate('auth');
  }
});
