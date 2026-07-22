/* ================= IKONKALAR (dinamik tugmalar uchun) ================= */
var ICONS = {
  trash: '<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
  undo: '<svg class="icon" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>',
  send: '<svg class="icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  map: '<svg class="icon-sm" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>'
};

/* ================= SOZLAMALAR ================= */
var DEFAULT_BOT_TOKEN = "8819241648:AAHg9Gk4FXwn4faYvV4sEuOxktceMNsQiFs";
var DEFAULT_CHAT_ID = "-1004355593897";
var DEFAULT_APP_PIN = "9999";

var BOT_TOKEN_KEY = "katlavanBotTokenV1";
var CHAT_ID_KEY = "katlavanChatIdV1";
var PIN_KEY = "katlavanAppPinV1";

var STORAGE_KEY = "katlavanHistoryV2";
var PENDING_KEY = "katlavanPendingV1";
var NAME_KEY = "katlavanOperatorNameV1";

var BOT_TOKEN = localStorage.getItem(BOT_TOKEN_KEY) || DEFAULT_BOT_TOKEN;
var CHAT_ID = localStorage.getItem(CHAT_ID_KEY) || DEFAULT_CHAT_ID;
var APP_PIN = localStorage.getItem(PIN_KEY) || DEFAULT_APP_PIN;

/* ================= DATABASE HELPER (IndexedDB) ================= */
var db;
var DB_NAME = "KatlavanDB";
var DB_VERSION = 1;

function initDb(callback) {
  var request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = function(e) {
    var dbObj = e.target.result;
    if (!dbObj.objectStoreNames.contains("store")) {
      dbObj.createObjectStore("store");
    }
  };
  request.onsuccess = function(e) {
    db = e.target.result;
    callback();
  };
  request.onerror = function(e) {
    console.error("IndexedDB initialization error:", e);
    callback();
  };
}

function dbGet(key, callback) {
  if (!db) {
    var val = localStorage.getItem("db_fallback_" + key);
    callback(val ? JSON.parse(val) : null);
    return;
  }
  var transaction = db.transaction(["store"], "readonly");
  var store = transaction.objectStore("store");
  var request = store.get(key);
  request.onsuccess = function(e) {
    callback(e.target.result || null);
  };
  request.onerror = function() {
    callback(null);
  };
}

function dbSet(key, value) {
  if (!db) {
    try {
      localStorage.setItem("db_fallback_" + key, JSON.stringify(value));
    } catch(e) {}
    return;
  }
  var transaction = db.transaction(["store"], "readwrite");
  var store = transaction.objectStore("store");
  store.put(value, key);
}

/* ================= ELEMENTLAR ================= */
var videoEl = document.getElementById("cam");
var canvasEl = document.getElementById("canvas");
var switchCamBtn = document.getElementById("switchCamBtn");
var switchCamLabel = document.getElementById("switchCamLabel");
var galleryBtn = document.getElementById("galleryBtn");
var galleryInput = document.getElementById("galleryInput");
var galleryPreviewImg = document.getElementById("galleryPreviewImg");
var galleryCancelBtn = document.getElementById("galleryCancelBtn");
var plateInput = document.getElementById("plateInput");
var autoReadBtn = document.getElementById("autoReadBtn");
var autoReadLabel = document.getElementById("autoReadLabel");
var noteInput = document.getElementById("noteInput");
var captureBtn = document.getElementById("captureBtn");
var paySuccessBtn = document.getElementById("paySuccessBtn");
var payFailBtn = document.getElementById("payFailBtn");
var currentPaymentStatus = "Pul oldi";

var blacklistPanel = document.getElementById("blacklistPanel");
var tabBlacklistBtn = document.getElementById("tabBlacklistBtn");
var blacklistAlertBanner = document.getElementById("blacklistAlertBanner");
var quickBlockBtn = document.getElementById("quickBlockBtn");
var blacklistPlateInput = document.getElementById("blacklistPlateInput");
var blacklistReasonInput = document.getElementById("blacklistReasonInput");
var addBlacklistBtn = document.getElementById("addBlacklistBtn");
var blacklistSearch = document.getElementById("blacklistSearch");
var blacklistList = document.getElementById("blacklistList");
var emptyBlacklist = document.getElementById("emptyBlacklist");
var blacklistCount = document.getElementById("blacklistCount");
var g_blacklist = [];

function setPaymentStatus(status){
  currentPaymentStatus = status;
  if(paySuccessBtn && payFailBtn){
    if(status === "Pul oldi"){
      paySuccessBtn.classList.add("active");
      payFailBtn.classList.remove("active");
    } else {
      payFailBtn.classList.add("active");
      paySuccessBtn.classList.remove("active");
    }
  }
}

if(paySuccessBtn){
  paySuccessBtn.addEventListener("click", function(){ setPaymentStatus("Pul oldi"); });
}
if(payFailBtn){
  payFailBtn.addEventListener("click", function(){ setPaymentStatus("Pul olmadi"); });
}

function loadBlacklist(){
  return g_blacklist;
}
function saveBlacklist(arr){
  g_blacklist = arr;
  dbSet("blacklist", g_blacklist);
}
function isBlacklisted(plate){
  var clean = plate.replace(/\s+/g, "").toUpperCase();
  for(var i = 0; i < g_blacklist.length; i++){
    var bClean = g_blacklist[i].plate.replace(/\s+/g, "").toUpperCase();
    if(bClean === clean){
      return g_blacklist[i];
    }
  }
  return null;
}
function checkPlateBlacklist(){
  if(!plateInput) return;
  var val = plateInput.value;
  var black = isBlacklisted(val);
  if(black){
    blacklistAlertBanner.style.display = "block";
    blacklistAlertBanner.textContent = "⚠️ ZAPRET! Sabab: " + black.reason;
  } else {
    blacklistAlertBanner.style.display = "none";
  }
}
if(plateInput){
  plateInput.addEventListener("input", checkPlateBlacklist);
}
if(quickBlockBtn){
  quickBlockBtn.addEventListener("click", function(){
    var val = plateInput.value.trim().toUpperCase();
    if(!val){
      showToast("Avval raqamni yozing yoki skanerlang", true);
      return;
    }
    var reason = prompt("Raqam: " + val + "\nTaqiqlash sababini yozing:", "Taqiq (qarz yoki buzilish)");
    if(reason === null){ return; }
    reason = reason.trim() || "Sabab ko'rsatilmadi";
    var arr = loadBlacklist();
    if(isBlacklisted(val)){
      showToast("Bu raqam allaqachon bloklangan!", true);
      return;
    }
    arr.push({ plate: val, reason: reason, addedAt: Date.now() });
    saveBlacklist(arr);
    renderBlacklistList();
    checkPlateBlacklist();
    showToast(val + " bloklandi!", false);
  });
}

function renderBlacklistList(){
  if(!blacklistList) return;
  var arr = loadBlacklist();
  blacklistList.innerHTML = "";
  
  var filter = blacklistSearch ? blacklistSearch.value.trim().toLowerCase() : "";
  var filtered = arr;
  if(filter){
    filtered = arr.filter(function(item){
      return item.plate.toLowerCase().indexOf(filter) !== -1 || item.reason.toLowerCase().indexOf(filter) !== -1;
    });
  }
  
  if(blacklistCount) blacklistCount.textContent = "Bloklangan mashinalar: " + arr.length + " ta";
  if(emptyBlacklist) emptyBlacklist.style.display = filtered.length === 0 ? "block" : "none";
  
  for(var i = filtered.length - 1; i >= 0; i--){
    var item = filtered[i];
    var li = document.createElement("li");
    
    var plateSpan = document.createElement("span");
    plateSpan.className = "plate";
    plateSpan.textContent = item.plate;
    
    var unblockBtn = document.createElement("button");
    unblockBtn.type = "button";
    unblockBtn.className = "unblock-btn";
    unblockBtn.textContent = "Blokdan yechish";
    unblockBtn.setAttribute("data-plate", item.plate);
    unblockBtn.addEventListener("click", function(e){
      var p = e.target.getAttribute("data-plate");
      if(confirm(p + " raqamini blokdan yechasizmi?")){
        var bList = loadBlacklist();
        bList = bList.filter(function(x){ return x.plate !== p; });
        saveBlacklist(bList);
        renderBlacklistList();
        checkPlateBlacklist();
        showToast(p + " blokdan yechildi", false);
      }
    });
    
    var reasonDiv = document.createElement("div");
    reasonDiv.className = "reason";
    reasonDiv.textContent = "Sababi: " + item.reason + " (Sana: " + new Date(item.addedAt).toLocaleDateString() + ")";
    
    li.appendChild(plateSpan);
    li.appendChild(unblockBtn);
    li.appendChild(reasonDiv);
    blacklistList.appendChild(li);
  }
}

if(blacklistSearch) blacklistSearch.addEventListener("input", renderBlacklistList);
if(addBlacklistBtn) addBlacklistBtn.addEventListener("click", function(){
  var pInput = blacklistPlateInput.value.trim().toUpperCase();
  var rInput = blacklistReasonInput.value.trim() || "Sabab ko'rsatilmadi";
  if(!pInput){
    showToast("Raqamni kiriting", true);
    return;
  }
  var arr = loadBlacklist();
  if(isBlacklisted(pInput)){
    showToast("Bu raqam allaqachon bloklangan!", true);
    return;
  }
  arr.push({ plate: pInput, reason: rInput, addedAt: Date.now() });
  saveBlacklist(arr);
  blacklistPlateInput.value = "";
  blacklistReasonInput.value = "";
  renderBlacklistList();
  checkPlateBlacklist();
  showToast(pInput + " bloklandi!", false);
});
var captureBtnLabel = document.getElementById("captureBtnLabel");
var statusEl = document.getElementById("status");
var clockEl = document.getElementById("clock");
var gpsBadge = document.getElementById("gpsBadge");

var pendingBar = document.getElementById("pendingBar");
var pendingText = document.getElementById("pendingText");
var retryPendingBtn = document.getElementById("retryPendingBtn");

var menuBtn = document.getElementById("menuBtn");
var closeMenu = document.getElementById("closeMenu");
var sideMenu = document.getElementById("sideMenu");
var overlay = document.getElementById("overlay");
var historyList = document.getElementById("historyList");
var historyCount = document.getElementById("historyCount");
var dailyReportText = document.getElementById("dailyReportText");
var sendDailyReportBtn = document.getElementById("sendDailyReportBtn");
var operatorNameLabel = document.getElementById("operatorNameLabel");
var changeNameBtn = document.getElementById("changeNameBtn");
var emptyHistory = document.getElementById("emptyHistory");
var clearHistoryBtn = document.getElementById("clearHistory");
var historySearch = document.getElementById("historySearch");
var exportCsvBtn = document.getElementById("exportCsvBtn");

