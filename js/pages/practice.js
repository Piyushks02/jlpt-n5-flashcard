/* Practice page */
Pages.practice = function(params){
  var deck = App.getDeck(params.id);
  if(!deck){ Router.navigate('/'); return; }

  var prefs   = Store.getPrefs();
  var deckDir = (prefs.directions||{})[deck.id] || 'normal';

  // Consume pre-selected card IDs from deck select mode (one-shot)
  var _selectionIds = (window._practiceSelection && window._practiceSelection.length > 0)
    ? window._practiceSelection.slice() : null;
  window._practiceSelection = null;
  var selectionMode = !!_selectionIds; // when true, filters are locked to the selection

  // ===== State =====
  var direction  = deckDir;
  var shuffle    = !!prefs.shuffle;
  var masteryAllMode = true;
  var masteryFilter  = [];
  var catAllMode = true;
  var catFilter  = [];
  var allCategories = _getCategories(deck);
  var queue        = [];       // filtered cards (total count reference)
  var recyclePool  = [];       // cards left in the current pass
  var shownHistory = [];       // last ≤10 card objects (for ← navigation)
  var histIdx      = -1;       // position within shownHistory
  var isRecycling  = false;    // true once all cards have been seen once
  var passCount    = 0;        // cards seen so far in the current pass
  var isFlipped    = false;
  var pendingLevel = null;
  var quizMode     = prefs.quizMode || 'mcq'; // 'mcq' | 'text'
  var autoNext     = !!prefs.autoNext;         // auto-advance on correct answer
  var mcqData      = null;  // {options:[], correct:''}  computed per card
  var mcqAnswered  = false; // true once user has picked an MCQ option
  var _autoNextTimer = null; // pending auto-advance timeout

  // ===== Build queue =====
  function _getCategories(deck){
    if(deck.type==='kana'){
      // for kana, filter unit is the row (e.g. 'a', 'ka', 'sa'...)
      var rows = [], seen = {};
      deck.cards.forEach(function(c){
        var r = c.row||'other';
        if(!seen[r]){ seen[r]=true; rows.push(r); }
      });
      return rows;
    }
    var cats = {}, order = [];
    deck.cards.forEach(function(c){
      var cat = _getCardCat(deck, c);
      if(!cats[cat]){ cats[cat]=true; order.push(cat); }
    });
    return order;
  }
  function _getCardCat(deck, c){
    if(deck.type==='kana')   return c.row||'other'; // filter by row for kana
    if(deck.type==='vocab')  return c.cat||'Other';
    if(deck.type==='kanji')  return c.cat||'Other';
    return deck.name;
  }

  // Returns group → ordered rows for kana grouped chip panel
  function _kanaGroupRows(){
    var order = ['gojuon','dakuten','combo'];
    var labels = {gojuon:'Gojuon', dakuten:'Dakuten', combo:'Combo'};
    var map = {gojuon:[], dakuten:[], combo:[]};
    deck.cards.forEach(function(c){
      var g = c.group||'gojuon', r = c.row||'other';
      if(map[g] && map[g].indexOf(r)<0) map[g].push(r);
    });
    return order.map(function(g){ return {key:g, label:labels[g], rows:map[g]}; });
  }

  function _shuffled(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; }
    return a;
  }

  function buildQueue(){
    var cards;
    if(selectionMode){
      cards = deck.cards.filter(function(c){ return _selectionIds.indexOf(c.id) >= 0; });
    } else {
      cards = deck.cards.filter(function(c){
        var lv = Store.getLevel(c.id);
        if(!masteryAllMode && masteryFilter.indexOf(lv) < 0) return false;
        if(!catAllMode){
          var cat = _getCardCat(deck, c);
          return catFilter.indexOf(cat) >= 0;
        }
        return true;
      });
    }
    queue       = cards;
    recyclePool = shuffle ? _shuffled(cards) : cards.slice();
    shownHistory = [];
    histIdx      = -1;
    isRecycling  = false;
    passCount    = 0;
    // pre-load first card into history
    if(recyclePool.length > 0){
      shownHistory.push(recyclePool.shift());
      histIdx   = 0;
      passCount = 1;
    }
  }

  function _refillPool(){
    isRecycling = true;
    recyclePool = shuffle ? _shuffled(queue) : queue.slice();
  }

  function currentCard(){ return histIdx >= 0 ? shownHistory[histIdx] : null; }

  // ===== Card face helpers =====
  function getFront(card){
    if(direction==='normal'){
      if(deck.type==='kana')   return {main:card.kana, sub:'', hint:'Click to reveal romaji'};
      if(deck.type==='kanji')  return {main:card.kanji, sub:'', hint:'Click to reveal meaning'};
      if(deck.type==='vocab')  return {main:card.jp, sub:'', hint:'Click to reveal meaning'};
      if(deck.type==='grammar')return {main:card.point, sub:'', hint:'Click to reveal meaning'};
    } else {
      if(deck.type==='kana')   return {main:card.romaji, sub:'', hint:'Click to reveal kana'};
      if(deck.type==='kanji')  return {main:card.meaning, sub:'On: '+card.on+' Kun: '+card.kun, hint:'Click to reveal kanji'};
      if(deck.type==='vocab')  return {main:card.en, sub:card.reading||'', hint:'Click to reveal Japanese'};
      if(deck.type==='grammar')return {main:card.meaning, sub:'', hint:'Click to reveal grammar point'};
    }
    return {main:'',sub:'',hint:''};
  }
  function getBack(card){
    if(direction==='normal'){
      if(deck.type==='kana')   return {main:card.romaji, sub:'', extra:''};
      if(deck.type==='kanji')  return {main:card.meaning, sub:'On: '+card.on, extra:'Kun: '+card.kun+(card.example?'\n'+card.example:'')};
      if(deck.type==='vocab')  return {main:card.en, sub:card.reading||'', extra:''};
      if(deck.type==='grammar')return {main:card.meaning, sub:card.example||'', extra:card.exampleEn||''};
    } else {
      if(deck.type==='kana')   return {main:card.kana, sub:'', extra:''};
      if(deck.type==='kanji')  return {main:card.kanji, sub:'', extra:''};
      if(deck.type==='vocab')  return {main:card.jp, sub:card.reading||'', extra:''};
      if(deck.type==='grammar')return {main:card.point, sub:'', extra:''};
    }
    return {main:'',sub:'',extra:''};
  }

  // Answer key for type-mode check only — null disables the textbox
  function getAnswerKey(card){
    if(direction==='reverse') return null; // type mode disabled in EN→JP (can't type Japanese easily)
    if(deck.type==='kana')    return card.romaji;
    if(deck.type==='kanji')   return card.meaning;
    if(deck.type==='vocab')   return card.en;
    if(deck.type==='grammar') return null;
    return null;
  }

  // Answer key for any card — used to generate MCQ distractors
  function _getCardAnswer(c){
    if(direction==='reverse'){
      if(deck.type==='kana')    return c.kana;
      if(deck.type==='kanji')   return c.kanji;
      if(deck.type==='vocab')   return c.jp;
      return null;
    }
    if(deck.type==='kana')    return c.romaji;
    if(deck.type==='kanji')   return c.meaning;
    if(deck.type==='vocab')   return c.en;
    return null;
  }

  function _getMCQData(card){
    var correct = _getCardAnswer(card);
    if(!correct) return null;
    var distractors = [];
    deck.cards.forEach(function(c){
      if(c.id === card.id) return;
      var ans = _getCardAnswer(c);
      if(!ans || ans === correct) return;
      // Use only the first alternative to keep options short
      var first = ans.split(/[,\/;]/)[0].trim();
      if(first && first !== correct && distractors.indexOf(first) < 0) distractors.push(first);
    });
    var picked = _shuffled(distractors).slice(0, 5);
    var options = _shuffled([correct].concat(picked));
    return {options: options, correct: correct};
  }

  // ===== Render =====
  function render(){
    App.setFocusMode(true);
    App.setFocusInfo({
      deckId: deck.id, deckName: deck.name,
      direction: direction==='normal'?'JP→EN':'EN→JP',
      current: isRecycling ? queue.length : passCount, total: queue.length,
      deckPct: Store.deckProgress(deck.cards),
    });

    var card = currentCard();
    mcqData = (quizMode==='mcq' && card) ? _getMCQData(card) : null;
    var mainHTML = _buildUI(card);
    App.setContent(mainHTML);
    _wireUI(card);
  }

  function _buildUI(card){
    var cats = allCategories;
    // mastery filter button group — "All" is exclusive; individual levels are multi-select
    var mfBtns = '<div class="btn-group" id="mastery-filter-group">'+
      '<button class="filter-btn'+(masteryAllMode?' active':'')+'" data-lv="all">All</button>'+
      ['unknown','learning','familiar','mastered'].map(function(lv){
        var on = !masteryAllMode && masteryFilter.indexOf(lv)>=0 ? ' active' : '';
        return '<button class="mastery-filter-btn filter-btn'+on+'" data-lv="'+lv+'">'+cap(lv)+'</button>';
      }).join('')+
    '</div>';
    // category chips — grouped for kana, flat for all other decks
    var catBtns;
    if(deck.type==='kana'){
      var groups = _kanaGroupRows();
      // [All] chip is rendered inline with the label — catBtns contains only the grouped sections
      catBtns = '<div class="kana-cat-panel">'+
        groups.map(function(g){
          if(!g.rows.length) return '';
          // in All mode every chip shows as active so the user sees the full selection
          var allGrpSel = catAllMode || g.rows.every(function(r){ return catFilter.indexOf(r)>=0; });
          return '<div class="cat-group-section">'+
            '<span class="cat-group-label">'+g.label+'</span>'+
            '<div class="cat-group-chips">'+
              '<button class="cat-group-all chip chip-sm'+(allGrpSel?' active':'')+'" data-group="'+g.key+'">All</button>'+
              g.rows.map(function(r){
                var on = catAllMode || catFilter.indexOf(r)>=0 ? ' active' : '';
                return '<button class="cat-filter-btn chip chip-sm'+on+'" data-cat="'+escHtml(r)+'">'+escHtml(r)+'</button>';
              }).join('')+
            '</div>'+
          '</div>';
        }).join('')+
      '</div>';
    } else {
      catBtns = '<div class="chip-group cat-btn-group">'+
        '<button class="cat-filter-btn chip'+(catAllMode?' active':'')+'" data-cat="all">All</button>'+
        cats.map(function(c){
          var on = !catAllMode && catFilter.indexOf(c)>=0 ? ' active' : '';
          return '<button class="cat-filter-btn chip'+on+'" data-cat="'+escHtml(c)+'">'+escHtml(c)+'</button>';
        }).join('')+
      '</div>';
    }

    var cardBlock;
    if(!card){
      cardBlock = '<div class="empty-state">No cards match the current filters.<br>Adjust the mastery or category filter.</div>';
    } else {
      var front = getFront(card);
      var back  = getBack(card);
      var ansKey = getAnswerKey(card);
      var ansDisabled = ansKey === null;

      // Build answer section — grammar has no answer check at all
      var ansSection;
      if(deck.type==='grammar'){
        ansSection = ''; // grammar: no textbox, no MCQ
      } else if(quizMode==='mcq' && mcqData){
        var mcqLetters = ['A','B','C','D','E','F'];
        // Use larger kana buttons when options are single/double kana characters
        var isKanaOpts = deck.type==='kana' && direction==='reverse';
        ansSection =
          '<div class="practice-divider practice-divider--answer">Choose answer</div>'+
          '<div class="mcq-grid'+(isKanaOpts?' mcq-grid--kana':'')+'">'+
            mcqData.options.map(function(opt, i){
              return '<button class="mcq-btn" data-mcq-idx="'+i+'" title="Shortcut: '+mcqLetters[i]+'">'+
                '<span class="mcq-letter">'+mcqLetters[i]+'</span>'+
                escHtml(opt)+
              '</button>';
            }).join('')+
          '</div>'+
          '<div class="answer-result" id="answer-result"></div>';
      } else if(quizMode==='mcq' && !mcqData){
        // MCQ disabled for grammar (both directions)
        var disMsg = 'No MCQ for grammar';
        ansSection = '<div class="practice-divider practice-divider--answer">Choose answer</div>'+
          '<div class="answer-check answer-check-disabled">'+
            '<input type="text" disabled placeholder="'+disMsg+'">'+
            '<button class="btn-secondary btn-sm" disabled>Check</button>'+
          '</div>';
      } else {
        // Text mode
        var ansPlaceholder = ansDisabled
          ? (direction==='reverse' ? 'Type mode unavailable for EN → JP — use MCQ' : 'No answer check for grammar')
          : 'Type answer…';
        ansSection =
          '<div class="answer-check'+(ansDisabled?' answer-check-disabled':'')+'">' +
            '<input type="text" id="answer-input" placeholder="'+ansPlaceholder+'" autocomplete="off"'+(ansDisabled?' disabled':'')+'>'+
            '<button class="btn-secondary btn-sm" id="check-btn"'+(ansDisabled?' disabled':'')+'>Check</button>'+
          '</div>'+
          '<div class="answer-result" id="answer-result"></div>';
      }

      cardBlock =
        '<div class="flip-card-outer">'+
          '<button class="nav-btn side-nav-btn" id="prev-btn" title="Previous card  (← Arrow)">'+
            '<svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">'+
              '<path d="M8 2L2 8L8 14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'+
            '</svg>'+
          '</button>'+
          '<div class="flip-card-wrapper'+(isFlipped?' flipped':'')+'" id="flip-card">'+
            '<div class="flip-card-inner">'+
              '<div class="flip-card-face flip-card-front">'+
                '<div class="card-face-jp">'+escHtml(front.main)+'</div>'+
                (front.sub?'<div class="card-face-sub">'+escHtml(front.sub)+'</div>':'')+
                '<div class="card-face-hint">'+escHtml(front.hint)+'</div>'+
              '</div>'+
              '<div class="flip-card-face flip-card-back">'+
                '<div class="card-face-answer">'+escHtml(back.main)+'</div>'+
                (back.sub?'<div class="card-face-reading">'+escHtml(back.sub)+'</div>':'')+
                (back.extra?'<div class="card-face-example">'+escHtml(back.extra)+'</div>':'')+
              '</div>'+
            '</div>'+
            '<div class="card-counter-inner">'+(isRecycling ? queue.length : passCount)+' / '+queue.length+(isRecycling ? ' ↺' : '')+'</div>'+
          '</div>'+
          '<button class="nav-btn side-nav-btn" id="next-btn" title="Next card  (→ Arrow · Enter)">'+
            '<svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">'+
              '<path d="M2 2L8 8L2 14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'+
            '</svg>'+
          '</button>'+
        '</div>'+
        '<div class="flip-hint">'+
          '<kbd>Space</kbd> flip &nbsp;·&nbsp; <kbd>← →</kbd> navigate &nbsp;·&nbsp; <kbd>1-4</kbd> level'+
          (quizMode==='mcq' && mcqData ? ' &nbsp;·&nbsp; <kbd>A-F</kbd> choose' : '')+
          (quizMode==='text' && !ansDisabled ? ' &nbsp;·&nbsp; <kbd>a-z</kbd> to type' : '')+
        '</div>'+
        ansSection+
        '<div class="practice-divider">Mark card as</div>'+
        '<div class="mastery-buttons">'+
          ['unknown','learning','familiar','mastered'].map(function(lv,i){
            var active = (pendingLevel||Store.getLevel(card.id))===lv?' active':'';
            return '<button class="mastery-btn '+lv+active+'" data-lv="'+lv+'" title="'+(i+1)+'">'+cap(lv)+'</button>';
          }).join('')+
        '</div>';
    }

    var filterRows = selectionMode
      ? '<div class="practice-controls-row">'+
          '<span class="controls-label">Settings</span>'+
          '<div class="settings-controls">'+
            '<button class="toggle-btn'+(direction==='reverse'?' on':'')+'" id="dir-toggle"'+
              ' title="Card direction — front side shown first">'+
              (direction==='normal'?'JP → EN':'EN → JP')+
            '</button>'+
            '<button class="toggle-btn'+(shuffle?' on':'')+'" id="shuffle-toggle"'+
              ' title="Randomise card order">⇄ Shuffle</button>'+
            (deck.type!=='grammar'
              ? '<button class="toggle-btn'+(quizMode==='mcq'?' on':'')+'" id="quiz-toggle"'+
                  ' title="MCQ: pick from 6 options · Type: write your answer">'+
                  (quizMode==='mcq' ? '⊞ MCQ' : '✎ Type')+
                '</button>'
              : '')+
            '<button class="toggle-btn'+(autoNext?' on':'')+'" id="autonext-toggle"'+
              ' title="Auto-advance to next card after a correct answer">▶ Auto</button>'+
          '</div>'+
        '</div>'+
        '<div class="selection-notice">'+
          '⚑ Practising <strong>'+_selectionIds.length+'</strong> selected card'+(_selectionIds.length===1?'':'s')+
          ' — level &amp; category filters are disabled'+
        '</div>'
      : '<div class="practice-controls-row">'+
          '<span class="controls-label">Settings</span>'+
          '<div class="settings-controls">'+
            '<button class="toggle-btn'+(direction==='reverse'?' on':'')+'" id="dir-toggle"'+
              ' title="Card direction — front side shown first">'+
              (direction==='normal'?'JP → EN':'EN → JP')+
            '</button>'+
            '<button class="toggle-btn'+(shuffle?' on':'')+'" id="shuffle-toggle"'+
              ' title="Randomise card order">⇄ Shuffle</button>'+
            (deck.type!=='grammar'
              ? '<button class="toggle-btn'+(quizMode==='mcq'?' on':'')+'" id="quiz-toggle"'+
                  ' title="MCQ: pick from 6 options · Type: write your answer">'+
                  (quizMode==='mcq' ? '⊞ MCQ' : '✎ Type')+
                '</button>'
              : '')+
            '<button class="toggle-btn'+(autoNext?' on':'')+'" id="autonext-toggle"'+
              ' title="Auto-advance to next card after a correct answer">▶ Auto</button>'+
          '</div>'+
        '</div>'+
        '<div class="practice-controls-row">'+
          '<span class="controls-label">Filter by level</span>'+
          mfBtns+
        '</div>'+
        (allCategories.length > 1
          ? (deck.type==='kana'
            ? '<div class="practice-controls-row cat-with-all-row">'+
                '<div class="cat-all-line">'+
                  '<span class="controls-label">Filter by category</span>'+
                  '<button class="cat-filter-btn chip'+(catAllMode?' active':'')+'" data-cat="all">All</button>'+
                '</div>'+
                catBtns+
              '</div>'
            : '<div class="practice-controls-row">'+
                '<span class="controls-label">Filter by category</span>'+
                catBtns+
              '</div>')
          : '');

    return '<div class="practice-layout">'+
      '<div class="practice-controls-block">'+filterRows+'</div>'+
      cardBlock+
    '</div>';
  }

  function _wireUI(card){
    // direction toggle
    var dt = document.getElementById('dir-toggle');
    if(dt) dt.addEventListener('click', function(){
      direction = direction==='normal'?'reverse':'normal';
      isFlipped = false; pendingLevel = null;
      render();
    });
    // shuffle
    var st = document.getElementById('shuffle-toggle');
    if(st) st.addEventListener('click', function(){
      shuffle = !shuffle;
      buildQueue(); isFlipped=false; pendingLevel=null;
      Store.setPref('shuffle', shuffle);
      render();
    });
    // mastery filter group
    var mfGroup = document.getElementById('mastery-filter-group');
    if(mfGroup){
      // "All" — reset to all-mode
      mfGroup.querySelector('[data-lv="all"]').addEventListener('click', function(){
        masteryAllMode = true;
        masteryFilter  = [];
        buildQueue(); isFlipped=false; pendingLevel=null;
        render();
      });
      // individual levels — multi-select; first click from All-mode selects only that level
      mfGroup.querySelectorAll('.mastery-filter-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var lv = btn.dataset.lv;
          if(masteryAllMode){
            masteryAllMode = false;
            masteryFilter  = [lv];
          } else {
            var idx = masteryFilter.indexOf(lv);
            if(idx >= 0) masteryFilter.splice(idx, 1);
            else masteryFilter.push(lv);
            if(masteryFilter.length === 0){ masteryAllMode = true; } // revert to All when empty
          }
          buildQueue(); isFlipped=false; pendingLevel=null;
          render();
        });
      });
    }
    // category filter — top-level "All"
    document.querySelectorAll('.cat-filter-btn[data-cat="all"]').forEach(function(btn){
      btn.addEventListener('click', function(){
        catAllMode = true; catFilter = [];
        buildQueue(); isFlipped=false; pendingLevel=null; render();
      });
    });
    // individual row/category chips
    document.querySelectorAll('.cat-filter-btn:not([data-cat="all"])').forEach(function(btn){
      btn.addEventListener('click', function(){
        var cat = btn.dataset.cat;
        if(catAllMode){ catAllMode=false; catFilter=[cat]; }
        else {
          var idx = catFilter.indexOf(cat);
          if(idx>=0) catFilter.splice(idx,1); else catFilter.push(cat);
          if(catFilter.length===0) catAllMode=true;
        }
        buildQueue(); isFlipped=false; pendingLevel=null; render();
      });
    });
    // kana group-level "All" buttons
    document.querySelectorAll('.cat-group-all').forEach(function(btn){
      btn.addEventListener('click', function(){
        var groupKey = btn.dataset.group;
        var groupRows = _kanaGroupRows().filter(function(g){ return g.key===groupKey; });
        var rows = groupRows.length ? groupRows[0].rows : [];
        if(catAllMode){
          catAllMode=false; catFilter=rows.slice();
        } else {
          var allSel = rows.every(function(r){ return catFilter.indexOf(r)>=0; });
          if(allSel){
            catFilter = catFilter.filter(function(r){ return rows.indexOf(r)<0; });
            if(catFilter.length===0) catAllMode=true;
          } else {
            rows.forEach(function(r){ if(catFilter.indexOf(r)<0) catFilter.push(r); });
          }
        }
        buildQueue(); isFlipped=false; pendingLevel=null; render();
      });
    });

    if(!card) return;

    // flip card
    var fc = document.getElementById('flip-card');
    if(fc) fc.addEventListener('click', function(){ _flip(card); });

    // nav
    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    if(prevBtn) prevBtn.addEventListener('click', function(){ _go(-1, card); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ _go(1, card); });

    // mastery buttons
    document.querySelectorAll('.mastery-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        pendingLevel = btn.dataset.lv;
        document.querySelectorAll('.mastery-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    // auto-next toggle
    var ant = document.getElementById('autonext-toggle');
    if(ant) ant.addEventListener('click', function(){
      autoNext = !autoNext;
      Store.setPref('autoNext', autoNext);
      render();
    });

    // quiz mode toggle
    var qt = document.getElementById('quiz-toggle');
    if(qt) qt.addEventListener('click', function(){
      quizMode = quizMode==='mcq' ? 'text' : 'mcq';
      mcqAnswered = false;
      Store.setPref('quizMode', quizMode);
      render();
    });

    // MCQ option clicks
    document.querySelectorAll('.mcq-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(mcqAnswered) return;
        _pickMCQ(parseInt(btn.dataset.mcqIdx, 10));
      });
    });

    // answer check (text mode)
    var inp = document.getElementById('answer-input');
    var chk = document.getElementById('check-btn');
    if(inp && chk){
      function doCheck(){
        var key = getAnswerKey(card);
        if(!key) return;
        var val = inp.value.trim();
        var correct = _checkAnswer(val, key);
        inp.classList.remove('correct','wrong');
        inp.classList.add(correct?'correct':'wrong');
        var res = document.getElementById('answer-result');
        if(res){
          res.className = 'answer-result '+(correct?'correct':'wrong');
          res.textContent = correct ? '✓ Correct!' : '✗ Expected: '+key;
        }
        // Always flip to reveal the answer
        _flipToBack(card);
        // Auto-advance after 700ms if correct and toggle is on
        if(correct && autoNext) _scheduleAutoNext(card);
      }
      chk.addEventListener('click', doCheck);
      inp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); doCheck(); inp.blur(); }});
    }

    // mark active day
    Store.markActiveDay();

    // keyboard shortcuts
    document.onkeydown = function(e){
      var inp = document.getElementById('answer-input');
      var inTextbox = e.target === inp;

      if(inTextbox){
        // Escape exits the textbox; everything else types normally
        if(e.key==='Escape'){ e.preventDefault(); inp.blur(); }
        return;
      }

      // Global shortcuts (always active when outside textbox)
      if(e.key==='ArrowLeft')  { _go(-1,card); return; }
      if(e.key==='ArrowRight') { _go(1,card);  return; }
      if(e.key==='Enter')      { e.preventDefault(); _go(1,card); return; }
      if(e.key===' ')          { e.preventDefault(); _flip(card); return; }

      // A–F → MCQ option selection
      if(quizMode==='mcq' && mcqData && !mcqAnswered){
        var mcqMap = {a:0,b:1,c:2,d:3,e:4,f:5};
        var mcqIdx = mcqMap[e.key.toLowerCase()];
        if(mcqIdx !== undefined){ e.preventDefault(); _pickMCQ(mcqIdx); return; }
      }

      // 1–4 → mastery shortcuts (numbers never redirect to textbox)
      if(e.key>='1'&&e.key<='4'){
        var levels=['unknown','learning','familiar','mastered'];
        pendingLevel = levels[+e.key-1];
        document.querySelectorAll('.mastery-btn').forEach(function(b){
          b.classList.toggle('active', b.dataset.lv===pendingLevel);
        });
        return;
      }

      // Any non-number printable key → focus textbox if it exists
      var isPrintableNonNumber = e.key.length===1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey;
      if(isPrintableNonNumber && inp && !inp.disabled){
        inp.focus();
        // don't preventDefault — let the character land in the input naturally
      }
    };

    // mark viewed on first flip or display
    _markViewedIfNeeded(card);
  }

  function _pickMCQ(idx){
    if(!mcqData || mcqAnswered) return;
    mcqAnswered = true;
    var chosen = mcqData.options[idx];
    var isCorrect = _checkAnswer(chosen, mcqData.correct);
    document.querySelectorAll('.mcq-btn').forEach(function(btn, i){
      btn.disabled = true;
      var opt = mcqData.options[i];
      if(_checkAnswer(opt, mcqData.correct)) btn.classList.add('correct');
      else if(i === idx && !isCorrect)       btn.classList.add('wrong');
    });
    var res = document.getElementById('answer-result');
    if(res){
      res.className = 'answer-result '+(isCorrect?'correct':'wrong');
      res.textContent = isCorrect ? '✓ Correct!' : '✗ Correct: '+mcqData.correct;
    }
    // Always flip to reveal the answer
    var cur = currentCard();
    if(cur) _flipToBack(cur);
    // Auto-advance after 700ms if correct and toggle is on
    if(isCorrect && autoNext && cur) _scheduleAutoNext(cur);
  }

  function _flipToBack(card){
    if(!isFlipped){
      isFlipped = true;
      var fc = document.getElementById('flip-card');
      if(fc) fc.classList.add('flipped');
      Store.markViewed(card.id);
    }
  }

  function _scheduleAutoNext(card){
    if(_autoNextTimer) clearTimeout(_autoNextTimer);
    _autoNextTimer = setTimeout(function(){
      _autoNextTimer = null;
      _go(1, card);
    }, 700);
  }

  function _flip(card){
    isFlipped = !isFlipped;
    var fc = document.getElementById('flip-card');
    if(fc) fc.classList.toggle('flipped', isFlipped);
    if(isFlipped) Store.markViewed(card.id);
  }

  function _go(dir, card){
    // commit pending mastery change
    if(card && pendingLevel && pendingLevel !== Store.getLevel(card.id)){
      var old = Store.getLevel(card.id);
      Store.setLevel(card.id, pendingLevel);
      Store.recordMove(card.id, old, pendingLevel);
    }
    if(_autoNextTimer){ clearTimeout(_autoNextTimer); _autoNextTimer = null; }
    pendingLevel = null;
    isFlipped = false;
    mcqAnswered = false;
    document.onkeydown = null;

    if(dir === 1){
      if(histIdx < shownHistory.length - 1){
        // move forward within history (revisiting)
        histIdx++;
      } else {
        // need a new card — refill pool if exhausted
        if(recyclePool.length === 0) _refillPool();
        if(queue.length > 0){
          var next = recyclePool.shift();
          shownHistory.push(next);
          if(shownHistory.length > 10) shownHistory.shift(); // cap history at 10
          histIdx = shownHistory.length - 1;
          if(!isRecycling) passCount = Math.min(passCount + 1, queue.length);
        }
      }
    } else {
      if(histIdx > 0) histIdx--;
    }

    render();
  }

  function _markViewedIfNeeded(card){
    // cards are "viewed" when flipped; mark automatically after 0.5s on the back if already flipped
    if(isFlipped) Store.markViewed(card.id);
  }

  function _checkAnswer(input, key){
    function norm(s){ return s.toLowerCase().replace(/[.,;!?''""\s]/g,''); }
    var alts = key.split(/[,\/;]/).map(function(s){ return norm(s.trim()); });
    var inp  = norm(input);
    return alts.some(function(a){ return a===inp; });
  }

  // helpers
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function escHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ===== Init =====
  buildQueue();
  render();
};
