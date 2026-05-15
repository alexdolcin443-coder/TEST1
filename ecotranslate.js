// ── Speech Recognition API ──
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ── Advertencia de navegador incompatible ──
(function checkBrowser(){
  if(SR) return; // compatible — no mostrar nada
  const banner = document.getElementById('browserWarn');
  const text   = document.getElementById('bwText');
  const close  = document.getElementById('bwClose');
  if(!banner) return;

  // Detectar nombre del navegador actual
  const ua = navigator.userAgent;
  let name = 'Tu navegador';
  if(/Firefox/i.test(ua))       name = 'Firefox';
  else if(/Safari/i.test(ua) && !/Chrome/i.test(ua)) name = 'Safari';
  else if(/OPR|Opera/i.test(ua)) name = 'Opera';

  if(text) text.innerHTML =
    `<strong>${name}</strong> no es compatible con ECO TRANSLATE.<br>` +
    `Usa <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> para continuar.`;

  banner.classList.add('show');
  document.body.classList.add('has-bw');

  // Deshabilitar botones de inicio visualmente
  ['btnMic','btnTab'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn){
      btn.style.opacity = '0.3';
      btn.style.cursor  = 'not-allowed';
      btn.title = `${name} no es compatible. Usa Chrome o Edge.`;
    }
  });

  // Botón cerrar
  if(close) close.addEventListener('click', () => {
    banner.classList.remove('show');
    document.body.classList.remove('has-bw');
  });
})();

// ── DOM ──
const captionArea  = document.getElementById('captionArea');
const modeSelector = document.getElementById('modeSelector');
const parasInner   = document.getElementById('parasInner');
const parasOuter   = document.getElementById('parasOuter');
const scrollHint   = document.getElementById('scrollHint');
const paraCount    = document.getElementById('paraCount');
const backBtn      = document.getElementById('backBtn');
const dirHud       = document.getElementById('dirHud');
const langBadge    = document.getElementById('langBadge');
const wCount       = document.getElementById('wCount');
const wHud         = document.getElementById('wHud');
const stopBtn      = document.getElementById('stopBtn');
const muteBtn      = document.getElementById('muteBtn');
const muteLbl      = document.getElementById('muteLbl');
const tabLiveBtn   = document.getElementById('tabLiveBtn');
const clearBtn     = document.getElementById('clearBtn');
const restartBtn   = document.getElementById('restartBtn');
const notif        = document.getElementById('notif');
const sourceTag    = document.getElementById('sourceTag');
const modeLabel    = document.getElementById('modeLabel');
const micDot       = document.getElementById('micDot');
const lblLeft      = document.getElementById('lblLeft');
const lblRight     = document.getElementById('lblRight');
const btnMic       = document.getElementById('btnMic');
const btnTab       = document.getElementById('btnTab');
const langModePill = document.getElementById('langModePill');
const lmBtnEs      = document.getElementById('lmBtnEs');
const lmBtnEn      = document.getElementById('lmBtnEn');

const exportBtn       = document.getElementById('exportBtn');
const homeBtn         = document.getElementById('homeBtn');
const langToggleBtn   = document.getElementById('langToggleBtn');
const langToggleLbl   = document.getElementById('langToggleLbl');

// ── GO HOME: volver al landing y reiniciar sesión ──
function goHome(){
  // Detener todo si hay una sesión activa
  if(isRunning) stopAll(true);
  // Limpiar transcripción y estado
  clearAll();
  // Ocultar caption area y mostrar modo selector
  captionArea.classList.remove('show');
  langBadge.classList.remove('show');
  homeBtn.classList.remove('show');
  restartBtn.classList.remove('show');
  [stopBtn, muteBtn, tabLiveBtn].forEach(b => b && b.classList.remove('show'));
  if(langToggleBtn) langToggleBtn.classList.remove('show');
  langModePill.classList.remove('show');
  sourceTag.textContent = '';
  if(modeLabel) modeLabel.textContent = '—';
  muteBtn.classList.remove('muted'); muteLbl.textContent = 'MUTEAR';
  micDot.classList.remove('pause');
  micDot.style.display = '';
  stopBtn.classList.remove('paused');
  stopBtn.querySelector('span').textContent = 'DETENER';
  modeSelector.classList.remove('hide');
  modeSelector.scrollTo({ top: 0, behavior: 'instant' });
  // Mostrar footer de privacidad al regresar al menú
  const pf = document.getElementById('privacyFooter');
  if(pf) pf.style.display = 'flex';
  // Ocultar bottom bar
  const bb = document.getElementById('bottomBar');
  if(bb) bb.style.display = 'none';
  // Ocultar color picker en ACC
  const act = document.getElementById('accColorTitle');
  const acs = document.getElementById('accColorSection');
  if(act) act.style.display = 'none';
  if(acs) acs.style.display = 'none';

}

// ── LANGUAGE DEFINITIONS ──
const LANGUAGES = [
  { code:'es',    name:'Español',            locale:'es-US', flag:'🇪🇸' },
  { code:'en',    name:'English',            locale:'en-US', flag:'🇺🇸' },
  { code:'fr',    name:'Français',           locale:'fr-FR', flag:'🇫🇷' },
  { code:'de',    name:'Deutsch',            locale:'de-DE', flag:'🇩🇪' },
  { code:'it',    name:'Italiano',           locale:'it-IT', flag:'🇮🇹' },
  { code:'pt',    name:'Português',          locale:'pt-BR', flag:'🇧🇷' },
  { code:'ru',    name:'Русский',            locale:'ru-RU', flag:'🇷🇺' },
  { code:'ja',    name:'日本語',              locale:'ja-JP', flag:'🇯🇵' },
  { code:'ko',    name:'한국어',              locale:'ko-KR', flag:'🇰🇷' },
  { code:'zh-CN', name:'中文 (简体)',         locale:'zh-CN', flag:'🇨🇳' },
  { code:'ar',    name:'العربية',            locale:'ar-SA', flag:'🇸🇦' },
  { code:'nl',    name:'Nederlands',         locale:'nl-NL', flag:'🇳🇱' },
  { code:'pl',    name:'Polski',             locale:'pl-PL', flag:'🇵🇱' },
  { code:'tr',    name:'Türkçe',             locale:'tr-TR', flag:'🇹🇷' },
  { code:'hi',    name:'हिन्दी',             locale:'hi-IN', flag:'🇮🇳' },
  { code:'vi',    name:'Tiếng Việt',         locale:'vi-VN', flag:'🇻🇳' },
  { code:'th',    name:'ภาษาไทย',            locale:'th-TH', flag:'🇹🇭' },
  { code:'id',    name:'Bahasa Indonesia',   locale:'id-ID', flag:'🇮🇩' },
  { code:'uk',    name:'Українська',         locale:'uk-UA', flag:'🇺🇦' },
  { code:'sv',    name:'Svenska',            locale:'sv-SE', flag:'🇸🇪' },
  { code:'da',    name:'Dansk',              locale:'da-DK', flag:'🇩🇰' },
  { code:'fi',    name:'Suomi',              locale:'fi-FI', flag:'🇫🇮' },
  { code:'cs',    name:'Čeština',            locale:'cs-CZ', flag:'🇨🇿' },
  { code:'ro',    name:'Română',             locale:'ro-RO', flag:'🇷🇴' },
  { code:'hu',    name:'Magyar',             locale:'hu-HU', flag:'🇭🇺' },
  { code:'el',    name:'Ελληνικά',           locale:'el-GR', flag:'🇬🇷' },
  { code:'he',    name:'עברית',              locale:'he-IL', flag:'🇮🇱' },
  { code:'ca',    name:'Català',             locale:'ca-ES', flag:'🏳️'  },
  { code:'nb',    name:'Norsk',              locale:'nb-NO', flag:'🇳🇴' },
  { code:'ms',    name:'Bahasa Melayu',      locale:'ms-MY', flag:'🇲🇾' },
];

// ── State ──
let recognition    = null;
let isRunning      = false;
let isMuted        = false;
let tabStream      = null;
let micStream      = null;
let micAudioCtx    = null;
let currentRecLang = 'es-US';
let wordTotal      = 0;
let lastTranslated = '';
let retryDelay     = 400;
let notifTimer     = null;
let txAbort        = null;
let txDebounce     = null;

// Idioma fuente y destino seleccionados
let srcLang = LANGUAGES.find(l => l.code === 'es');
let tgtLang = LANGUAGES.find(l => l.code === 'en');

// Legacy compat (algunos refs internos)
let langMode = 'es';
let preferredRecLang = 'es';

// ── Cambio de idioma cooldown ──
let lastLangSwitch = 0;
const SWITCH_COOLDOWN = 850;

// ── Paragraph state ──
let paragraphs     = [];
let currentParaIdx = -1;
let pendingNewPara = false;
let silenceTimer   = null;
const SILENCE_MS   = 1700;

let isManualScroll = false;

// ── Función para obtener la clase de color del idioma destino ──
function getTxClass(code){
  if(code === 'es') return 'es-output';
  if(code === 'en') return 'en-output';
  return 'tx-output';
}

// ── Actualizar UI con los idiomas seleccionados ──
function applyLangUI(){
  // Actualizar headers de columnas
  if(lblLeft){
    lblLeft.textContent = srcLang.name.toUpperCase();
    lblLeft.className = 'col-header src-lbl';
  }
  if(lblRight){
    lblRight.textContent = tgtLang.name.toUpperCase();
    lblRight.className = 'col-header tgt-lbl';
  }
  // Actualizar HUD
  if(dirHud) dirHud.textContent = srcLang.code.toUpperCase() + ' → ' + tgtLang.code.toUpperCase();
  // Actualizar lang badge
  if(langBadge){
    langBadge.textContent = srcLang.code.slice(0,2).toUpperCase();
    langBadge.className = 'lang-badge show ' + (srcLang.code === 'en' ? 'en' : 'es');
  }
  // Compat legacy
  langMode = srcLang.code;
  preferredRecLang = srcLang.code;
  currentRecLang = srcLang.locale;
}

// ── Setear idiomas y arrancar reconocimiento ──
function setLanguages(src, tgt, skipRec){
  srcLang = src; tgtLang = tgt;
  applyLangUI();
  if(!skipRec && isRunning && !(isMuted && !tabStream)){
    startRec();
  }
}

// ── Intercambiar fuente y destino (Ctrl) ──
function swapLanguages(){
  const prev = srcLang;
  setLanguages(tgtLang, prev);
  clearAll();
  if(isRunning && !(isMuted && !tabStream)) startRec();
  showNotif(srcLang.name.toUpperCase() + ' → ' + tgtLang.name.toUpperCase(), 2500);
}

// Compat: setLangMode redirects to setLanguages
function setLangMode(mode, silent){
  if(mode === 'auto') mode = 'es';
  const src = LANGUAGES.find(l => l.code === mode) || LANGUAGES[0];
  const tgt = src.code === 'es' ? LANGUAGES.find(l=>l.code==='en') : LANGUAGES.find(l=>l.code==='es');
  setLanguages(src, tgt, silent);
}

lmBtnEs && lmBtnEs.addEventListener('click', () => setLangMode('es'));
lmBtnEn && lmBtnEn.addEventListener('click', () => setLangMode('en'));

langModePill.addEventListener('click', () => swapLanguages());

// Botón swap en bottom bar
if(langToggleBtn){
  langToggleBtn.addEventListener('click', () => swapLanguages());
}

// ── Notificaciones ──
function showNotif(msg, dur=3500){ /* notificaciones desactivadas */ }

