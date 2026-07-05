/* Hash router */
var Router = (function(){
  var _routes = {};
  var _current = null;

  function on(pattern, handler){ _routes[pattern] = handler; }

  function _match(hash){
    for(var pat in _routes){
      var re = new RegExp('^' + pat.replace(/:[^/]+/g, '([^/]+)') + '$');
      var m = hash.match(re);
      if(m){
        var keys = (pat.match(/:[^/]+/g)||[]).map(function(k){ return k.slice(1); });
        var params = {};
        keys.forEach(function(k,i){ params[k] = m[i+1]; });
        return {handler: _routes[pat], params: params};
      }
    }
    return null;
  }

  function dispatch(){
    var hash = location.hash.replace(/^#/,'') || '/';
    var r = _match(hash);
    if(r){
      _current = hash;
      r.handler(r.params);
    } else {
      location.hash = '#/';
    }
  }

  function navigate(path){
    location.hash = '#' + path;
  }

  window.addEventListener('hashchange', dispatch);

  return { on:on, dispatch:dispatch, navigate:navigate };
})();
