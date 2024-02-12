# poker-simulator

## TODO
  - need toast element https://duckduckgo.com/?q=javascript+toast+message&t=iphone&ia=web 
  - Usability
    - share a hand with others
    - process localstorage events
    - shake to undo?z
    - click on X twice to remove saved simulations (toaster shows this)
  - drag to delete stat 
    - Using view transitions for animation? https://codepen.io/dannymoerkerke/pen/ExMEPaW
  - drag to reorder stat
  - better layout (iPhone curvature)
  - run stats as a thread
  - Chromium: cannot create max-content size column. Is this because table_layout_types.cc:InlineLayoutFromStyle is setting CellInlineConstraint::is_constrained to false?
  - lets build and debug chromium. Set the breakpoint for max-content
  - typescript usage
  - a11y
  - use state? https://sqlsync.dev/posts/stop-building-databases/
  - Reimplement using different frameworks:
    - React https://lwc.dev/
    - Vue.js 
    - Lighting Web Components https://lwc.dev/. Noah Lawson
  - prompt user to install offline if they use app offline
    https://stackoverflow.com/questions/51160348/pwa-how-to-programmatically-trigger-add-to-homescreen-on-ios-safari

## INTERESTING

Super speedy hand evaluation algo. Might be interesting
https://web.archive.org/web/20120509001649/http://www.suffecool.net/poker/evaluator.html
https://senzee.blogspot.com/2007/01/7.html
https://github.com/mixu/perfect

Main page styles
https://css-tricks.com/snippets/css/complete-guide-grid/ 
Single DIV poker chips
https://codepen.io/pmk/pen/GgrJRq
Simple PWA starter kit
https://github.com/nikkifurls/simplepwa/blob/master/style.css

Poker odds
https://www.cardschat.com/poker/strategy/odds/
https://flopturnriver.com/poker-strategy/basic-poker-odds-19146/
Poker book resources:
https://www.holdemresources.net/docs
GTO explanations
https://www.runitonce.com/
Now defunct simulator manual http://propokertools.com/oracle_help/main

## DONE

7-Feb-24
- default target should be marked
- fix PLO scoring

23-Jan-24 
- installable from github pages

18-Jan-24
- when you make fewer players, try hard to keep existing filled in players
- improved stats display
- limit number of stored simulations to PokerStorage.MAX_STATS
- drag'n'drop usability improvements
  
27-Dec-23 vs mode: 
1) pokerEngine vsMode
2) simulate in vsMode
3) display results in vsMode

22-Dec-23 stats loading. Initialize UI from stats. Save stats list

22-Dec stats for high low

11-Dec-23 installed on iPhone simulator
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- run server as https: done, but with incorrect certificate authority
- icons
  - apple wants 1024.png
    https://developer.apple.com/design/human-interface-guidelines/app-icons#App-icon-sizes
  - windows wants 512.png as basic


7-Dec-23 service worker v1 done
  has test_serviceWorker.js. Cacheing strategy is network first. Preloads basics

2-Dec-23 button that circles through suits for mobile?

suit popup

toolbar happiness: hilo button, sync hole cards with hilo

click on deck to serve cards

poker table crowded

adjust graphics for small screen

drag-n-drop: should enlarge the card, give it shadow for that drag look

drag n drop: secret was to cancel drag by adding not passive event listener

view on iPhone http://192.168.1.46:8080/poker.html

21-Nov-23 Use http-server https://www.npmjs.com/package/http-server

17-Nov-23 poker engine works, high low scoring too

15-Nov-23 drag n drop

References
  manifest.json https://w3c.github.io/manifest/#display-member