// ── DETECCIÓN DE IDIOMA MEJORADA ──
// Normaliza acentos para que palabras como "también", "más", "están" sean detectadas
function normStr(t){
  return t.toLowerCase()
    .replace(/[áàãä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòõö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/[ñ]/g,'n');
}

// ── LÉXICO ESPAÑOL AMPLIADO + VOCABULARIO MÉDICO COMPLETO ──
const ES_RX = /\b(el|los|las|una|del|que|con|por|para|como|pero|mas|este|esta|estos|estas|hay|tengo|hola|gracias|bien|muy|soy|estan|son|tienen|porque|cuando|tambien|todo|puede|quiero|hacer|tiempo|vida|mundo|mucho|poco|donde|siempre|nunca|ahora|despues|antes|entre|sobre|hasta|desde|durante|mientras|aunque|sino|incluso|ademas|sin|solo|cada|otro|otra|yo|ella|nosotros|ellos|ellas|usted|ustedes|quien|cual|ese|eso|esa|fue|ser|estar|tener|decir|saber|querer|llegar|pasar|deber|poner|parecer|quedar|creer|hablar|llevar|dejar|seguir|encontrar|llamar|venir|pensar|salir|volver|tomar|conocer|vivir|sentir|tratar|mirar|contar|empezar|esperar|buscar|entrar|trabajar|escribir|perder|entender|pedir|recibir|recordar|terminar|permitir|aparecer|conseguir|comenzar|servir|sacar|necesitar|mantener|cambiar|crear|abrir|ganar|formar|traer|morir|aceptar|realizar|comprender|lograr|explicar|preguntar|reconocer|estudiar|nacer|correr|usar|valer|me|te|se|nos|le|les|mi|su|mis|sus|nuestro|nuestra|al|lo|ha|han|he|hemos|era|eran|estaba|estoy|estamos|fui|fuiste|fuimos|fueron|tenia|tienes|tiene|tenemos|hago|hace|hacemos|digo|dice|voy|vas|va|vamos|van|quiero|quieres|quiere|queremos|bueno|buena|buenos|malo|mala|grande|nuevo|nueva|primero|primera|segundo|ultima|todos|todas|nada|algo|alguien|nadie|hoy|ayer|luego|casi|tan|tanto|igual|varios|algunas|ninguno|aqui|alli|alla|pues|claro|entonces|oye|mira|dale|vale|chevere|listo|vaina|verdad|gente|cosa|vez|dia|mes|hora|parte|lugar|forma|tipo|caso|punto|nombre|grupo|hecho|nino|noche|tarde|semana|ciudad|minuto|letra|libro|ropa|carro|calle|tienda|escuela|iglesia|hospital|oficina|puerta|ventana|mesa|silla|cama|dinero|trabajo|familia|mama|papa|hermano|hermana|amigo|amiga|senor|senora|muchacho|muchacha|chico|chica|buenas|buenos dias|buenas noches|hasta luego|de nada|estoy|estamos|estaban|habla|hablo|hablamos|vamos a|hay que|tiene que|tengo que|quiero que|para que|a ver|tal vez|quizas|ojala|por supuesto|desde luego|lo que|lo mismo|eso es|eso si|nada mas|pero que|y que|o que|no hay|no es|si hay|aqui esta|donde esta|como esta|que tal|que paso|que es|que fue|quien es|cuando es|porque es|para eso|para mi|para el|para ella|estaba bien|muy bien|muy malo|bastante|dolor|fiebre|nauseas|vomito|mareo|desmayo|convulsion|temblor|fatiga|cansancio|debilidad|inflamacion|hinchazon|picazon|ardor|hormigueo|entumecimiento|rigidez|espasmo|sangrado|hemorragia|tos|disnea|ahogo|palpitaciones|taquicardia|bradicardia|hipertension|hipotension|vertigo|cefalea|migrana|insomnio|somnolencia|confusion|desorientacion|agitacion|ansiedad|depresion|alucinaciones|disfagia|acidez|reflujo|distension|estrenimiento|diarrea|incontinencia|disuria|hematuria|prurito|exantema|urticaria|edema|cianosis|ictericia|palidez|deshidratacion|sudoracion|corazon|pulmon|higado|rinon|cerebro|hueso|musculo|nervio|vena|arteria|sangre|piel|tejido|celula|organo|columna|vertebra|costilla|craneo|pelvis|femur|tibia|perone|humero|radio|cubito|clavicula|esternon|mandibula|rodilla|codo|hombro|tobillo|muneca|cadera|medula|torax|abdomen|membrana|cartilago|ligamento|tendon|fascia|traquea|esofago|estomago|intestino|colon|recto|vejiga|utero|ovario|testiculo|prostata|tiroides|suprarrenal|pancreas|bazo|vesicula|apendice|nodulo|medula osea|retina|cornea|coclea|cardiovascular|respiratorio|digestivo|nervioso|endocrino|inmune|musculoesqueletico|reproductivo|urinario|linfatico|diabetes|hipertension|cancer|tumor|carcinoma|leucemia|linfoma|asma|bronquitis|neumonia|tuberculosis|enfisema|fibrosis|infarto|angina|arritmia|insuficiencia|aterosclerosis|trombosis|embolia|derrame|ictus|epilepsia|alzheimer|parkinson|esclerosis|lupus|artritis|osteoporosis|escoliosis|hernia|apendicitis|colitis|gastritis|ulcera|cirrosis|hepatitis|pancreatitis|nefrolitiasis|hipotiroidismo|hipertiroidismo|anemia|hemofilia|sepsis|shock|meningitis|encefalitis|poliomielitis|influenza|dengue|malaria|vih|sida|infeccion|bacteria|virus|parasito|hongo|absceso|celulitis|psoriasis|eczema|melanoma|glaucoma|cataratas|conjuntivitis|otitis|rinitis|sinusitis|faringitis|amigdalitis|laringitis|endocarditis|pericarditis|miocarditis|vasculitis|fibromialgia|bipolar|esquizofrenia|autismo|demencia|hipotiroidismo|celiaca|crohn|colon irritable|cirugia|operacion|intervencion|biopsia|endoscopia|colonoscopia|laparoscopia|artroscopia|trasplante|dialisis|quimioterapia|radioterapia|inmunoterapia|angioplastia|bypass|cateterismo|ablacion|amputacion|colostomia|traqueotomia|intubacion|ventilacion|reanimacion|rcp|desfibrilacion|cardioversion|marcapasos|sutura|drenaje|puncion|aspiracion|irrigacion|vendaje|yeso|ferula|vacuna|transfusion|hemotransfusion|plasma|medicamento|farmaco|medicacion|tratamiento|terapia|pastilla|tableta|capsula|jarabe|suspension|inyeccion|ampolla|suero|solucion|crema|pomada|unguento|parche|inhalador|nebulizador|antibiotico|analgesico|antipiretico|antiinflamatorio|antihistaminico|antihipertensivo|antidiabetico|antidepresivo|ansiolitico|sedante|somnifero|diuretico|laxante|antiacido|broncodilatador|corticoide|inmunosupresor|anticoagulante|estatina|betabloqueante|inhibidor|hormona|insulina|metformina|aspirina|ibuprofeno|paracetamol|acetaminofen|morfina|codeina|tramadol|fentanilo|lidocaina|anestesia|profilaxis|dosis|sobredosis|contraindicacion|efecto secundario|interaccion|alergico|sensibilidad|tolerancia|dependencia|diagnostico|prueba|examen|analisis|laboratorio|resultado|muestra|histologia|citologia|radiografia|rayos|tomografia|resonancia|ecografia|ultrasonido|electrocardiograma|ekg|eeg|espirometria|ecocardiograma|densitometria|gammagrafia|scanner|contraste|medicion|valor|rango|normal|anormal|positivo|negativo|reactivo|cultivo|panel|diferencial|medico|doctor|doctora|enfermera|enfermero|cirujano|cirujana|especialista|internista|pediatra|cardiologo|neurologo|oncologo|ortopeda|traumatologo|ginecologo|obstetra|dermatologo|oftalmologo|otorrinolaringologo|urologo|nefrologo|hepatologo|gastroenterologo|neumólogo|reumatologo|endocrinologo|hematologo|infectologo|radiologo|patologo|anestesiologo|intensivista|farmaceutico|fisioterapeuta|nutricionista|psicologo|psiquiatra|trabajador social|emergencias|urgencias|guardia|unidad|uci|quirofano|consultorio|clinica|ambulancia|camilla|expediente|historia clinica|epicrisis|alta medica|referimiento|interconsulta|consentimiento|prognosis|pronostico|receta|formulario|seguro|cita|turno|ingreso|egreso|sala de espera|triage|signos vitales|tension arterial|frecuencia cardiaca|frecuencia respiratoria|temperatura|saturacion|oxigeno|glucosa|hemoglobina|plaquetas|leucocitos|eritrocitos|hematocrito|creatinina|urea|acido urico|colesterol|trigliceridos|albumina|bilirrubina|transaminasas|enzimas|hormona|anticuerpo|antigeno|inmunoglobulina|proteina|electrolito|sodio|potasio|calcio|magnesio|fosforo|cloro|bicarbonato|ph|gasometria|gram|cultivo|antibiograma|sensibilidad|resistencia|cepa|patogeno|microorganismo|microbioma|flora|esteril|aseptico|desinfeccion|esterilizacion|aislamiento|cuarentena|contagio|epidemia|pandemia|brote|zoonosis|vector|huesped|incubacion|periodo|transmision|prevencion|vacunacion|inmunizacion|herd immunity|cobertura|seroprevalencia|vigilancia|epidemiologia|salud publica|intervencion|cuidados paliativos|hospicio|terminal|cuidados intensivos|reanimacion cardiopulmonar|desfibrilador|monitor|ventilador|cateter|sonda|drena|vendaje|apósito|esteril|bioequivalente|generico|marca|principio activo|excipiente|via oral|via intravenosa|via intramuscular|via subcutanea|via topica|via inhalatoria|absorcion|distribucion|metabolismo|eliminacion|farmacocinetica|farmacodinamia|receptor|agonista|antagonista|sinergismo|antagonismo|interaccion medicamentosa|polifarmacia|adherencia|cumplimiento|seguimiento|control|monitoreo|ajuste|titulacion|suspension|discontinuacion|reaccion adversa|efecto indeseable|contraindicacion|precaucion|advertencia|caja negra|fda|cofepris|invima|cecmed|digemid)\b/gi;

// ── DETECCIÓN DE PREGUNTAS Y PUNTUACIÓN
// Detecta si una oración es una pregunta según palabras clave
function isQuestion(text){
  if(!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  
  // Palabras interrogativas en español
  const esQuestionWords = /^(qué|cómo|cuándo|dónde|por qué|adónde|cuál|cuáles|cuánto|cuánta|cuántos|cuántas|quién|quiénes|de quién|a quién|con quién)/;
  
  // Palabras interrogativas en inglés
  const enQuestionWords = /^(what|how|when|where|why|which|who|whom|whose|can|could|will|would|should|do|does|did|is|are|was|were|have|has|had)/;
  
  if(srcLang.code === 'es' && esQuestionWords.test(t)) return true;
  if(srcLang.code === 'en' && enQuestionWords.test(t)) return true;
  
  return false;
}

// Agrega signo de interrogación si está faltando
function addQuestionMark(text){
  if(!text || typeof text !== 'string') return text;
  const t = text.trim();
  
  // Si ya tiene signo de interrogación, no hacer nada
  if(t.endsWith('?') || t.endsWith('¿')) return text;
  
  // Si es una pregunta pero no tiene signo, agregar
  if(isQuestion(text)){
    // En español, agregar ¿ al inicio y ? al final
    if(srcLang.code === 'es' && !t.startsWith('¿')){
      return '¿' + t + '?';
    }
    // En inglés, solo agregar ? al final
    if(srcLang.code === 'en'){
      return t + '?';
    }
  }
  
  return text;
}

// ══════════════════════════════════════════════════════════════
// CORRECCIÓN FONÉTICA PARA INGLÉS NO NATIVO
// Normaliza palabras frecuentemente confundidas por pronunciación
// imperfecta, acentos fuertes o reconocimiento fonético cercano.
// ══════════════════════════════════════════════════════════════
// ── CORRECCIÓN FONÉTICA PARA ESPAÑOL
// Normaliza palabras frecuentemente confundidas por el reconocimiento de voz
function phoneticCorrectES(text){
  if(!text || typeof text !== 'string') return text;
  let t = text;
  
  // Palabras comunes confundidas frecuentemente
  t = t.replace(/\bcómo estás\b/gi, 'cómo estás'); // asegurar formato
  t = t.replace(/\bque tal\b/gi, 'qué tal');
  t = t.replace(/\bque pasa\b/gi, 'qué pasa');
  t = t.replace(/\bque es\b/gi, 'qué es');
  t = t.replace(/\bque hay\b/gi, 'qué hay');
  t = t.replace(/\bque haces\b/gi, 'qué haces');
  t = t.replace(/\ba donde\b/gi, 'adónde');
  t = t.replace(/\bd donde\b/gi, 'dónde');
  t = t.replace(/\bcuándo\b/gi, 'cuándo');
  t = t.replace(/\bcuando\b/gi, 'cuándo');
  
  // Contracciones y formas comunes
  t = t.replace(/\bpa\b/gi, 'para');
  t = t.replace(/\bpués\b/gi, 'pues');
  t = t.replace(/\bota\b/gi, 'otra');
  t = t.replace(/\bsi\b/gi, 'sí'); // diferenciar sí/si cuando sea posible
  
  // Corrección de mayúscula inicial
  t = t.replace(/^(\s*)([a-z])/, (m,sp,c) => sp + c.toUpperCase());
  
  return t;
}

// ── CORRECCIÓN FONÉTICA PARA INGLÉS (minimal)
// Solo corrige lo esencial sin alterar lo que se dice
function phoneticCorrectEN(text){
  // Sin correcciones — se muestra exactamente lo que el usuario dice
  return text;
}

// ── LÉXICO INGLÉS AMPLIADO + VOCABULARIO MÉDICO COMPLETO ──
const EN_RX = /\b(the|and|that|this|with|have|from|they|been|were|will|would|could|should|there|their|what|when|where|which|about|after|before|being|between|during|through|without|because|although|however|therefore|another|something|anything|everything|nothing|someone|anyone|everyone|nobody|everybody|already|always|never|often|sometimes|usually|really|actually|probably|definitely|basically|literally|obviously|clearly|certainly|generally|specifically|especially|particularly|currently|recently|finally|suddenly|quickly|slowly|easily|simply|truly|exactly|nearly|almost|quite|rather|whether|neither|either|unless|until|while|since|both|each|every|such|much|more|most|less|least|many|few|some|any|all|other|another|same|different|important|necessary|possible|available|various|several|certain|whole|entire|main|major|large|small|great|good|bad|new|old|young|first|last|next|best|worst|right|wrong|true|false|real|high|low|long|short|hard|easy|free|open|close|full|empty|clear|dark|light|fast|slow|strong|weak|hot|cold|warm|cool|early|late|soon|yet|still|just|even|also|too|very|so|well|then|now|here|please|thank|thanks|sorry|hello|goodbye|okay|sure|yes|absolutely|indeed|perhaps|maybe|likely|within|among|along|across|around|above|below|behind|beside|beyond|despite|except|instead|whereas|meanwhile|furthermore|moreover|otherwise|nevertheless|regardless|herself|himself|itself|myself|yourself|ourselves|themselves|enough|half|whatever|whichever|whoever|wherever|whenever|however|gonna|wanna|gotta|yeah|nope|yep|nah|hey|wow|hmm|like|ok|totally|seriously|honestly|pretty|fairly|extremely|incredibly|unfortunately|fortunately|apparently|essentially|fundamentally|primarily|largely|mostly|mainly|typically|normally|naturally|certainly|possibly|presumably|pain|fever|nausea|vomiting|dizziness|fainting|seizure|tremor|fatigue|weakness|swelling|redness|warmth|itching|burning|numbness|tingling|stiffness|spasm|bleeding|hemorrhage|cough|sputum|dyspnea|breathlessness|palpitations|tachycardia|bradycardia|hypertension|hypotension|tinnitus|vertigo|headache|migraine|insomnia|drowsiness|confusion|disorientation|agitation|anxiety|depression|hallucinations|dysphagia|heartburn|reflux|bloating|constipation|diarrhea|incontinence|dysuria|hematuria|rash|urticaria|edema|cyanosis|jaundice|pallor|dehydration|diaphoresis|sweating|shortness|breath|chest|pressure|tight|stabbing|throbbing|sharp|dull|aching|crushing|burning|radiating|intermittent|constant|acute|chronic|mild|moderate|severe|onset|duration|frequency|location|radiation|alleviating|aggravating|heart|lung|liver|kidney|brain|bone|muscle|nerve|vein|artery|blood|skin|tissue|cell|organ|spine|vertebra|rib|skull|pelvis|femur|tibia|fibula|humerus|radius|ulna|clavicle|sternum|mandible|knee|elbow|shoulder|ankle|wrist|hip|spinal|thorax|abdomen|membrane|cartilage|ligament|tendon|fascia|trachea|esophagus|stomach|intestine|colon|rectum|bladder|uterus|ovary|testis|prostate|thyroid|adrenal|pancreas|spleen|gallbladder|appendix|lymph|marrow|retina|cornea|cochlea|aorta|atrium|ventricle|mitral|aortic|tricuspid|pulmonary|coronary|carotid|femoral|jugular|subclavian|iliac|renal|hepatic|portal|mesenteric|cerebral|frontal|parietal|temporal|occipital|cerebellum|brainstem|hypothalamus|pituitary|hippocampus|tonsil|adenoid|thymus|spleen|lymph node|diabetes|hypertension|cancer|tumor|carcinoma|leukemia|lymphoma|asthma|bronchitis|pneumonia|tuberculosis|emphysema|fibrosis|infarction|angina|arrhythmia|insufficiency|atherosclerosis|thrombosis|embolism|stroke|epilepsy|alzheimer|parkinson|sclerosis|lupus|arthritis|osteoporosis|scoliosis|hernia|appendicitis|colitis|gastritis|ulcer|cirrhosis|hepatitis|pancreatitis|nephrolithiasis|hypothyroidism|hyperthyroidism|anemia|hemophilia|sepsis|shock|meningitis|encephalitis|polio|influenza|dengue|malaria|hiv|aids|infection|bacteria|virus|parasite|fungus|abscess|cellulitis|psoriasis|eczema|melanoma|glaucoma|cataracts|conjunctivitis|otitis|rhinitis|sinusitis|pharyngitis|tonsillitis|laryngitis|endocarditis|pericarditis|myocarditis|vasculitis|fibromyalgia|bipolar|schizophrenia|autism|dementia|adhd|celiac|crohn|gerd|barrett|obesity|metabolic|syndrome|covid|influenza|respiratory|cardiovascular|neurological|musculoskeletal|autoimmune|congenital|hereditary|genetic|acquired|infectious|inflammatory|degenerative|malignant|benign|surgery|operation|procedure|biopsy|endoscopy|colonoscopy|laparoscopy|arthroscopy|transplant|dialysis|chemotherapy|radiation|immunotherapy|angioplasty|bypass|catheterization|ablation|amputation|colostomy|tracheotomy|intubation|ventilation|resuscitation|cpr|defibrillation|cardioversion|pacemaker|suture|drainage|puncture|aspiration|irrigation|reduction|immobilization|bandage|cast|splint|injection|vaccination|transfusion|infusion|medication|drug|medicine|treatment|therapy|pill|tablet|capsule|syrup|suspension|serum|solution|cream|ointment|patch|inhaler|nebulizer|antibiotic|analgesic|antipyretic|anti-inflammatory|antihistamine|antihypertensive|antidiabetic|antidepressant|anxiolytic|sedative|diuretic|laxative|antiemetic|antacid|bronchodilator|corticosteroid|immunosuppressant|anticoagulant|statin|beta-blocker|inhibitor|hormone|insulin|metformin|aspirin|ibuprofen|acetaminophen|morphine|codeine|tramadol|fentanyl|lidocaine|anesthesia|prophylaxis|dosage|overdose|contraindication|side effect|interaction|allergy|sensitivity|tolerance|dependence|diagnosis|test|examination|analysis|laboratory|result|sample|histology|cytology|x-ray|tomography|mri|ultrasound|ecg|ekg|eeg|emg|spirometry|echocardiogram|densitometry|scan|contrast|measurement|value|range|normal|abnormal|positive|negative|reactive|culture|susceptibility|panel|workup|differential|physician|doctor|nurse|surgeon|specialist|internist|pediatrician|cardiologist|neurologist|oncologist|orthopedist|traumatologist|gynecologist|obstetrician|dermatologist|ophthalmologist|otolaryngologist|urologist|nephrologist|hepatologist|gastroenterologist|pulmonologist|rheumatologist|endocrinologist|hematologist|radiologist|pathologist|anesthesiologist|intensivist|resident|intern|attending|pharmacist|therapist|nutritionist|psychologist|psychiatrist|social worker|hospital|clinic|office|emergency|urgent|icu|ward|operating|pharmacy|ambulance|stretcher|chart|record|discharge|referral|consult|consent|prognosis|prescription|insurance|appointment|admission|triage|vital signs|blood pressure|heart rate|respiratory rate|temperature|saturation|oxygen|glucose|hemoglobin|platelets|white blood|red blood|hematocrit|creatinine|urea|uric acid|cholesterol|triglycerides|albumin|bilirubin|transaminase|enzyme|antibody|antigen|immunoglobulin|protein|electrolyte|sodium|potassium|calcium|magnesium|phosphorus|chloride|bicarbonate|ph|blood gas|gram stain|antibiogram|resistance|strain|pathogen|microorganism|microbiome|flora|sterile|aseptic|disinfection|sterilization|isolation|quarantine|contagion|epidemic|pandemic|outbreak|zoonosis|vector|host|incubation|transmission|prevention|immunization|coverage|seroprevalence|surveillance|epidemiology|public health|palliative|hospice|terminal|intensive|cardiopulmonary|defibrillator|monitor|ventilator|catheter|probe|drain|dressing|bioequivalent|generic|brand|active ingredient|oral|intravenous|intramuscular|subcutaneous|topical|inhalation|absorption|distribution|metabolism|elimination|pharmacokinetics|pharmacodynamics|receptor|agonist|antagonist|synergism|polypharmacy|adherence|compliance|monitoring|adjustment|titration|discontinuation|adverse reaction|contraindication|precaution|warning)\b/gi;

function detectLanguage(text){
  // Con idioma fuente explícito, siempre retornamos el código del srcLang
  return srcLang.code;
}

// ── UI Labels ──
function updateLangUI(lang){
  // lang param kept for compat but we use srcLang/tgtLang
  applyLangUI();
  if(currentParaIdx >= 0){
    const tr = document.getElementById(`para-trans-${currentParaIdx}`);
    if(tr) tr.className = 'para-right ' + getTxClass(tgtLang.code);
  }
}

// ── DICCIONARIO DE FRASES COMUNES PARA TRADUCCIÓN RÁPIDA ──
// Estas frases se traducen mejor manualmente que con servicios en línea
const PHRASE_DICT = {
  // Saludos y expresiones comunes
  'hola cómo estás': 'hello how are you',
  'hola como estás': 'hello how are you',
  'hola cómo estás?': 'hello how are you?',
  'hola como estás?': 'hello how are you?',
  'qué tal': 'what\'s up',
  'qué pasa': 'what\'s up',
  'qué hay': 'what\'s up',
  'buenos días': 'good morning',
  'buenas tardes': 'good afternoon',
  'buenas noches': 'good evening',
  'buenas noches': 'good night',
  'cómo estás': 'how are you',
  'como estás': 'how are you',
  'estoy bien': 'i\'m fine',
  'muy bien': 'very well',
  'más o menos': 'so so',
  'no muy bien': 'not very well',
  'te amo': 'i love you',
  'te quiero': 'i love you',
  'te extraño': 'i miss you',
  'muchas gracias': 'thank you very much',
  'muchas gracias': 'thank you so much',
  'de nada': 'you\'re welcome',
  'por favor': 'please',
  'disculpa': 'sorry',
  'lo siento': 'i\'m sorry',
  'que tengas un buen día': 'have a good day',
  'hasta luego': 'see you later',
  'hasta pronto': 'see you soon',
  'adiós': 'goodbye',
  'chao': 'bye',
  'cuéntame': 'tell me',
  'no entiendo': 'i don\'t understand',
  'no sé': 'i don\'t know',
  'creo que sí': 'i think so',
  'creo que no': 'i don\'t think so',
  'me encanta': 'i love it',
  'no me gusta': 'i don\'t like it',
  'está muy bueno': 'it\'s very good',
  'está muy malo': 'it\'s very bad',
  'me duele': 'it hurts',
  'tengo hambre': 'i\'m hungry',
  'tengo sed': 'i\'m thirsty',
  'tengo sueño': 'i\'m sleepy',
  'tengo frío': 'i\'m cold',
  'tengo calor': 'i\'m hot',
};

function translateWithDictionary(text, sl, tl){
  // Si es de es->en, buscar en diccionario
  if(sl === 'es' && tl === 'en'){
    const lower = text.toLowerCase().trim();
    for(const [es, en] of Object.entries(PHRASE_DICT)){
      if(lower === es){
        return en;
      }
      // También buscar como substring al final (oración completa)
      if(lower.endsWith(es) && (lower === es || lower[lower.length - es.length - 1] === ' ')){
        return en;
      }
    }
  }
  return null;
}
function createPara(lang='en'){
  const id = paragraphs.length;
  paragraphs.push({orig:'', trans:'', lang});
  currentParaIdx = id;

  const row   = document.createElement('div');
  row.className = 'para-row current';
  row.id = `para-row-${id}`;

  const left  = document.createElement('div');
  left.className = 'para-left';
  left.id = `para-orig-${id}`;
  left.innerHTML = ''; // Asegurar que está vacío

  const sep = document.createElement('div');
  sep.className = 'para-vsep';

  const right = document.createElement('div');
  right.className = 'para-right ' + getTxClass(tgtLang.code);
  right.id = `para-trans-${id}`;
  right.innerHTML = ''; // Asegurar que está vacío

  row.appendChild(left); row.appendChild(sep); row.appendChild(right);
  // Aplicar el tamaño de letra actual si se cambió
  if(typeof currentFontScale !== 'undefined' && currentFontScale !== 1){
    left.style.fontSize = `clamp(${Math.round(24*currentFontScale)}px,${(3.8*currentFontScale).toFixed(1)}vw,${Math.round(54*currentFontScale)}px)`;
    right.style.fontSize = `clamp(${Math.round(24*currentFontScale)}px,${(3.8*currentFontScale).toFixed(1)}vw,${Math.round(54*currentFontScale)}px)`;
  }
  // Click en cualquier parte de la fila = copiar párrafo al portapapeles
  row.style.cursor = 'pointer';
  row.title = 'Clic para copiar';
  row.addEventListener('click', () => {
    const p = paragraphs[id];
    if(!p) return;
    const txt = [p.orig, p.trans].filter(Boolean).join('\n');
    if(!txt) return;
    navigator.clipboard.writeText(txt).then(() => {
      row.classList.add('copy-flash');
      setTimeout(() => row.classList.remove('copy-flash'), 600);
      showNotif('COPIADO ✓', 1800);
    }).catch(() => showNotif('ERROR AL COPIAR', 2000));
  });
  parasInner.appendChild(row);
  refreshParaAges();
  updateParaCount();
  autoScrollToBottom();
  return id;
}

function refreshParaAges(){
  const rows = parasInner.querySelectorAll('.para-row');
  const n = rows.length;
  rows.forEach((row, i) => {
    const age = n - 1 - i;
    row.className = 'para-row';
    if(age === 0) row.classList.add('current');
    else if(age === 1) row.classList.add('age-1');
    else row.classList.add('age-old');
  });
}

function updateParaCount(){
  const n = paragraphs.length;
  paraCount.textContent = n > 1 ? `${n} PÁRR` : '';
}

function getCurrentOrigEl(){  return currentParaIdx >= 0 ? document.getElementById(`para-orig-${currentParaIdx}`) : null; }
function getCurrentTransEl(){ return currentParaIdx >= 0 ? document.getElementById(`para-trans-${currentParaIdx}`) : null; }

// ── Scroll ──
function autoScrollToBottom(){
  // Solo auto-scroll si estamos al final o casi al final (menos de 100px del final)
  // De esta forma respeta cuando el usuario ha scrolleado arriba manualmente
  const nearBottom = parasInner.scrollTop >= parasInner.scrollHeight - parasInner.clientHeight - 100;
  if(!isManualScroll && nearBottom){
    parasInner.scrollTop = parasInner.scrollHeight;
  }
  updateScrollUI();
}
function updateScrollUI(){
  const atBottom = parasInner.scrollTop >= parasInner.scrollHeight - parasInner.clientHeight - 40;
  const hasAbove = parasInner.scrollTop > 30;
  scrollHint.classList.toggle('show', hasAbove);
  backBtn.classList.toggle('show', isManualScroll);
  parasInner.classList.toggle('history-mode', isManualScroll);
}

captionArea.addEventListener('wheel', (e) => {
  if(e.target.closest('.lang-picker')) return;
  e.preventDefault(); 
  parasInner.scrollTop += e.deltaY;
  // Si el usuario scrollea hacia arriba (o muy lejos del final), activar modo manual
  const nearBottom = parasInner.scrollTop >= parasInner.scrollHeight - parasInner.clientHeight - 100;
  isManualScroll = !nearBottom;
  updateScrollUI();
}, {passive:false});

parasOuter.addEventListener('wheel', (e) => {
  if(e.target.closest('.lang-picker')) return;
  e.preventDefault(); 
  parasInner.scrollTop += e.deltaY;
  // Si el usuario scrollea hacia arriba (o muy lejos del final), activar modo manual
  const nearBottom = parasInner.scrollTop >= parasInner.scrollHeight - parasInner.clientHeight - 100;
  isManualScroll = !nearBottom;
  updateScrollUI();
}, {passive:false});

parasInner.addEventListener('scroll', () => {
  // Si vuelven al final, desactivar modo manual
  if(parasInner.scrollTop >= parasInner.scrollHeight - parasInner.clientHeight - 100) isManualScroll = false;
  updateScrollUI();
});

backBtn.addEventListener('click', () => {
  isManualScroll = false;
  parasInner.scrollTop = parasInner.scrollHeight;
  updateScrollUI();
});

// ── Clear ──
function clearAll(){
  paragraphs = []; currentParaIdx = -1; pendingNewPara = false;
  wordTotal = 0; lastTranslated = '';
  clearTimeout(silenceTimer); isManualScroll = false;
  parasInner.innerHTML = '';
  wCount.textContent = '0 PALABRAS'; wHud.textContent = '0 W';
  updateParaCount(); updateScrollUI();
}

// ── Traducción — cascada sin API key ──
// Nivel 1: MyMemory  (API oficial y gratuita — la más estable sin clave)
// Nivel 2: Google gtx  (endpoint no oficial, muy confiable como respaldo)
// Nivel 3: Lingva Translate  (proxy open-source de Google Translate)

async function tryMyMemory(chunk, sl, tl, sig){
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sl}|${tl}`,
    { signal: sig }
  );
  if(!res.ok) return null;
  const d = await res.json();
  if(d.responseStatus === 200 && d.responseData?.translatedText){
    const tx = d.responseData.translatedText.trim();
    if(tx && !tx.startsWith('MYMEMORY WARNING')) return tx;
  }
  return null;
}

async function tryGtx(chunk, sl, tl, sig){
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(chunk)}`;
  const res  = await fetch(url, { signal: sig });
  if(!res.ok) return null;
  const d = await res.json();
  if(d && d[0]){
    const result = d[0].map(s => s?.[0] || '').join('').trim();
    if(result) return result;
  }
  return null;
}

async function tryLingva(chunk, sl, tl, sig){
  const res = await fetch(
    `https://lingva.ml/api/v1/${sl}/${tl}/${encodeURIComponent(chunk)}`,
    { signal: sig }
  );
  if(!res.ok) return null;
  const d = await res.json();
  return d?.translation?.trim() || null;
}

async function translateNow(text){
  if(txAbort){ txAbort.abort(); txAbort = null; }
  const ctrl = new AbortController(); txAbort = ctrl;
  const sig  = ctrl.signal;
  const sl   = srcLang.code;
  const tl   = tgtLang.code;

  if(sl === tl){
    const el = getCurrentTransEl();
    if(el) el.textContent = '—';
    return;
  }

  // Intentar diccionario primero
  const dictResult = translateWithDictionary(text, sl, tl);
  if(dictResult){
    const el = getCurrentTransEl();
    if(el && !sig.aborted) el.textContent = dictResult;
    if(currentParaIdx >= 0) paragraphs[currentParaIdx].trans = dictResult;
    lastTranslated = dictResult;
    return;
  }

  const chunk = text.slice(-380).trim();
  if(!chunk || sig.aborted) return;

  const transEl = getCurrentTransEl();
  if(transEl) transEl.innerHTML = '<span class="translating">·&nbsp;·&nbsp;·</span>';

  for(const service of [tryMyMemory, tryGtx, tryLingva]){
    if(sig.aborted) return;
    try {
      const result = await service(chunk, sl, tl, sig);
      if(result){
        const el = getCurrentTransEl();
        if(el && !sig.aborted) el.textContent = result;
        if(currentParaIdx >= 0) paragraphs[currentParaIdx].trans = result;
        lastTranslated = result;
        return;
      }
    } catch(e){
      if(sig.aborted) return;
    }
  }

  const el = getCurrentTransEl();
  if(!sig.aborted && el) el.textContent = lastTranslated || '—';
}

function scheduleTranslate(text, lang){
  clearTimeout(txDebounce);
  txDebounce = setTimeout(() => translateNow(text, lang), 20);
}

// ── Mic keepalive ──
let micGainNode = null;

// ── MIC STREAM PERMANENTE ──
// Una vez que el usuario da permiso, el stream físico del micrófono
// se mantiene vivo CON GAIN=0 durante toda la sesión.
// Esto evita que el navegador muestre el indicador "mic liberado"
// al cambiar idioma o mutear. Solo se libera en stopAll() o al cerrar la página.
async function keepMicAlive(){
  if(micStream) return;
  try{
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      },
      video: false
    });
    micAudioCtx = new AudioContext();
    const src = micAudioCtx.createMediaStreamSource(micStream);
    micGainNode = micAudioCtx.createGain();
    micGainNode.gain.value = 0; // silencio total, solo mantiene el permiso activo
    src.connect(micGainNode);
    // NO conectar a destination para no reproducir el audio
  } catch(e){ console.warn('keepMicAlive:', e); }
}

