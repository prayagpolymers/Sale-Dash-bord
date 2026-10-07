# Prayag CEO Dashboard V9 — Connected API

The Apps Script API URL is already configured in dashboard.js.

API:
https://script.google.com/macros/s/AKfycbwcLGd8IKvi5BSmXZoRD41rqctR7wIVbZDbK2uzcPwwjV7giXkqiaFAKqNuqsQgBd_r/exec

GitHub files:
- index.html
- style.css
- dashboard.js

No login screen.
No direct Google Sheet reads from the browser.
The dashboard calls the Apps Script Web App.

If the API shows an authorization error, open the Apps Script deployment and confirm:
Execute as: Me
Who has access: Anyone
Then redeploy as a new version.

The Apps Script Code.gs must be the V8 Code.gs supplied with the previous package.
