const $ = id => document.getElementById(id);
$('menu-button').onclick = () => $('menu-button').setAttribute('aria-expanded', String($('menu-button').getAttribute('aria-expanded') !== 'true'));
$('selected').onclick = () => $('selected').setAttribute('aria-pressed', String($('selected').getAttribute('aria-pressed') !== 'true'));
$('subscribe').onclick = () => {
  const valid = $('email').validity.valid && $('email').value.length > 0;
  $('email').setAttribute('aria-invalid', String(!valid));
  $('form-feedback').hidden = false;
  $('form-feedback').textContent = valid ? 'Success: you are subscribed.' : 'Error: enter a valid email address.';
};
$('add').onclick = () => {
  const article = document.createElement('article');
  article.innerHTML = '<h3>A newly added story</h3><p>This content arrived after the theme.</p><button>Read story</button>';
  $('dynamic').append(article);
};
$('navigate').onclick = () => { history.pushState({}, '', '/next'); $('article').querySelector('h2').textContent = 'A different chapter'; };
$('inline-update').onclick = () => { $('inline').style.backgroundColor = '#19112b'; $('inline').style.color = '#f0e0ff'; };
$('sheet-update').onclick = () => {
  const style = document.createElement('style'); style.textContent = ':root{--accent:#d555aa}aside{background-color:#12072a}'; document.head.append(style);
};
const sheet = new CSSStyleSheet(); sheet.replaceSync('.adopted-label{color:#244073;background:#f0f4fc}'); document.adoptedStyleSheets = [sheet];
const adopted = document.createElement('p'); adopted.className = 'adopted-label'; adopted.textContent = 'Constructable stylesheet content'; $('dynamic').append(adopted);
$('adopted-update').onclick = () => sheet.replaceSync('.adopted-label{color:#ffee88;background:#290017}');
const attach = host => {
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<style>:host{display:block;margin:16px 0}article{background:#def;color:#125;padding:12px}button{background:#125;color:white}</style><article><h3>Inside an open shadow root</h3><p>Expressive rules currently stop at this boundary.</p><button>Shadow action</button></article>';
};
attach($('shadow-host'));
$('new-shadow').onclick = () => { if (!$('later-shadow-host').shadowRoot) attach($('later-shadow-host')); };
$('open-dialog').onclick = () => $('dialog').showModal();
$('close-dialog').onclick = () => $('dialog').close();
