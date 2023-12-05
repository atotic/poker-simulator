# poker-simulator

CURRENT
Use http-server
https://www.npmjs.com/package/http-server

TODO
	- installable as an app
	  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
		- run server as https: done, but with incorrect certificate authority
		- "theme_color": "orange", shows up as top bar
	- stats
	  - pre-flop stats
		- vs stats
		- highlow: how do we display: sweep
	- typescript usage
	- run stats as a thread
	- save status GUI
	- a11y
	- use state? https://sqlsync.dev/posts/stop-building-databases/
	- Reimplement using different frameworks:
	  - React https://lwc.dev/
		- Vue.js 
		- Lighting Web Components https://lwc.dev/. Noah Lawson
	
DONE
  12/Dec/23 button that circles through suits for mobile?
	- suit popup
  - toolbar happiness: hilo button, sync hole cards with hilo
	- click on deck to serve cards
	- poker table crowded
	- adjust graphics for small screen
	- drag-n-drop: should enlarge the card, give it shadow for that drag look
	- drag n drop: secret was to cancel drag by adding not passive event listener
	- view on iPhone http://192.168.1.46:8080/poker.html
	- poker engine works
  - drag n drop