function releaseMic(){
  if(micStream){ micStream.getTracks().forEach(t=>t.stop()); micStream = null; }
  if(micAudioCtx){ try{ micAudioCtx.close(); }catch(x){} micAudioCtx = null; }
  micGainNode = null;
}

// ── MOTOR DE RECONOCIMIENTO ──
function getEffectiveLang(hint){ return srcLang.code; }

function startRec(lang){
  // Si está muteado Y no hay pestaña compartida → no iniciar
  if(!SR || !isRunning || (isMuted && !tabStream)) return;

  // Detener instancia anterior sin liberar micStream
  if(recognition){
    recognition.onend = null; recognition.onerror = null; recognition.onresult = null;
    try{ recognition.abort(); }catch(x){}
    recognition = null;
  }

  recognition = new SR();
  recognition.lang            = srcLang.locale;
  currentRecLang              = srcLang.locale;
  recognition.continuous      = true;
  recognition.interimResults  = true;
  recognition.maxAlternatives = 3;

  recognition.onresult = (e) => {
    // Si estamos muteados Y no hay pestaña compartida, ignorar resultados
    if(isMuted && !tabStream) return;
    retryDelay = 300;
    let interim = '', newFinal = '';

    for(let i = e.resultIndex; i < e.results.length; i++){
      if(e.results[i].isFinal){
        let best = e.results[i][0].transcript;
        // Corrección fonética según idioma fuente
        if(srcLang.code === 'es') best = phoneticCorrectES(best);
        if(srcLang.code === 'en') best = phoneticCorrectEN(best);
        newFinal += best + ' ';
      } else {
        interim += e.results[i][0].transcript;
      }
    }

    if(paragraphs.length === 0 || (pendingNewPara && (newFinal || interim).trim())){
      pendingNewPara = false;
      createPara(srcLang.code);
      updateLangUI(srcLang.code);
    }

    const curPara = paragraphs[currentParaIdx];

    if(newFinal){
      curPara.orig += newFinal;
      wordTotal = paragraphs.reduce((s,p) => s + p.orig.trim().split(/\s+/).filter(Boolean).length, 0);
      wCount.textContent = wordTotal + ' PALABRAS';
      wHud.textContent   = wordTotal + ' W';
      curPara.lang = srcLang.code;
      updateLangUI(srcLang.code);
      scheduleTranslate(curPara.orig.trim(), srcLang.code);
    }

    if(interim){
      const live = ((curPara?.orig||'') + ' ' + interim).trim();
      scheduleTranslate(live, srcLang.code);
    }

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => { pendingNewPara = true; }, getSilenceMS());

    const origEl = getCurrentOrigEl();
    if(origEl){
      const finText = addQuestionMark(curPara.orig); // Aplicar detección de pregunta al final
      let html = '';
      if(finText) html = `<span>${finText}</span>`;
      if(interim) {
        const interimWithQuestion = addQuestionMark((curPara.orig + ' ' + interim).trim());
        // Extraer solo la parte del interim que viene después del final
        const interimPart = interimWithQuestion.length > finText.length ? 
          interimWithQuestion.substring(finText.length).trim() : interim;
        html += `<span class="interim">${interimPart}</span>`;
      }
      // Debug: log para update
      console.log(`[PARA ${currentParaIdx}] Final:"${finText}" Interim:"${interim}"`);
      origEl.innerHTML = html; // Esto reemplaza todo lo anterior
      autoScrollToBottom();
    }
  };

  recognition.onend = () => {
    if(!isRunning) return;
    if(isMuted && !tabStream) return;
    if(document.hidden) return; // no reiniciar si la página está oculta
    setTimeout(() => {
      if(!isRunning) return;
      if(isMuted && !tabStream) return;
      if(document.hidden) return;
      startRec();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 1.3, 800);
  };

  recognition.onerror = (e) => {
    if(e.error === 'not-allowed' || e.error === 'service-not-allowed'){
      if(document.hidden) return; // Chrome restringe el mic al ocultar la pestaña — no parar
      showNotif('PERMISO DENEGADO — REVISA AJUSTES DEL NAVEGADOR', 6000);
      stopAll(); return;
    }
    if(e.error === 'language-not-supported'){
      showNotif(`IDIOMA NO SOPORTADO: ${srcLang.name} (${srcLang.locale})`, 4000);
    }
    if(e.error === 'no-speech') retryDelay = 280;
    if(e.error === 'network')   retryDelay = 600;
  };

  try{ recognition.start(); }catch(x){}
}

