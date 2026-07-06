/* Storage layer — all localStorage access goes through here */
var Store = (function(){
  var KEYS = {
    mastery:  'n5_mastery',
    history:  'n5_history',
    session:  'n5_session',
    prefs:    'n5_prefs',
    timelog:  'n5_timelog',
  };

  var POINTS = {unknown:0, learning:0.2, familiar:0.6, mastered:1.0};

  // --- raw helpers ---
  function load(key){
    try{ return JSON.parse(localStorage.getItem(key)||'null'); }catch(e){ return null; }
  }
  function save(key,val){ localStorage.setItem(key, JSON.stringify(val)); }

  // --- mastery ---
  var _mastery = null;
  function getMastery(){
    if(!_mastery) _mastery = load(KEYS.mastery) || {};
    return _mastery;
  }
  function setLevel(cardId, level){
    var m = getMastery();
    m[cardId] = level;
    save(KEYS.mastery, m);
    _markUnsaved();
    _emitChange();
  }
  function getLevel(cardId){ return getMastery()[cardId] || 'unknown'; }

  // --- prefs ---
  var _defaultPrefs = {
    theme: 'light',
    preset: 'ai-shu',
    resetHour: 5,
    resetMinute: 0,
    directions: {},   // deckId -> 'normal'|'reverse'
    shuffle: false,
  };
  var _prefs = null;
  function getPrefs(){
    if(!_prefs) _prefs = Object.assign({}, _defaultPrefs, load(KEYS.prefs)||{});
    return _prefs;
  }
  function setPref(key, val){
    var p = getPrefs();
    p[key] = val;
    save(KEYS.prefs, p);
  }

  // --- logical day boundary ---
  function _localDateStr(d){
    // Format as YYYY-MM-DD in LOCAL time (not UTC) so day boundaries match the user's clock
    return d.getFullYear()+'-'+
      String(d.getMonth()+1).padStart(2,'0')+'-'+
      String(d.getDate()).padStart(2,'0');
  }
  function getLogicalDay(date){
    var p = getPrefs();
    var d = date ? new Date(date) : new Date();
    var boundary = new Date(d);
    boundary.setHours(p.resetHour, p.resetMinute, 0, 0);
    if(d < boundary) d.setDate(d.getDate() - 1);
    return _localDateStr(d); // local date, not UTC
  }

  // --- session ---
  var _session = null;
  function getSession(){
    if(_session) return _session;
    var raw = load(KEYS.session);
    var today = getLogicalDay();
    if(raw && raw.day === today){
      _session = raw;
    } else {
      _session = {day: today, viewed: {}, moves: []};
      save(KEYS.session, _session);
    }
    return _session;
  }
  function markViewed(cardId){
    var s = getSession();
    s.viewed[cardId] = (s.viewed[cardId]||0) + 1;
    save(KEYS.session, s);
  }
  function recordMove(cardId, fromLevel, toLevel){
    var s = getSession();
    var pts = (POINTS[toLevel]||0) - (POINTS[fromLevel]||0);
    s.moves.push({id:cardId, from:fromLevel, to:toLevel, pts:pts, ts: Date.now()});
    save(KEYS.session, s);
    // update daily history
    _recordHistory(s.day, pts);
    _markUnsaved();
    _emitChange();
  }
  function resetSession(){
    var today = getLogicalDay();
    _session = {day: today, viewed: {}, moves: []};
    save(KEYS.session, _session);
  }

  // --- history (calendar) ---
  var _history = null;
  function getHistory(){
    if(!_history) _history = load(KEYS.history) || {};
    return _history;
  }
  function _recordHistory(day, pts){
    var h = getHistory();
    h[day] = h[day] || {pts:0, active:true};
    h[day].pts = parseFloat(((h[day].pts||0) + pts).toFixed(4));
    if(!h[day].active) h[day].active = true;
    save(KEYS.history, h);
  }
  function markActiveDay(){
    var day = getLogicalDay();
    var h = getHistory();
    h[day] = h[day] || {pts:0, active:true};
    h[day].active = true;
    save(KEYS.history, h);
    _history = h;
  }

  // --- time tracking ---
  var _timelog = null;
  function getTimelog(){
    if(!_timelog) _timelog = load(KEYS.timelog) || {};
    return _timelog;
  }
  function addTimeToday(seconds){
    if(seconds <= 0) return;
    var day = getLogicalDay();
    var tl = getTimelog();
    tl[day] = (tl[day]||0) + seconds;
    save(KEYS.timelog, tl);
  }
  function getDayHours(key){
    return (getTimelog()[key]||0) / 3600;
  }
  function getTodayHours(){
    return getDayHours(getLogicalDay());
  }
  function getTotalHours(){
    var tl = getTimelog();
    var secs = Object.keys(tl).reduce(function(s,k){ return s+(tl[k]||0); },0);
    return secs / 3600;
  }

  // --- progress calculations ---
  function deckProgress(cards){
    if(!cards||!cards.length) return 0;
    var total = cards.reduce(function(s,c){
      return s + (POINTS[getLevel(c.id)]||0);
    }, 0);
    return total / cards.length;
  }
  function overallProgress(allDecks){
    var totalPts=0, totalCards=0;
    allDecks.forEach(function(deck){
      totalCards += deck.cards.length;
      totalPts += deck.cards.reduce(function(s,c){
        return s + (POINTS[getLevel(c.id)]||0);
      },0);
    });
    return totalCards ? totalPts/totalCards : 0;
  }
  function deckCounts(cards){
    var out = {unknown:0,learning:0,familiar:0,mastered:0};
    cards.forEach(function(c){ out[getLevel(c.id)]++; });
    return out;
  }

  // --- export / import ---
  // Persist unsaved flag across reloads
  var _unsaved = !!localStorage.getItem('n5_unsaved');
  function _markUnsaved(){ _unsaved = true; try{ localStorage.setItem('n5_unsaved','1'); }catch(e){} }
  function hasUnsaved(){ return _unsaved; }
  function markSaved(){ _unsaved = false; localStorage.removeItem('n5_unsaved'); _emitChange(); }

  function exportData(){
    return {
      version: 1,
      mastery:  getMastery(),
      history:  getHistory(),
      prefs:    getPrefs(),
      timelog:  getTimelog(),
    };
  }
  function importData(obj){
    if(!obj||obj.version!==1) throw new Error('Invalid export file');
    _mastery = obj.mastery || {};
    _history = obj.history || {};
    _prefs   = Object.assign({}, _defaultPrefs, obj.prefs||{});
    _timelog = obj.timelog || {};
    save(KEYS.mastery, _mastery);
    save(KEYS.history, _history);
    save(KEYS.prefs,   _prefs);
    save(KEYS.timelog, _timelog);
    markSaved();
    _session = null; // let it re-init from today
    _emitChange();
  }

  // --- change listeners ---
  var _listeners = [];
  function onChange(fn){ _listeners.push(fn); }
  function _emitChange(){ _listeners.forEach(function(fn){ fn(); }); }

  return {
    POINTS: POINTS,
    getLevel: getLevel,
    setLevel: setLevel,
    getPrefs: getPrefs,
    setPref:  setPref,
    getLogicalDay: getLogicalDay,
    getSession: getSession,
    markViewed: markViewed,
    recordMove: recordMove,
    resetSession: resetSession,
    markActiveDay: markActiveDay,
    getHistory: getHistory,
    addTimeToday: addTimeToday,
    getDayHours:  getDayHours,
    getTodayHours: getTodayHours,
    getTotalHours: getTotalHours,
    deckProgress:    deckProgress,
    overallProgress: overallProgress,
    deckCounts:      deckCounts,
    hasUnsaved:  hasUnsaved,
    markSaved:   markSaved,
    exportData:  exportData,
    importData:  importData,
    onChange:    onChange,
  };
})();
