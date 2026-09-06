// === Mobile nav ===
document.getElementById('mobileToggle')?.addEventListener('click', () => {
  const nav = document.querySelector('.nav-links');
  const open = nav.style.display === 'flex';
  nav.style.display = open ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '60px';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = '#fff';
  nav.style.padding = '20px';
  nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
});

// === Tabs ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'leads') renderLeads();
  });
});

// === Helpers ===
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function slugify(s) {
  return String(s || 'business').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'business';
}
function stars(rating) {
  const r = parseFloat(rating) || 5;
  const full = Math.round(r);
  return '★'.repeat(Math.min(5, Math.max(0, full))) + '☆'.repeat(Math.max(0, 5 - full));
}

// === Generate the standalone client site HTML ===
function buildSiteHTML(d) {
  const services = d.services.split(',').map(s => s.trim()).filter(Boolean);
  const reviews = d.reviewQuotes.split('\n').map(s => s.trim()).filter(Boolean);
  const servicesHTML = services.map(s => `<li>${esc(s)}</li>`).join('');
  const reviewsHTML = reviews.map(r => {
    const parts = r.split('—');
    const quote = esc((parts[0] || r).trim());
    const author = parts[1] ? esc(parts[1].trim()) : 'Verified Google Review';
    return `<div class="rv-card"><p class="rv-stars">★★★★★</p><p class="rv-quote">"${quote}"</p><p class="rv-author">— ${author}</p></div>`;
  }).join('');
  const phoneHref = (d.phone || '').replace(/[^0-9+]/g, '');
  const mapsQuery = encodeURIComponent(`${d.name} ${d.address}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.name)} | ${esc(d.category)} in ${esc(d.city)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,'Segoe UI',Inter,sans-serif;color:#1a1a1a;line-height:1.6;background:#fafafa;}
  .wrap{max-width:960px;margin:0 auto;padding:0 20px;}
  header{background:#16181d;color:#fff;padding:18px 0;}
  header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .brand{font-weight:800;font-size:20px;}
  .call-btn{background:#FF6B35;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;}
  .hero{background:linear-gradient(135deg,#1a1a1a,#2a2a2a);color:#fff;padding:64px 0 56px;text-align:center;}
  .rating-badge{display:inline-block;background:rgba(255,255,255,.12);padding:8px 18px;border-radius:100px;font-size:14px;margin-bottom:18px;}
  .rating-badge b{color:#F7C948;}
  .hero h1{font-size:36px;font-weight:800;margin-bottom:14px;letter-spacing:-.5px;}
  .hero p{font-size:17px;opacity:.85;max-width:620px;margin:0 auto 28px;}
  .hero-ctas a{display:inline-block;margin:0 8px;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;}
  .cta-primary{background:#FF6B35;color:#fff;}
  .cta-secondary{background:transparent;border:2px solid #fff;color:#fff;}
  section{padding:56px 0;}
  h2.section-h{font-size:26px;font-weight:800;text-align:center;margin-bottom:30px;}
  .services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;}
  .service-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.06);text-align:center;font-weight:600;}
  .reviews-band{background:#fff4ec;}
  .rv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;}
  .rv-card{background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
  .rv-stars{color:#F7C948;font-size:16px;margin-bottom:8px;}
  .rv-quote{font-size:14px;color:#333;margin-bottom:10px;}
  .rv-author{font-size:13px;color:#888;font-weight:600;}
  .contact{background:#16181d;color:#fff;text-align:center;}
  .contact h2{color:#fff;}
  .contact p{opacity:.8;margin-bottom:24px;}
  .contact-info{font-size:15px;margin-bottom:6px;}
  footer{padding:24px 0;text-align:center;font-size:12px;color:#999;}
</style>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="brand">${esc(d.name)}</div>
      ${d.phone ? `<a class="call-btn" href="tel:${esc(phoneHref)}">📞 Call ${esc(d.phone)}</a>` : ''}
    </div>
  </header>

  <div class="hero">
    <div class="wrap">
      <div class="rating-badge">${stars(d.rating)} <b>${esc(d.rating)}</b> (${esc(d.reviewCount)} Google reviews)</div>
      <h1>${esc(d.city)}'s Trusted ${esc(d.category)}</h1>
      <p>${d.reviews.length ? esc((d.reviews.split('\n')[0] || '').split('—')[0].trim()) : 'Honest work, fair prices, and the reviews to prove it.'}</p>
      <div class="hero-ctas">
        ${d.phone ? `<a class="cta-primary" href="tel:${esc(phoneHref)}">Call Now</a>` : ''}
        <a class="cta-secondary" href="https://maps.google.com/?q=${mapsQuery}" target="_blank" rel="noopener">Get Directions</a>
      </div>
    </div>
  </div>

  <section>
    <div class="wrap">
      <h2 class="section-h">Our Services</h2>
      <div class="services-grid">${servicesHTML || '<div class="service-card">Full-Service Repair</div>'}</div>
    </div>
  </section>

  <section class="reviews-band">
    <div class="wrap">
      <h2 class="section-h">What Customers Say</h2>
      <div class="rv-grid">${reviewsHTML || '<div class="rv-card"><p class="rv-quote">Reviews coming soon.</p></div>'}</div>
    </div>
  </section>

  <section class="contact">
    <div class="wrap">
      <h2 class="section-h">Get In Touch</h2>
      <p>Stop by, call, or get directions — we're ready when you are.</p>
      ${d.phone ? `<div class="contact-info">📞 ${esc(d.phone)}</div>` : ''}
      ${d.address ? `<div class="contact-info">📍 ${esc(d.address)}</div>` : ''}
      ${d.phone ? `<a class="cta-primary" style="margin-top:16px;display:inline-block;" href="tel:${esc(phoneHref)}">Call Now</a>` : ''}
    </div>
  </section>

  <footer>Built by ShopFront AI — © 2026 ${esc(d.name)}</footer>
</body>
</html>`;
}

// === Outreach generators ===
function buildOutreach(d) {
  const owner = d.owner ? d.owner : 'there';
  const previewFile = `preview_${slugify(d.name)}.html`;
  const email =
`Subject: Quick site preview for ${d.name} (based on your ${d.rating}★ reviews)

Hi ${owner},

I noticed ${d.name} has a ${d.rating}★ rating from ${d.reviewCount} Google reviews${d.city ? ` in ${d.city}` : ''} — but no working website link on your Google Business Profile. That's costing you calls from people who search you up before contacting you.

I already built a free preview site for you (attached: ${previewFile}) using your actual rating and real customer reviews as the headline — nothing generic. Take a look, no obligation.

If you like it, I can have it live on your own domain by end of day for a flat $397 (or $97/mo if you'd rather we host and maintain it). If not, no worries at all — it's yours to keep either way.

Worth 2 minutes to take a look?

${owner === 'there' ? '' : '— '}`;

  const sms =
`Hi, this is about ${d.name}'s Google listing — saw your ${d.rating}★ (${d.reviewCount} reviews) but no website link. I built you a free preview site already, want me to text you the link?`;

  const call =
`OPENER: "Hi, is this ${owner === 'there' ? 'the owner' : owner}? I'm calling about ${d.name} — I help ${d.category.toLowerCase()}s in ${d.city || 'the area'} turn their Google reviews into an actual website."

HOOK: "You've got a ${d.rating}-star rating from ${d.reviewCount} reviews, but when I searched you up, there's no website link — just the phone number. I actually already built you a free preview using your real reviews so you can see exactly what it'd look like."

VALUE: "It's a one-page site — your rating and review count right at the top, your services listed, real customer quotes, click-to-call button. Takes people two seconds to trust you and call."

CLOSE: "Can I text you the preview link right now? No cost to look, and if you like it we can have it live today for $397 flat, or $97 a month if you want us to host and keep it updated."

OBJECTION — "I don't have time": "Totally get it — that's the point, it's already built. Just look when you get a sec."

OBJECTION — "How much again?": "$397 one-time, or $97/month if you'd rather not think about it — hosting, updates, all included. Either way you keep the files."`;

  return { email, sms, call, previewFile };
}

// === Leads storage ===
const LEADS_KEY = 'shopfront_leads';
function loadLeads() {
  try { return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); } catch (e) { return []; }
}
function saveLeads(leads) {
  try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); } catch (e) {}
}
function upsertLead(d) {
  const leads = loadLeads();
  const id = slugify(d.name) + '-' + slugify(d.city);
  const existing = leads.find(l => l.id === id);
  if (existing) {
    Object.assign(existing, { rating: d.rating, city: d.city });
  } else {
    leads.unshift({ id, name: d.name, city: d.city, rating: d.rating, status: 'Found', created: Date.now() });
  }
  saveLeads(leads);
}
function setLeadStatus(id, status) {
  const leads = loadLeads();
  const l = leads.find(x => x.id === id);
  if (l) { l.status = status; saveLeads(leads); renderLeads(); }
}
const STATUS_CYCLE = ['Found', 'Contacted', 'Replied', 'Closed'];
function nextStatus(s) {
  const i = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}