var historyPanel = document.getElementById("historyPanel");
var trashPanel = document.getElementById("trashPanel");
var tabHistoryBtn = document.getElementById("tabHistoryBtn");
var tabTrashBtn = document.getElementById("tabTrashBtn");
var trashList = document.getElementById("trashList");
var trashCount = document.getElementById("trashCount");
var clearTrashBtn = document.getElementById("clearTrash");
var emptyTrash = document.getElementById("emptyTrash");

var statsPanel = document.getElementById("statsPanel");
var tabStatsBtn = document.getElementById("tabStatsBtn");
var statToday = document.getElementById("statToday");
var statWeek = document.getElementById("statWeek");
var statMonth = document.getElementById("statMonth");
var statAll = document.getElementById("statAll");
var statsWeekChart = document.getElementById("statsWeekChart");
var statsHourChart = document.getElementById("statsHourChart");
var statsTopPlates = document.getElementById("statsTopPlates");
var statsEmpty = document.getElementById("statsEmpty");

var pendingPanel = document.getElementById("pendingPanel");
var tabPendingBtn = document.getElementById("tabPendingBtn");
var tabPendingCount = document.getElementById("tabPendingCount");
var pendingList = document.getElementById("pendingList");
var pendingCount = document.getElementById("pendingCount");
var emptyPending = document.getElementById("emptyPending");
var sendAllPendingBtn = document.getElementById("sendAllPendingBtn");

var settingsPanel = document.getElementById("settingsPanel");
var darkModeToggle = document.getElementById("darkModeToggle");
var themeColorMeta = document.getElementById("themeColorMeta");
var tabSettingsBtn = document.getElementById("tabSettingsBtn");
var botTokenInput = document.getElementById("botTokenInput");
var toggleBotTokenBtn = document.getElementById("toggleBotTokenBtn");
var chatIdInput = document.getElementById("chatIdInput");
var newPinInput = document.getElementById("newPinInput");
var toggleNewPinBtn = document.getElementById("toggleNewPinBtn");
var settingsStatus = document.getElementById("settingsStatus");
var saveSettingsBtn = document.getElementById("saveSettingsBtn");
var testConnectionBtn = document.getElementById("testConnectionBtn");
var resetSettingsBtn = document.getElementById("resetSettingsBtn");
var lockAppBtn = document.getElementById("lockAppBtn");
var exportBackupBtn = document.getElementById("exportBackupBtn");
var importBackupBtn = document.getElementById("importBackupBtn");
var importBackupFile = document.getElementById("importBackupFile");
var backupStatus = document.getElementById("backupStatus");

var imgViewer = document.getElementById("imgViewer");
var viewerImg = document.getElementById("viewerImg");
var viewerCaption = document.getElementById("viewerCaption");
var closeViewer = document.getElementById("closeViewer");

var editEntryOverlay = document.getElementById("editEntryOverlay");
var editEntryBox = document.getElementById("editEntryBox");
var editPlateInput = document.getElementById("editPlateInput");
var editNoteInput = document.getElementById("editNoteInput");
var editEntryError = document.getElementById("editEntryError");
var editEntrySaveBtn = document.getElementById("editEntrySaveBtn");
var editEntryCancelBtn = document.getElementById("editEntryCancelBtn");

var toastEl = document.getElementById("toast");
var toastText = document.getElementById("toastText");
var toastIcon = document.getElementById("toastIcon");

var pinScreen = document.getElementById("pinScreen");
var pinInput = document.getElementById("pinInput");
var pinSubmit = document.getElementById("pinSubmit");
var pinError = document.getElementById("pinError");

var nameScreen = document.getElementById("nameScreen");
var nameInputField = document.getElementById("nameInputField");
var nameSubmit = document.getElementById("nameSubmit");
var nameError = document.getElementById("nameError");

var isSending = false;
var lastLat = null;
var lastLon = null;
var historyFilter = "";