// ── Session ──
function setActive(src){
  isRunning = true;
  modeSelector.classList.add('hide');
  captionArea.classList.add('show');
  langBadge.classList.add('show');
  stopBtn.classList.add('show');
  muteBtn.classList.add('show');
  tabLiveBtn.classList.add('show');
  langModePill.classList.add('show');
  if(langToggleBtn) langToggleBtn.classList.add('show');
  exportBtn && exportBtn.classList.add('show');
  homeBtn.classList.add('show');
  if(modeLabel) modeLabel.textContent = src === 'mic' ? 'MIC' : 'TAB';
  sourceTag.textContent = src === 'mic' ? '— MICRÓFONO —' : '— AUDIO DEL SISTEMA —';
  // Ocultar footer de privacidad
  const pf = document.getElementById('privacyFooter');
  if(pf) pf.style.display = 'none';
  // Mostrar bottom bar
  const bb = document.getElementById('bottomBar');
  if(bb) bb.style.display = 'flex';
  // Mostrar color picker en ACC
  const act = document.getElementById('accColorTitle');
  const acs = document.getElementById('accColorSection');
  if(act) act.style.display = '';
  if(acs) acs.style.display = '';
  // Session timer
  startSessionTimer();
  // Audio meter (solo para mic)
  if(src === 'mic') startMicMeter();
}