function renderLeads() {
  const body = document.getElementById('leadTableBody');
  if (!body) return;
  const leads = loadLeads();
  if (!leads.length) {
    body.innerHTML = '<tr><td colspan="5" style="color:#999;">No leads yet — generate a preview to add one.</td></tr>';
    return;
  }
  body.innerHTML = leads.map(l => `
    <tr>
      <td>${esc(l.name)}</td>
      <td>${esc(l.city || '')}</td>
      <td>${esc(l.rating || '')}★</td>
      <td><span class="status-pill status-${esc(l.status)}">${esc(l.status)}</span></td>
      <td><button class="mini-btn" data-advance="${esc(l.id)}">Next Stage →</button></td>
    </tr>
  `).join('');
  body.querySelectorAll('[data-advance]').forEach(btn => {
    btn.addEventListener('click', () => {
      const leads2 = loadLeads();
      const l = leads2.find(x => x.id === btn.dataset.advance);
      if (l) setLeadStatus(l.id, nextStatus(l.status));
    });
  });
}

// === Form wiring ===
document.getElementById('leadForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = {
    name: document.getElementById('bizName').value.trim() || 'Your Business',
    category: document.getElementById('bizCategory').value,
    city: document.getElementById('bizCity').value.trim(),
    rating: document.getElementById('bizRating').value.trim() || '4.9',
    reviewCount: document.getElementById('bizReviews').value.trim() || '0',
    phone: document.getElementById('bizPhone').value.trim(),
    address: document.getElementById('bizAddress').value.trim(),
    services: document.getElementById('bizServices').value.trim(),
    reviewQuotes: document.getElementById('bizReviewQuotes').value.trim(),
    owner: document.getElementById('ownerName').value.trim()
  };
  d.reviews = d.reviewQuotes;

  // Build site preview
  const html = buildSiteHTML(d);
  const frame = document.getElementById('siteFrame');
  frame.srcdoc = html;
  document.getElementById('previewFileName').textContent = `preview_${slugify(d.name)}.html`;
  frame.dataset.html = html;
  frame.dataset.filename = `preview_${slugify(d.name)}.html`;

  // Build outreach
  const out = buildOutreach(d);
  document.getElementById('outEmail').textContent = out.email;
  document.getElementById('outSms').textContent = out.sms;
  document.getElementById('outCall').textContent = out.call;

  // Track lead
  upsertLead(d);
  renderLeads();
});

document.getElementById('downloadSiteBtn')?.addEventListener('click', () => {
  const frame = document.getElementById('siteFrame');
  const html = frame.dataset.html;
  if (!html) { alert('Generate a preview first.'); return; }
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = frame.dataset.filename || 'preview.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const el = document.getElementById(btn.dataset.copy);
    const text = el.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    } catch (e) {
      alert('Copy failed — select the text manually.');
    }
  });
});

document.addEventListener('DOMContentLoaded', renderLeads);