/* ---------- Sahifadan tasodifan chiqib ketishning oldini olish ---------- */
window.addEventListener("beforeunload", function(e){
  if(isSending){
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("dragover", function(e){ e.preventDefault(); });
document.addEventListener("drop", function(e){ e.preventDefault(); });
document.addEventListener("contextmenu", function(e){ e.preventDefault(); });

/* ================= PIN LOCK (faqat 1 marta so'raladi) ================= */
var operatorName = localStorage.getItem(NAME_KEY) || "";

function checkUnlocked(){
  return localStorage.getItem("katlavanUnlocked") === "1";
}
function hasOperatorName(){
  return operatorName.trim() !== "";
}
function proceedAfterUnlock(){
  if(pinScreen) pinScreen.style.display = "none";
  if(hasOperatorName()){
    if(nameScreen) nameScreen.style.display = "none";
    initAppAfterUnlock();
  } else {
    if(nameScreen) nameScreen.style.display = "flex";
    if(nameInputField) nameInputField.focus();
  }
}
function tryUnlock(){
  var val = pinInput.value.trim();
  if(val === APP_PIN){
    localStorage.setItem("katlavanUnlocked", "1");
    pinError.textContent = "";
    proceedAfterUnlock();
  } else {
    pinError.textContent = "PIN noto'g'ri. Qayta urinib ko'ring.";
    pinInput.value = "";
    pinInput.focus();
  }
}
if (pinSubmit) pinSubmit.addEventListener("click", tryUnlock);
if (pinInput) pinInput.addEventListener("keydown", function(e){
  if(e.key === "Enter"){ tryUnlock(); }
});

function updateOperatorLabel(){
  operatorNameLabel.textContent = operatorName || "-";
}
var appAlreadyStarted = false;
function trySaveName(){
  var val = nameInputField.value.trim();
  if(val === ""){
    nameError.textContent = "Iltimos, ismingizni kiriting.";
    nameInputField.focus();
    return;
  }
  operatorName = val;
  localStorage.setItem(NAME_KEY, operatorName);
  nameError.textContent = "";
  nameScreen.style.display = "none";
  updateOperatorLabel();
  if(appAlreadyStarted){
    closeMenuFn();
  } else {
    initAppAfterUnlock();
    appAlreadyStarted = true;
  }
}
if (nameSubmit) nameSubmit.addEventListener("click", trySaveName);
if (nameInputField) nameInputField.addEventListener("keydown", function(e){
  if(e.key === "Enter"){ trySaveName(); }
});
if (changeNameBtn) changeNameBtn.addEventListener("click", function(){
  nameInputField.value = operatorName;
  nameError.textContent = "";
  nameScreen.style.display = "flex";
  nameInputField.focus();
});
updateOperatorLabel();

/* Unlock check deferred to DB init at the end */

/* ---------- Soat va sana ---------- */
function pad(n){
  n = String(n);
  if(n.length < 2){ n = "0" + n; }
  return n;
}
function getNowStrings(){
  var d = new Date();
  var time = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  var date = pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  return { time: time, date: date };
}
function tickClock(){
  var now = getNowStrings();
  clockEl.textContent = now.time;
}
setInterval(tickClock, 1000);
tickClock();

/* ================= GPS JOYLASHUV ================= */
function updateGps(){
  if(!navigator.geolocation){
    gpsBadge.textContent = "GPS mavjud emas";
    return;
  }
  navigator.geolocation.getCurrentPosition(function(pos){
    lastLat = pos.coords.latitude;
    lastLon = pos.coords.longitude;
    gpsBadge.textContent = "GPS: " + lastLat.toFixed(5) + ", " + lastLon.toFixed(5);
  }, function(err){
    gpsBadge.textContent = "GPS ruxsat berilmadi";
  }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 });
}

/* ================= KAMERA ================= */
var currentFacing = "environment";
var currentStream = null;
var galleryImageEl = null;
var CAPTURE_BTN_DEFAULT_LABEL = "RASMGA OLISH VA YUBORISH";
var CAPTURE_BTN_GALLERY_LABEL = "TASDIQLASH VA YUBORISH";

function startCamera(facing){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    setStatus("Bu qurilma/brauzer kamerani qo'llab-quvvatlamaydi.", "error");
    return;
  }
  if(currentStream){
    currentStream.getTracks().forEach(function(track){ track.stop(); });
    currentStream = null;
  }
  setStatus("Kamera ochilmoqda...", "sending");

  function onStreamReady(stream){
    currentStream = stream;
    videoEl.srcObject = stream;
    if(facing === "user"){
      videoEl.classList.add("mirrored");
      switchCamLabel.textContent = "Orqa kameraga o'tish";
    } else {
      videoEl.classList.remove("mirrored");
      switchCamLabel.textContent = "Old kameraga o'tish";
    }
    setStatus("Kamera tayyor. Raqamni ramka ichiga tushiring.", "idle");
  }

  /* Tezroq ochilishi uchun o'rtacha (1920x1080) o'lcham so'raladi */
  var constraints = { video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };
  navigator.mediaDevices.getUserMedia(constraints).then(onStreamReady).catch(function(err){
    var fallbackConstraints = { video: { facingMode: facing }, audio: false };
    navigator.mediaDevices.getUserMedia(fallbackConstraints).then(onStreamReady).catch(function(err2){
      setStatus("Kameraga ruxsat berilmadi: " + err2.message, "error");
    });
  });
}

if (switchCamBtn) switchCamBtn.addEventListener("click", function(){
  currentFacing = (currentFacing === "environment") ? "user" : "environment";
  setStatus("Kamera almashtirilmoqda...", "sending");
  startCamera(currentFacing);
});

/* ================= RAQAM VALIDATSIYASI ================= */
function isPlateLikelyValid(plate){
  var clean = plate.replace(/\s+/g, "").toUpperCase();
  var re1 = /^\d{2}[A-Z]\d{3}[A-Z]{2}$/;
  var re2 = /^\d{2}\d{3}[A-Z]{3}$/;
  return re1.test(clean) || re2.test(clean);
}

/* ================= TARIX (IndexedDB) ================= */
var g_history = [];
var g_trash = [];
var g_pending = [];

function loadHistory(){
  return g_history;
}
function saveHistory(arr){
  g_history = arr;
  dbSet("history", g_history);
}

var TRASH_KEY = "katlavan_trash";
function loadTrash(){
  return g_trash;
}
function saveTrash(arr){
  g_trash = arr;
  dbSet("trash", g_trash);
}

function findRecentDuplicate(plate){
  var arr = loadHistory();
  var now = Date.now();
  var i;
  for(i = arr.length - 1; i >= 0; i--){
    var item = arr[i];
    if(item.plate === plate && item.ts && (now - item.ts) < 5 * 60 * 1000){
      return item;
    }
  }
  return null;
}
function getTodayDateStr(){
  var d = new Date();
  return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
}
function countTodayEntries(){
  var arr = loadHistory();
  var today = getTodayDateStr();
  var count = 0;
  var i;
  for(i = 0; i < arr.length; i++){
    if(arr[i].date === today){ count++; }
  }
  return count;
}
function updateDailyReportText(){
  if(!dailyReportText) return;
  var count = countTodayEntries();
  dailyReportText.textContent = "Bugun: " + count + " ta mashina qayd etildi";
}
function renderHistory(){
  if(!historyList) return;
  var arr = loadHistory();
  var pending = loadPending();
  historyList.innerHTML = "";
  updateDailyReportText();

  var filtered = arr;
  if(historyFilter){
    filtered = arr.filter(function(item){
      return item.plate.toLowerCase().indexOf(historyFilter) !== -1;
    });
  }

  if(historyCount) historyCount.textContent = "Saqlangan yozuvlar: " + arr.length + " ta" + (pending.length > 0 ? " (" + pending.length + " ta navbatda)" : "");
  if(emptyHistory) emptyHistory.style.display = filtered.length === 0 ? "block" : "none";
  var i;
  for(i = filtered.length - 1; i >= 0; i--){
    var item = filtered[i];
    var li = document.createElement("li");

    var thumbBtn = document.createElement("button");
    thumbBtn.type = "button";
    thumbBtn.className = "histThumbBtn";
    thumbBtn.setAttribute("data-plate", item.plate);
    thumbBtn.setAttribute("data-time", item.time);

    var img = document.createElement("img");
    img.src = item.thumb;
    thumbBtn.appendChild(img);

    var plateSpan = document.createElement("span");
    plateSpan.className = "plate";
    plateSpan.textContent = item.plate;

    if(item.payment){
      var payBadge = document.createElement("span");
      payBadge.className = "pay-badge " + (item.payment === "Pul oldi" ? "paySuccess" : "payFail");
      payBadge.textContent = item.payment;
      plateSpan.appendChild(payBadge);
    }

    var timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = item.time + "  ·  " + item.date;

    li.appendChild(thumbBtn);
    li.appendChild(plateSpan);
    if(item.note){
      var noteSpan = document.createElement("span");
      noteSpan.className = "note";
      noteSpan.textContent = item.note;
      li.appendChild(noteSpan);
    }
    if(item.lat && item.lon){
      var mapLink = document.createElement("a");
      mapLink.className = "mapLink";
      mapLink.href = "https://maps.google.com/?q=" + item.lat + "," + item.lon;
      mapLink.target = "_blank";
      mapLink.rel = "noopener";
      mapLink.innerHTML = ICONS.map + " Xarita";
      li.appendChild(mapLink);
    }
    
    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "deleteHistBtn";
    deleteBtn.innerHTML = ICONS.trash + " O'chirish";
    deleteBtn.setAttribute("data-id", item.id || item.plate + "_" + item.time);
    deleteBtn.addEventListener("click", function(e){
      e.stopPropagation();
      deleteHistoryEntry(e.currentTarget.getAttribute("data-id"));
    });
    li.appendChild(deleteBtn);

    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "editHistBtn";
    editBtn.innerHTML = ICONS.edit + " Tahrirlash";
    editBtn.setAttribute("data-id", item.id || item.plate + "_" + item.time);
    editBtn.addEventListener("click", function(e){
      e.stopPropagation();
      openEditEntry(e.currentTarget.getAttribute("data-id"));
    });
    li.appendChild(editBtn);
    
    li.appendChild(timeSpan);
    historyList.appendChild(li);
  }
}
function addHistoryEntry(thumbDataUrl, plate, note, time, date, lat, lon, paymentStatus){
  var arr = loadHistory();
  arr.push({
    thumb: thumbDataUrl,
    plate: plate,
    note: note,
    payment: paymentStatus || "Pul oldi",
    time: time,
    date: date,
    lat: lat,
    lon: lon,
    ts: Date.now()
  });
  saveHistory(arr);
  renderHistory();
}
renderHistory();

function deleteHistoryEntry(entryId){
  var arr = loadHistory();
  var foundItem = null;
  var foundIndex = -1;
  
  for(var i = 0; i < arr.length; i++){
    var id = arr[i].id || arr[i].plate + "_" + arr[i].time;
    if(id === entryId){
      foundItem = arr[i];
      foundIndex = i;
      break;
    }
  }
  
  if(foundIndex !== -1){
    arr.splice(foundIndex, 1);
    saveHistory(arr);
    
    var trash = loadTrash();
    foundItem.id = foundItem.id || entryId;
    trash.unshift(foundItem);
    saveTrash(trash);
    
    renderHistory();
    renderTrash();
    showToast(foundItem.plate + " o'chirildi, savat-ga tushdi", false);
  }
}

/* ---------- YOZUVNI TAHRIRLASH ---------- */
var editingEntryId = null;
function openEditEntry(entryId){
  var arr = loadHistory();
  var foundItem = null;
  var i;
  for(i = 0; i < arr.length; i++){
    var id = arr[i].id || arr[i].plate + "_" + arr[i].time;
    if(id === entryId){
      foundItem = arr[i];
      break;
    }
  }
  if(!foundItem){ return; }

  editingEntryId = entryId;
  editPlateInput.value = foundItem.plate || "";
  editNoteInput.value = foundItem.note || "";
  editEntryError.textContent = "";
  editEntryOverlay.classList.add("show");
  editPlateInput.focus();
}
function closeEditEntry(){
  editingEntryId = null;
  editEntryOverlay.classList.remove("show");
}
function saveEditEntry(){
  if(!editingEntryId){ return; }
  var newPlate = editPlateInput.value.trim().toUpperCase();
  var newNote = editNoteInput.value.trim();

  if(newPlate === ""){
    editEntryError.textContent = "Mashina raqami bo'sh bo'lishi mumkin emas.";
    editPlateInput.focus();
    return;
  }

  var arr = loadHistory();
  var i;
  for(i = 0; i < arr.length; i++){
    var id = arr[i].id || arr[i].plate + "_" + arr[i].time;
    if(id === editingEntryId){
      arr[i].id = arr[i].id || editingEntryId;
      arr[i].plate = newPlate;
      arr[i].note = newNote;
      arr[i].editedAt = Date.now();
      break;
    }
  }
  saveHistory(arr);
  renderHistory();
  closeEditEntry();
  showToast(newPlate + " ma'lumotlari yangilandi", false);
}
if (editEntrySaveBtn) editEntrySaveBtn.addEventListener("click", saveEditEntry);
if (editEntryCancelBtn) editEntryCancelBtn.addEventListener("click", closeEditEntry);
if (editEntryOverlay) editEntryOverlay.addEventListener("click", function(e){
  if(e.target === editEntryOverlay){ closeEditEntry(); }
});
if (editPlateInput) editPlateInput.addEventListener("keydown", function(e){
  if(e.key === "Enter"){ saveEditEntry(); }
});
if (editNoteInput) editNoteInput.addEventListener("keydown", function(e){
  if(e.key === "Enter"){ saveEditEntry(); }
});

function restoreTrashEntry(entryId){
  var trash = loadTrash();
  var foundItem = null;
  var foundIndex = -1;
  
  for(var i = 0; i < trash.length; i++){
    if((trash[i].id || trash[i].plate + "_" + trash[i].time) === entryId){
      foundItem = trash[i];
      foundIndex = i;
      break;
    }
  }
  
  if(foundIndex !== -1){
    trash.splice(foundIndex, 1);
    saveTrash(trash);
    
    var history = loadHistory();
    history.push(foundItem);
    saveHistory(history);
    
    renderHistory();
    renderTrash();
    showToast(foundItem.plate + " tiklandi, tarix-ga qaytarildi", false);
  }
}

function renderTrash(){
  var arr = loadTrash();
  trashList.innerHTML = "";
  
  trashCount.textContent = "O'chirilganlar: " + arr.length + " ta";
  if(arr.length === 0){
    emptyTrash.style.display = "block";
  } else {
    emptyTrash.style.display = "none";
  }
  
  var i;
  for(i = arr.length - 1; i >= 0; i--){
    var item = arr[i];
    var li = document.createElement("li");
    
    var plateSpan = document.createElement("span");
    plateSpan.className = "plate";
    plateSpan.textContent = item.plate;
    
    var timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = item.time + "  ·  " + item.date;
    
    li.appendChild(plateSpan);
    
    var restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "restoreBtn";
    restoreBtn.innerHTML = ICONS.undo + " Tiklash";
    restoreBtn.setAttribute("data-id", item.id || item.plate + "_" + item.time);
    restoreBtn.addEventListener("click", function(e){
      e.stopPropagation();
      restoreTrashEntry(e.currentTarget.getAttribute("data-id"));
    });
    li.appendChild(restoreBtn);
    
    li.appendChild(timeSpan);
    trashList.appendChild(li);
  }
}
renderTrash();

if (historySearch) historySearch.addEventListener("input", function(){
  historyFilter = historySearch.value.trim().toLowerCase();
  renderHistory();
});

/* ---------- CSV eksport ---------- */
function csvEscape(val){
  if(val === null || val === undefined){ val = ""; }
  val = String(val).replace(/"/g, '""');
  return '"' + val + '"';
}
if (exportCsvBtn) exportCsvBtn.addEventListener("click", function(){
  var arr = loadHistory();
  var rows = ["Raqam,To'lov,Izoh,Vaqt,Sana,Kenglik,Uzunlik"];
  var i;
  for(i = 0; i < arr.length; i++){
    var item = arr[i];
    rows.push([
      csvEscape(item.plate),
      csvEscape(item.payment || "Pul oldi"),
      csvEscape(item.note || ""),
      csvEscape(item.time),
      csvEscape(item.date),
      csvEscape(item.lat || ""),
      csvEscape(item.lon || "")
    ].join(","));
  }
  var csvContent = "\uFEFF" + rows.join("\r\n");
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "katlavan_tarix.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
});

/* ---------- Rasmni to'liq ko'rish ---------- */
if (historyList) historyList.addEventListener("click", function(e){
  var btn = e.target.closest ? e.target.closest(".histThumbBtn") : null;
  if(!btn){ return; }
  var plate = btn.getAttribute("data-plate");
  var time = btn.getAttribute("data-time");
  var arr = loadHistory();
  var item = null;
  var i;
  for(i = 0; i < arr.length; i++){
    if(arr[i].plate === plate && arr[i].time === time){ item = arr[i]; break; }
  }
  if(!item){ return; }
  viewerImg.src = item.thumb;
  var capTxt = item.plate + "   ·   " + item.time + "   ·   " + item.date;
  if(item.note){ capTxt = capTxt + "   ·   " + item.note; }
  viewerCaption.textContent = capTxt;
  imgViewer.classList.add("show");
});
if (closeViewer) closeViewer.addEventListener("click", function(){
  imgViewer.classList.remove("show");
});
if (imgViewer) imgViewer.addEventListener("click", function(e){
  if(e.target === imgViewer){
    imgViewer.classList.remove("show");
  }
});

/* ================= YON MENYU ================= */
function openMenu(){
  sideMenu.classList.add("open");
  overlay.classList.add("show");
}
function closeMenuFn(){
  sideMenu.classList.remove("open");
  overlay.classList.remove("show");
}
if (menuBtn) menuBtn.addEventListener("click", openMenu);
if (closeMenu) closeMenu.addEventListener("click", closeMenuFn);
if (overlay) overlay.addEventListener("click", closeMenuFn);
if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", function(){
  if(!confirm("Butun tarixni o'chirishga ishonchingiz komilmi?")){ return; }
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

function sendTelegramMessage(text){
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: text })
  }).then(function(res){ return res.json(); });
}

