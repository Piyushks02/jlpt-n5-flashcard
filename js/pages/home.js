/* Home page */
Pages = window.Pages || {};
Pages.home = function(){
  App.setFocusMode(false);
  var decks = App.getAllDecks();
  var overall = Store.overallProgress(decks);
  var overallTotalCards = 0, overallEarnedPts = 0;
  decks.forEach(function(d){
    overallTotalCards += d.cards.length;
    overallEarnedPts  += d.cards.reduce(function(s,c){
      return s + (Store.POINTS[Store.getLevel(c.id)]||0);
    }, 0);
  });

  function deckRow(deck){
    var pct  = Store.deckProgress(deck.cards) * 100;
    var cnt  = Store.deckCounts(deck.cards);
    var earnedPts = deck.cards.reduce(function(s,c){
      return s + (Store.POINTS[Store.getLevel(c.id)]||0);
    }, 0);
    var totalPts = deck.cards.length;
    return '<div class="deck-card" data-deck="'+deck.id+'">'+
      '<div class="deck-card-icon">'+deck.icon+'</div>'+
      '<div class="deck-card-info">'+
        '<div class="deck-card-name">'+deck.name+'</div>'+
        '<div class="deck-card-meta">'+deck.cards.length+' cards</div>'+
        '<div class="mastery-bar">'+
          '<div class="mastery-bar-seg unknown"  style="width:'+((cnt.unknown/deck.cards.length)*100).toFixed(1)+'%"></div>'+
          '<div class="mastery-bar-seg learning" style="width:'+((cnt.learning/deck.cards.length)*100).toFixed(1)+'%"></div>'+
          '<div class="mastery-bar-seg familiar" style="width:'+((cnt.familiar/deck.cards.length)*100).toFixed(1)+'%"></div>'+
          '<div class="mastery-bar-seg mastered" style="width:'+((cnt.mastered/deck.cards.length)*100).toFixed(1)+'%"></div>'+
        '</div>'+
        '<div class="progress-label">'+Math.round(pct)+'% · '+earnedPts.toFixed(1)+' / '+totalPts+' pts · '+cnt.mastered+' mastered</div>'+
      '</div>'+
      '<div class="deck-card-action">Practice →</div>'+
    '</div>';
  }

  var history = Store.getHistory();
  var activeDays = Object.keys(history).filter(function(k){ return history[k] && history[k].active; }).sort();
  var daysSinceStart = 0;
  if(activeDays.length){
    var first = new Date(activeDays[0]);
    daysSinceStart = Math.floor((new Date() - first) / 86400000) + 1;
  }

  var html = '<div class="page">'+
    '<div class="home-hero">'+
      '<h1>JLPT N5 Flashcards</h1>'+
      '<p class="text-muted text-sm">120-day study plan — track your progress below.'+
        (daysSinceStart > 0 ? ' &nbsp;·&nbsp; 📅 Day <strong>'+daysSinceStart+'</strong>' : '')+
      '</p>'+
      '<div class="mt-md">'+
        '<div class="progress-bar"><div class="progress-fill" style="width:'+(overall*100).toFixed(1)+'%"></div></div>'+
        '<div class="progress-label">Overall: '+Math.round(overall*100)+'% · '+overallEarnedPts.toFixed(1)+' / '+overallTotalCards+' pts</div>'+
      '</div>'+
    '</div>'+
    '<div class="deck-list">'+decks.map(deckRow).join('')+'</div>'+
    '<div class="mt-lg"><a href="#/calendar" class="text-muted text-sm">📅 View practice calendar →</a></div>'+
  '</div>';

  App.setContent(html);

  // wire deck clicks
  document.querySelectorAll('.deck-card[data-deck]').forEach(function(el){
    // "Practice →" goes to practice; anything else on the card goes to deck view
    el.querySelector('.deck-card-action').addEventListener('click', function(e){
      e.stopPropagation();
      Router.navigate('/practice/'+el.dataset.deck);
    });
    el.addEventListener('click', function(){
      Router.navigate('/deck/'+el.dataset.deck);
    });
  });
};
