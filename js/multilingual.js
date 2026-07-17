/**
 * @fileoverview Multilingual Module
 * @module multilingual
 */

'use strict';

/** Essential match-day phrases in multiple languages */
const PHRASEBOOK = {
  es: [
    { en: 'Where is my seat?', trans: '¿Dónde está mi asiento?' },
    { en: 'I need medical help', trans: 'Necesito ayuda médica' },
    { en: 'Where is the nearest exit?', trans: '¿Dónde está la salida más cercana?' },
    { en: 'Do you speak English?', trans: '¿Hablas inglés?' },
    { en: 'Where is the restroom?', trans: '¿Dónde está el baño?' },
    { en: 'I lost my ticket', trans: 'Perdí mi entrada' },
    { en: 'What time does it start?', trans: '¿A qué hora empieza?' },
    { en: 'I need wheelchair access', trans: 'Necesito acceso para silla de ruedas' },
  ],
  fr: [
    { en: 'Where is my seat?', trans: 'Où est mon siège?' },
    { en: 'I need medical help', trans: "J'ai besoin d'aide médicale" },
    { en: 'Where is the nearest exit?', trans: 'Où est la sortie la plus proche?' },
    { en: 'Do you speak English?', trans: 'Parlez-vous anglais?' },
    { en: 'Where is the restroom?', trans: 'Où sont les toilettes?' },
    { en: 'I lost my ticket', trans: "J'ai perdu mon billet" },
    { en: 'What time does it start?', trans: 'À quelle heure ça commence?' },
    { en: 'I need wheelchair access', trans: "J'ai besoin d'un accès fauteuil roulant" },
  ],
  ar: [
    { en: 'Where is my seat?', trans: 'أين مقعدي؟' },
    { en: 'I need medical help', trans: 'أحتاج إلى مساعدة طبية' },
    { en: 'Where is the nearest exit?', trans: 'أين أقرب مخرج؟' },
    { en: 'Do you speak English?', trans: 'هل تتحدث الإنجليزية؟' },
    { en: 'Where is the restroom?', trans: 'أين الحمام؟' },
    { en: 'I lost my ticket', trans: 'لقد فقدت تذكرتي' },
    { en: 'What time does it start?', trans: 'في أي وقت تبدأ؟' },
    { en: 'I need wheelchair access', trans: 'أحتاج إلى منفذ الكرسي المتحرك' },
  ],
  pt: [
    { en: 'Where is my seat?', trans: 'Onde fica meu assento?' },
    { en: 'I need medical help', trans: 'Preciso de ajuda médica' },
    { en: 'Where is the nearest exit?', trans: 'Onde fica a saída mais próxima?' },
    { en: 'Do you speak English?', trans: 'Você fala inglês?' },
    { en: 'Where is the restroom?', trans: 'Onde fica o banheiro?' },
    { en: 'I lost my ticket', trans: 'Perdi meu ingresso' },
    { en: 'What time does it start?', trans: 'A que horas começa?' },
    { en: 'I need wheelchair access', trans: 'Preciso de acesso para cadeira de rodas' },
  ],
  de: [
    { en: 'Where is my seat?', trans: 'Wo ist mein Platz?' },
    { en: 'I need medical help', trans: 'Ich brauche medizinische Hilfe' },
    { en: 'Where is the nearest exit?', trans: 'Wo ist der nächste Ausgang?' },
    { en: 'Do you speak English?', trans: 'Sprechen Sie Englisch?' },
    { en: 'Where is the restroom?', trans: 'Wo sind die Toiletten?' },
    { en: 'I lost my ticket', trans: 'Ich habe mein Ticket verloren' },
    { en: 'What time does it start?', trans: 'Wann fängt es an?' },
    { en: 'I need wheelchair access', trans: 'Ich brauche Rollstuhlzugang' },
  ],
  zh: [
    { en: 'Where is my seat?', trans: '我的座位在哪里？' },
    { en: 'I need medical help', trans: '我需要医疗帮助' },
    { en: 'Where is the nearest exit?', trans: '最近的出口在哪里？' },
    { en: 'Do you speak English?', trans: '你说英语吗？' },
    { en: 'Where is the restroom?', trans: '洗手间在哪里？' },
    { en: 'I lost my ticket', trans: '我丢了我的票' },
    { en: 'What time does it start?', trans: '什么时候开始？' },
    { en: 'I need wheelchair access', trans: '我需要轮椅通道' },
  ],
  ja: [
    { en: 'Where is my seat?', trans: '私の席はどこですか？' },
    { en: 'I need medical help', trans: '医療の助けが必要です' },
    { en: 'Where is the nearest exit?', trans: '最寄りの出口はどこですか？' },
    { en: 'Do you speak English?', trans: '英語を話しますか？' },
    { en: 'Where is the restroom?', trans: 'トイレはどこですか？' },
    { en: 'I lost my ticket', trans: 'チケットをなくしました' },
    { en: 'What time does it start?', trans: '何時に始まりますか？' },
    { en: 'I need wheelchair access', trans: '車椅子のアクセスが必要です' },
  ],
  hi: [
    { en: 'Where is my seat?', trans: 'मेरी सीट कहाँ है?' },
    { en: 'I need medical help', trans: 'मुझे चिकित्सा सहायता चाहिए' },
    { en: 'Where is the nearest exit?', trans: 'निकटतम निकास कहाँ है?' },
    { en: 'Do you speak English?', trans: 'क्या आप अंग्रेज़ी बोलते हैं?' },
    { en: 'Where is the restroom?', trans: 'शौचालय कहाँ है?' },
    { en: 'I lost my ticket', trans: 'मैंने अपना टिकट खो दिया' },
    { en: 'What time does it start?', trans: 'यह किस समय शुरू होता है?' },
    { en: 'I need wheelchair access', trans: 'मुझे व्हीलचेयर एक्सेस चाहिए' },
  ],
  ko: [
    { en: 'Where is my seat?', trans: '내 좌석이 어디에 있나요?' },
    { en: 'I need medical help', trans: '의료 도움이 필요합니다' },
    { en: 'Where is the nearest exit?', trans: '가장 가까운 출구는 어디인가요?' },
    { en: 'Do you speak English?', trans: '영어를 하시나요?' },
    { en: 'Where is the restroom?', trans: '화장실이 어디에 있나요?' },
    { en: 'I lost my ticket', trans: '티켓을 잃어버렸어요' },
    { en: 'What time does it start?', trans: '몇 시에 시작하나요?' },
    { en: 'I need wheelchair access', trans: '휠체어 접근이 필요합니다' },
  ],
};