if (sendDailyReportBtn) sendDailyReportBtn.addEventListener("click", function(){
  var arr = loadHistory();
  var now = getNowStrings();
  var paidCount = 0;
  var unpaidCount = 0;
  var totalToday = 0;
  for(var i = 0; i < arr.length; i++){
    if(arr[i].date === now.date){
      totalToday++;
      if(arr[i].payment === "Pul olmadi"){
        unpaidCount++;
      } else {
        paidCount++;
      }
    }
  }
  var opLine = operatorName ? ("\nOperator: " + operatorName) : "";
  var text = "📋 KUNLIK HISOBOT\nSana: " + now.date + "\nBugun qayd etilgan mashinalar: " + totalToday + " ta\n- Pul oldi: " + paidCount + " ta\n- Pul olmadi: " + unpaidCount + " ta" + opLine + "\nVaqt: " + now.time;

  sendDailyReportBtn.disabled = true;
  var originalHTML = sendDailyReportBtn.innerHTML;
  sendDailyReportBtn.textContent = "Yuborilmoqda...";

  sendTelegramMessage(text).then(function(data){
    sendDailyReportBtn.disabled = false;
    sendDailyReportBtn.innerHTML = originalHTML;
    if(data && data.ok){
      showToast("Kunlik hisobot yuborildi: " + count + " ta", false);
    } else {
      var desc = (data && data.description) ? data.description : "Noma'lum xatolik";
      showToast("Hisobot yuborilmadi: " + desc, true);
    }
  }).catch(function(err){
    sendDailyReportBtn.disabled = false;
    sendDailyReportBtn.innerHTML = originalHTML;
    showToast("Tarmoq xatoligi, hisobot yuborilmadi", true);
  });
});

if (clearTrashBtn) clearTrashBtn.addEventListener("click", function(){
  if(!confirm("O'chirilganlarni butunlay tozalashga ishonchingiz komilmi? Bu amalni qaytarib bo'lmaydi!")){ return; }
  localStorage.removeItem(TRASH_KEY);
  renderTrash();
  showToast("Savat tozalandi", false);
});

function showMenuTab(tab){
  var cameraPanel = document.getElementById("cameraPanel");
  var historyPanel = document.getElementById("historyPanel");
  var pendingPanel = document.getElementById("pendingPanel");
  var trashPanel = document.getElementById("trashPanel");
  var statsPanel = document.getElementById("statsPanel");
  var settingsPanel = document.getElementById("settingsPanel");
  var blacklistPanel = document.getElementById("blacklistPanel");

  var targetPanel = null;
  var targetUrl = "";
  if(tab === "camera"){ targetPanel = cameraPanel; targetUrl = "index.html"; }
  else if(tab === "history"){ targetPanel = historyPanel; targetUrl = "tarix.html"; }
  else if(tab === "pending"){ targetPanel = pendingPanel; targetUrl = "yuborilmagan.html"; }
  else if(tab === "trash"){ targetPanel = trashPanel; targetUrl = "ochirilganlar.html"; }
  else if(tab === "stats"){ targetPanel = statsPanel; targetUrl = "statistika.html"; }
  else if(tab === "settings"){ targetPanel = settingsPanel; targetUrl = "sozlamalar.html"; }
  else if(tab === "blacklist"){ targetPanel = blacklistPanel; targetUrl = "bloklanganlar.html"; }

  if(!targetPanel && targetUrl){
    var currentPage = location.pathname.split("/").pop() || "index.html";
    if(currentPage !== targetUrl){
      location.href = targetUrl;
      return;
    }
  }

  var tabCameraBtn = document.getElementById("tabCameraBtn");
  var tabHistoryBtn = document.getElementById("tabHistoryBtn");
  var tabPendingBtn = document.getElementById("tabPendingBtn");
  var tabTrashBtn = document.getElementById("tabTrashBtn");
  var tabStatsBtn = document.getElementById("tabStatsBtn");
  var tabSettingsBtn = document.getElementById("tabSettingsBtn");
  var tabBlacklistBtn = document.getElementById("tabBlacklistBtn");

  var cameraPanel = document.getElementById("cameraPanel");
  var historyPanel = document.getElementById("historyPanel");
  var pendingPanel = document.getElementById("pendingPanel");
  var trashPanel = document.getElementById("trashPanel");
  var statsPanel = document.getElementById("statsPanel");
  var settingsPanel = document.getElementById("settingsPanel");
  var blacklistPanel = document.getElementById("blacklistPanel");

  if(tabCameraBtn) tabCameraBtn.classList.remove("active");
  if(tabHistoryBtn) tabHistoryBtn.classList.remove("active");
  if(tabPendingBtn) tabPendingBtn.classList.remove("active");
  if(tabTrashBtn) tabTrashBtn.classList.remove("active");
  if(tabStatsBtn) tabStatsBtn.classList.remove("active");
  if(tabSettingsBtn) tabSettingsBtn.classList.remove("active");
  if(tabBlacklistBtn) tabBlacklistBtn.classList.remove("active");

  var panels = [cameraPanel, historyPanel, pendingPanel, trashPanel, statsPanel, settingsPanel, blacklistPanel];
  for(var i=0; i<panels.length; i++){
    if(panels[i]){
      panels[i].style.setProperty("display", "none", "important");
      panels[i].classList.add("tabHidden");
    }
  }

  if(tab === "camera"){
    if(tabCameraBtn) tabCameraBtn.classList.add("active");
    if(cameraPanel){
      cameraPanel.style.setProperty("display", "flex", "important");
      cameraPanel.classList.remove("tabHidden");
    }
  } else if(tab === "history"){
    if(tabHistoryBtn) tabHistoryBtn.classList.add("active");
    if(historyPanel){
      historyPanel.style.setProperty("display", "flex", "important");
      historyPanel.classList.remove("tabHidden");
    }
    renderHistory();
  } else if(tab === "pending"){
    if(tabPendingBtn) tabPendingBtn.classList.add("active");
    if(pendingPanel){
      pendingPanel.style.setProperty("display", "flex", "important");
      pendingPanel.classList.remove("tabHidden");
    }
    renderPendingList();
  } else if(tab === "trash"){
    if(tabTrashBtn) tabTrashBtn.classList.add("active");
    if(trashPanel){
      trashPanel.style.setProperty("display", "flex", "important");
      trashPanel.classList.remove("tabHidden");
    }
    renderTrash();
  } else if(tab === "stats"){
    if(tabStatsBtn) tabStatsBtn.classList.add("active");
    if(statsPanel){
      statsPanel.style.setProperty("display", "flex", "important");
      statsPanel.classList.remove("tabHidden");
    }
    renderStats();
  } else if(tab === "settings"){
    if(tabSettingsBtn) tabSettingsBtn.classList.add("active");
    if(settingsPanel){
      settingsPanel.style.setProperty("display", "flex", "important");
      settingsPanel.classList.remove("tabHidden");
    }
    loadSettingsIntoForm();
  } else if(tab === "blacklist"){
    if(tabBlacklistBtn) tabBlacklistBtn.classList.add("active");
    if(blacklistPanel){
      blacklistPanel.style.setProperty("display", "flex", "important");
      blacklistPanel.classList.remove("tabHidden");
    }
    renderBlacklistList();
  }

  closeMenuFn();
}

document.addEventListener("click", function(e){
  var btn = e.target.closest ? e.target.closest(".menuTabBtn") : null;
  if(!btn){ return; }
  var tab = btn.getAttribute("data-tab");
  if(tab){
    e.preventDefault();
    showMenuTab(tab);
  }
});

/* ================= STATISTIKA ================= */
var STATS_WEEKDAY_LABELS = ["Ya","Du","Se","Ch","Pa","Ju","Sh"];

function startOfDay(d){
  var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x.getTime();
}

