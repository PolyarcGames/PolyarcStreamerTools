// Internationalization system
let i18nStrings = {};
let currentLanguage = 'en';

async function loadLanguage(lang) {
  try {
    const response = await fetch(`locales/${lang}.json`);
    if (!response.ok) throw new Error(`Failed to load language: ${lang}`);
    i18nStrings = await response.json();
    return true;
  } catch (error) {
    console.error('Error loading language file:', error);
    // Fallback to English if loading fails
    if (lang !== 'en') {
      return loadLanguage('en');
    }
    return false;
  }
}

async function changeLanguage(lang) {
  currentLanguage = lang;

  // Load the language file
  await loadLanguage(lang);

  // Update static elements with data-i18n attributes
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (i18nStrings[key]) {
      el.textContent = i18nStrings[key];
    }
  });

  // Save language preference
  localStorage.setItem('preferredLanguage', lang);
}

function getLocalizedText(key) {
  return i18nStrings[key] || key;
}