/**
 * Loads the phrasebook for the selected language.
 * @param {string} lang - Language code
 */
function loadPhrases(lang) {
  const phrasebook = getEl('phrasebook');
  if (!phrasebook) return;

  const phrases = PHRASEBOOK[lang] || PHRASEBOOK['es'];
  phrasebook.innerHTML = '';

  phrases.forEach((phrase, i) => {
    const item = document.createElement('div');
    item.className = 'phrase-item';
    item.setAttribute('role', 'listitem');
    item.style.animationDelay = `${i * 0.05}s`;
    item.innerHTML = `
      <div>
        <div class="phrase-en">${sanitizeHTML(phrase.en)}</div>
        <div class="phrase-trans">${sanitizeHTML(phrase.trans)}</div>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="speakPhrase('${sanitizeHTML(phrase.trans)}')" aria-label="Speak: ${sanitizeHTML(phrase.trans)}">🔊</button>`;
    phrasebook.appendChild(item);
  });

  announceToScreenReader(`Phrasebook loaded in ${lang}.`);
}

/**
 * Speaks a phrase using the Web Speech API.
 * @param {string} text - Text to speak
 */
function speakPhrase(text) {
  if (!('speechSynthesis' in window)) {
    showToast('⚠️ Speech synthesis not supported in this browser', 'warning');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

/**
 * Translates text using AI.
 */
async function translateText() {
  const fromLang = getEl('trans-from-lang')?.value || 'en';
  const toLang = getEl('trans-to-lang')?.value || 'es';
  const inputText = sanitizeInput(getEl('trans-input')?.value || '', 1000);
  const resultEl = getEl('trans-result');
  const btn = getEl('translate-btn');

  if (!inputText) {
    showToast('⚠️ Please enter text to translate', 'warning');
    return;
  }
  if (!resultEl) return;

  if (btn) btn.disabled = true;

  try {
    const langNames = { en:'English', es:'Spanish', fr:'French', ar:'Arabic', pt:'Portuguese', de:'German', zh:'Chinese', ja:'Japanese', hi:'Hindi', ko:'Korean' };
    const prompt = `Translate the following text from ${langNames[fromLang] || fromLang} to ${langNames[toLang] || toLang}. Context: FIFA World Cup 2026 stadium environment. Provide only the translation, no explanation:\n\n"${inputText}"`;
    const response = await generateAIResponse(prompt, 'multilingual');

    resultEl.innerHTML = `
      <div class="result-heading">🌐 Translation (${langNames[toLang] || toLang})</div>
      <p style="font-size:1.1rem;font-weight:600;color:var(--text-primary)">${sanitizeHTML(response)}</p>
      <button class="btn btn-sm btn-ghost" onclick="speakPhrase('${sanitizeHTML(response)}')" style="margin-top:0.5rem">🔊 Speak Translation</button>`;
    resultEl.classList.add('visible');
    announceToScreenReader('Translation complete.');
  } catch (_) {
    resultEl.innerHTML = '<p>⚠️ Translation service temporarily unavailable. Please try again.</p>';
    resultEl.classList.add('visible');
  } finally {
    if (btn) btn.disabled = false;
  }
}

/**
 * Swaps the source and target languages.
 */
function swapLanguages() {
  const fromEl = getEl('trans-from-lang');
  const toEl = getEl('trans-to-lang');
  if (!fromEl || !toEl) return;

  const tmp = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = tmp;
  announceToScreenReader('Languages swapped.');
}

/**
 * Initializes the multilingual module.
 */
function initMultilingual() {
  loadPhrases('es'); // Default language

  const phraseLangEl = getEl('phrase-lang');
  if (phraseLangEl) {
    phraseLangEl.addEventListener('change', (e) => loadPhrases(e.target.value));
  }
}

// Expose globals
window.loadPhrases = loadPhrases;
window.speakPhrase = speakPhrase;
window.translateText = translateText;
window.swapLanguages = swapLanguages;
