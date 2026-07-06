/* App bootstrap — deck registry, navbar, theme, wiring */

var App = (function(){

  // ===== Deck registry =====
  var DECKS = [
    {id:'hiragana', name:'Hiragana', icon:'あ', type:'kana',
      get cards(){ return (window.N5DATA||{}).hiragana||[]; }},
    {id:'katakana', name:'Katakana', icon:'ア', type:'kana',
      get cards(){ return (window.N5DATA||{}).katakana||[]; }},
    {id:'kanji',    name:'Kanji',    icon:'漢', type:'kanji',
      get cards(){ return (window.N5DATA||{}).kanji||[]; }},
    {id:'vocab',    name:'Vocabulary', icon:'📖', type:'vocab',
      get cards(){ return (window.N5DATA||{}).vocab||[]; }},
    {id:'grammar',  name:'Grammar',  icon:'文', type:'grammar',
      get cards(){ return (window.N5DATA||{}).grammar||[]; }},
  ];

  function getDeck(id){ return DECKS.find(function(d){ return d.id===id; }); }
  function getAllDecks(){ return DECKS; }

  // ===== Theme =====
  function applyTheme(){
    var p = Store.getPrefs();
    document.documentElement.setAttribute('data-theme',  p.theme  || 'light');
    document.documentElement.setAttribute('data-preset', p.preset || 'ai-shu');
  }
  function toggleTheme(){
    var p = Store.getPrefs();
    var next = p.theme === 'dark' ? 'light' : 'dark';
    Store.setPref('theme', next);
    applyTheme();
    updateNavbar();
  }

  // ===== Navbar =====
  var _focusMode = false;
  function setFocusMode(on){ _focusMode = on; renderNavbar(); }

  var _focusInfo = {};
  function setFocusInfo(info){ _focusInfo = info; renderNavbar(); }

  function renderNavbar(){
    var nb = document.getElementById('navbar');
    if(!nb) return;
    if(_focusMode){
      nb.className = 'navbar-focus';
      nb.innerHTML = renderFocusNavbar();
    } else {
      nb.className = 'navbar';
      nb.innerHTML = renderMainNavbar();
      wireMobileMenu();
      wireDecksDropdown();
    }
    updateNavProgress();
    wireThemeToggle();
    wireSaveIndicator();
  }

  function renderMainNavbar(){
    var p = Store.getPrefs();
    var icon = p.theme === 'dark' ? '☀' : '🌙';
    var hash = location.hash;
    function active(path){ return hash === '#'+path || hash === '#'+path+'/' ? ' active' : ''; }
    var deckLinks = DECKS.map(function(d){
      return '<a href="#/deck/'+d.id+'">'+d.icon+' '+d.name+'</a>';
    }).join('');
    return '<a class="navbar-logo" href="#/">'+
      '<svg viewBox="0 0 3 2" width="22" height="15" aria-label="Japan flag" style="vertical-align:middle;border:1px solid rgba(0,0,0,.12);border-radius:2px;margin-right:5px">'+
        '<rect width="3" height="2" fill="#fff"/>'+
        '<circle cx="1.5" cy="1" r="0.6" fill="#BC002D"/>'+
      '</svg>'+
      '<span style="font-size:.9em">N5</span>'+
    '</a>'+
      '<nav class="navbar-links">'+
        '<a href="#/"'+active('/')+'">Home</a>'+
        '<div class="dropdown" id="decks-dropdown">'+
          '<button>Decks ▾</button>'+
          '<div class="dropdown-menu">'+deckLinks+'</div>'+
        '</div>'+
        '<a href="#/calendar"'+active('/calendar')+'">Calendar</a>'+
        '<a href="#/settings"'+active('/settings')+'">Settings</a>'+
      '</nav>'+
      '<div class="navbar-right">'+
        '<div class="nav-progress" id="nav-progress">'+
          '<span id="nav-score" class="nav-score">0 / 0</span>'+
          '<div class="nav-progress-bar"><div class="nav-progress-fill" id="nav-progress-fill" style="width:0%"></div></div>'+
          '<span id="nav-progress-pct">0%</span>'+
        '</div>'+
        '<button class="save-indicator" id="save-indicator" title="Save progress">💾</button>'+
        '<button class="theme-toggle" id="theme-toggle" title="Toggle theme">'+icon+'</button>'+
        '<button class="hamburger" id="hamburger">☰</button>'+
      '</div>';
  }

  function renderFocusNavbar(){
    var fi = _focusInfo;
    var pct = fi.deckPct !== undefined ? Math.round(fi.deckPct*100) : 0;
    return '<a class="exit-link" href="#/deck/'+(fi.deckId||'')+'">‹ Exit</a>'+
      '<span class="focus-info">'+(fi.deckName||'')+'</span>'+
      '<span class="focus-info text-muted" id="focus-counter">'+(fi.current||0)+'/'+(fi.total||0)+'</span>'+
      '<span class="spacer"></span>'+
      '<div class="focus-progress-bar"><div class="focus-progress-fill" style="width:'+pct+'%"></div></div>'+
      '<span class="text-muted text-sm">'+pct+'%</span>';
  }

  function updateNavProgress(){
    var fill  = document.getElementById('nav-progress-fill');
    var pct   = document.getElementById('nav-progress-pct');
    var score = document.getElementById('nav-score');
    if(!fill||!pct) return;
    var totalCards = 0, earnedPts = 0;
    DECKS.forEach(function(d){
      totalCards += d.cards.length;
      earnedPts  += d.cards.reduce(function(s,c){
        return s + (Store.POINTS[Store.getLevel(c.id)]||0);
      }, 0);
    });
    var ratio = totalCards ? earnedPts / totalCards : 0;
    fill.style.width = (ratio * 100).toFixed(1)+'%';
    pct.textContent  = Math.round(ratio * 100)+'%';
    if(score) score.textContent = earnedPts.toFixed(1)+' / '+totalCards;
  }
  function updateFocusCounter(cur, total){
    var el = document.getElementById('focus-counter');
    if(el) el.textContent = cur+'/'+total;
  }

  function wireMobileMenu(){
    var hb = document.getElementById('hamburger');
    if(!hb) return;
    var existing = document.getElementById('mobile-menu');
    if(!existing){
      var mm = document.createElement('div');
      mm.id = 'mobile-menu';
      mm.className = 'mobile-menu';
      mm.innerHTML = DECKS.map(function(d){
        return '<a href="#/deck/'+d.id+'">'+d.icon+' '+d.name+'</a>';
      }).join('')+
        '<a href="#/">Home</a>'+
        '<a href="#/calendar">Calendar</a>'+
        '<a href="#/settings">Settings</a>';
      var nb = document.getElementById('navbar');
      nb.parentNode.insertBefore(mm, nb.nextSibling);
    }
    hb.addEventListener('click', function(){
      var menu = document.getElementById('mobile-menu');
      if(menu) menu.classList.toggle('open');
    });
  }

  function wireDecksDropdown(){
    var dd = document.getElementById('decks-dropdown');
    if(!dd) return;
    dd.addEventListener('click', function(e){
      e.stopPropagation();
      dd.classList.toggle('open');
    });
    document.addEventListener('click', function close(){
      dd.classList.remove('open');
    }, {once:false, capture:false});
  }

  function wireThemeToggle(){
    var btn = document.getElementById('theme-toggle');
    if(btn) btn.addEventListener('click', toggleTheme);
  }
  function wireSaveIndicator(){
    var btn = document.getElementById('save-indicator');
    if(!btn) return;
    btn.addEventListener('click', function(){ exportFile(); });
    updateSaveIndicator();
  }
  function updateSaveIndicator(){
    var btn = document.getElementById('save-indicator');
    if(!btn) return;
    if(Store.hasUnsaved()){
      btn.classList.add('unsaved');
      btn.title = 'Unsaved changes — click to save';
      btn.textContent = '⚠';
    } else {
      btn.classList.remove('unsaved');
      btn.title = _dirHandle
        ? 'Save to ' + _dirHandle.name + '/n5-progress.json'
        : 'Save progress';
      btn.textContent = '💾';
    }
  }

  // ===== Directory handle persistence (IndexedDB) =====
  var _dirHandle = null;

  function _idbOpen(cb){
    try {
      var req = indexedDB.open('n5_dir', 1);
      req.onupgradeneeded = function(e){
        e.target.result.createObjectStore('dir');
      };
      req.onsuccess = function(e){ cb(null, e.target.result); };
      req.onerror   = function(){ cb(req.error, null); };
    } catch(e){ cb(e, null); }
  }
  function _idbGet(cb){
    _idbOpen(function(err, db){
      if(err){ cb(null); return; }
      var tx = db.transaction('dir','readonly');
      var r  = tx.objectStore('dir').get('handle');
      r.onsuccess = function(){ cb(r.result||null); };
      r.onerror   = function(){ cb(null); };
    });
  }
  function _idbSet(handle){
    _idbOpen(function(err, db){
      if(err) return;
      var tx = db.transaction('dir','readwrite');
      tx.objectStore('dir').put(handle, 'handle');
    });
  }
  function _idbClear(){
    _idbOpen(function(err, db){
      if(err) return;
      var tx = db.transaction('dir','readwrite');
      tx.objectStore('dir').delete('handle');
    });
  }

  // ===== Save to directory =====
  var SAVE_FILENAME = 'jlpt-n5-progress.json';

  function _writeToDir(dirHandle, cb){
    dirHandle.getFileHandle(SAVE_FILENAME, {create:true})
      .then(function(fh){ return fh.createWritable(); })
      .then(function(w){
        var data = JSON.stringify(Store.exportData(), null, 2);
        return w.write(data).then(function(){ return w.close(); });
      })
      .then(function(){ cb(null); })
      .catch(function(err){ cb(err); });
  }

  // ===== Toast notifications =====
  function showToast(msg, type){
    var existing = document.getElementById('app-toast');
    if(existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast app-toast-' + (type||'success');
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ toast.classList.add('app-toast-visible'); });
    });
    var duration = type === 'error' ? 6000 : type === 'warn' ? 9000 : 3000;
    setTimeout(function(){
      toast.classList.remove('app-toast-visible');
      setTimeout(function(){ if(toast.parentNode) toast.remove(); }, 350);
    }, duration);
  }

  function _saveWithHandle(dirHandle){
    _writeToDir(dirHandle, function(err){
      if(err){
        showToast('Failed to save file due to error: ' + err.message, 'error');
        return;
      }
      Store.markSaved();
      updateSaveIndicator();
      showToast('Progress saved to ' + dirHandle.name + '/' + SAVE_FILENAME, 'success');
    });
  }

  function pickDirectory(){
    if(!window.showDirectoryPicker){ _downloadFallback(); return; }
    window.showDirectoryPicker({mode:'readwrite'})
      .then(function(dh){
        _dirHandle = dh;
        _idbSet(dh);
        _saveWithHandle(dh);
      })
      .catch(function(err){
        if(err.name !== 'AbortError') _downloadFallback();
      });
  }

  function exportFile(){
    if(!window.showDirectoryPicker){ _downloadFallback(); return; }
    if(_dirHandle){
      _dirHandle.requestPermission({mode:'readwrite'})
        .then(function(perm){
          if(perm === 'granted') _saveWithHandle(_dirHandle);
          else pickDirectory();
        })
        .catch(function(){ pickDirectory(); });
    } else {
      pickDirectory();
    }
  }

  function _downloadFallback(){
    try {
      var data = JSON.stringify(Store.exportData(), null, 2);
      var blob = new Blob([data], {type:'application/json'});
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = SAVE_FILENAME; a.click();
      URL.revokeObjectURL(url);
      Store.markSaved();
      updateSaveIndicator();
      showToast('Progress saved — ' + SAVE_FILENAME + ' downloaded', 'success');
    } catch(err){
      showToast('Failed to save file due to error: ' + err.message, 'error');
    }
  }

  function getDirName(){ return _dirHandle ? _dirHandle.name : null; }

  // Resolves the handle from memory first, then IDB — use this wherever async is acceptable
  function getDir(cb){
    if(_dirHandle){ cb(_dirHandle); return; }
    _idbGet(function(handle){
      if(handle) _dirHandle = handle;
      cb(_dirHandle || null);
    });
  }

  function clearSaveDir(){
    _dirHandle = null;
    _idbClear();
    updateSaveIndicator();
  }

  // ===== Import =====
  function importFile(){
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.addEventListener('change', function(){
      var file = input.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(e){
        try{
          var obj = JSON.parse(e.target.result);
          if(!confirm('Import will replace all current progress. Continue?')) return;
          Store.importData(obj);
          Router.navigate('/');
        } catch(err){
          alert('Invalid file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // ===== Active-time tracker =====
  var _timerStart = null;

  function _startTimer(){
    if(!_timerStart) _timerStart = Date.now();
  }
  function _pauseTimer(){
    if(_timerStart){
      var elapsed = (Date.now() - _timerStart) / 1000;
      Store.addTimeToday(elapsed);
      _timerStart = null;
    }
  }

  function initTimeTracker(){
    _startTimer();
    document.addEventListener('visibilitychange', function(){
      if(document.hidden) _pauseTimer(); else _startTimer();
    });
    window.addEventListener('blur',  _pauseTimer);
    window.addEventListener('focus', _startTimer);
    window.addEventListener('beforeunload', _pauseTimer);
  }

  // ===== Unsaved-changes guard =====
  function initBeforeUnload(){
    window.addEventListener('beforeunload', function(e){
      if(Store.hasUnsaved() && !Store.getPrefs().suppressCloseWarning){
        e.preventDefault();
        e.returnValue = '';
        showToast('Unsaved progress — click the ⚠ icon in the top right to save<br><span style="font-size:.8em;opacity:.85">To disable this alert, go to Settings</span>', 'warn');
      }
    });
  }

  // ===== Main content area =====
  function setContent(html){ document.getElementById('main').innerHTML = html; }
  function getMain(){ return document.getElementById('main'); }

  // ===== Init =====
  function init(){
    applyTheme();
    // Pre-load saved directory handle from IndexedDB
    _idbGet(function(handle){
      if(handle) _dirHandle = handle;
    });
    Store.onChange(function(){
      updateNavProgress();
      updateSaveIndicator();
    });
    renderNavbar();
    initBeforeUnload();
    initTimeTracker();
    // Remind user of unsaved progress after reload
    if(Store.hasUnsaved() && !Store.getPrefs().suppressCloseWarning){
      setTimeout(function(){
        showToast('Unsaved progress — click the ⚠ icon in the top right to save<br><span style="font-size:.8em;opacity:.85">To disable this alert, go to Settings</span>', 'warn');
      }, 1200);
    }
    Router.on('/', Pages.home);
    Router.on('/deck/:id', Pages.deck);
    Router.on('/practice/:id', Pages.practice);
    Router.on('/calendar', Pages.calendar);
    Router.on('/settings', Pages.settings);
    Router.dispatch();
  }

  return {
    init: init,
    getDeck: getDeck,
    getAllDecks: getAllDecks,
    applyTheme: applyTheme,
    renderNavbar: renderNavbar,
    setFocusMode: setFocusMode,
    setFocusInfo: setFocusInfo,
    updateFocusCounter: updateFocusCounter,
    setContent: setContent,
    getMain: getMain,
    exportFile: exportFile,
    importFile: importFile,
    pickDirectory: pickDirectory,
    getDirName: getDirName,
    getDir: getDir,
    clearSaveDir: clearSaveDir,
    updateSaveIndicator: updateSaveIndicator,
  };
})();
