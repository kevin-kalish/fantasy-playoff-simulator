# Fightin' Kali Demo V0

This is a zero-dependency, read-only dashboard for the weekly intelligence report.

## Run it

1. Generate the weekly report:
   `npm run fightin-kali:weekly -- data/private/fightin-kali-current.json 3`
2. Copy the private report into the demo payload:
   `npm run demo:build -- 3`
3. Start the local site:
   `npm run demo:serve`
4. Open `http://localhost:4173`.

The dashboard intentionally does not contain Yahoo credentials, JerryGM credentials, or other secrets. `demo/data.json` is generated locally from the weekly report and should be treated as demo output rather than a credential store.

Until a live Yahoo token is available, the weekly report can use the existing captured league snapshot. Projection trust/degraded status is displayed in the UI rather than hidden.