function renderStats(){
  if(!statToday && !statsWeekChart) return;
  var arr = loadHistory();
  var now = new Date();
  var todayStart = startOfDay(now);
  var dayMs = 24 * 60 * 60 * 1000;

  var weekAgoStart = todayStart - 6 * dayMs;
  var monthAgoStart = todayStart - 29 * dayMs;

  var todayCount = 0, weekCount = 0, monthCount = 0;
  var dayBuckets = {};
  var hourBuckets = new Array(24).fill(0);
  var plateCounts30 = {};

  var i, item, ts, itemDayStart;
  for(i = 0; i < arr.length; i++){
    item = arr[i];
    ts = item.ts;
    if(!ts){ continue; }
    itemDayStart = startOfDay(new Date(ts));

    if(itemDayStart === todayStart){
      todayCount++;
      var hr = new Date(ts).getHours();
      hourBuckets[hr] = hourBuckets[hr] + 1;
    }
    if(itemDayStart >= weekAgoStart && itemDayStart <= todayStart){
      weekCount++;
      dayBuckets[itemDayStart] = (dayBuckets[itemDayStart] || 0) + 1;
    }
    if(itemDayStart >= monthAgoStart && itemDayStart <= todayStart){
      monthCount++;
      if(item.plate){
        plateCounts30[item.plate] = (plateCounts30[item.plate] || 0) + 1;
      }
    }
  }

  if(statToday) statToday.textContent = todayCount;
  if(statWeek) statWeek.textContent = weekCount;
  if(statMonth) statMonth.textContent = monthCount;
  if(statAll) statAll.textContent = arr.length;

  /* ---- oxirgi 7 kunlik ustunli diagramma ---- */
  if(statsWeekChart) statsWeekChart.innerHTML = "";
  var maxDayCount = 1;
  var d;
  for(d = 0; d < 7; d++){
    var ds = weekAgoStart + d * dayMs;
    if((dayBuckets[ds] || 0) > maxDayCount){ maxDayCount = dayBuckets[ds]; }
  }
  for(d = 0; d < 7; d++){
    var ds2 = weekAgoStart + d * dayMs;
    var cnt = dayBuckets[ds2] || 0;
    var pct = Math.round((cnt / maxDayCount) * 100);
    if(cnt > 0 && pct < 6){ pct = 6; }
    var wd = new Date(ds2).getDay();
    var col = document.createElement("span");
    col.className = "statBarCol";
    var numEl = document.createElement("span");
    numEl.className = "statBarNum";
    numEl.textContent = cnt;
    var barEl = document.createElement("span");
    barEl.className = "statBar" + (ds2 === todayStart ? " today" : "");
    barEl.style.height = pct + "%";
    var lblEl = document.createElement("span");
    lblEl.className = "statBarLabel";
    lblEl.textContent = STATS_WEEKDAY_LABELS[wd];
    col.appendChild(numEl);
    col.appendChild(barEl);
    col.appendChild(lblEl);
    statsWeekChart.appendChild(col);
  }

  /* ---- bugungi soatlik diagramma (06:00-23:00) ---- */
  if(statsHourChart) statsHourChart.innerHTML = "";
  var startHour = 6, endHour = 23;
  var maxHourCount = 1;
  var h;
  for(h = startHour; h <= endHour; h++){
    if(hourBuckets[h] > maxHourCount){ maxHourCount = hourBuckets[h]; }
  }
  for(h = startHour; h <= endHour; h++){
    var hc = hourBuckets[h];
    var hpct = Math.round((hc / maxHourCount) * 100);
    if(hc > 0 && hpct < 6){ hpct = 6; }
    var hcol = document.createElement("span");
    hcol.className = "statBarCol";
    var hnum = document.createElement("span");
    hnum.className = "statBarNum";
    hnum.textContent = hc > 0 ? hc : "";
    var hbar = document.createElement("span");
    hbar.className = "statBar today";
    hbar.style.height = hpct + "%";
    var hlbl = document.createElement("span");
    hlbl.className = "statBarLabel";
    hlbl.textContent = pad(h);
    hcol.appendChild(hnum);
    hcol.appendChild(hbar);
    hcol.appendChild(hlbl);
    statsHourChart.appendChild(hcol);
  }

  /* ---- eng ko'p qaytalangan raqamlar (oxirgi 30 kun) ---- */
  statsTopPlates.innerHTML = "";
  var plateKeys = Object.keys(plateCounts30);
  plateKeys.sort(function(a, b){ return plateCounts30[b] - plateCounts30[a]; });
  var topKeys = plateKeys.slice(0, 5);

  if(arr.length === 0){
    statsEmpty.style.display = "block";
  } else {
    statsEmpty.style.display = "none";
  }

  for(i = 0; i < topKeys.length; i++){
    var pk = topKeys[i];
    var li = document.createElement("li");
    var rankEl = document.createElement("span");
    rankEl.className = "statRank";
    rankEl.textContent = (i + 1);
    var nameEl = document.createElement("span");
    nameEl.className = "statPlateName";
    nameEl.textContent = pk;
    var countEl = document.createElement("span");
    countEl.className = "statPlateCount";
    countEl.textContent = plateCounts30[pk] + " marta";
    li.appendChild(rankEl);
    li.appendChild(nameEl);
    li.appendChild(countEl);
    statsTopPlates.appendChild(li);
  }
  if(topKeys.length === 0 && arr.length > 0){
    var noneLi = document.createElement("li");
    noneLi.textContent = "Oxirgi 30 kunda takrorlangan raqam yo'q.";
    noneLi.style.color = "var(--muted)";
    noneLi.style.fontSize = "12px";
    statsTopPlates.appendChild(noneLi);
  }
}

/* ================= YUBORILMAGAN RASMLAR NAVBATI ================= */
function loadPending(){
  return g_pending;
}
function savePending(arr){
  g_pending = arr;
  dbSet("pending", g_pending);
  return true;
}
function updatePendingBar(){
  var arr = loadPending();
  if(arr.length > 0){
    pendingBar.classList.add("show");
    pendingText.textContent = arr.length + " ta yuborilmagan rasm navbatda";
  } else {
    pendingBar.classList.remove("show");
  }
  if(arr.length > 0){
    tabPendingCount.style.display = "inline-block";
    tabPendingCount.textContent = arr.length;
  } else {
    tabPendingCount.style.display = "none";
  }
  if(pendingPanel.style.display !== "none"){
    renderPendingList();
  }
}
function queuePending(dataUrl, caption, filename, meta){
  var arr = loadPending();
  arr.push({ dataUrl: dataUrl, caption: caption, filename: filename, meta: meta, addedAt: Date.now() });
  var ok = savePending(arr);
  updatePendingBar();
  return ok;
}
function dataUrlToBlob(dataUrl){
  var parts = dataUrl.split(",");
  var mimeMatch = parts[0].match(/:(.*?);/);
  var mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  var binStr = atob(parts[1]);
  var len = binStr.length;
  var arr = new Uint8Array(len);
  var i;
  for(i = 0; i < len; i++){ arr[i] = binStr.charCodeAt(i); }
  return new Blob([arr], { type: mime });
}
function sendToTelegram(blob, caption, filename){
  var formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", blob, filename);
  formData.append("caption", caption);
  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendPhoto";
  return fetch(url, { method: "POST", body: formData }).then(function(res){ return res.json(); });
}
var retryingPending = false;
function retryPendingQueue(){
  if(retryingPending){ return; }
  var arr = loadPending();
  if(arr.length === 0){ return; }
  retryingPending = true;
  var remaining = arr.slice();
  var stillPending = [];

  function processNext(){
    if(remaining.length === 0){
      savePending(stillPending);
      updatePendingBar();
      retryingPending = false;
      if(stillPending.length === 0){
        setStatus("Navbatdagi barcha rasmlar muvaffaqiyatli yuborildi.", "ok");
      }
      return;
    }
    var entry = remaining.shift();
    var blob = dataUrlToBlob(entry.dataUrl);
    sendToTelegram(blob, entry.caption, entry.filename).then(function(data){
      if(!(data && data.ok)){
        stillPending.push(entry);
      }
      processNext();
    }).catch(function(){
      stillPending.push(entry);
      processNext();
    });
  }
  processNext();
}
if (retryPendingBtn) retryPendingBtn.addEventListener("click", function(){
  setStatus("Navbat qayta yuborilmoqda...", "sending");
  retryPendingQueue();
});
window.addEventListener("online", function(){
  retryPendingQueue();
});
setInterval(function(){
  if(navigator.onLine !== false){ retryPendingQueue(); }
}, 25000);
updatePendingBar();

/* ---------- YUBORILMAGAN RASMLAR PANELI ---------- */
function renderPendingList(){
  var arr = loadPending();
  pendingCount.textContent = "Yuborilmagan rasmlar: " + arr.length + " ta";
  pendingList.innerHTML = "";

  if(arr.length === 0){
    emptyPending.style.display = "block";
    return;
  }
  emptyPending.style.display = "none";

  var i;
  for(i = arr.length - 1; i >= 0; i--){
    var entry = arr[i];
    var li = document.createElement("li");
    li.setAttribute("data-added-at", entry.addedAt);

    var plateSpan = document.createElement("span");
    plateSpan.className = "plate";
    plateSpan.textContent = (entry.meta && entry.meta.plate) ? entry.meta.plate : "(raqamsiz)";

    if(entry.meta && entry.meta.payment){
      var payBadge = document.createElement("span");
      payBadge.className = "pay-badge " + (entry.meta.payment === "Pul oldi" ? "paySuccess" : "payFail");
      payBadge.textContent = entry.meta.payment;
      plateSpan.appendChild(payBadge);
    }

    var timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = "Navbatga qo'shildi: " + new Date(entry.addedAt).toLocaleString();

    var sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "sendOnePendingBtn";
    sendBtn.innerHTML = ICONS.send + " Yuborish";
    sendBtn.setAttribute("data-added-at", entry.addedAt);

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "deletePendingBtn";
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.setAttribute("data-added-at", entry.addedAt);

    li.appendChild(plateSpan);
    li.appendChild(sendBtn);
    li.appendChild(deleteBtn);
    li.appendChild(timeSpan);
    pendingList.appendChild(li);
  }
}

function sendOnePending(addedAt, btnEl){
  var arr = loadPending();
  var idx = -1;
  var i;
  for(i = 0; i < arr.length; i++){
    if(String(arr[i].addedAt) === String(addedAt)){ idx = i; break; }
  }
  if(idx === -1){ return; }
  var entry = arr[idx];

  if(btnEl){
    btnEl.disabled = true;
    btnEl.textContent = "Yuborilmoqda...";
  }

  var blob = dataUrlToBlob(entry.dataUrl);
  sendToTelegram(blob, entry.caption, entry.filename).then(function(data){
    if(data && data.ok){
      var freshArr = loadPending();
      var newArr = freshArr.filter(function(it){ return String(it.addedAt) !== String(addedAt); });
      savePending(newArr);
      updatePendingBar();
      renderPendingList();
      showToast((freshArr[idx].meta && freshArr[idx].meta.plate ? freshArr[idx].meta.plate : "Rasm") + " muvaffaqiyatli yuborildi", false);
    } else {
      if(btnEl){
        btnEl.disabled = false;
        btnEl.innerHTML = ICONS.send + " Yuborish";
      }
      showToast("Yuborilmadi, qaytadan urinib ko'ring", true);
    }
  }).catch(function(){
    if(btnEl){
      btnEl.disabled = false;
      btnEl.innerHTML = ICONS.send + " Yuborish";
    }
    showToast("Tarmoq xatoligi, qaytadan urinib ko'ring", true);
  });
}

function deleteOnePending(addedAt){
  var okDel = confirm("Ushbu yuborilmagan rasmni navbatdan o'chirmoqchimisiz?");
  if(!okDel){ return; }
  var arr = loadPending();
  var newArr = arr.filter(function(it){ return String(it.addedAt) !== String(addedAt); });
  savePending(newArr);
  updatePendingBar();
  renderPendingList();
  showToast("Yuborilmagan rasm o'chirildi", false);
}

if (pendingList) pendingList.addEventListener("click", function(e){
  var sendBtn = e.target.closest(".sendOnePendingBtn");
  if(sendBtn){
    sendOnePending(sendBtn.getAttribute("data-added-at"), sendBtn);
    return;
  }
  var delBtn = e.target.closest(".deletePendingBtn");
  if(delBtn){
    deleteOnePending(delBtn.getAttribute("data-added-at"));
    return;
  }
});

if (sendAllPendingBtn) sendAllPendingBtn.addEventListener("click", function(){
  sendAllPendingBtn.disabled = true;
  sendAllPendingBtn.textContent = "Yuborilmoqda...";
  setStatus("Navbat qayta yuborilmoqda...", "sending");
  retryPendingQueue();
  var checkDone = setInterval(function(){
    if(!retryingPending){
      clearInterval(checkDone);
      sendAllPendingBtn.disabled = false;
      sendAllPendingBtn.innerHTML = ICONS.send + " Barchasini yuborish";
      renderPendingList();
    }
  }, 400);
});

/* ================= TUNGI REJIM (DARK MODE) ================= */
var DARK_MODE_KEY = "katlavan_dark_mode";