function stopAll(voluntary){
  isRunning = false; isMuted = false;
  clearTimeout(silenceTimer);
  // Detener el recognition API (no el stream físico del mic)
  if(recognition){
    recognition.onend = null; recognition.onerror = null; recognition.onresult = null;
    try{ recognition.abort(); }catch(x){} recognition = null;
  }
  // Detener tab capture si existe
  if(tabStream){ tabStream.getTracks().forEach(t=>t.stop()); tabStream = null; }
  // Liberar el mic SOLO aquí (parar la sesión = soltar todo)
  releaseMic();
  stopMicMeter();
  stopSessionTimer();
  muteBtn.classList.remove('muted'); muteLbl.textContent = 'MUTEAR';
  micDot.classList.remove('pause');
  langBadge.classList.remove('show');
  sourceTag.textContent = '— PAUSADO —'; if(modeLabel) modeLabel.textContent = 'PAUSED';
  backBtn.classList.remove('show');
  // restartBtn nunca se muestra — la sesión se auto-reanuda si no fue voluntario
  if(!voluntary){
    // Auto-reanudar: volver a arrancar la sesión de mic automáticamente
    [stopBtn, muteBtn, tabLiveBtn].forEach(b => b && b.classList.remove('show'));
    if(langToggleBtn) langToggleBtn.classList.remove('show');
    langModePill.classList.remove('show');
    setTimeout(() => {
      if(!SR) return;
      keepMicAlive();
      retryDelay = 400;
      applyLangUI();
      setActive('mic');
      startRec();
    }, 800);
  } else {
    // Parada voluntaria: mantener la barra visible con botón REANUDAR
    [muteBtn, tabLiveBtn].forEach(b => b && b.classList.remove('show'));
    if(langToggleBtn) langToggleBtn.classList.remove('show');
    langModePill.classList.remove('show');
    // Transformar stopBtn en botón REANUDAR
    stopBtn.classList.add('paused');
    stopBtn.querySelector('span').textContent = 'REANUDAR';
    micDot.style.display = 'none';
    showNotif('SESIÓN PAUSADA · HISTORIAL DISPONIBLE', 4000);
  }
}

// ── Visibility change ──
// Cuando el usuario cambia de pestaña, el SpeechRecognition se puede pausar
// internamente en Chrome, pero NO llamamos stop()/abort() para no soltar el mic.
// Cuando vuelve, reiniciamos el recognition si no estaba muteado.
document.addEventListener('visibilitychange', () => {
  if(!isRunning || isMuted) return;
  if(document.hidden){
    // Página oculta: pausar recognition limpiamente sin soltar la sesión ni los botones
    if(recognition){
      recognition.onend = null; recognition.onerror = null; recognition.onresult = null;
      try{ recognition.abort(); }catch(x){} recognition = null;
    }
  } else {
    // Regresa a la página: reanudar recognition
    if(!recognition) startRec();
  }
});

// ── Tab capture ──
async function startTabCapture(fresh){
  if(!SR){ showNotif('USA CHROME O EDGE'); return; }
  if(!navigator.mediaDevices?.getDisplayMedia){ showNotif('NAVEGADOR NO SOPORTA CAPTURA'); return; }
  try{
    showNotif('SELECCIONA LA PESTAÑA Y ACTIVA ✓ "COMPARTIR AUDIO"', 8000);
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {echoCancellation:false, noiseSuppression:false, sampleRate:44100}
    });
    const aTracks = stream.getAudioTracks();
    if(aTracks.length === 0){
      showNotif('SIN AUDIO — ACTIVA "COMPARTIR AUDIO" AL SELECCIONAR', 7000);
      stream.getTracks().forEach(t=>t.stop()); return;
    }
    if(recognition){ try{ recognition.abort(); }catch(x){} recognition=null; }
    if(tabStream){ tabStream.getTracks().forEach(t=>t.stop()); }
    tabStream = stream;

    // ── MANTENER STREAM ACTIVO sin reproducir doble ──
    // El audio de la pestaña ya suena normalmente por los altavoces.
    // Usamos gain=0 para que el AudioContext mantenga el stream vivo
    // sin añadir una segunda copia del audio (evita el eco/doble sonido).
    const actx = new AudioContext();
    const tabSrc  = actx.createMediaStreamSource(stream);
    const silence = actx.createGain();
    silence.gain.value = 0;            // ← volumen 0: no suena doble
    tabSrc.connect(silence);
    silence.connect(actx.destination); // mantiene el stream activo en el contexto

    stream.getVideoTracks().forEach(t=>t.stop());
    stream.oninactive = () => { if(isRunning) stopAll(); };

    clearAll();
    retryDelay  = 400;
    updateLangUI(srcLang.code);
    if(fresh) setActive('tab');
    else { if(modeLabel) modeLabel.textContent='TAB'; sourceTag.textContent='— AUDIO DEL SISTEMA —'; }
    startRec();
    showNotif('✓ AUDIO ACTIVO — CAPTIONS + TRADUCCIÓN EN VIVO', 4000);
  } catch(err){
    if(err.name !== 'NotAllowedError') showNotif('ERROR: ' + err.message, 5000);
    else showNotif('CAPTURA CANCELADA');
  }
}

// ── Botones ──
btnMic.addEventListener('click', () => {
  if(!SR){ showNotif('USA CHROME O EDGE'); return; }
  keepMicAlive();
  clearAll();
  retryDelay = 400;
  applyLangUI();
  setActive('mic');
  startRec();
  showNotif(srcLang.name.toUpperCase() + ' → ' + tgtLang.name.toUpperCase() + ' — EN VIVO', 3000);
});

btnTab.addEventListener('click',     () => startTabCapture(true));
tabLiveBtn.addEventListener('click', () => startTabCapture(false));
stopBtn.addEventListener('click', () => {
  if(stopBtn.classList.contains('paused')){
    // Reanudar sesión
    stopBtn.classList.remove('paused');
    stopBtn.querySelector('span').textContent = 'DETENER';
    micDot.style.display = '';
    keepMicAlive();
    retryDelay = 400;
    applyLangUI();
    setActive('mic');
    startRec();
    showNotif('SESIÓN REANUDADA', 2500);
  } else {
    stopAll(true);
  }
});

muteBtn.addEventListener('click', () => {
  if(!isRunning) return;
  isMuted = !isMuted;
  if(isMuted){
    // MUTE: levantamos el flag.
    // Si hay pestaña compartida: el recognition de la pestaña SIGUE activo.
    // Si solo mic: el recognition se pausa (onresult lo ignorará).
    muteBtn.classList.add('muted'); muteLbl.textContent = 'ACTIVAR';
    micDot.classList.add('pause');
    if(tabStream){
      showNotif('MIC MUTEADO — PESTAÑA SIGUE TRANSCRIBIENDO');
    } else {
      showNotif('MIC MUTEADO — SOLO ESTA PÁGINA');
    }
  } else {
    // DESMUTE: bajamos el flag y reiniciamos el recognition (si no había tab activa
    // el recognition había parado; si había tab, ya seguía corriendo).
    muteBtn.classList.remove('muted'); muteLbl.textContent = 'MUTEAR';
    micDot.classList.remove('pause');
    startRec();
    showNotif('MICRÓFONO ACTIVO');
  }
});

clearBtn && clearBtn.addEventListener('click', () => clearAll());

// ── Atajos de teclado ──
// CTRL = cambiar idioma ES ↔ EN
// ALT  = mutear/desmutear micrófono solo en esta página
// TAB  = abrir / cerrar libreta de notas
document.addEventListener('keydown', (e) => {
  if(e.target.tagName === 'INPUT') return;
  if(e.target.tagName === 'TEXTAREA' && e.key !== 'Tab') return;

  // TAB: toggle libreta de notas
  if(e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey){
    e.preventDefault();
    const overlay = document.getElementById('notepadOverlay');
    if(overlay && overlay.classList.contains('open')){
      overlay.classList.remove('open');
    } else if(overlay){
      overlay.classList.add('open');
      accPanel.classList.remove('open');
      accToggle.classList.remove('open');
      setTimeout(() => document.getElementById('notepadTextarea')?.focus(), 320);
    }
    return;
  }

  if(e.target.tagName === 'TEXTAREA') return;

  // CTRL: intercambiar idioma fuente ↔ destino
  if(e.key === 'Control' && !e.altKey && !e.shiftKey && !e.metaKey){
    e.preventDefault();
    if(isRunning) swapLanguages();
    return;
  }

  // ALT: mutear/desmutear MIC solo en esta página (no afecta otras pestañas)
  if(e.key === 'Alt' && !e.ctrlKey && !e.shiftKey && !e.metaKey){
    e.preventDefault();
    if(isRunning) muteBtn.click();
    return;
  }
});

// ── ACCESSIBILITY MENU ──
const accToggle     = document.getElementById('accToggle');
const accPanel      = document.getElementById('accPanel');
const fontSizeSlider= document.getElementById('fontSizeSlider');
const fontSizeHint  = document.getElementById('fontSizeHint');
const speedSlider   = document.getElementById('speedSlider');
const speedHint     = document.getElementById('speedHint');
// Toggle panel
accToggle.addEventListener('click', () => {
  const open = accPanel.classList.toggle('open');
  accToggle.classList.toggle('open', open);
  if(open) {
    const timerPanel = document.getElementById('timerPanel');
    const timerToggle = document.getElementById('timerToggle');
    if(timerPanel && timerToggle) {
      timerPanel.classList.remove('open');
      timerToggle.classList.remove('open');
    }
  }
});
// Cerrar al hacer click en el backdrop (fuera del modal)
accPanel.addEventListener('click', e => {
  if(e.target === accPanel) {
    accPanel.classList.remove('open');
    accToggle.classList.remove('open');
  }
});
// Botón cerrar
const accCloseBtn = document.getElementById('accCloseBtn');
if(accCloseBtn) accCloseBtn.addEventListener('click', () => {
  accPanel.classList.remove('open');
  accToggle.classList.remove('open');
});
// Tecla Escape cierra el modal
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && accPanel.classList.contains('open')) {
    accPanel.classList.remove('open');
    accToggle.classList.remove('open');
  }
});

// ── Color del texto traducido ──
const COLOR_NAMES = {
  'rgba(255,195,90,0.9)':'Dorado (default)',
  'rgba(100,200,255,0.9)':'Azul cielo',
  'rgba(100,220,160,0.9)':'Verde menta',
  'rgba(180,140,255,0.9)':'Lavanda',
  'rgba(255,120,120,0.9)':'Coral',
  'rgba(255,160,80,0.9)':'Naranja',
  'rgba(80,220,220,0.9)':'Cian',
  'rgba(255,200,220,0.9)':'Rosa',
  'rgba(160,255,120,0.9)':'Lima',
  'rgba(255,240,100,0.9)':'Amarillo',
  'rgba(200,200,200,0.9)':'Gris claro',
  'rgba(255,255,255,0.95)':'Blanco',
};
let currentTranslationColor = 'rgba(255,195,90,0.9)';

