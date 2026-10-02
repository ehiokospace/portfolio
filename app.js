// Trial fonts are available only in the local preview.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = './local-fonts/fonts.css';
  document.head.append(fonts);
}
// Replace null destinations with your own URLs. Relative paths work on GitHub Pages.
const destinations = {
  Gallery: null, Resume: null,
  'Internal tooling case study': null,
  'AI mental health case study': null,
  'Course scheduling case study': null,
  'ColorStack community case study': null,
};
const dialog = document.querySelector('#notice');
document.querySelectorAll('[data-missing]').forEach(button => {
  button.addEventListener('click', () => {
    const label = button.dataset.missing;
    const url = destinations[label];
    if (url) { window.location.href = url; return; }
    document.querySelector('#notice-title').textContent = label;
    document.querySelector('#notice-body').textContent = label.includes('case study')
      ? 'This case study has not been added to the portfolio yet.'
      : label === 'Gallery' ? 'The gallery has not been added yet.'
      : 'This destination has not been connected yet.';
    dialog.showModal();
  });
});
dialog.addEventListener('click', event => { if(event.target === dialog) dialog.close(); });
function sizeArtwork() {
  const art = document.querySelector('.artboard');
  if (!art) return;
  art.style.transform = 'scale(' + art.parentElement.clientWidth / 478.5 + ')';
}
new ResizeObserver(sizeArtwork).observe(document.querySelector('.internal .media'));
sizeArtwork();

const heroVideo = document.querySelector('.hero-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updateHeroPlayback() {
  if (reducedMotion.matches) {
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
    heroVideo.load();
  } else {
    heroVideo.setAttribute('autoplay', '');
    heroVideo.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
  }
}
reducedMotion.addEventListener('change', updateHeroPlayback);
updateHeroPlayback();

// Use a city-level network estimate rather than requesting precise GPS coordinates.
const weatherLabel = document.querySelector('#viewer-weather');
function weatherDescription(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45,48].includes(code)) return 'Fog';
  if ([51,53,55,56,57].includes(code)) return 'Drizzle';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'Rain';
  if ([71,73,75,77,85,86].includes(code)) return 'Snow';
  if ([95,96,99].includes(code)) return 'Thunderstorms';
  return 'Current weather';
}
async function fetchJSON(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000), credentials: 'omit', referrerPolicy: 'no-referrer'
  });
  if (!response.ok) throw new Error('Lookup unavailable');
  return response.json();
}
async function updateViewerWeather() {
  try {
    let location;
    for (const url of ['https://ipinfo.io/json', 'https://ipwho.is/', 'https://ipapi.co/json/']) {
      try {
        const result = await fetchJSON(url);
        if (typeof result.loc === 'string') {
          [result.latitude, result.longitude] = result.loc.split(',').map(Number);
          result.country_code = result.country;
        }
        if (Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
          location = result; break;
        }
      } catch (error) { console.warn('City lookup:', error.message); }
    }
    if (!location) throw new Error('Location unavailable');
    if (typeof location.city === 'string' && location.city.trim()) {
      document.querySelector('#viewer-location').textContent = location.city.trim() + '.';
    }
    const fahrenheit = location.country_code === 'US';
    const params = new URLSearchParams({
      latitude: location.latitude.toFixed(1), longitude: location.longitude.toFixed(1),
      current: 'temperature_2m,weather_code', temperature_unit: fahrenheit ? 'fahrenheit' : 'celsius',
      timezone: 'auto'
    });
    const data = await fetchJSON('https://api.open-meteo.com/v1/forecast?' + params);
    if (!Number.isFinite(data.current?.temperature_2m)) throw new Error('Weather unavailable');
    weatherLabel.textContent = Math.round(data.current.temperature_2m) + '°' +
      (fahrenheit ? 'F' : 'C') + ' · ' + weatherDescription(data.current.weather_code);
  } catch {
    weatherLabel.textContent = 'Weather unavailable';
  }
}
updateViewerWeather();
setInterval(updateViewerWeather, 15 * 60 * 1000);

const copyEmailButton = document.querySelector('#copy-email');
let emailResetTimer;
copyEmailButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('ehigoko1@gmail.com');
    clearTimeout(emailResetTimer);
    copyEmailButton.querySelector('.email-label').textContent = 'COPIED!';
    copyEmailButton.classList.add('is-copied');
    emailResetTimer = setTimeout(() => {
      copyEmailButton.querySelector('.email-label').textContent = '04. Email';
      copyEmailButton.classList.remove('is-copied');
    }, 2000);
  } catch {
    document.querySelector('#notice-title').textContent = '04. Email';
    document.querySelector('#notice-body').textContent = 'Copy this address: ehigoko1@gmail.com';
    dialog.showModal();
  }
});

const descriptionButton = document.querySelector('#scramble-description');
const descriptions = ['DESIGNED AND CODED WITH ♥︎','ALWAYS BUILDING','DESIGNING FOR HUMANS','TRAVELING THE WORLD','TYPOGRAPHY ENTHUSIAST','SPARKING DELIGHT'];
let descriptionIndex = 0;
let scrambleFrame;
function scrambleDescription() {
  cancelAnimationFrame(scrambleFrame);
  descriptionIndex = (descriptionIndex + 1) % descriptions.length;
  const target = descriptions[descriptionIndex];
  descriptionButton.setAttribute('aria-label', target + '. Show another description');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { descriptionButton.textContent = target; return; }
  const start = performance.now();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:%$#*&@^?!';
  function animate(now) {
    const progress = Math.min((now - start) / 650, 1);
    const resolved = Math.floor(progress * target.length);
    descriptionButton.textContent = Array.from(target, (character, index) => character === ' ' || index < resolved ? character : characters[Math.floor(Math.random() * characters.length)]).join('');
    if (progress < 1) scrambleFrame = requestAnimationFrame(animate);
    else descriptionButton.textContent = target;
  }
  scrambleFrame = requestAnimationFrame(animate);
}
descriptionButton.addEventListener('pointerenter', scrambleDescription);
descriptionButton.addEventListener('focus', scrambleDescription);
descriptionButton.addEventListener('click', scrambleDescription);
