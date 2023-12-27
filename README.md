# poker-simulator

CURRENT

TODO
	- stats
	- better hilow stats:
		instead of scoop, give me win percentage
	  - pre-flop full stats
		- vs stats
	- better layout (iPhone curvature)
	- installable from github pages
	- typescript usage
	- run stats as a thread
	- save status GUI
	- a11y
	- use state? https://sqlsync.dev/posts/stop-building-databases/
	- Reimplement using different frameworks:
	  - React https://lwc.dev/
		- Vue.js 
		- Lighting Web Components https://lwc.dev/. Noah Lawson
	- prompt user to install offline if they use app offline
		https://stackoverflow.com/questions/51160348/pwa-how-to-programmatically-trigger-add-to-homescreen-on-ios-safari
DONE
	22-Dec-23 stats loading. Initialize UI from stats
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
	Use http-server https://www.npmjs.com/package/http-server
	poker engine works
  drag n drop

References
	manifest.json https://w3c.github.io/manifest/#display-member