// Aplicar dorado por default al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const lblRight = document.getElementById('lblRight');
  if(lblRight){
    lblRight.style.color = currentTranslationColor;
    lblRight.style.borderColor = currentTranslationColor.replace(/[\d.]+\)$/, '0.25)');
  }
});

function applyTranslationColor(color){
  currentTranslationColor = color;
  document.querySelectorAll('.para-right').forEach(el => {
    el.style.color = color;
  });
  // Actualizar el cuadrito del idioma de traducción
  const lblRight = document.getElementById('lblRight');
  if(lblRight){
    lblRight.style.color = color;
    lblRight.style.borderColor = color.replace(/[\d.]+\)$/, '0.25)');
  }
  const style = document.getElementById('txColorStyle') || (() => {
    const s = document.createElement('style');
    s.id = 'txColorStyle';
    document.head.appendChild(s);
    return s;
  })();
  style.textContent = `.para-right.es-output,.para-right.en-output,.para-right.tx-output{color:${color}!important;}`;
}

document.querySelectorAll('.acc-color-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.acc-color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    const color = sw.dataset.color;
    applyTranslationColor(color);
    const hint = document.getElementById('accColorHint');
    if(hint) hint.textContent = COLOR_NAMES[color] || color;
  });
});


const FONT_LABELS = ['XS','S','NORMAL','L','XL'];
const FONT_SCALES = [0.55, 0.72, 1, 1.32, 1.65];
let currentFontScale = 1; // guarda el scale actual

function applyFontScale(scale){
  currentFontScale = scale;
  document.querySelectorAll('.para-left').forEach(el => {
    el.style.fontSize = `clamp(${Math.round(24*scale)}px,${(3.8*scale).toFixed(1)}vw,${Math.round(54*scale)}px)`;
  });
  document.querySelectorAll('.para-right').forEach(el => {
    el.style.fontSize = `clamp(${Math.round(24*scale)}px,${(3.8*scale).toFixed(1)}vw,${Math.round(54*scale)}px)`;
  });
}

fontSizeSlider.addEventListener('input', () => {
  const idx = parseInt(fontSizeSlider.value) - 1;
  fontSizeHint.textContent = FONT_LABELS[idx];
  applyFontScale(FONT_SCALES[idx]);
});

// ── Velocidad de actualización (silence debounce) ──
const SPEED_LABELS  = ['LENTO (2.5s)','NORMAL (1.7s)','RÁPIDO (900ms)'];
const SPEED_VALUES  = [2500, 1700, 900];
speedSlider.addEventListener('input', () => {
  const idx = parseInt(speedSlider.value) - 1;
  speedHint.textContent = SPEED_LABELS[idx];
  // Override global SILENCE_MS via closure trick
  window._silenceOverride = SPEED_VALUES[idx];
});
// Patch silenceTimer to use override if set
const _origSilenceMS = 1700;
function getSilenceMS(){ return window._silenceOverride || _origSilenceMS; }

// ── RESTART: nueva sesión desde el estado pausado ──
restartBtn.addEventListener('click', () => {
  restartBtn.classList.remove('show');
  captionArea.classList.remove('show');
  langBadge.classList.remove('show');
  homeBtn.classList.remove('show');
  modeSelector.classList.remove('hide');
  sourceTag.textContent = ''; if(modeLabel) modeLabel.textContent = '\u2014';
  const pf = document.getElementById('privacyFooter');
  if(pf) pf.style.display = 'flex';
  const bb2 = document.getElementById('bottomBar');
  if(bb2) bb2.style.display = 'none';
  const act2 = document.getElementById('accColorTitle');
  const acs2 = document.getElementById('accColorSection');
  if(act2) act2.style.display = 'none';
  if(acs2) acs2.style.display = 'none';
});

homeBtn.addEventListener('click', () => goHome());

// Inicializar UI con idiomas por defecto (ES → EN)
applyLangUI();

// ══════════════════════════════════════
// LANGUAGE PICKER
// ══════════════════════════════════════
const srcLangPicker = document.getElementById('srcLangPicker');
const tgtLangPicker = document.getElementById('tgtLangPicker');
let activePicker = null; // 'src' | 'tgt' | null

function buildPickerHTML(selectedCode){
  return `
    <div class="lang-picker-search">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input class="lang-picker-input" placeholder="Buscar idioma..." autocomplete="off" spellcheck="false" id="pickerSearchInput">
    </div>
    <div class="lang-picker-list" id="pickerList">
      ${LANGUAGES.map(l => `
        <div class="lang-picker-item${l.code === selectedCode ? ' selected' : ''}" data-code="${l.code}">
          <span class="lp-flag">${l.flag}</span>
          <span class="lp-name">${l.name}</span>
          ${l.code === selectedCode ? '<span class="lp-check">✓</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function filterPicker(query, pickerEl){
  const q = query.toLowerCase().trim();
  pickerEl.querySelectorAll('.lang-picker-item').forEach(item => {
    const name = item.querySelector('.lp-name').textContent.toLowerCase();
    const code = item.dataset.code.toLowerCase();
    item.style.display = (!q || name.includes(q) || code.includes(q)) ? '' : 'none';
  });
}

function openPicker(side){
  closePicker();
  activePicker = side;
  const panel = side === 'src' ? srcLangPicker : tgtLangPicker;
  const selectedCode = side === 'src' ? srcLang.code : tgtLang.code;
  panel.innerHTML = buildPickerHTML(selectedCode);
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  // Focus search
  setTimeout(() => panel.querySelector('.lang-picker-input')?.focus(), 20);
  // Search filter
  panel.querySelector('#pickerSearchInput')?.addEventListener('input', e => {
    filterPicker(e.target.value, panel.querySelector('#pickerList'));
  });
  // Item click
  panel.querySelectorAll('.lang-picker-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.dataset.code;
      const lang = LANGUAGES.find(l => l.code === code);
      if(!lang) return;
      if(side === 'src'){
        // Evitar mismo idioma en src y tgt
        if(lang.code === tgtLang.code){
          setLanguages(lang, srcLang, false);
        } else {
          setLanguages(lang, tgtLang, false);
        }
      } else {
        if(lang.code === srcLang.code){
          setLanguages(tgtLang, lang, false);
        } else {
          setLanguages(srcLang, lang, false);
        }
      }
      clearAll();
      if(isRunning && !(isMuted && !tabStream)) startRec();
      closePicker();
    });
  });
}

function closePicker(){
  if(srcLangPicker) {
    srcLangPicker.style.display = 'none';
    srcLangPicker.style.opacity = '0';
  }
  if(tgtLangPicker) {
    tgtLangPicker.style.display = 'none';
    tgtLangPicker.style.opacity = '0';
  }
  activePicker = null;
}

// Click en headers de columna
lblLeft && lblLeft.addEventListener('click', (e) => {
  e.stopPropagation();
  if(activePicker === 'src') closePicker();
  else openPicker('src');
});
lblRight && lblRight.addEventListener('click', (e) => {
  e.stopPropagation();
  if(activePicker === 'tgt') closePicker();
  else openPicker('tgt');
});

// Cerrar picker al hacer clic fuera
document.addEventListener('click', (e) => {
  if(activePicker && !e.target.closest('#srcLangWrap') && !e.target.closest('#tgtLangWrap')){
    closePicker();
  }
});
// ESC cierra picker
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && activePicker) { closePicker(); e.stopPropagation(); }
});

// ── NOTEPAD ──
const notepadOverlay  = document.getElementById('notepadOverlay');
const notepadClose    = document.getElementById('notepadClose');
const notepadTextarea = document.getElementById('notepadTextarea');
const notepadSaveBtn  = document.getElementById('notepadSaveBtn');
const notepadClearAllBtn= document.getElementById('notepadClearAllBtn');
const notepadSavedList  = document.getElementById('notepadSavedList');
const notepadEmpty      = document.getElementById('notepadEmpty');
const notesOpenBtn      = document.getElementById('notesOpenBtn');
const notesCountBadge   = document.getElementById('notesCountBadge');

let savedNotes = []; // {id, ts, text}

// ── PERSISTENCIA DE NOTAS (localStorage) ──
function loadNotesFromStorage(){
  try{
    const raw = localStorage.getItem('caption_notes');
    if(raw) savedNotes = JSON.parse(raw);
  } catch(e){ savedNotes = []; }
}
function saveNotesToStorage(){
  try{ localStorage.setItem('caption_notes', JSON.stringify(savedNotes)); }catch(e){}
}
loadNotesFromStorage();

function openNotepad(){
  accPanel.classList.remove('open');
  accToggle.classList.remove('open');
  notepadOverlay.classList.add('open');
  setTimeout(() => notepadTextarea.focus(), 320);
}
function closeNotepad(){
  notepadOverlay.classList.remove('open');
}

notesOpenBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  openNotepad();
});
notepadClose.addEventListener('click', closeNotepad);
notepadOverlay.addEventListener('click', (e) => {
  if(e.target === notepadOverlay) closeNotepad();
});

function updateNotesBadge(){
  const n = savedNotes.length;
  notesCountBadge.textContent = n;
  notesCountBadge.classList.toggle('show', n > 0);
}

function renderSavedNotes(){
  // Remove all saved entries (keep empty msg)
  notepadSavedList.querySelectorAll('.notepad-saved-entry').forEach(el => el.remove());
  notepadEmpty.style.display = savedNotes.length === 0 ? 'block' : 'none';
  savedNotes.slice().reverse().forEach(note => {
    const entry = document.createElement('div');
    entry.className = 'notepad-saved-entry';
    entry.id = 'note-' + note.id;

    const ts = document.createElement('div');
    ts.className = 'notepad-saved-ts';
    ts.textContent = note.ts;

    const txt = document.createElement('div');
    txt.className = 'notepad-saved-text';
    txt.textContent = note.text;

    const del = document.createElement('button');
    del.className = 'notepad-del-btn';
    del.textContent = '✕';
    del.title = 'Eliminar nota';
    del.addEventListener('click', () => {
      savedNotes = savedNotes.filter(n => n.id !== note.id);
      renderSavedNotes();
      updateNotesBadge();
      saveNotesToStorage();
    });

    entry.appendChild(ts);
    entry.appendChild(txt);
    entry.appendChild(del);
    notepadSavedList.appendChild(entry);
    // Aplicar tamaño de letra actual si ya está definido
    if(typeof noteFontIdx !== 'undefined' && typeof FONT_SIZES !== 'undefined'){
      txt.style.fontSize = FONT_SIZES[noteFontIdx] + 'px';
    }
  });
}

function saveCurrentNote(){
  const text = notepadTextarea.value.trim();
  if(!text){ notepadTextarea.focus(); return; }
  const now = new Date();
  const ts  = now.toLocaleTimeString('es-DO', {hour:'2-digit', minute:'2-digit', second:'2-digit'})
             + ' · ' + now.toLocaleDateString('es-DO', {day:'2-digit', month:'short'});
  savedNotes.push({ id: Date.now(), ts, text });
  notepadTextarea.value = '';
  renderSavedNotes();
  updateNotesBadge();
  saveNotesToStorage();
  showNotif('NOTA GUARDADA ✓', 2200);
}

notepadSaveBtn.addEventListener('click', saveCurrentNote);

notepadClearAllBtn.addEventListener('click', () => {
  if(savedNotes.length === 0 && !notepadTextarea.value.trim()){ return; }
  savedNotes = [];
  notepadTextarea.value = '';
  renderSavedNotes();
  updateNotesBadge();
  saveNotesToStorage();
  showNotif('NOTAS BORRADAS', 2000);
});

// Ctrl+Enter en textarea = guardar nota
notepadTextarea.addEventListener('keydown', (e) => {
  if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
    e.preventDefault();
    saveCurrentNote();
  }
});

// ── SESSION TIMER ──
const sessionTimerEl = document.getElementById('sessionTimer');
let sessionStartTime = null;
let sessionTimerInt  = null;