function isDarkModeOn(){
  return document.documentElement.classList.contains("darkMode");
}
function applyDarkMode(isDark){
  if(isDark){
    document.documentElement.classList.add("darkMode");
  } else {
    document.documentElement.classList.remove("darkMode");
  }
  if(darkModeToggle){
    darkModeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  }
  if(themeColorMeta){
    themeColorMeta.setAttribute("content", isDark ? "#0a121d" : "#0d3f78");
  }
}
function loadDarkModePref(){
  try{
    return localStorage.getItem(DARK_MODE_KEY) === "1";
  }catch(e){ return false; }
}
function saveDarkModePref(isDark){
  try{ localStorage.setItem(DARK_MODE_KEY, isDark ? "1" : "0"); }catch(e){}
}
if(darkModeToggle){
  if (darkModeToggle) darkModeToggle.addEventListener("click", function(){
    var next = !isDarkModeOn();
    applyDarkMode(next);
    saveDarkModePref(next);
  });
}
applyDarkMode(isDarkModeOn());

/* ================= SOZLAMALAR PANELI ================= */
function setSettingsStatus(text, state){
  settingsStatus.textContent = text;
  settingsStatus.setAttribute("data-state", state || "");
}

function loadSettingsIntoForm(){
  botTokenInput.value = BOT_TOKEN;
  chatIdInput.value = CHAT_ID;
  newPinInput.value = "";
  setSettingsStatus("", "");
}

if (toggleBotTokenBtn) toggleBotTokenBtn.addEventListener("click", function(){
  botTokenInput.type = (botTokenInput.type === "password") ? "text" : "password";
});
if (toggleNewPinBtn) toggleNewPinBtn.addEventListener("click", function(){
  newPinInput.type = (newPinInput.type === "password") ? "text" : "password";
});

if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", function(){
  var newToken = botTokenInput.value.trim();
  var newChatId = chatIdInput.value.trim();
  var newPin = newPinInput.value.trim();

  if(newToken === ""){
    setSettingsStatus("Bot Token bo'sh bo'lishi mumkin emas.", "error");
    botTokenInput.focus();
    return;
  }
  if(newChatId === ""){
    setSettingsStatus("Chat ID bo'sh bo'lishi mumkin emas.", "error");
    chatIdInput.focus();
    return;
  }
  if(newPin !== "" && !/^[0-9]{4,6}$/.test(newPin)){
    setSettingsStatus("PIN kod 4 dan 6 tagacha raqamdan iborat bo'lishi kerak.", "error");
    newPinInput.focus();
    return;
  }

  BOT_TOKEN = newToken;
  CHAT_ID = newChatId;
  localStorage.setItem(BOT_TOKEN_KEY, BOT_TOKEN);
  localStorage.setItem(CHAT_ID_KEY, CHAT_ID);

  if(newPin !== ""){
    APP_PIN = newPin;
    localStorage.setItem(PIN_KEY, APP_PIN);
  }

  newPinInput.value = "";
  setSettingsStatus("Sozlamalar saqlandi.", "ok");
  showToast("Sozlamalar muvaffaqiyatli saqlandi", false);
});

if (testConnectionBtn) testConnectionBtn.addEventListener("click", function(){
  var testToken = botTokenInput.value.trim();
  var testChatId = chatIdInput.value.trim();

  if(testToken === "" || testChatId === ""){
    setSettingsStatus("Tekshirish uchun Bot Token va Chat ID to'ldirilishi kerak.", "error");
    return;
  }

  testConnectionBtn.disabled = true;
  saveSettingsBtn.disabled = true;
  setSettingsStatus("Ulanish tekshirilmoqda...", "");

  fetch("https://api.telegram.org/bot" + testToken + "/getMe")
    .then(function(res){ return res.json(); })
    .then(function(botData){
      if(!(botData && botData.ok)){
        throw new Error("BOT_TOKEN_INVALID");
      }
      var msgUrl = "https://api.telegram.org/bot" + testToken + "/sendMessage";
      return fetch(msgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: testChatId, text: "✅ KATLAVAN NAZORAT — ulanish testi muvaffaqiyatli." })
      }).then(function(res){ return res.json(); });
    })
    .then(function(msgData){
      testConnectionBtn.disabled = false;
      saveSettingsBtn.disabled = false;
      if(msgData && msgData.ok){
        setSettingsStatus("Ulanish muvaffaqiyatli! Test xabari yuborildi.", "ok");
        showToast("Ulanish tekshirildi: muvaffaqiyatli", false);
      } else {
        setSettingsStatus("Bot Token to'g'ri, lekin Chat ID xato yoki bot guruhga qo'shilmagan.", "error");
        showToast("Chat ID xato bo'lishi mumkin", true);
      }
    })
    .catch(function(err){
      testConnectionBtn.disabled = false;
      saveSettingsBtn.disabled = false;
      if(err && err.message === "BOT_TOKEN_INVALID"){
        setSettingsStatus("Bot Token noto'g'ri.", "error");
      } else {
        setSettingsStatus("Tarmoq xatoligi, internetni tekshiring.", "error");
      }
      showToast("Ulanishni tekshirishda xatolik", true);
    });
});

if (resetSettingsBtn) resetSettingsBtn.addEventListener("click", function(){
  var okReset = confirm("Bot Token, Chat ID va PIN kodni dastlabki holatiga qaytarmoqchimisiz?");
  if(!okReset){ return; }
  localStorage.removeItem(BOT_TOKEN_KEY);
  localStorage.removeItem(CHAT_ID_KEY);
  localStorage.removeItem(PIN_KEY);
  BOT_TOKEN = DEFAULT_BOT_TOKEN;
  CHAT_ID = DEFAULT_CHAT_ID;
  APP_PIN = DEFAULT_APP_PIN;
  loadSettingsIntoForm();
  setSettingsStatus("Standart sozlamalarga qaytarildi.", "ok");
  showToast("Sozlamalar standart holatga qaytarildi", false);
});

if (lockAppBtn) lockAppBtn.addEventListener("click", function(){
  var okLock = confirm("Ilovani qulflab, chatdan chiqmoqchimisiz?");
  if(!okLock){ return; }
  localStorage.removeItem("katlavanUnlocked");
  location.reload();
});

/* ---------- ZAXIRA NUSXA (BACKUP / RESTORE) ---------- */
function setBackupStatus(text, state){
  backupStatus.textContent = text;
  backupStatus.setAttribute("data-state", state || "");
}

function exportBackup(){
  try{
    var backup = {
      appName: "KATLAVAN_NAZORAT",
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      history: loadHistory(),
      trash: loadTrash(),
      pending: loadPending(),
      blacklist: loadBlacklist(),
      operatorName: operatorName,
      botToken: BOT_TOKEN,
      chatId: CHAT_ID,
      appPin: APP_PIN
    };
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = "katlavan-zaxira-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 3000);
    setBackupStatus("Zaxira fayli yuklab olindi.", "ok");
    showToast("Zaxira nusxa muvaffaqiyatli saqlandi", false);
  }catch(err){
    setBackupStatus("Zaxira faylini yaratishda xatolik yuz berdi.", "error");
    showToast("Zaxira qilishda xatolik", true);
  }
}
if (exportBackupBtn) exportBackupBtn.addEventListener("click", exportBackup);

if (importBackupBtn) importBackupBtn.addEventListener("click", function(){
  importBackupFile.value = "";
  importBackupFile.click();
});

if (importBackupFile) importBackupFile.addEventListener("change", function(){
  var file = importBackupFile.files && importBackupFile.files[0];
  if(!file){ return; }

  var okConfirm = confirm("Zaxiradan tiklash joriy barcha ma'lumotlarni almashtiradi. Davom etasizmi?");
  if(!okConfirm){
    importBackupFile.value = "";
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var data = JSON.parse(e.target.result);
      if(!data || typeof data !== "object"){
        throw new Error("Fayl formati noto'g'ri");
      }

      if(Array.isArray(data.history)){ saveHistory(data.history); }
      if(Array.isArray(data.trash)){ saveTrash(data.trash); }
      if(Array.isArray(data.pending)){ savePending(data.pending); }
      if(Array.isArray(data.blacklist)){ saveBlacklist(data.blacklist); }
      if(typeof data.operatorName === "string" && data.operatorName.trim() !== ""){
        localStorage.setItem(NAME_KEY, data.operatorName.trim());
      }
      if(typeof data.botToken === "string" && data.botToken.trim() !== ""){
        localStorage.setItem(BOT_TOKEN_KEY, data.botToken.trim());
      }
      if(typeof data.chatId === "string" && data.chatId.trim() !== ""){
        localStorage.setItem(CHAT_ID_KEY, data.chatId.trim());
      }
      if(typeof data.appPin === "string" && /^[0-9]{4,6}$/.test(data.appPin.trim())){
        localStorage.setItem(PIN_KEY, data.appPin.trim());
      }

      setBackupStatus("Zaxiradan tiklandi. Ilova qayta yuklanmoqda...", "ok");
      showToast("Zaxiradan muvaffaqiyatli tiklandi", false);
      setTimeout(function(){ location.reload(); }, 1200);
    }catch(err){
      setBackupStatus("Zaxira faylini o'qib bo'lmadi.", "error");
      showToast("Zaxira faylida xatolik", true);
    }
  };
  reader.onerror = function(){
    setBackupStatus("Faylni o'qib bo'lmadi.", "error");
  };
  reader.readAsText(file);
});

/* ================= RASMGA OLISH VA YUBORISH ================= */
function setStatus(text, state){
  statusEl.textContent = text;
  statusEl.setAttribute("data-state", state);
}

var toastTimer = null;
function showToast(text, isError){
  toastText.textContent = text;
  toastIcon.innerHTML = isError
    ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  toastEl.classList.toggle("error", !!isError);
  toastEl.classList.add("show");
  if(toastTimer){ clearTimeout(toastTimer); }
  toastTimer = setTimeout(function(){
    toastEl.classList.remove("show");
  }, 3200);
}

