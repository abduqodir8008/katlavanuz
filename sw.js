/* KATLAVAN NAZORAT — Service Worker
   Maqsad: ilova qobig'ini (index.html, manifest, ikonkalar) keshga saqlab,
   internet bo'lmaganda ham ilova ochilishini ta'minlash.
   Telegramga rasm/xabar yuborish har doim tarmoq orqali (network-only) bajariladi;
   agar internet bo'lmasa, bu so'rovlar ilova ichidagi navbatga (localStorage queue) tushadi. */

var CACHE_NAME = "katlavan-shell-v3";
var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

function isTelegramApi(url){
  return url.indexOf("api.telegram.org") !== -1;
}

function isFontOrExternal(url){
  return url.indexOf("fonts.googleapis.com") !== -1 ||
         url.indexOf("fonts.gstatic.com") !== -1 ||
         url.indexOf("cdn.jsdelivr.net") !== -1;
}

self.addEventListener("fetch", function(event){
  var req = event.request;
  var url = req.url;

  /* Telegramga yuborish so'rovlarini hech qachon keshlamaymiz — har doim tarmoqdan */
  if(isTelegramApi(url)){
    event.respondWith(fetch(req));
    return;
  }

  /* Faqat GET so'rovlarini keshlaymiz */
  if(req.method !== "GET"){
    return;
  }

  /* Sahifa navigatsiyasi (index.html so'ralganda) — avval keshdan, keyin tarmoqdan */
  if(req.mode === "navigate"){
    event.respondWith(
      fetch(req).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put("./index.html", resClone); });
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  /* Shrift/tashqi kutubxonalar (JetBrains Mono, Manrope, Tesseract.js): keshdan, bo'lmasa tarmoqdan, tarmoqni ham keshga qo'shamiz */
  if(isFontOrExternal(url)){
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached){ return cached; }
        return fetch(req).then(function(res){
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
          return res;
        }).catch(function(){ return cached; });
      })
    );
    return;
  }

  /* Qolgan barcha statik fayllar uchun: avval kesh, bo'lmasa tarmoq */
  event.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
        return res;
      });
    })
  );
});