function startSessionTimer(){
  sessionStartTime = Date.now();
  sessionTimerEl.classList.add('show');
  sessionTimerInt = setInterval(() => {
    const s = Math.floor((Date.now() - sessionStartTime) / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    sessionTimerEl.textContent = String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  }, 1000);
}

function stopSessionTimer(){
  clearInterval(sessionTimerInt);
  sessionTimerEl.classList.remove('show');
  sessionTimerEl.textContent = '00:00';
}

// ── AUDIO LEVEL METER ──
const micMeterWrap = document.getElementById('micMeterWrap');
const meterBars    = [0,1,2,3,4].map(i => document.getElementById('mb'+i));
let meterAnalyser  = null;
let meterACtx      = null;
let meterSrc       = null;
let meterRaf       = null;
const meterData    = new Uint8Array(64);

function startMicMeter(){
  if(!micStream) return;
  try{
    meterACtx     = new AudioContext();
    meterSrc      = meterACtx.createMediaStreamSource(micStream);
    meterAnalyser = meterACtx.createAnalyser();
    meterAnalyser.fftSize = 128;
    meterSrc.connect(meterAnalyser);
    micMeterWrap.style.display = 'flex';
    drawMeter();
  } catch(e){}
}

function drawMeter(){
  meterRaf = requestAnimationFrame(drawMeter);
  if(!meterAnalyser) return;
  meterAnalyser.getByteFrequencyData(meterData);
  const avg = meterData.slice(0, 20).reduce((a,b) => a+b, 0) / 20;
  const level = Math.min(avg / 120, 1); // 0..1
  const thresholds = [0.05, 0.2, 0.4, 0.6, 0.8];
  meterBars.forEach((bar, i) => {
    const on = level > thresholds[i];
    const h  = on ? (4 + i * 2) : 4;
    bar.style.height = h + 'px';
    bar.style.background = on
      ? (isMuted ? 'rgba(255,155,30,0.7)' : 'rgba(100,220,160,0.8)')
      : 'rgba(255,255,255,0.08)';
  });
  // Animate mute button mic icon based on audio level
  if(muteBtn){
    if(!isMuted && level > 0.04){
      muteBtn.classList.add('speaking');
    } else {
      muteBtn.classList.remove('speaking');
    }
  }
}

function stopMicMeter(){
  cancelAnimationFrame(meterRaf);
  if(meterACtx){ try{ meterACtx.close(); }catch(x){} meterACtx = null; }
  meterAnalyser = null; meterSrc = null;
  micMeterWrap.style.display = 'none';
  meterBars.forEach(b => { b.style.height = '4px'; b.style.background = 'rgba(255,255,255,0.08)'; });
}

// ── EXPORT TRANSCRIPT ──
exportBtn && exportBtn.addEventListener('click', () => {
  if(paragraphs.length === 0){ showNotif('SIN TRANSCRIPCIÓN QUE EXPORTAR', 2500); return; }
  const now = new Date();
  const ts  = now.toLocaleString('es-DO', {dateStyle:'short', timeStyle:'medium'});
  let txt = `CAPTION — Transcripción\n${ts}\n${'─'.repeat(40)}\n\n`;
  paragraphs.forEach((p, i) => {
    if(!p.orig.trim()) return;
    const dir = p.lang === 'en' ? 'EN → ES' : 'ES → EN';
    txt += `[${String(i+1).padStart(2,'0')}] ${dir}\n`;
    txt += `  ${p.orig.trim()}\n`;
    if(p.trans) txt += `  ↳ ${p.trans.trim()}\n`;
    txt += '\n';
  });
  txt += `${'─'.repeat(40)}\nTotal: ${wordTotal} palabras`;

  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `caption-${now.toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showNotif('TRANSCRIPCIÓN DESCARGADA ✓', 3000);
});

// ── COPY ALL NOTES ──
const notepadCopyAllBtn = document.getElementById('notepadCopyAllBtn');
notepadCopyAllBtn.addEventListener('click', () => {
  if(savedNotes.length === 0){ showNotif('SIN NOTAS QUE COPIAR', 2000); return; }
  const txt = savedNotes.map(n => `[${n.ts}]\n${n.text}`).join('\n\n─────\n\n');
  navigator.clipboard.writeText(txt).then(() => showNotif('NOTAS COPIADAS ✓', 2000))
    .catch(() => showNotif('ERROR AL COPIAR', 2000));
});


updateNotesBadge();

// ── CONTROL TAMAÑO LETRA NOTAS ──
const notepadFontInc   = document.getElementById('notepadFontInc');
const notepadFontDec   = document.getElementById('notepadFontDec');
const notepadFontLabel = document.getElementById('notepadFontLabel');
const FONT_SIZES = [9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24];
let noteFontIdx = 2; // default = 11px

function applyNoteFont(){
  const sz = FONT_SIZES[noteFontIdx];
  notepadTextarea.style.fontSize = sz + 'px';
  notepadFontLabel.textContent   = sz + 'px';
  // Aplicar también a las notas guardadas
  document.querySelectorAll('.notepad-saved-text').forEach(el => el.style.fontSize = sz + 'px');
}

notepadFontInc.addEventListener('click', () => {
  if(noteFontIdx < FONT_SIZES.length - 1){ noteFontIdx++; applyNoteFont(); }
});
notepadFontDec.addEventListener('click', () => {
  if(noteFontIdx > 0){ noteFontIdx--; applyNoteFont(); }
});

// Aplicar tamaño guardado al crear nuevas notas (parche en renderSavedNotes)
const _origRender = renderSavedNotes;
// Override para que las notas nuevas hereden el tamaño actual
const _renderSavedNotesPatch = () => {
  _origRender();
  const sz = FONT_SIZES[noteFontIdx];
  document.querySelectorAll('.notepad-saved-text').forEach(el => el.style.fontSize = sz + 'px');
};
// Patch global
window.renderSavedNotesSized = _renderSavedNotesPatch;

// ══ ONBOARDING ══
const ONBOARD_STEPS = [
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(100,200,255,0.9)" stroke-width="1.4"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    iconClass: 'blue',
    num: 'PASO 1 DE 3',
    title: 'ELIGE TU IDIOMA',
    desc: 'Selecciona <strong>ES</strong> si vas a hablar en español o <strong>EN</strong> si hablarás en inglés. Caption detectará el idioma automáticamente y mostrará la traducción al otro en tiempo real.'
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,195,90,0.9)" stroke-width="1.4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    iconClass: 'gold',
    num: 'PASO 2 DE 3',
    title: 'INICIA LA CAPTURA',
    desc: 'Presiona <strong>INICIAR CON MICRÓFONO</strong> para subtítulos de tu voz en vivo. Usa <strong>COMPARTIR PESTAÑA</strong> (solo escritorio) para capturar reuniones, clases o podcasts que estén en otra pestaña.'
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(100,220,160,0.9)" stroke-width="1.4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    iconClass: 'green',
    num: 'PASO 3 DE 3',
    title: 'TIPS RÁPIDOS',
    desc: '<strong>Clic en un párrafo</strong> para copiarlo al portapapeles. <strong>TAB</strong> abre la libreta de notas. <strong>CTRL</strong> cambia idioma. El botón <strong>EXPORTAR</strong> descarga toda la transcripción como .txt.'
  }
];

const onboardOverlay = document.getElementById('onboardOverlay');
const onboardBody    = document.getElementById('onboardBody');
const onboardBar     = document.getElementById('onboardBar');
const onboardDots    = document.getElementById('onboardDots');
const onboardNext    = document.getElementById('onboardNext');
const onboardSkip    = document.getElementById('onboardSkip');
const showOnboardBtn = document.getElementById('showOnboardBtn');

let onboardStep = 0;

function renderOnboardStep(step){
  const s   = ONBOARD_STEPS[step];
  const pct = Math.round(((step + 1) / ONBOARD_STEPS.length) * 100);
  onboardBar.style.width = pct + '%';
  onboardBody.innerHTML  = `
    <div class="onboard-step-num">${s.num}</div>
    <div class="onboard-icon-wrap ${s.iconClass}">${s.icon}</div>
    <div class="onboard-title">${s.title}</div>
    <div class="onboard-desc">${s.desc}</div>
  `;
  onboardDots.innerHTML = ONBOARD_STEPS.map((_,i) =>
    `<div class="onboard-dot${i===step?' active':''}"></div>`
  ).join('');
  const isLast = step === ONBOARD_STEPS.length - 1;
  onboardNext.textContent = isLast ? 'EMPEZAR ✓' : 'SIGUIENTE →';
}

function openOnboard(){
  onboardStep = 0;
  renderOnboardStep(0);
  onboardOverlay.classList.add('show');
}
function closeOnboard(){
  onboardOverlay.classList.remove('show');
  try{ localStorage.setItem('caption_onboard_done','1'); }catch(e){}
}

onboardNext.addEventListener('click', () => {
  if(onboardStep < ONBOARD_STEPS.length - 1){
    onboardStep++;
    renderOnboardStep(onboardStep);
  } else {
    closeOnboard();
  }
});
onboardSkip.addEventListener('click', closeOnboard);
onboardOverlay.addEventListener('click', e => { if(e.target === onboardOverlay) closeOnboard(); });
if(showOnboardBtn) showOnboardBtn.addEventListener('click', openOnboard);

// Primera visita: onboarding desactivado en v18 para carga más limpia
// try{
//   if(!localStorage.getItem('caption_onboard_done')){
//     setTimeout(openOnboard, 700);
//   }
// }catch(e){}

// ══════════════════════════════════════════
// SEGURIDAD — Consentimiento, Privacidad, ToS
// ══════════════════════════════════════════

const micConsentBanner   = document.getElementById('micConsentBanner');
const consentAcceptBtn   = document.getElementById('consentAcceptBtn');
const consentDeclineBtn  = document.getElementById('consentDeclineBtn');
const micStatusIndicator = document.getElementById('micStatusIndicator');
const micStatusDot       = document.getElementById('micStatusDot');
const micStatusText      = document.getElementById('micStatusText');
const clearDataBtn       = document.getElementById('clearDataBtn');

// Mostrar banner si no hay consentimiento previo
const CONSENT_KEY = 'caption_mic_consent';
function checkConsent(){
  try{
    if(!localStorage.getItem(CONSENT_KEY)){
      micConsentBanner.style.display = 'flex';
    } else {
      micConsentBanner.style.display = 'none';
    }
  }catch(e){ micConsentBanner.style.display = 'flex'; }
}
checkConsent();

consentAcceptBtn.addEventListener('click', () => {
  try{ localStorage.setItem(CONSENT_KEY,'1'); }catch(e){}
  micConsentBanner.classList.add('hide');
  setTimeout(() => micConsentBanner.style.display = 'none', 350);
});
consentDeclineBtn.addEventListener('click', () => {
  micConsentBanner.classList.add('hide');
  setTimeout(() => micConsentBanner.style.display = 'none', 350);
  showNotif('ACCESO AL MICRÓFONO RECHAZADO', 2500);
});

// Modals de privacidad y ToS
window.openModal = function(type){
  const id = type === 'privacy' ? 'privacyModal' : 'tosModal';
  document.getElementById(id).classList.add('show');
};
window.closeModal = function(type){
  const id = type === 'privacy' ? 'privacyModal' : 'tosModal';
  document.getElementById(id).classList.remove('show');
};
document.getElementById('privacyModal').addEventListener('click', e => {
  if(e.target.id === 'privacyModal') closeModal('privacy');
});
document.getElementById('tosModal').addEventListener('click', e => {
  if(e.target.id === 'tosModal') closeModal('tos');
});

// Indicador de estado del micrófono
function setMicStatus(state){
  micStatusIndicator.classList.add('show');
  micStatusDot.className = 'mic-status-dot ' + (state === 'active' ? 'active' : state === 'denied' ? 'denied' : 'idle');
  const labels = { idle:'MIC · EN ESPERA', active:'MIC · ACTIVO', denied:'MIC · ACCESO DENEGADO', muted:'MIC · SILENCIADO' };
  micStatusText.textContent = labels[state] || 'MIC · EN ESPERA';
}

[document.getElementById('btnMic'), document.getElementById('btnTab')].forEach(btn => {
  if(!btn) return;
  btn.addEventListener('click', () => {
    setTimeout(() => {
      if(navigator.permissions){
        navigator.permissions.query({name:'microphone'}).then(r => {
          setMicStatus(r.state === 'granted' ? 'active' : r.state === 'denied' ? 'denied' : 'idle');
          r.onchange = () => setMicStatus(r.state === 'granted' ? 'active' : r.state === 'denied' ? 'denied' : 'idle');
        }).catch(() => setMicStatus('active'));
      } else {
        setMicStatus('active');
      }
    }, 800);
  });
});

const _stopBtn2 = document.getElementById('stopBtn');
if(_stopBtn2){ _stopBtn2.addEventListener('click', () => setMicStatus('idle')); }
const _homeBtn2 = document.getElementById('homeBtn');
if(_homeBtn2){ _homeBtn2.addEventListener('click', () => { micStatusIndicator.classList.remove('show'); }); }

// Limpiar datos temporales al cerrar la pestaña
window.addEventListener('beforeunload', () => {
  try{ sessionStorage.clear(); }catch(e){}
});

// Botón borrar datos manualmente — elemento removido, referencia guardada por compatibilidad
// clearDataBtn fue reemplazado por "Forma de uso" en el footer

// ══════════════════════════════════════
// MODAL FORMA DE USO
// ══════════════════════════════════════
const USAGE_KEY = 'echo_usage_seen';
const usageModal = document.getElementById('usageModal');

window.openUsageModal = function(){
  usageModal.classList.add('show');
};
window.closeUsageModal = function(){
  usageModal.classList.remove('show');
};
window.dontShowUsageAgain = function(){
  try{ localStorage.setItem(USAGE_KEY,'1'); }catch(e){}
  closeUsageModal();
};
window.switchUsageTab = function(idx){
  document.querySelectorAll('.usage-tab').forEach((t,i) => t.classList.toggle('active', i===idx));
  document.querySelectorAll('.usage-tab-content').forEach((c,i) => c.classList.toggle('active', i===idx));
};

// Cerrar al hacer clic fuera
usageModal.addEventListener('click', e => { if(e.target === usageModal) closeUsageModal(); });

// Mostrar automáticamente al cargar si no ha visto antes
try{
  if(!localStorage.getItem(USAGE_KEY)){
    setTimeout(openUsageModal, 600);
  }
}catch(e){ setTimeout(openUsageModal, 600); }

// ══════════════════════════════════════
// LIVE PREVIEW ANIMATION — Landing screen
// ══════════════════════════════════════
(function(){
  const PAIRS = [
    { en: "The meeting starts in five minutes",     es: "La reunión empieza en cinco minutos" },
    { en: "Can you hear me clearly?",               es: "¿Me escuchas bien?" },
    { en: "Let's review the main points",           es: "Repasemos los puntos principales" },
    { en: "Thank you for your time today",          es: "Gracias por su tiempo hoy" },
    { en: "We'll share the notes after the call",   es: "Compartiremos las notas después de la llamada" },
    { en: "That's a great question",                es: "Esa es una gran pregunta" },
    { en: "Please repeat that one more time",       es: "Por favor repite eso una vez más" },
  ];

  let pairIdx = 0, wordIdx = 0, phase = 'typing';
  const elEN = document.getElementById('previewEN');
  const elES = document.getElementById('previewES');
  if (!elEN || !elES) return;

  function renderState(pair, nEN) {
    const wEN = pair.en.split(' ');
    const wES = pair.es.split(' ');
    const total = wEN.length;

    // EN: words pop in one by one, cursor after last
    elEN.innerHTML = wEN.slice(0, nEN).map((w, i) => {
      const delay = (i === nEN - 1) ? 0 : 0; // only animate the latest word
      return `<span class="pw" style="animation-delay:${delay}s">${w}</span>`;
    }).join(' ') + (nEN <= total ? '<span class="preview-cursor"></span>' : '');

    // ES: lags 2 words behind, appears with fade
    const nES = nEN < 3 ? 0 : Math.floor(wES.length * Math.max(0, (nEN - 2) / total));
    elES.innerHTML = wES.slice(0, nES).map((w, i) =>
      `<span class="pw-es" style="animation-delay:${i * 0.02}s">${w}</span>`
    ).join(' ');
  }

  function showFullES(pair) {
    const wES = pair.es.split(' ');
    elES.innerHTML = wES.map((w, i) =>
      `<span class="pw-es" style="animation-delay:${i * 0.05}s">${w}</span>`
    ).join(' ');
  }

  function tick() {
    const pair = PAIRS[pairIdx];
    const wEN  = pair.en.split(' ');

    if (phase === 'typing') {
      wordIdx++;
      if (wordIdx > wEN.length) {
        phase = 'hold';
        showFullES(pair);
        setTimeout(tick, 2100);
        return;
      }
      renderState(pair, wordIdx);
      // Natural cadence: slight hesitation on punctuation, random rhythm
      const w = wEN[wordIdx - 1] || '';
      const hasPunct = /[,.:;?!]$/.test(w);
      const delay = 190 + Math.random() * 100 + (hasPunct ? 130 : 0);
      setTimeout(tick, delay);

    } else if (phase === 'hold') {
      phase = 'fading';
      elEN.classList.add('pv-fade');
      elES.classList.add('pv-fade');
      setTimeout(() => {
        pairIdx = (pairIdx + 1) % PAIRS.length;
        wordIdx = 0;
        phase   = 'typing';
        elEN.innerHTML = '';
        elES.innerHTML = '';
        elEN.classList.remove('pv-fade');
        elES.classList.remove('pv-fade');
        setTimeout(tick, 160);
      }, 320);

    } else if (phase === 'fading') { /* wait */ }
  }

  setTimeout(tick, 700);
})();

// ══════════════════════════════════════
// CRONÓMETRO — Timer regresivo / Countdown
// ══════════════════════════════════════
(function(){
  let timerSeconds = 0;
  let totalSeconds = 0;
  let timerInterval = null;
  let isRunning = false;

  const timerMenuWrap = document.getElementById('timerMenuWrap');
  const timerToggle = document.getElementById('timerToggle');
  const timerPanel = document.getElementById('timerPanel');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerBigDisplay = document.getElementById('timerBigDisplay');
  const timerPanelClose = document.getElementById('timerPanelClose');
  const timerStartBtn = document.getElementById('timerStartBtn');
  const timerPauseBtn = document.getElementById('timerPauseBtn');
  const timerResetBtn = document.getElementById('timerResetBtn');
  const timerStatus = document.getElementById('timerStatus');
  const timerProgressFill = document.getElementById('timerProgressFill');
  const presetBtns = document.querySelectorAll('.timer-preset-btn');
  const timerInputH = document.getElementById('timerInputH');
  const timerInputM = document.getElementById('timerInputM');
  const timerInputS = document.getElementById('timerInputS');

  if(!timerToggle || !timerPanel) return;

  // Leer segundos desde los inputs en cualquier momento
  function readInputSeconds() {
    const h = Math.max(0, Math.min(23, parseInt(timerInputH.value) || 0));
    const m = Math.max(0, Math.min(59, parseInt(timerInputM.value) || 0));
    const s = Math.max(0, Math.min(59, parseInt(timerInputS.value) || 0));
    return h * 3600 + m * 60 + s;
  }

  // Formato compacto para el botón toggle
  function formatCompact(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if(h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function formatBig(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if(h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function updateDisplay() {
    const compact = formatCompact(timerSeconds);
    const big = formatBig(timerSeconds);
    timerDisplay.textContent = compact;
    if(timerBigDisplay) timerBigDisplay.textContent = big;
    if(timerProgressFill && totalSeconds > 0) {
      timerProgressFill.style.width = ((totalSeconds - timerSeconds) / totalSeconds * 100) + '%';
    } else if(timerProgressFill) {
      timerProgressFill.style.width = '0%';
    }
  }

  // Cerrar panel
  if(timerPanelClose) {
    timerPanelClose.addEventListener('click', (e) => {
      e.stopPropagation();
      timerPanel.classList.remove('open');
      timerToggle.classList.remove('open');
    });
  }

  // Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if(isRunning) return;
      const minutes = parseInt(btn.dataset.minutes);
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timerInputH.value = '00';
      timerInputM.value = String(minutes).padStart(2,'0');
      timerInputS.value = '00';
      timerSeconds = minutes * 60;
      totalSeconds = timerSeconds;
      updateDisplay();
      if(timerStatus) timerStatus.textContent = `${minutes} min`;
      timerStartBtn.disabled = false;
    });
  });

  // Auto-avance: al escribir 2 dígitos pasa al siguiente campo
  function setupAutoAdvance(inp, nextInp, max) {
    inp.addEventListener('focus', () => { inp.select(); });
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '');
      presetBtns.forEach(b => b.classList.remove('active'));
      if(inp.value.length === 2) {
        const val = parseInt(inp.value);
        if(val > max) inp.value = String(max).padStart(2,'0');
        if(nextInp) { nextInp.focus(); nextInp.select(); }
      }
      // Habilitar Iniciar si hay tiempo
      const total = readInputSeconds();
      timerSeconds = total;
      totalSeconds = total;
      updateDisplay();
      timerStartBtn.disabled = total === 0;
    });
    inp.addEventListener('keydown', e => {
      if(e.key === 'Enter') timerStartBtn.click();
    });
  }

  setupAutoAdvance(timerInputH, timerInputM, 23);
  setupAutoAdvance(timerInputM, timerInputS, 59);
  setupAutoAdvance(timerInputS, null, 59);

  // Toggle panel
  timerToggle.addEventListener('click', () => {
    const isOpen = timerPanel.classList.contains('open');
    if(isOpen) {
      timerPanel.classList.remove('open');
      timerToggle.classList.remove('open');
    } else {
      timerPanel.classList.add('open');
      timerToggle.classList.add('open');
      const accPanel = document.getElementById('accPanel');
      const accToggle = document.getElementById('accToggle');
      if(accPanel && accToggle) {
        accPanel.classList.remove('open');
        accToggle.classList.remove('open');
      }
    }
  });

  // Start button — lee los inputs en el momento de iniciar
  timerStartBtn.addEventListener('click', () => {
    if(isRunning) return;
    const total = readInputSeconds();
    if(total === 0) { if(timerStatus) timerStatus.textContent = 'Ingresa un tiempo'; return; }
    timerSeconds = total;
    totalSeconds = total;
    updateDisplay();
    isRunning = true;
    if(timerBigDisplay){ timerBigDisplay.classList.add('running'); timerBigDisplay.classList.remove('finished'); }
    timerStartBtn.style.display = 'none';
    timerPauseBtn.style.display = 'flex';
    presetBtns.forEach(btn => btn.disabled = true);
    [timerInputH, timerInputM, timerInputS].forEach(i => i.disabled = true);

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateDisplay();
      if(timerSeconds <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        timerSeconds = 0;
        updateDisplay();
        if(timerBigDisplay){ timerBigDisplay.classList.remove('running'); timerBigDisplay.classList.add('finished'); }
        timerPauseBtn.style.display = 'none';
        timerStartBtn.style.display = 'flex';
        presetBtns.forEach(btn => btn.disabled = false);
        [timerInputH, timerInputM, timerInputS].forEach(i => i.disabled = false);
        if(timerStatus) timerStatus.textContent = '⏰ ¡TIEMPO!';
      }
    }, 1000);
  });

  // Pause button
  timerPauseBtn.addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerInterval);
    timerPauseBtn.style.display = 'none';
    timerStartBtn.style.display = 'flex';
    if(timerBigDisplay){ timerBigDisplay.classList.remove('running'); }
    if(timerStatus) timerStatus.textContent = 'Pausado';
  });

  // Reset button
  timerResetBtn.addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerInterval);
    timerSeconds = 0;
    totalSeconds = 0;
    if(timerBigDisplay){ timerBigDisplay.classList.remove('running','finished'); }
    updateDisplay();
    timerPauseBtn.style.display = 'none';
    timerStartBtn.style.display = 'flex';
    timerStartBtn.disabled = true;
    presetBtns.forEach(btn => { btn.disabled = false; btn.classList.remove('active'); });
    [timerInputH, timerInputM, timerInputS].forEach(i => { i.disabled = false; i.value = '00'; });
    if(timerStatus) timerStatus.textContent = 'Selecciona un tiempo';
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', e => {
    const isClickInside = timerPanel.contains(e.target) || timerToggle.contains(e.target);
    if(!isClickInside && timerPanel.classList.contains('open')) {
      timerPanel.classList.remove('open');
      timerToggle.classList.remove('open');
    }
  });

  // Mostrar/ocultar según la página
  const observer = new MutationObserver(() => {
    const captionArea = document.getElementById('captionArea');
    if(captionArea && captionArea.classList.contains('show')) {
      timerMenuWrap.classList.add('show');
    } else {
      timerMenuWrap.classList.remove('show');
      if(isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        timerPauseBtn.style.display = 'none';
        timerStartBtn.style.display = 'flex';
      }
    }
  });

  const captionArea = document.getElementById('captionArea');
  if(captionArea) {
    observer.observe(captionArea, { attributes: true, attributeFilter: ['class'] });
  }

  updateDisplay();
  timerStartBtn.disabled = true;
})();




