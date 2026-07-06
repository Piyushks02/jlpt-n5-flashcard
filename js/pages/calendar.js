/* Calendar page */
Pages.calendar = function(){
  App.setFocusMode(false);

  var history = Store.getHistory();
  var session = Store.getSession();
  var prefs   = Store.getPrefs();

  // ===== Build ~182-day grid (26 weeks, ~6 months) =====
  function buildHeatmap(){
    var cells = [];
    var today = new Date();
    var todayDay = Store.getLogicalDay();
    for(var i=181; i>=0; i--){
      var d = new Date(today);
      d.setDate(d.getDate()-i);
      var key = d.toISOString().slice(0,10);
      var entry = history[key];
      cells.push({key:key, entry:entry, dow: d.getDay(), date:d});
    }
    return cells;
  }

  function intensity(entry){
    if(!entry) return -1;  // empty
    if(!entry.active) return -1;
    var pts = entry.pts||0;
    if(pts===0)      return 0;
    if(pts<0.5)      return 1;
    if(pts<2)        return 2;
    if(pts<5)        return 3;
    return 4;
  }

  var cells = buildHeatmap();

  // Group into columns (weeks), with Mon=0 padding
  var cols = [];
  var col = [];
  // pad first column with empty cells to align to Sunday start
  var firstDow = cells[0].date.getDay(); // 0=Sun
  for(var p=0;p<firstDow;p++) col.push(null);
  cells.forEach(function(cell){
    col.push(cell);
    if(col.length===7){ cols.push(col); col=[]; }
  });
  if(col.length) cols.push(col);

  // Month labels
  function monthLabel(cols){
    var labels = [];
    var lastMonth = -1;
    cols.forEach(function(col, ci){
      var firstReal = col.find(function(c){ return c; });
      if(firstReal){
        var m = firstReal.date.getMonth();
        if(m!==lastMonth){
          labels.push({ci:ci, label:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]});
          lastMonth=m;
        }
      }
    });
    return labels;
  }
  var mLabels = monthLabel(cols);

  // Render heatmap
  var dayAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var dayLabelsHtml = '<div class="heatmap-day-labels">';
  for(var d=0;d<7;d++) dayLabelsHtml += '<div style="height:13px;line-height:13px">'+dayAbbr[d].slice(0,1)+'</div>';
  dayLabelsHtml += '</div>';

  var colsHtml = cols.map(function(col){
    return '<div class="heatmap-col">'+
      col.map(function(cell){
        if(!cell) return '<div class="heatmap-cell"></div>';
        var iv = intensity(cell.entry);
        var cls = iv<0 ? 'heatmap-cell' : 'heatmap-cell active-'+iv;
        var hrs   = Store.getDayHours(cell.key);
        var title = cell.key +
          (cell.entry ? ' · '+(cell.entry.pts||0).toFixed(1)+' pts' : '') +
          (hrs > 0    ? ' · '+fmtHours(hrs) : '');
        return '<div class="'+cls+'" title="'+title+'"></div>';
      }).join('')+
    '</div>';
  }).join('');

  // Month label row
  var mlHtml = '<div class="heatmap-month-labels">';
  var cellW = 16; // 13px + 3px gap
  var leftOffset = 18; // day labels width
  mLabels.forEach(function(ml, i){
    var left = leftOffset + ml.ci*cellW;
    mlHtml += '<div style="position:absolute;left:'+left+'px">'+ml.label+'</div>';
  });
  mlHtml += '</div>';

  // ===== Session summary =====
  var viewedIds  = Object.keys(session.viewed||{});
  var viewedCount = viewedIds.length;
  var rawMoves = session.moves||[];

  // Compute net change per card (first-seen from → last-seen to), skip no-ops
  var _firstFrom = {}, _latestTo = {};
  rawMoves.forEach(function(mv){
    if(!_firstFrom[mv.id]) _firstFrom[mv.id] = mv.from;
    _latestTo[mv.id] = mv.to;
  });
  var netMoves = Object.keys(_latestTo)
    .filter(function(id){ return _firstFrom[id] !== _latestTo[id]; })
    .map(function(id){ return {id:id, from:_firstFrom[id], to:_latestTo[id]}; })
    .reverse(); // most-recent card first (Object.keys preserves insertion order)

  // Viewed cards list
  var viewedHtml = viewedCount ? viewedIds.map(function(id){
    var card  = _findCard(id);
    var label = card ? _cardLabel(card) : id;
    var level = Store.getLevel(id);
    return '<div class="move-item">'+
      '<span class="move-badge '+level+'">'+cap(level)+'</span>'+
      '<span>'+escHtml(label)+'</span>'+
    '</div>';
  }).join('') : '<div class="text-muted text-sm">No cards viewed yet this session.</div>';

  // Level changes list (net per card)
  var movesHtml = netMoves.length ? netMoves.slice(0,20).map(function(mv){
    var card = _findCard(mv.id);
    var label = card ? _cardLabel(card) : mv.id;
    return '<div class="move-item">'+
      '<span class="move-badge '+mv.to+'">'+cap(mv.to)+'</span>'+
      '<span>'+escHtml(label)+'</span>'+
      '<span style="margin-left:auto;display:flex;align-items:center;gap:.3rem">'+
        '<span class="text-muted" style="font-size:.75rem">from</span>'+
        '<span class="move-badge '+mv.from+'">'+cap(mv.from)+'</span>'+
      '</span>'+
    '</div>';
  }).join('') : '<div class="text-muted text-sm">No level changes yet this session.</div>';

  function _findCard(id){
    var all = App.getAllDecks();
    for(var i=0;i<all.length;i++){
      var c = all[i].cards.find(function(c){ return c.id===id; });
      if(c) return c;
    }
    return null;
  }
  function _cardLabel(c){
    if(c.kana)   return c.kana+' ('+c.romaji+')';
    if(c.kanji)  return c.kanji;
    if(c.jp)     return c.jp;
    if(c.point)  return c.point;
    return c.id;
  }

  // ===== Days since started =====
  var activeDays = Object.keys(history).filter(function(k){ return history[k] && history[k].active; }).sort();
  var daysSinceStart = 0;
  if(activeDays.length){
    var first = new Date(activeDays[0]);
    var now   = new Date();
    daysSinceStart = Math.floor((now - first) / 86400000) + 1;
  }

  var totalHrs = Store.getTotalHours();

  var html = '<div class="page">'+
    '<h1 class="fw-600" style="margin-bottom:1.5rem">Practice Calendar</h1>'+
    (daysSinceStart > 0
      ? '<p class="text-muted text-sm mt-sm" style="margin-bottom:1.5rem">'+
          '📅 Day <strong>'+daysSinceStart+'</strong> since you started learning'+
          (totalHrs > 0 ? ' &nbsp;·&nbsp; ⏱ <strong title="'+fmtHours(totalHrs)+'">'+totalHrs.toFixed(1)+'</strong> hrs total' : '')+
        '</p>'
      : '')+
    '<div class="calendar-section">'+
      '<h2>Last 6 months</h2>'+
      '<div style="display:flex;overflow-x:auto">'+
        dayLabelsHtml+
        '<div>'+
          '<div style="position:relative;height:18px;margin-bottom:.3rem">'+mlHtml+'</div>'+
          '<div class="heatmap-grid">'+colsHtml+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="text-muted text-sm mt-sm">Darker = more progress gained that day.</div>'+
    '</div>'+
    '<div class="calendar-section">'+
      '<h2>Today\'s session</h2>'+
      '<div class="session-summary">'+
        '<div class="session-stat"><span>Time today</span><span class="session-stat-val" title="'+fmtHours(Store.getTodayHours())+'">'+Store.getTodayHours().toFixed(1)+' hrs</span></div>'+
        '<div class="session-stat"><span>Cards viewed</span><span class="session-stat-val">'+viewedCount+'</span></div>'+
        '<div class="session-stat"><span>Level changes</span><span class="session-stat-val">'+netMoves.length+'</span></div>'+
        '<h3 class="mt-sm">Cards viewed</h3>'+
        '<div class="moves-list">'+viewedHtml+'</div>'+
        '<h3 class="mt-sm">Level changes</h3>'+
        '<div class="moves-list">'+movesHtml+'</div>'+
      '</div>'+
    '</div>'+
  '</div>';

  App.setContent(html);

  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmtHours(hrs){
    var totalMin = Math.round(hrs * 60);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if(h === 0) return m + 'm';
    return h + 'h ' + m + 'm';
  }
};
