/* Deck page */
Pages.deck = function(params){
  App.setFocusMode(false);
  var deck = App.getDeck(params.id);
  if(!deck){ Router.navigate('/'); return; }

  var cards = deck.cards;

  // ===== Select mode state =====
  var selectMode    = false;
  var selectedCards = new Set();

  // ===== Grouping helpers =====
  function groupCards(){
    var groups = {}, order = [];
    cards.forEach(function(c){
      var key;
      if(deck.type==='kana')        key = (c.group||'other')+'|'+(c.row||'');
      else if(deck.type==='vocab')  key = c.cat||'Other';
      else if(deck.type==='kanji') key = c.cat||'Other';
      else key = deck.name;
      if(!groups[key]){ groups[key]=[]; order.push(key); }
      groups[key].push(c);
    });
    return {groups:groups, order:order};
  }
  function cardLabel(c){
    if(deck.type==='kana')   return {jp:c.kana,   sub:c.romaji};
    if(deck.type==='kanji')  return {jp:c.kanji,  sub:c.meaning};
    if(deck.type==='vocab')  return {jp:c.jp,      sub:c.reading||''};
    if(deck.type==='grammar')return {jp:c.point,   sub:''};
    return {jp:'?',sub:''};
  }
  function cardBack(c){
    if(deck.type==='kana')   return {main:c.romaji,  sub:''};
    if(deck.type==='kanji')  return {main:c.meaning,  sub:'On: '+c.on+' · Kun: '+c.kun};
    if(deck.type==='vocab')  return {main:c.en,       sub:c.reading};
    if(deck.type==='grammar')return {main:c.meaning,  sub:c.example};
    return {main:'',sub:''};
  }
  function groupTitle(key){
    if(deck.type==='kana'){
      var parts = key.split('|');
      var gLabel = {gojuon:'Basic (Gojuon)',dakuten:'Voiced (Dakuten)',combo:'Combinations (Yōon)'}[parts[0]]||parts[0];
      return parts[1] ? gLabel+' · '+parts[1]+'-row' : gLabel;
    }
    return key;
  }

  var grouped = groupCards();

  // ===== Tile renderer =====
  function renderTile(c){
    var level = Store.getLevel(c.id);
    var lbl   = cardLabel(c);
    var isSel = selectedCards.has(c.id);
    var selCls = selectMode ? (isSel ? ' selectable selected' : ' selectable') : '';
    var check  = (selectMode && isSel)
      ? '<div class="select-check">✓</div>' : '';
    return '<div class="card-tile '+level+selCls+'" data-id="'+c.id+'">'+
      check+
      '<div class="card-tile-jp">'+lbl.jp+'</div>'+
      (lbl.sub ? '<div class="card-tile-sub">'+lbl.sub+'</div>' : '')+
    '</div>';
  }

  // ===== Full render =====
  function render(){
    var cnt = Store.deckCounts(cards);
    var pct = Store.deckProgress(cards)*100;
    var earnedPts = cards.reduce(function(s,c){
      return s + (Store.POINTS[Store.getLevel(c.id)]||0);
    }, 0);
    var totalPts = cards.length;

    var groupsHtml = grouped.order.map(function(key, gidx){
      var gc  = grouped.groups[key];
      var allSel = gc.length > 0 && gc.every(function(c){ return selectedCards.has(c.id); });
      var catBtn = selectMode
        ? '<button class="cat-select-all" data-gidx="'+gidx+'" data-action="'+(allSel?'deselect':'select')+'">'+
            (allSel ? 'Deselect all' : 'Select all')+
          '</button>'
        : '';
      return '<div class="card-group">'+
        '<div class="card-group-title">'+groupTitle(key)+catBtn+'</div>'+
        '<div class="card-grid">'+gc.map(renderTile).join('')+'</div>'+
      '</div>';
    }).join('');

    var selCount = selectedCards.size;
    var html =
      '<div class="page-wide">'+
        '<div class="deck-header">'+
          '<a href="#/" class="text-muted text-sm">← Home</a>'+
          '<h1 class="mt-sm">'+deck.icon+' '+deck.name+'</h1>'+
          '<div class="progress-bar-header">'+
            '<span class="text-muted text-sm">'+Math.round(pct)+'% · '+earnedPts.toFixed(1)+' / '+totalPts+' pts</span>'+
          '</div>'+
          '<div class="mastery-bar">'+
            '<div class="mastery-bar-seg unknown"  style="width:'+((cnt.unknown/cards.length)*100).toFixed(1)+'%"></div>'+
            '<div class="mastery-bar-seg learning" style="width:'+((cnt.learning/cards.length)*100).toFixed(1)+'%"></div>'+
            '<div class="mastery-bar-seg familiar" style="width:'+((cnt.familiar/cards.length)*100).toFixed(1)+'%"></div>'+
            '<div class="mastery-bar-seg mastered" style="width:'+((cnt.mastered/cards.length)*100).toFixed(1)+'%"></div>'+
          '</div>'+
          '<div class="deck-summary">'+
            '<span><span class="dot dot-unknown"></span>Unknown '+cnt.unknown+'</span>'+
            '<span><span class="dot dot-learning"></span>Learning '+cnt.learning+'</span>'+
            '<span><span class="dot dot-familiar"></span>Familiar '+cnt.familiar+'</span>'+
            '<span><span class="dot dot-mastered"></span>Mastered '+cnt.mastered+'</span>'+
          '</div>'+
        '</div>'+
        '<div class="deck-controls">'+
          '<button class="btn-primary" id="start-practice">▶ Practice</button>'+
          '<button class="btn-secondary'+(selectMode?' select-active':'')+'" id="select-toggle">'+
            (selectMode ? '✕ Cancel' : '☑ Select')+
          '</button>'+
        '</div>'+
        groupsHtml+
        // Bottom action bar — visible whenever select mode is active
        '<div class="select-action-bar'+(selectMode?' visible':'')+'" id="select-action-bar">'+
          '<button class="btn-secondary btn-sm" id="select-all-btn">Select all</button>'+
          '<button class="btn-secondary btn-sm" id="deselect-all">Deselect all</button>'+
          '<div id="mark-section" class="'+(selCount===0?'hidden':'')+'" style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">'+
            '<span class="select-divider"></span>'+
            '<span class="text-muted text-sm" style="white-space:nowrap">Mark as:</span>'+
            ['unknown','learning','familiar','mastered'].map(function(lv){
              return '<button class="mastery-btn '+lv+'" data-mark="'+lv+'">'+cap(lv)+'</button>';
            }).join('')+
          '</div>'+
          '<span style="flex:1"></span>'+
          '<span class="select-count'+(selCount===0?' hidden':'')+'" id="select-count">'+selCount+' '+(selCount===1?'card':'cards')+' selected</span>'+
        '</div>'+
      '</div>';

    App.setContent(html);
    wireEvents();
  }

  // ===== In-place tile update (no full re-render) =====
  function updateTile(id){
    var el = document.querySelector('.card-tile[data-id="'+id+'"]');
    if(!el) return;
    var isSel = selectedCards.has(id);
    el.classList.toggle('selected', isSel);
    var check = el.querySelector('.select-check');
    if(isSel && !check){
      var div = document.createElement('div');
      div.className = 'select-check'; div.textContent = '✓';
      el.insertBefore(div, el.firstChild);
    } else if(!isSel && check){
      check.remove();
    }
  }

  function updateCategoryButtons(){
    grouped.order.forEach(function(key, gidx){
      var btn = document.querySelector('.cat-select-all[data-gidx="'+gidx+'"]');
      if(!btn) return;
      var gc = grouped.groups[key];
      var allSel = gc.length > 0 && gc.every(function(c){ return selectedCards.has(c.id); });
      btn.textContent = allSel ? 'Deselect all' : 'Select all';
      btn.dataset.action = allSel ? 'deselect' : 'select';
    });
  }

  function updateActionBar(){
    var bar     = document.getElementById('select-action-bar');
    var label   = document.getElementById('select-count');
    var markSec = document.getElementById('mark-section');
    if(!bar) return;
    var n = selectedCards.size;
    bar.classList.toggle('visible', selectMode);
    if(markSec) markSec.classList.toggle('hidden', n === 0);
    if(label){
      label.classList.toggle('hidden', n === 0);
      label.textContent = n+' '+(n===1?'card':'cards')+' selected';
    }
  }

  // ===== Event wiring =====
  function wireEvents(){
    // Practice — pass selected cards if in select mode
    document.getElementById('start-practice').addEventListener('click', function(){
      if(selectMode && selectedCards.size > 0){
        window._practiceSelection = Array.from(selectedCards);
      } else {
        window._practiceSelection = null;
      }
      Router.navigate('/practice/'+deck.id);
    });

    // Select mode toggle
    document.getElementById('select-toggle').addEventListener('click', function(){
      selectMode = !selectMode;
      if(!selectMode) selectedCards.clear();
      render();
    });

    // Card clicks
    document.querySelectorAll('.card-tile[data-id]').forEach(function(el){
      if(selectMode){
        el.addEventListener('click', function(){
          var id = el.dataset.id;
          if(selectedCards.has(id)) selectedCards.delete(id); else selectedCards.add(id);
          updateTile(id);
          updateCategoryButtons();
          updateActionBar();
        });
      } else {
        // Normal inline flip
        var id   = el.dataset.id;
        var card = cards.find(function(c){ return c.id===id; });
        if(!card) return;
        var flipped = false;
        var front = cardLabel(card);
        var back  = cardBack(card);
        el.addEventListener('click', function(){
          flipped = !flipped;
          if(flipped){
            el.classList.add('flipped');
            el.querySelector('.card-tile-jp').textContent = back.main;
            var sub = el.querySelector('.card-tile-sub');
            if(sub) sub.textContent = back.sub;
            else if(back.sub){ var s=document.createElement('div');s.className='card-tile-sub';s.textContent=back.sub;el.appendChild(s); }
          } else {
            el.classList.remove('flipped');
            el.querySelector('.card-tile-jp').textContent = front.jp;
            var sub2 = el.querySelector('.card-tile-sub');
            if(sub2) sub2.textContent = front.sub;
          }
        });
      }
    });

    // Category select-all / deselect-all
    document.querySelectorAll('.cat-select-all').forEach(function(btn){
      btn.addEventListener('click', function(){
        var gidx = parseInt(btn.dataset.gidx, 10);
        var gc   = grouped.groups[grouped.order[gidx]];
        if(btn.dataset.action === 'select'){
          gc.forEach(function(c){ selectedCards.add(c.id); });
        } else {
          gc.forEach(function(c){ selectedCards.delete(c.id); });
        }
        gc.forEach(function(c){ updateTile(c.id); });
        updateCategoryButtons();
        updateActionBar();
      });
    });

    // Mark selected cards
    document.querySelectorAll('[data-mark]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var level = btn.dataset.mark;
        selectedCards.forEach(function(id){
          var old = Store.getLevel(id);
          if(old !== level){
            Store.setLevel(id, level);
            Store.recordMove(id, old, level);
          }
        });
        selectedCards.clear();
        selectMode = false;
        render();
      });
    });

    // Select all (from action bar)
    var sa = document.getElementById('select-all-btn');
    if(sa) sa.addEventListener('click', function(){
      cards.forEach(function(c){ selectedCards.add(c.id); });
      cards.forEach(function(c){ updateTile(c.id); });
      updateCategoryButtons();
      updateActionBar();
    });

    // Deselect all (from action bar)
    var da = document.getElementById('deselect-all');
    if(da) da.addEventListener('click', function(){
      var prev = Array.from(selectedCards);
      selectedCards.clear();
      prev.forEach(updateTile);
      updateCategoryButtons();
      updateActionBar();
    });
  }

  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  render();
};