function stampImage(ctx, w, h, plate, note, time, date, operator, paymentStatus){
  var isBanned = isBlacklisted(plate);
  var borderThickness = Math.max(8, Math.round(w * 0.012));
  var innerLineThickness = Math.max(2, Math.round(w * 0.003));
  var statusColor = (isBanned || paymentStatus === "Pul olmadi") ? "#FF3333" : "#00FF66";

  var plateFontSize = Math.round(w * 0.075);
  if(plateFontSize < 34){ plateFontSize = 34; }

  var subFontSize = Math.round(w * 0.034);
  if(subFontSize < 21){ subFontSize = 21; }

  var noteFontSize = Math.round(w * 0.03);
  if(noteFontSize < 19){ noteFontSize = 19; }

  var pad = Math.round(h * 0.025);
  if(pad < 14){ pad = 14; }

  var lineGap = Math.round(subFontSize * 0.55);

  var extraLines = 0;
  if(paymentStatus){ extraLines++; }
  if(note){ extraLines++; }
  if(operator){ extraLines++; }

  var barH = pad + plateFontSize + lineGap + subFontSize + pad * 0.6;
  if(extraLines > 0){
    barH = barH + extraLines * (lineGap + noteFontSize) + pad * 0.4;
  }
  barH = Math.round(barH) + borderThickness;

  // Draw semi-transparent dark text bar
  ctx.fillStyle = "rgba(8,18,30,0.80)";
  ctx.fillRect(borderThickness, h - barH, w - 2 * borderThickness, barH - borderThickness);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  var textX = Math.round(w * 0.035) + borderThickness;
  var cursorY = h - barH + pad + plateFontSize;

  ctx.font = "800 " + plateFontSize + "px 'JetBrains Mono', 'Courier New', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(plate, textX, cursorY);

  cursorY = cursorY + lineGap + subFontSize;
  ctx.font = "700 " + subFontSize + "px 'JetBrains Mono', 'Courier New', monospace";
  ctx.fillStyle = "#ffd54a";
  ctx.fillText(time + "   " + date, textX, cursorY);

  if(paymentStatus){
    cursorY = cursorY + lineGap + noteFontSize;
    ctx.font = "800 " + noteFontSize + "px 'Manrope', Arial, sans-serif";
    ctx.fillStyle = statusColor;
    ctx.fillText("To'lov: " + paymentStatus, textX, cursorY);
  }

  if(note){
    cursorY = cursorY + lineGap + noteFontSize;
    ctx.font = "600 " + noteFontSize + "px 'Manrope', Arial, sans-serif";
    ctx.fillStyle = "#e7f0fa";
    ctx.fillText("Izoh: " + note, textX, cursorY);
  }

  if(operator){
    cursorY = cursorY + lineGap + noteFontSize;
    ctx.font = "600 " + noteFontSize + "px 'Manrope', Arial, sans-serif";
    ctx.fillStyle = "#a9d6ff";
    ctx.fillText("Oldi: " + operator, textX, cursorY);
  }

  // Draw solid dark outer border around entire canvas
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = "#08121e";
  ctx.strokeRect(borderThickness / 2, borderThickness / 2, w - borderThickness, h - borderThickness);

  // Draw neon accent line parallel to the border (Green / Red)
  var innerOffset = borderThickness;
  ctx.lineWidth = innerLineThickness;
  ctx.strokeStyle = statusColor;
  ctx.strokeRect(
    innerOffset + innerLineThickness / 2,
    innerOffset + innerLineThickness / 2,
    w - 2 * innerOffset - innerLineThickness,
    h - 2 * innerOffset - innerLineThickness
  );

  // Draw top border/accent line on the text bar
  var lineY = h - barH;
  ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
  ctx.strokeStyle = statusColor;
  ctx.beginPath();
  ctx.moveTo(borderThickness, lineY);
  ctx.lineTo(w - borderThickness, lineY);
  ctx.stroke();

  // Draw a prominent red header bar if the vehicle is blacklisted
  if(isBanned){
    var headerH = Math.round(h * 0.08);
    if(headerH < 35){ headerH = 35; }
    ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
    ctx.fillRect(borderThickness, borderThickness, w - 2 * borderThickness, headerH);
    
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "800 " + Math.round(w * 0.038) + "px 'Manrope', Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("⚠️ ZAPRET / TAQIQLANGAN MASHINA", w / 2, borderThickness + headerH / 2);
    
    // Restore text baselines
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
  }
}

function getJpegQuality(){
  var conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  if(conn && conn.effectiveType){
    if(conn.effectiveType === "slow-2g" || conn.effectiveType === "2g"){ return 0.7; }
    if(conn.effectiveType === "3g"){ return 0.85; }
  }
  return 0.97;
}

/* ================= AVTOMATIK RAQAM O'QISH (OCR) ================= */
var ocrBusy = false;

