// Navigation
document.getElementById('mobileToggle')?.addEventListener('click', () => {
  const nav = document.querySelector('.nav-links');
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  nav.style.flexDirection = 'column';
  nav.style.position = 'absolute';
  nav.style.top = '60px';
  nav.style.left = '0';
  nav.style.right = '0';
  nav.style.background = '#fff';
  nav.style.padding = '20px';
  nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
});

// Tier selector
document.querySelectorAll('.tier-option').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.tier-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('campaignTier').value = el.dataset.tier;
  });
});

// Form submission
document.getElementById('campaignForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  // Build the brief
  const brief = `# Property Brief — ${data.propertyAddress}\n\n` +
    `**Address:** ${data.propertyAddress}\n` +
    `**Price:** $${data.listingPrice}\n` +
    `**Bedrooms:** ${data.bedrooms}\n` +
    `**Bathrooms:** ${data.bathrooms}\n` +
    `**Square Feet:** ${data.sqft}\n` +
    `**Year Built:** ${data.yearBuilt}\n` +
    `**Property Type:** ${data.propertyType}\n` +
    `**Target Buyer:** ${data.targetBuyer}\n` +
    `**Agent Brand Voice:** ${data.brandVoice}\n` +
    `**Marketing Goal:** ${data.marketingGoal}\n` +
    `**Campaign Tier:** ${data.campaignTier}\n\n` +
    `**Key Features:**\n${data.keyFeatures}\n\n` +
    `**Special Notes:**\n${data.specialNotes}`;

  // Show success
  document.getElementById('formContent').style.display = 'none';
  const success = document.getElementById('formSuccess');
  success.style.display = 'block';

  // Here we'd normally POST to an API, but for now let's log
  console.log('Campaign request submitted:', data);
  console.log('Brief generated:', brief);
});

// Sample campaign viewer
function loadSample() {
  const samples = {
    strategy: 'Campaign Strategy & Buyer Avatar — shows positioning, target personas, channel plan',
    copy: 'MLS Copy Suite — 3 versions (short/medium/luxury) plus Zillow/Redfin/website/flyer versions',
    social: 'Social Media Pack — 10 hooks, 5 captions, 3 carousels, 3 Reels scripts, 2 Shorts, shot list',
    email: 'Email & SMS Follow-Up — 4-email sequence, open house reminders, price-drop alerts, FAQ templates',
    ads: 'Ad Angles — 5 complete ad sets (luxury/urgency/lifestyle/local/investment) with audience targeting',
    leads: 'Lead Capture System — 5 DM prompts with auto-response sequences, landing page, SMS opt-in, lead magnets',
    seller: 'Seller Report — professional weekly template with 9 sections + 3 scenario filler scripts'
  };
  console.log('Sample campaign loaded:', samples);
}

document.addEventListener('DOMContentLoaded', loadSample);
