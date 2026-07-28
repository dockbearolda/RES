const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CODE = process.env.ADMIN_CODE || 'admin';
const WA = process.env.WHATSAPP || '590690000000';
const MAIL = process.env.EMAIL || 'votre@email.com';
fs.mkdirSync(DIR, { recursive: true });

app.use(express.json({ limit: '1mb' }));

// page principale : les coordonnees viennent des variables Railway
app.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  html = html.replace(/const WHATSAPP = "[^"]*"/, 'const WHATSAPP = "' + WA + '"')
             .replace(/const MON_EMAIL = "[^"]*"/, 'const MON_EMAIL = "' + MAIL + '"');
  res.type('html').send(html);
});

app.use(express.static('public'));

app.post('/api/reponses', (req, res) => {
  const nom = String(req.body.nom || 'client').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'client';
  fs.writeFileSync(path.join(DIR, Date.now() + '-' + nom + '.json'), JSON.stringify(req.body, null, 2));
  console.log('=== NOUVELLES REPONSES ===\n' + (req.body.texte || ''));
  res.json({ ok: true });
});

app.get('/admin', (req, res) => {
  if (req.query.code !== CODE) return res.status(401).send('Code requis : /admin?code=VOTRECODE');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (!files.length) return res.send('<meta charset="utf-8"><body style="font:16px system-ui;padding:40px">Aucune reponse pour le moment.</body>');
  const html = files.map(f => {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    return '<h2>' + f + '</h2><pre style="white-space:pre-wrap;background:#f5f5f5;padding:16px;border-radius:8px">' +
      String(d.texte || '').replace(/</g, '&lt;') + '</pre>';
  }).join('');
  res.send('<meta charset="utf-8"><body style="font:16px/1.5 system-ui;max-width:800px;margin:auto;padding:30px">' + html + '</body>');
});

app.listen(process.env.PORT || 3000);