function cleanOcrText(raw){
  return raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

function extractPlateFromText(cleaned){
  var re1 = /\d{2}[A-Z]\d{3}[A-Z]{2}/;
  var re2 = /\d{2}\d{3}[A-Z]{3}/;
  var m = cleaned.match(re1);
  if(m){ return m[0]; }
  m = cleaned.match(re2);
  if(m){ return m[0]; }
  return cleaned;
}

function formatPlateForDisplay(plate){
  var m = plate.match(/^(\d{2})([A-Z])(\d{3})([A-Z]{2})$/);
  if(m){ return m[1] + " " + m[2] + " " + m[3] + " " + m[4]; }
  m = plate.match(/^(\d{2})(\d{3})([A-Z]{3})$/);
  if(m){ return m[1] + " " + m[2] + " " + m[3]; }
  return plate;
}

function buildOcrCanvasFromSource(sourceEl, w, h){
  if(!w || !h){ return null; }

  // Crop the middle 75% width and 45% height where the license plate is framed
  var cropW = Math.round(w * 0.75);
  var cropH = Math.round(h * 0.45);
  var cropX = Math.round((w - cropW) / 2);
  var cropY = Math.round((h - cropH) / 2);

  var oc = document.createElement("canvas");
  var scale = 2; // Upscale for better OCR text edges
  oc.width = cropW * scale;
  oc.height = cropH * scale;

  var octx = oc.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";

  // Draw ONLY the cropped middle portion
  octx.drawImage(sourceEl, cropX, cropY, cropW, cropH, 0, 0, oc.width, oc.height);

  var imgData = octx.getImageData(0, 0, oc.width, oc.height);
  var d = imgData.data;
  var i;
  for(i = 0; i < d.length; i += 4){
    var gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    // Boost contrast
    gray = (gray - 128) * 2.0 + 128;
    if(gray < 0){ gray = 0; }
    if(gray > 255){ gray = 255; }
    d[i] = gray; d[i + 1] = gray; d[i + 2] = gray;
  }
  octx.putImageData(imgData, 0, 0);
  return oc;
}

function buildOcrCanvas(){
  return buildOcrCanvasFromSource(videoEl, videoEl.videoWidth, videoEl.videoHeight);
}

/* ================= GALEREYADAN RASM TANLASH ================= */
function setCaptureModeGallery(isGallery){
  captureBtnLabel.textContent = isGallery ? CAPTURE_BTN_GALLERY_LABEL : CAPTURE_BTN_DEFAULT_LABEL;
}

function cancelGalleryImage(silent){
  galleryImageEl = null;
  galleryPreviewImg.src = "";
  galleryPreviewImg.style.display = "none";
  galleryCancelBtn.style.display = "none";
  switchCamBtn.style.display = "flex";
  galleryBtn.style.display = "flex";
  autoReadBtn.disabled = false;
  setCaptureModeGallery(false);
  if(!silent){
    setStatus("Kamera rejimiga qaytildi.", "idle");
  }
}

function runGalleryOcr(img){
  if(typeof Tesseract === "undefined"){
    setStatus("OCR kutubxonasi yuklanmadi. Raqamni qo'lda kiriting.", "error");
    return;
  }
  if(ocrBusy){ return; }

  var ocrCanvas = buildOcrCanvasFromSource(img, img.naturalWidth, img.naturalHeight);
  if(!ocrCanvas){
    setStatus("Rasmdan kadr olib bo'lmadi. Raqamni qo'lda kiriting.", "error");
    return;
  }

  ocrBusy = true;
  autoReadBtn.disabled = true;

  Tesseract.recognize(ocrCanvas, "eng", {
    langPath: "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0",
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  }).then(function(result){
    var rawText = (result && result.data && result.data.text) ? result.data.text : "";
    var cleaned = cleanOcrText(rawText);

    if(cleaned === ""){
      setStatus("Raqam avtomatik aniqlanmadi. Iltimos, qo'lda kiriting.", "error");
      showToast("Galereya rasmidan raqam aniqlanmadi, qo'lda kiriting", true);
      plateInput.focus();
    } else {
      var candidate = extractPlateFromText(cleaned);
      var displayValue = formatPlateForDisplay(candidate);
      plateInput.value = displayValue;
      checkPlateBlacklist();
      if(isPlateLikelyValid(displayValue)){
        setStatus("Raqam aniqlandi: " + displayValue + ". Tekshirib, yuboring.", "ok");
        showToast("Aniqlandi: " + displayValue, false);
      } else {
        setStatus("Taxminiy o'qildi: " + displayValue + ". Tekshirib to'g'irlang.", "error");
        showToast("Aniq o'qilmadi, tekshiring: " + displayValue, true);
      }
      plateInput.focus();
    }
  }).catch(function(err){
    setStatus("OCR xatoligi. Raqamni qo'lda kiriting.", "error");
  }).finally(function(){
    ocrBusy = false;
    autoReadBtn.disabled = !!galleryImageEl;
  });
}

if (galleryBtn) galleryBtn.addEventListener("click", function(){
  if(isSending){ return; }
  galleryInput.value = "";
  galleryInput.click();
});

if (galleryInput) galleryInput.addEventListener("change", function(){
  var file = galleryInput.files && galleryInput.files[0];
  if(!file){ return; }

  var reader = new FileReader();
  reader.onload = function(){
    var img = new Image();
    img.onload = function(){
      galleryImageEl = img;
      galleryPreviewImg.src = reader.result;
      galleryPreviewImg.style.display = "block";
      galleryCancelBtn.style.display = "flex";
      switchCamBtn.style.display = "none";
      galleryBtn.style.display = "none";
      setCaptureModeGallery(true);
      setStatus("Galereyadan rasm tanlandi. Raqam avtomatik aniqlanmoqda...", "sending");
      runGalleryOcr(img);
    };
    img.onerror = function(){
      setStatus("Bu rasmni ochib bo'lmadi, boshqasini tanlang.", "error");
    };
    img.src = reader.result;
  };
  reader.onerror = function(){
    setStatus("Faylni o'qib bo'lmadi.", "error");
  };
  reader.readAsDataURL(file);
});

if (galleryCancelBtn) galleryCancelBtn.addEventListener("click", function(){
  cancelGalleryImage();
});

if (autoReadBtn) autoReadBtn.addEventListener("click", function(){
  if(ocrBusy){ return; }
  if(!videoEl.videoWidth){
    setStatus("Kamera hali tayyor emas, biroz kuting.", "error");
    return;
  }
  if(typeof Tesseract === "undefined"){
    setStatus("OCR kutubxonasi yuklanmadi. Internetni tekshiring.", "error");
    return;
  }

  var ocrCanvas = buildOcrCanvas();
  if(!ocrCanvas){
    setStatus("Kameradan kadr olinmadi.", "error");
    return;
  }

  ocrBusy = true;
  autoReadBtn.disabled = true;
  autoReadLabel.textContent = "O'qilmoqda...";
  setStatus("Raqam aniqlanmoqda, biroz kuting...", "sending");

  Tesseract.recognize(ocrCanvas, "eng", {
    langPath: "https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0",
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  }).then(function(result){
    var rawText = (result && result.data && result.data.text) ? result.data.text : "";
    var cleaned = cleanOcrText(rawText);

    if(cleaned === ""){
      setStatus("Raqam aniqlanmadi. Ramkaga yaqinroq tutib qayta urining.", "error");
      showToast("Raqam aniqlanmadi, qo'lda kiriting", true);
    } else {
      var candidate = extractPlateFromText(cleaned);
      var displayValue = formatPlateForDisplay(candidate);
      plateInput.value = displayValue;
      checkPlateBlacklist();
      if(isPlateLikelyValid(displayValue)){
        setStatus("Raqam aniqlandi: " + displayValue + ". Tekshirib, keyin rasmga oling.", "ok");
        showToast("Aniqlandi: " + displayValue, false);
      } else {
        setStatus("Taxminiy o'qildi: " + displayValue + ". Iltimos tekshirib to'g'irlang.", "error");
        showToast("Aniq o'qilmadi, tekshiring: " + displayValue, true);
      }
      plateInput.focus();
    }
  }).catch(function(err){
    setStatus("OCR xatoligi.", "error");
    showToast("Avtomatik o'qishda xatolik yuz berdi", true);
  }).finally(function(){
    ocrBusy = false;
    autoReadBtn.disabled = false;
    autoReadLabel.textContent = "Avto";
  });
});

if (captureBtn) captureBtn.addEventListener("click", function(){
  if(isSending){ return; }

  var usingGallery = !!galleryImageEl;
  var plateValue = plateInput.value.trim().toUpperCase();
  var noteValue = noteInput.value.trim();

  if(plateValue === ""){
    setStatus("Iltimos, avval mashina raqamini kiriting.", "error");
    plateInput.focus();
    return;
  }

  var srcEl = usingGallery ? galleryImageEl : videoEl;
  var srcW = usingGallery ? galleryImageEl.naturalWidth : videoEl.videoWidth;
  var srcH = usingGallery ? galleryImageEl.naturalHeight : videoEl.videoHeight;

  if(!srcW || !srcH){
    setStatus("Kamera/Rasm hali tayyor emas.", "error");
    return;
  }

  if(!isPlateLikelyValid(plateValue)){
    var okContinue = confirm("Raqam formati odatiy ko'rinishdan farq qiladi. Davom etasizmi?");
    if(!okContinue){ return; }
  }

  var dup = findRecentDuplicate(plateValue);
  if(dup){
    var okDup = confirm("Bu raqam so'nggi 5 daqiqa ichida qayd etilgan. Davom etasizmi?");
    if(!okDup){ return; }
  }

  var w = srcW;
  var h = srcH;
  canvasEl.width = w;
  canvasEl.height = h;
  var ctx = canvasEl.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcEl, 0, 0, w, h);

  var now = getNowStrings();
  stampImage(ctx, w, h, plateValue, noteValue, now.time, now.date, operatorName, currentPaymentStatus);

  var isBanned = isBlacklisted(plateValue);
  var caption = "";
  if(isBanned){
    caption = "⚠️ ZAPRET / TAQIQLANGAN MASHINA! ⚠️\n";
  }
  caption = caption + "Mashina raqami: " + plateValue;
  if(isBanned){
    caption = caption + "\nSabab: " + isBanned.reason;
  }
  caption = caption + "\nTo'lov: " + currentPaymentStatus;
  if(noteValue !== ""){
    caption = caption + "\nIzoh: " + noteValue;
  }
  caption = caption + "\nVaqt: " + now.time + "\nSana: " + now.date;
  if(operatorName){
    caption = caption + "\nRasmga oldi: " + operatorName;
  }
  if(usingGallery){
    caption = caption + "\nManba: Galereyadan tanlandi";
  }
  if(lastLat && lastLon){
    caption = caption + "\nJoylashuv: https://maps.google.com/?q=" + lastLat + "," + lastLon;
  }

  isSending = true;
  captureBtn.disabled = true;
  galleryBtn.disabled = true;
  setStatus("Yuborilmoqda...", "sending");

  var quality = getJpegQuality();

  canvasEl.toBlob(function(blob){
    if(!blob){
      setStatus("Rasmni tayyorlashda xatolik yuz berdi.", "error");
      isSending = false;
      captureBtn.disabled = false;
      galleryBtn.disabled = false;
      return;
    }

    var thumbCanvas = document.createElement("canvas");
    var tw = 480;
    var th = Math.round(tw * (h / w));
    thumbCanvas.width = tw;
    thumbCanvas.height = th;
    var tctx = thumbCanvas.getContext("2d");
    tctx.drawImage(canvasEl, 0, 0, tw, th);
    var thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.62);

    sendToTelegram(blob, caption, "raqam.jpg")
      .then(function(data){
        isSending = false;
        captureBtn.disabled = false;
        galleryBtn.disabled = false;
        if(data && data.ok){
          setStatus("Yuborildi: " + plateValue + " (" + now.time + ")", "ok");
          showToast(plateValue + " muvaffaqiyatli yuborildi (" + now.time + ")", false);
          addHistoryEntry(thumbDataUrl, plateValue, noteValue, now.time, now.date, lastLat, lastLon, currentPaymentStatus);
          plateInput.value = "";
          noteInput.value = "";
          setPaymentStatus("Pul oldi");
          if(usingGallery){ cancelGalleryImage(true); }
        } else {
          var desc = (data && data.description) ? data.description : "Noma'lum xatolik";
          setStatus("Yuborilmadi, navbatga qo'shildi: " + desc, "error");
          showToast(plateValue + " yuborilmadi, navbatga qo'shildi", true);
          var fr = new FileReader();
          fr.onload = function(){
            queuePending(fr.result, caption, "raqam.jpg", { plate: plateValue, payment: currentPaymentStatus });
            addHistoryEntry(thumbDataUrl, plateValue, noteValue, now.time, now.date, lastLat, lastLon, currentPaymentStatus);
            plateInput.value = "";
            noteInput.value = "";
            setPaymentStatus("Pul oldi");
            if(usingGallery){ cancelGalleryImage(true); }
          };
          fr.readAsDataURL(blob);
        }
      })
      .catch(function(err){
        isSending = false;
        captureBtn.disabled = false;
        galleryBtn.disabled = false;
        setStatus("Tarmoq xatoligi, rasm navbatga qo'shildi.", "error");
        showToast(plateValue + " uchun tarmoq xatoligi, navbatga qo'shildi", true);
        var fr2 = new FileReader();
        fr2.onload = function(){
          queuePending(fr2.result, caption, "raqam.jpg", { plate: plateValue, payment: currentPaymentStatus });
          addHistoryEntry(thumbDataUrl, plateValue, noteValue, now.time, now.date, lastLat, lastLon, currentPaymentStatus);
          plateInput.value = "";
          noteInput.value = "";
          setPaymentStatus("Pul oldi");
          if(usingGallery){ cancelGalleryImage(true); }
        };
        fr2.readAsDataURL(blob);
      });
  }, "image/jpeg", quality);
});

/* ================= ILOVANI ISHGA TUSHIRISH ================= */
function initAppAfterUnlock(){

  // Sync logo image if missing src
  var logoEl = document.getElementById("logo");
  if(logoEl && (!logoEl.src || logoEl.src === window.location.href)){
    var mainLogo = document.querySelector("img[src^='data:image']");
    if(mainLogo) logoEl.src = mainLogo.src;
  }

  appAlreadyStarted = true;
  var cameraPanel = document.getElementById("cameraPanel");
  var historyPanel = document.getElementById("historyPanel");
  var pendingPanel = document.getElementById("pendingPanel");
  var trashPanel = document.getElementById("trashPanel");
  var statsPanel = document.getElementById("statsPanel");
  var settingsPanel = document.getElementById("settingsPanel");
  var blacklistPanel = document.getElementById("blacklistPanel");

  if(cameraPanel){
    showMenuTab("camera");
    startCamera(currentFacing);
    updateGps();
  } else if(historyPanel){
    showMenuTab("history");
  } else if(pendingPanel){
    showMenuTab("pending");
  } else if(trashPanel){
    showMenuTab("trash");
  } else if(statsPanel){
    showMenuTab("stats");
  } else if(settingsPanel){
    showMenuTab("settings");
  } else if(blacklistPanel){
    showMenuTab("blacklist");
  }
  
  retryPendingQueue();
}

/* ================= SERVICE WORKER RO'YXATDAN O'TKAZISH ================= */
if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(err){
      console.warn("Service worker ro'yxatdan o'tmadi:", err);
    });
  });
}

function updateOfflineBadge(){
  if(navigator.onLine){
    document.body.classList.remove("offlineMode");
  } else {
    document.body.classList.add("offlineMode");
  }
}
window.addEventListener("online", updateOfflineBadge);
window.addEventListener("offline", updateOfflineBadge);
updateOfflineBadge();

// Initialize database and start app
initDb(function() {
  dbGet("history", function(hist) {
    g_history = hist || [];
    if (g_history.length === 0) {
      var oldHist = localStorage.getItem(STORAGE_KEY);
      if (oldHist) {
        try {
          g_history = JSON.parse(oldHist);
          dbSet("history", g_history);
        } catch(e) {}
      }
    }
    
    dbGet("trash", function(tr) {
      g_trash = tr || [];
      if (g_trash.length === 0) {
        var oldTrash = localStorage.getItem(TRASH_KEY);
        if (oldTrash) {
          try {
            g_trash = JSON.parse(oldTrash);
            dbSet("trash", g_trash);
          } catch(e) {}
        }
      }
      
      dbGet("pending", function(pend) {
        g_pending = pend || [];
        if (g_pending.length === 0) {
          var oldPending = localStorage.getItem(PENDING_KEY);
          if (oldPending) {
            try {
              g_pending = JSON.parse(oldPending);
              dbSet("pending", g_pending);
            } catch(e) {}
          }
        }
        
        dbGet("blacklist", function(blist) {
          g_blacklist = blist || [];
          
          // Logo caching across pages
          var logoEl = document.getElementById("logo");
          if (logoEl) {
            var logoSrc = logoEl.getAttribute("src");
            if (logoSrc && logoSrc.length > 100) {
              localStorage.setItem("katlavanLogoBase64", logoSrc);
            } else {
              var storedLogo = localStorage.getItem("katlavanLogoBase64");
              if (storedLogo) {
                logoEl.src = storedLogo;
              }
            }
          }

          // Render UI panels
          renderHistory();
          renderTrash();
          renderBlacklistList();
          updatePendingBar();
          
          // Unlock check
          if (checkUnlocked()) {
            proceedAfterUnlock();
          } else {
            pinInput.focus();
          }
        });
      });
    });
  });
});
