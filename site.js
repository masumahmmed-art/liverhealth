/* LiverHealthHub site script — shared by every page */
function toggleNavGroup(btn){
  const group = btn.parentElement;
  const wasOpen = group.classList.contains('open');
  closeAllNavGroups();
  if(!wasOpen){ group.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
}
function closeAllNavGroups(){
  document.querySelectorAll('.nav-group').forEach(function(g){
    g.classList.remove('open');
    const b = g.querySelector(':scope > button');
    if(b) b.setAttribute('aria-expanded','false');
  });
}
document.addEventListener('click', function(e){
  if(!e.target.closest('.nav-group')) closeAllNavGroups();
});
function toggleDetail(btn){
  const d = btn.parentElement.nextElementSibling;
  d.classList.toggle('open');
  btn.textContent = d.classList.contains('open') ? 'Hide Details' : 'Learn More';
}
function setRegion(region, btn){
  document.querySelectorAll('.lh-region-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  let visibleCount = 0;
  document.querySelectorAll('#supplements [data-region]').forEach(function(card){
    const regions = card.getAttribute('data-region').split(' ');
    const show = (region === 'ALL' || regions.indexOf(region) !== -1);
    card.style.display = show ? '' : 'none';
    if(show) visibleCount++;
  });
  const emptyMsg = document.getElementById('regionEmptyMsg');
  if(emptyMsg) emptyMsg.style.display = (visibleCount === 0) ? 'block' : 'none';
  try{ localStorage.setItem('lhRegion', region); }catch(e){}
}
document.addEventListener('DOMContentLoaded', function(){
  let saved = 'ALL';
  try{ saved = localStorage.getItem('lhRegion') || 'ALL'; }catch(e){}
  const btn = document.querySelector('.lh-region-btn[data-region-filter="'+saved+'"]');
  setRegion(saved, btn);
});
function toggleCheck(item){
  item.classList.toggle('checked');
  const total = document.querySelectorAll('.lh-check-item').length;
  const checked = document.querySelectorAll('.lh-check-item.checked').length;
  document.getElementById('scoreNum').textContent = checked+'/'+total;
  document.getElementById('progFill').style.width = (checked/total*100)+'%';
  const labels = ['Great baseline — keep it up.','A few areas to watch.','Worth a conversation with your doctor.','Consider booking a liver check-up soon.'];
  const label = checked<=1?labels[0]:checked<=3?labels[1]:checked<=5?labels[2]:labels[3];
  document.getElementById('scoreLabel').textContent = label;
}
function runCalc(){
  const w = parseFloat(document.getElementById('calc-weight').value);
  const h = parseFloat(document.getElementById('calc-height').value)/100;
  const alc = parseInt(document.getElementById('calc-alcohol').value);
  const ex = parseInt(document.getElementById('calc-exercise').value);
  const diet = parseInt(document.getElementById('calc-diet').value);
  const dia = parseInt(document.getElementById('calc-diabetes').value);
  if(!w || !h){ alert('Please enter your weight and height.'); return; }
  const bmi = w/(h*h);
  let score = alc*2 + ex + diet + dia*2;
  if(bmi>=30) score += 3; else if(bmi>=25) score += 1.5;
  const result = document.getElementById('calc-result');
  result.classList.add('show');
  document.getElementById('calc-bmi').textContent = 'Estimated BMI: '+bmi.toFixed(1);
  let title, msg;
  if(score<4){ title='Lower Lifestyle Risk'; msg='Your habits align well with liver-protective patterns. Keep up regular movement and whole-food eating, and stick to routine check-ups.'; }
  else if(score<9){ title='Moderate Lifestyle Risk'; msg='A few factors could be adding strain on your liver. Small changes — more activity, less alcohol, less processed food — can meaningfully help. Consider a liver function test at your next check-up.'; }
  else { title='Higher Lifestyle Risk'; msg='Several factors here are linked to higher fatty-liver risk. This is not a diagnosis, but it is worth booking a liver function test (AST/ALT/GGT) and discussing your results with a doctor.'; }
  document.getElementById('calc-title').textContent = title;
  document.getElementById('calc-msg').textContent = msg;
}

/* Fatty Liver Index (FLI) calculator — Bedogni et al., BMC Gastroenterology 2006 */
(function(){
  const fliForm = document.getElementById('fli-form');
  if(!fliForm) return;
  fliForm.addEventListener('submit', function(e){
    e.preventDefault();
    const heightCm = parseFloat(document.getElementById('fli-height').value);
    const weightKg = parseFloat(document.getElementById('fli-weight').value);
    const waist = parseFloat(document.getElementById('fli-waist').value);
    const ggt = parseFloat(document.getElementById('fli-ggt').value);
    let trig = parseFloat(document.getElementById('fli-trig').value);
    const trigUnit = document.getElementById('fli-trig-unit').value;
    const fliFields = [
      {id:'fli-height', name:'Height', val:heightCm},
      {id:'fli-weight', name:'Weight', val:weightKg},
      {id:'fli-waist', name:'Waist circumference', val:waist},
      {id:'fli-ggt', name:'GGT', val:ggt},
      {id:'fli-trig', name:'Triglycerides', val:trig}
    ];
    const fliBadField = fliFields.find(function(f){ return isNaN(f.val) || f.val <= 0; });
    if(fliBadField){
      alert('Please enter a valid, positive number for "'+fliBadField.name+'" before calculating.');
      document.getElementById(fliBadField.id).focus();
      return;
    }
    if(trigUnit === 'mmoll'){ trig = trig * 88.5; } // convert mmol/L to mg/dL
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const x = 0.953*Math.log(trig) + 0.139*bmi + 0.718*Math.log(ggt) + 0.053*waist - 15.745;
    const fli = (Math.exp(x) / (1 + Math.exp(x))) * 100;
    const fliClamped = Math.min(100, Math.max(0, fli));

    document.getElementById('fli-scoreNum').textContent = fliClamped.toFixed(1);
    document.getElementById('fli-marker').style.left = fliClamped + '%';

    const pillEl = document.getElementById('fli-bandPill');
    const explainEl = document.getElementById('fli-explain');
    let band, pillBg, pillColor, explainClass, explainHtml;
    if(fliClamped < 30){
      band = 'Lower'; pillBg = 'var(--ps-bg)'; pillColor = 'var(--ps)'; explainClass = 'low';
      explainHtml = 'Your estimate of '+fliClamped.toFixed(1)+' falls in the lower range — this pattern is not typically associated with excess liver fat. <strong>This is not a diagnosis.</strong> Keep up routine check-ups, and mention this estimate to your doctor if you have any liver-related symptoms or concerns.';
    } else if(fliClamped < 60){
      band = 'Mixed'; pillBg = 'var(--wn-bg)'; pillColor = 'var(--wn)'; explainClass = 'mid';
      explainHtml = 'Your estimate of '+fliClamped.toFixed(1)+' falls in the mixed range (30–60) — on its own, this estimate can\'t say much either way. <strong>This is not a diagnosis.</strong> A conversation with a doctor about further testing is the best way to find out more.';
    } else {
      band = 'Higher'; pillBg = 'var(--dg-bg)'; pillColor = 'var(--dg)'; explainClass = 'high';
      explainHtml = 'Your estimate of '+fliClamped.toFixed(1)+' falls in the higher range — this pattern is more often seen in people with excess liver fat. <strong>This is not a diagnosis.</strong> Please discuss this estimate with a healthcare provider, who can arrange proper testing (such as an ultrasound) to find out what\'s actually going on.';
    }
    pillEl.textContent = band;
    pillEl.style.background = pillBg;
    pillEl.style.color = pillColor;
    explainEl.className = 'fli-explain ' + explainClass;
    explainEl.innerHTML = explainHtml;

    const resultsEl = document.getElementById('fli-results');
    resultsEl.classList.add('show');
    resultsEl.classList.remove('just-shown');
    void resultsEl.offsetWidth; // restart the highlight animation on repeat calculations
    resultsEl.classList.add('just-shown');
    resultsEl.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();

/* FIB-4 Index calculator — age-adjusted cutoffs per published liver-fibrosis research */
(function(){
  const fib4Form = document.getElementById('fib4-form');
  if(!fib4Form) return;
  const DISPLAY_MAX = 4.5;
  fib4Form.addEventListener('submit', function(e){
    e.preventDefault();
    const age = parseFloat(document.getElementById('fib4-age').value);
    const ast = parseFloat(document.getElementById('fib4-ast').value);
    const alt = parseFloat(document.getElementById('fib4-alt').value);
    const plt = parseFloat(document.getElementById('fib4-platelets').value);
    const fib4Fields = [
      {id:'fib4-age', name:'Age', val:age},
      {id:'fib4-ast', name:'AST', val:ast},
      {id:'fib4-alt', name:'ALT', val:alt},
      {id:'fib4-platelets', name:'Platelet count', val:plt}
    ];
    const fib4BadField = fib4Fields.find(function(f){ return isNaN(f.val) || f.val <= 0; });
    if(fib4BadField){
      alert('Please enter a valid, positive number for "'+fib4BadField.name+'" before calculating.');
      document.getElementById(fib4BadField.id).focus();
      return;
    }

    const score = (age * ast) / (plt * Math.sqrt(alt));
    const isOlder = age >= 65;
    const lowCutoff = isOlder ? 2.00 : 1.30;
    const highCutoff = 2.67;

    document.getElementById('fib4-scoreNum').textContent = score.toFixed(2);
    const markerPct = Math.min(100, Math.max(0, (score / DISPLAY_MAX) * 100));
    document.getElementById('fib4-marker').style.left = markerPct + '%';

    const lowPct = (lowCutoff / DISPLAY_MAX) * 100;
    const highPct = (highCutoff / DISPLAY_MAX) * 100;
    document.getElementById('fib4-meter').style.background = 'linear-gradient(to right, var(--ps) 0%, var(--ps) '+lowPct+'%, var(--wn) '+lowPct+'%, var(--wn) '+highPct+'%, var(--dg) '+highPct+'%, var(--dg) 100%)';
    document.getElementById('fib4-zoneMid').textContent = lowCutoff.toFixed(2) + ' · Mixed';
    document.getElementById('fib4-zoneHigh').textContent = highCutoff.toFixed(2) + ' · Higher';
    document.getElementById('fib4-zoneMax').textContent = DISPLAY_MAX + '+';

    const pillEl = document.getElementById('fib4-bandPill');
    const explainEl = document.getElementById('fib4-explain');
    let band, pillBg, pillColor, explainClass, explainHtml;
    if(score < lowCutoff){
      band = 'Lower'; pillBg = 'var(--ps-bg)'; pillColor = 'var(--ps)'; explainClass = 'low';
      explainHtml = 'Your estimate of '+score.toFixed(2)+' falls in the lower range — this pattern is not typically associated with advanced liver scarring (fibrosis). <strong>This is not a diagnosis.</strong> Keep up routine check-ups, and mention this estimate to your doctor if you have any liver-related symptoms or concerns.';
    } else if(score <= highCutoff){
      band = 'Mixed'; pillBg = 'var(--wn-bg)'; pillColor = 'var(--wn)'; explainClass = 'mid';
      explainHtml = 'Your estimate of '+score.toFixed(2)+' falls in the mixed range ('+lowCutoff.toFixed(2)+'–'+highCutoff.toFixed(2)+') — on its own, this estimate can\'t say much either way. <strong>This is not a diagnosis.</strong> A conversation with a doctor about further testing is the best way to find out more.';
    } else {
      band = 'Higher'; pillBg = 'var(--dg-bg)'; pillColor = 'var(--dg)'; explainClass = 'high';
      explainHtml = 'Your estimate of '+score.toFixed(2)+' falls in the higher range — this pattern is more often seen in people with more advanced liver scarring. <strong>This is not a diagnosis.</strong> Please discuss this estimate with a healthcare provider, who can arrange proper testing (such as imaging or a specialist referral) to find out what\'s actually going on.';
    }
    pillEl.textContent = band;
    pillEl.style.background = pillBg;
    pillEl.style.color = pillColor;
    explainEl.className = 'fli-explain ' + explainClass;
    explainEl.innerHTML = explainHtml;

    const ageNoteEl = document.getElementById('fib4-ageNote');
    ageNoteEl.textContent = isOlder
      ? 'Because you entered an age of 65 or older, the lower cutoff used above is 2.00 instead of 1.30 — the standard formula is known to be less precise in older adults, so the threshold is raised accordingly.'
      : 'Cutoffs shown above are for adults under 65. The lower cutoff rises to 2.00 (from 1.30) for those 65 and older, since the standard formula is less precise in older adults.';

    const resultsEl = document.getElementById('fib4-results');
    resultsEl.classList.add('show');
    resultsEl.classList.remove('just-shown');
    void resultsEl.offsetWidth; // restart the highlight animation on repeat calculations
    resultsEl.classList.add('just-shown');
    resultsEl.scrollIntoView({behavior:'smooth', block:'start'});
  });
})();
