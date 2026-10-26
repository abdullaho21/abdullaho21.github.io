# abdullaho21.github.io

Personal site of Abdullah Alsuqayhi, computer engineer. Live at https://abdullaho21.github.io/

Static HTML, no build step. Edit `index.html` and push to `main`; GitHub Pages publishes it.

Before publishing, run `python3 scripts/check_site.py`, `node --check assets/site.js`
and `node --check assets/mesh.js`. GitHub Actions runs these checks on pull requests
and changes to `main`, covering local links, anchors, required page metadata,
duplicate IDs, image alt attributes and JavaScript syntax.
