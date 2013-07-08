/* https://github.com/devsigner/smart_keys_js - inspired by smart on ffffound.com UI */
/* by Cedric Darricau - www.avantagegraphique.com */

var SmartKeys = function() {

  // settings
  var config = {
    nodeSelector:        '.smart-section .smart-higthlight',  // used to select each item on the page and place in the map (must be a link)
    prevPageSelector:    '.previous_page',            // link on this element should always jump to prev page a.prev_page (must be a link)
    nextPageSelector:    '.next_page',                // link on this element should always jump to next page a.next_page (must be a link)
    smartNavId:          'smart-keys-nav',            // dom id of the floating page smart element
    keyNext:             'j',                         // hot keys used
    keyPrev:             'k',
    keyNextPage:         'l',
    keyPrevPage:         'h',
    keyOpen:             'o',
    spaceArround:         50, 
    currentItemClass:    'smart-current',             // optional, class assigned to each element you jump to, set to null or remove to disable
    additionalBodyClass: 'smart-keys',                // this class is assigned to the page body on load
    bottomAnchor:        'bottom'                     // the name of the anchor (without #) at end of page, e.g. set on last post on the page
  };

  var item_map        = []
  var item_map_size   = 0;
  var asset_loaded    = false;
  var hot_key         = false;
  var disable_hot_key = false;
  var currentElement  = null;
  var currentPagging  = null;

  function getEl(selector) {
    return $(selector);
  }

  function addItemToMap(n) {
    var pos = $(n).offset();
    item_map.push({id: n.id, y: Math.round(pos.top) - 20});
  }

  function getScrollTop() {
    return $(window).scrollTop();
  }

  function isIE() {
    return $.browser.msie;
  }

  function isWebKit() {
    return $.browser.safari;
  }

  function isChrome() {
    return $.browser.chrome;
  }

  function init() {
    $(window).bind("load", setupSmartKeys);
    windowScrollInit();
  }

  function windowScrollInit() {
    $(window).scroll(function () {
      positionNav();
    });
  };

  function positionNav() {
    if($(config.pagingNavId))
      setNavCSS();
  }

  function setNavCSS() {
    pTop = getScrollTop() + 5;
    $('#'+config.smartNavId).css({display: 'block', top: pTop + 'px' });
  }


  function setupSmartKeys() {
    // TODO: escape/return when incompatible browser found
    var body = document.body;
    body.className = body.className ? body.className + (' '+config.additionalBodyClass) : config.additionalBodyClass;
    buildItemMap();
    setNavCSS();
    initHotKeys();
  }

  // 'prev' and 'next' are used to identify items and their position in the map
  function buildItemMap() {
    asset_loaded = false;

    var nodes = getEl(config.nodeSelector);
    item_map_size = nodes.length
    for (var i = 0; i < item_map_size; i++) {
      addItemToMap( nodes[i] );
    }

    // sort based on page Y postion
    //item_map.sort(function(a, b) {
    //  return a.y - b.y;
    //});

    asset_loaded = true;
  }
  
  // enable hotkeys
  function initHotKeys() {
    try {
      hot_key = new HotKey();
    }
    catch (e) {
      alert('Oops, smart_keys requires HotKeys.js (http://la.ma.la/blog/diary_200511041713.htm)');
      alert(e);
    }
    if (hot_key) {
      hot_key.add(config.keyNext,            function() { moveToItem(1);     });
      hot_key.add(config.keyPrev,            function() { moveToItem(-1);    });
      hot_key.add(config.keyNextPage,        function() { movePage(1);       });
      hot_key.add(config.keyPrevPage,        function() { movePage(-1);      });

      hot_key.add(config.keyOpen,            function() { openActive();      });
    }
  }

  function redirect(href) {
    /* fix IE */
    if (isIE()) {
      var a = document.createElement('a');
      a.style.display = 'none';
      a.href = href;
      document.body.appendChild(a);
      a.click();
    }
    else {
      location.href = href;
    }
  }

  function disableHotKeys() {
    if (hot_key) {
      disable_hot_key = true;
      hot_key.remove(config.keyNext);
      hot_key.remove(config.keyPrev);
      hot_key.remove(config.keyNextPage);
      hot_key.remove(config.keyPrevPage);
    }
  }

  function moveToItem(delta, p) {
    if (!asset_loaded)
      return false;
    
    if (currentPagging == null && p == null) {
      p = currentItem(delta);
    }

    else if( !isVisible( currentPagging ) ) {
      p = currentItem(delta);
    }

    else {
      
      var index = item_map.indexOf( currentPagging );

      
      index = index + delta

      if( index < 0 ) {
        movePagePrev();
        return false
      }
      else if( index > item_map_size - 1 ) {
        movePageNext();
        return false
      }
      
      p = item_map[ index ]
    }


    setCurrentPagging(p);

    return true;
  }

  function setCurrentPagging(p) {
    currentPagging = p;
    toggleCurrentElement( p.id );
    if( typeof($.scrollTo) === 'function' )
      $.scrollTo(p.y); // require zepto.scroll.js
    else
      window.scrollTo(0, p.y);
  }

  function currentItem(delta, screen_y) {
    
    var index = 0;

    if( currentPagging && isVisible( currentPagging ) ) {
      
      index = item_map.indexOf(currentPagging);
    }
    else {
      
      if (screen_y == null)
        screen_y = whereAmI().top;    

      var index = item_map_size - 1;
      var item_map_length = item_map.length;
      for (var i = 0; i < item_map_length; i++) {
        if (0 < delta) {
          if (screen_y < item_map[i].y) {
            index = i;
            break;
          }
        }
      }
    }

    index = Math.max(index, 0);
    p = item_map[index];

    return p;
  }

  function toggleCurrentElement(id) {
    getEl(config.nodeSelector).removeClass(config.currentItemClass);

    currentElement = $('#'+id);
    currentElement.addClass(config.currentItemClass);
  }

  function isVisible(p) {
    position = whereAmI();
    y = p.y + config.spaceArround ;
    value = y > position.top && y < position.bottom ;

    return value
  }



  // determine current position in the document based on viewport and scrolling
  function whereAmI() {
    var screen_top      = $(window).scrollTop(),
        screen_height   = $(window).height()
        screen_bottom   = screen_top + screen_height,
        document_height = $(document).height();

    return {
      'top':        screen_top,
      'height':     screen_height,
      'bottom':     screen_bottom,
      'is_at_top':  screen_top    == 0,
      'is_at_last': screen_bottom == document_height
    }
  }

  function openActive() {
    if ( currentElement.attr('href') )
      redirect( currentElement.attr('href') )
    else
      redirect( currentElement.find('a').first().attr('href') )
  }

  function movePage(delta) {
    var w = whereAmI();
    if (delta < 0) {
      if (w.is_at_top)
        movePagePrev();

      else if ( currentPagging && item_map[0] === currentPagging )
        movePagePrev();  

      else
        p = item_map[ 0 ]
    }
    else {
      if (w.is_at_last)
        movePageNext();

      else if ( currentPagging && item_map[item_map_size - 1] === currentPagging )
        movePageNext();

      else
        p = item_map[ item_map_size - 1 ]
        
    }
    setCurrentPagging(p);
  }

  function movePageNext() {
    if (getEl(config.nextPageSelector)[0]) {
      if (getEl(config.nextPageSelector)[0].href != null) {
        redirect(getEl(config.nextPageSelector)[0].href);
        disableHotKeys();
        return true;
      }
    }
    else { return false; }
  }

  function movePagePrev() {
    if (getEl(config.prevPageSelector)[0]) {
      if (getEl(config.prevPageSelector)[0].href != null) {
        redirect(getEl(config.prevPageSelector)[0].href+'#'+config.bottomAnchor);
        disableHotKeys();
        return true;
      }
    }
    else { return false; }
  }

  // return public pointers to the private methods and properties you want to reveal
  return {
    init:         init,
    moveToItem:   moveToItem,
    movePage:     movePage,
    currentItem:  currentItem,
    whereAmI:     whereAmI,
    config:       config,
    item_map:     item_map
  }
}();


if($('html.no-touch').length > 0 && $('.smart-section').length > 0) {
  SmartKeys.init();
};
