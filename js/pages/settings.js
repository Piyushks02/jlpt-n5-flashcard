/* Settings page */
Pages.settings = function(){
  App.setFocusMode(false);
  var prefs = Store.getPrefs();

  var PRESETS = [
    {id:'ai-shu',  label:'Ai & Shu (default)', swatch:'#2E4A8B'},
    {id:'indigo',  label:'Indigo',              swatch:'#4F46E5'},
    {id:'calm',    label:'Calm / Focus',        swatch:'#0D9488'},
    {id:'playful', label:'Playful',             swatch:'#7C3AED'},
  ];

  var DECKS = App.getAllDecks();

  function presetBtns(){
    return PRESETS.map(function(p){
      var active = prefs.preset===p.id?' active':'';
      return '<button class="preset-btn'+active+'" data-preset="'+p.id+'">'+
        '<span class="preset-swatch" style="background:'+p.swatch+'"></span>'+p.label+
      '</button>';
    }).join('');
  }

  function deckDirRows(){
    return DECKS.map(function(d){
      var dir = (prefs.directions||{})[d.id]||'normal';
      return '<div class="setting-row">'+
        '<div><div class="setting-label">'+d.icon+' '+d.name+'</div></div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(dir==='normal'?' on':'')+'" data-deck="'+d.id+'" data-dir="normal">JP → EN</button>'+
          '<button class="toggle-btn'+(dir==='reverse'?' on':'')+'" data-deck="'+d.id+'" data-dir="reverse">EN → JP</button>'+
        '</div>'+
      '</div>';
    }).join('');
  }

  var html = '<div class="page">'+
    '<h1 class="fw-600" style="margin-bottom:1.5rem">Settings</h1>'+

    '<div class="settings-section">'+
      '<h2>Appearance</h2>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Theme</div></div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(prefs.theme==='light'?' on':'')+'" data-theme="light">☀ Light</button>'+
          '<button class="toggle-btn'+(prefs.theme==='dark'?' on':'')+'" data-theme="dark">🌙 Dark</button>'+
        '</div>'+
      '</div>'+
      '<div class="setting-row" style="flex-direction:column;align-items:flex-start">'+
        '<div class="setting-label" style="margin-bottom:.5rem">Color Preset</div>'+
        '<div class="preset-grid">'+presetBtns()+'</div>'+
      '</div>'+
    '</div>'+

    '<div class="settings-section">'+
      '<h2>Practice Defaults</h2>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Shuffle</div><div class="setting-desc">Randomize card order each session</div></div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(prefs.shuffle?' on':'')+'" id="shuffle-toggle">'+
            (prefs.shuffle?'On':'Off')+
          '</button>'+
        '</div>'+
      '</div>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Answer mode</div><div class="setting-desc">MCQ shows 6 options to pick from; Type uses a text input</div></div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(prefs.quizMode!=='text'?' on':'')+'" data-quiz="mcq">⊞ MCQ</button>'+
          '<button class="toggle-btn'+(prefs.quizMode==='text'?' on':'')+'" data-quiz="text">✎ Type</button>'+
        '</div>'+
      '</div>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">▶ Auto Next</div><div class="setting-desc">Auto-advance to the next card after a correct answer</div></div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(prefs.autoNext?' on':'')+'" id="autonext-setting">'+
            (prefs.autoNext?'On':'Off')+
          '</button>'+
        '</div>'+
      '</div>'+
      deckDirRows()+
    '</div>'+

    '<div class="settings-section">'+
      '<h2>Daily Reset Time</h2>'+
      '<div class="setting-row">'+
        '<div>'+
          '<div class="setting-label">Day rolls over at</div>'+
          '<div class="setting-desc">Practice before this time counts toward the previous calendar day.</div>'+
        '</div>'+
        '<div class="setting-control">'+
          '<input type="time" id="reset-time" value="'+
            String(prefs.resetHour||5).padStart(2,'0')+':'+String(prefs.resetMinute||0).padStart(2,'0')+
          '" style="padding:.35rem .55rem;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text)">'+
        '</div>'+
      '</div>'+
    '</div>'+

    '<div class="settings-section">'+
      '<h2>Save Location</h2>'+
      '<p class="setting-desc" style="margin-bottom:.85rem;line-height:1.6">'+
        'Progress is already auto-saved in your browser and survives browser restarts and updates.'+
        '<br>A <strong>save file</strong> is useful if you clear browser data, switch devices, or want a portable backup.'+
      '</p>'+
      '<div class="setting-row">'+
        '<div>'+
          '<div class="setting-label">Save directory</div>'+
          '<div class="setting-desc" id="dir-desc">Loading…</div>'+
        '</div>'+
        '<div class="setting-control" id="dir-control">'+
          '<button class="btn-secondary btn-sm" id="choose-dir-btn">Choose directory</button>'+
        '</div>'+
      '</div>'+
      '<div class="setting-row">'+
        '<div>'+
          '<div class="setting-label">Close warning</div>'+
          '<div class="setting-desc">Show a browser alert when closing or reloading with unsaved progress</div>'+
        '</div>'+
        '<div class="setting-control">'+
          '<button class="toggle-btn'+(prefs.suppressCloseWarning ? '' : ' on')+'" id="close-warning-toggle">'+
            (prefs.suppressCloseWarning ? 'Off' : 'On')+
          '</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="settings-section">'+
      '<h2>Data</h2>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Export / download backup</div><div class="setting-desc">Download a JSON backup to your machine.</div></div>'+
        '<button class="btn-primary btn-sm" id="export-btn">Export JSON</button>'+
      '</div>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Import progress</div><div class="setting-desc">Replaces all local progress.</div></div>'+
        '<button class="btn-secondary btn-sm" id="import-btn">Import JSON</button>'+
      '</div>'+
      '<div class="setting-row">'+
        '<div><div class="setting-label">Reset all progress</div><div class="setting-desc">Erase mastery data and history.</div></div>'+
        '<button class="btn-danger btn-sm" id="reset-btn">Reset</button>'+
      '</div>'+
    '</div>'+
  '</div>';

  App.setContent(html);

  // --- Wire ---
  // Theme
  document.querySelectorAll('[data-theme]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var t = btn.dataset.theme;
      Store.setPref('theme', t);
      prefs.theme = t;
      App.applyTheme();
      document.querySelectorAll('[data-theme]').forEach(function(b){
        b.classList.toggle('on', b.dataset.theme===t);
      });
    });
  });

  // Preset
  document.querySelectorAll('[data-preset]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var pr = btn.dataset.preset;
      Store.setPref('preset', pr);
      prefs.preset = pr;
      App.applyTheme();
      document.querySelectorAll('[data-preset]').forEach(function(b){
        b.classList.toggle('active', b.dataset.preset===pr);
      });
    });
  });

  // Shuffle toggle
  var shBtn = document.getElementById('shuffle-toggle');
  if(shBtn) shBtn.addEventListener('click', function(){
    prefs.shuffle = !prefs.shuffle;
    Store.setPref('shuffle', prefs.shuffle);
    shBtn.classList.toggle('on', prefs.shuffle);
    shBtn.textContent = prefs.shuffle ? 'On' : 'Off';
  });

  // Answer mode (quiz mode)
  document.querySelectorAll('[data-quiz]').forEach(function(btn){
    btn.addEventListener('click', function(){
      prefs.quizMode = btn.dataset.quiz;
      Store.setPref('quizMode', prefs.quizMode);
      document.querySelectorAll('[data-quiz]').forEach(function(b){
        b.classList.toggle('on', b.dataset.quiz === prefs.quizMode);
      });
    });
  });

  // Auto Next toggle
  var anBtn = document.getElementById('autonext-setting');
  if(anBtn) anBtn.addEventListener('click', function(){
    prefs.autoNext = !prefs.autoNext;
    Store.setPref('autoNext', prefs.autoNext);
    anBtn.classList.toggle('on', prefs.autoNext);
    anBtn.textContent = prefs.autoNext ? 'On' : 'Off';
  });

  // Deck direction toggles
  document.querySelectorAll('[data-deck][data-dir]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var deckId = btn.dataset.deck;
      var dir    = btn.dataset.dir;
      var dirs   = prefs.directions || {};
      dirs[deckId] = dir;
      Store.setPref('directions', dirs);
      prefs.directions = dirs;
      document.querySelectorAll('[data-deck="'+deckId+'"]').forEach(function(b){
        b.classList.toggle('on', b.dataset.dir===dir);
      });
    });
  });

  // Reset time
  var rtInput = document.getElementById('reset-time');
  if(rtInput) rtInput.addEventListener('change', function(){
    var parts = rtInput.value.split(':');
    Store.setPref('resetHour',   parseInt(parts[0],10)||5);
    Store.setPref('resetMinute', parseInt(parts[1],10)||0);
  });

  // Save directory — resolve asynchronously then fill in the row
  function wireDirRow(handle){
    var desc = document.getElementById('dir-desc');
    var ctrl = document.getElementById('dir-control');
    if(!desc || !ctrl) return;
    if(handle){
      desc.innerHTML = 'Saves to <strong>'+handle.name+'</strong>/jlpt-n5-progress.json';
      ctrl.innerHTML =
        '<button class="btn-secondary btn-sm" id="choose-dir-btn">Change directory</button>'+
        '<button class="btn-danger btn-sm" id="clear-dir-btn">Clear</button>';
    } else {
      desc.textContent = 'No directory chosen — will prompt on first save.';
      ctrl.innerHTML = '<button class="btn-secondary btn-sm" id="choose-dir-btn">Choose directory</button>';
    }
    var chooseDir = document.getElementById('choose-dir-btn');
    if(chooseDir) chooseDir.addEventListener('click', function(){
      App.pickDirectory();
      setTimeout(function(){
        App.getDir(function(h){ wireDirRow(h); });
      }, 800);
    });
    var clearDir = document.getElementById('clear-dir-btn');
    if(clearDir) clearDir.addEventListener('click', function(){
      App.clearSaveDir();
      wireDirRow(null);
    });
  }
  App.getDir(function(handle){ wireDirRow(handle); });

  // Close warning toggle
  var cwBtn = document.getElementById('close-warning-toggle');
  if(cwBtn) cwBtn.addEventListener('click', function(){
    prefs.suppressCloseWarning = !prefs.suppressCloseWarning;
    Store.setPref('suppressCloseWarning', prefs.suppressCloseWarning);
    cwBtn.classList.toggle('on', !prefs.suppressCloseWarning);
    cwBtn.textContent = prefs.suppressCloseWarning ? 'Off' : 'On';
  });

  // Export / Import / Reset
  document.getElementById('export-btn').addEventListener('click', function(){ App.exportFile(); });
  document.getElementById('import-btn').addEventListener('click', function(){ App.importFile(); });
  document.getElementById('reset-btn').addEventListener('click', function(){
    if(confirm('Reset ALL progress? This cannot be undone.')){
      Store.importData({version:1, mastery:{}, history:{}, prefs: Store.getPrefs()});
      Pages.settings();
    }
  });
};
