const APP_DISPLAY_NAME = "仙贝的键盘练习";
const CHILD_NAME = "仙贝";
const APP_VERSION = "RC1.0";
const KEYMAP_URL = "data/keymap.json";
const LESSONS_URL = "data/lessons.json";
const NEXT_TARGET_DELAY_MS = 900;

let introKeyboard = null;
let practiceKeyboard = null;
let keymapData = null;
let lessonsData = null;
let textsData = null;
let randomModesData = null;
let progressData = null;
let introState = null;
let practiceState = null;
let randomState = null;

async function loadKeymap() {
  if (window.KEY_TRAIN_KEYMAP) {
    return window.KEY_TRAIN_KEYMAP;
  }

  try {
    const response = await fetch(KEYMAP_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (fetchError) {
    console.warn("无法读取键盘数据。请确认 data/keymap-data.js 已加载，或 data/keymap.json 可以被当前浏览器读取。", fetchError);
    throw fetchError;
  }
}

async function loadLessons() {
  if (window.KEY_TRAIN_LESSONS) {
    return window.KEY_TRAIN_LESSONS;
  }

  try {
    const response = await fetch(LESSONS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (fetchError) {
    console.warn("无法读取课程数据。请确认 data/lessons-data.js 已加载，或 data/lessons.json 可以被当前浏览器读取。", fetchError);
    throw fetchError;
  }
}

function loadTexts() {
  if (Array.isArray(window.KEY_TRAIN_TEXTS)) {
    return window.KEY_TRAIN_TEXTS;
  }

  console.warn("无法读取随机练习文本。请确认 data/texts-data.js 已加载。");
  return [];
}

function loadRandomModes() {
  if (Array.isArray(window.KEY_TRAIN_RANDOM_MODES)) {
    return window.KEY_TRAIN_RANDOM_MODES;
  }

  console.warn("无法读取自由随机练习配置。请确认 data/texts-data.js 已加载。");
  return [];
}

function showKeymapLoadError(container, error) {
  container.replaceChildren();

  const message = document.createElement("p");
  message.className = "keyboard-load-error";
  message.textContent = "键盘或课程数据没有加载成功，请确认 data/keymap-data.js、data/lessons-data.js 与 index.html 在同一个项目目录中。";
  container.appendChild(message);

  console.error("键盘或课程数据加载失败。", error);
}

function showView(viewId) {
  document.querySelectorAll(".app-view").forEach((view) => {
    view.hidden = view.id !== viewId;
  });
}

function renderAppVersion() {
  const versionElement = document.querySelector("#app-version");

  if (versionElement) {
    versionElement.textContent = `版本：${APP_VERSION}`;
  }
}

function getLessonGroups() {
  if (lessonsData.groups) {
    return lessonsData.groups;
  }

  return [
    {
      id: "home-row",
      name: "基准键课程",
      lessons: lessonsData.homeRow || []
    }
  ];
}

function getAllLessons() {
  return getLessonGroups().flatMap((group) => group.lessons);
}

function getKeyDisplay(baseKey) {
  const keyData = introKeyboard.getKeyData(baseKey) || practiceKeyboard.getKeyData(baseKey);
  return keyData ? keyData.display : baseKey;
}

function getLessonKeyDisplay(lesson) {
  if (Array.isArray(lesson.displayKeys)) {
    return lesson.displayKeys.join(" ");
  }

  return lesson.keys.map((key) => getKeyDisplay(key)).join(" ");
}

function isNumberLesson(lesson) {
  return lesson.id.startsWith("numbers-");
}

function isPunctuationLesson(lesson) {
  return lesson.id.startsWith("punctuation-");
}

function isShiftPunctuationLesson(lesson) {
  return lesson.id.startsWith("shift-punctuation-");
}

function isCaseLesson(lesson) {
  return Boolean(lesson && lesson.id === "case-toggle-27");
}

function getProgressModule() {
  return window.KeyTrainStorage;
}

function updateStorageWarning() {
  const storage = getProgressModule();
  const warning = document.querySelector("#storage-warning");
  warning.hidden = Boolean(storage && storage.isAvailable());
}

function formatLastPracticeTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `最近一次练习：${date.toLocaleString("zh-CN")}`;
}

function loadSavedProgress() {
  const storage = getProgressModule();
  progressData = storage ? storage.loadProgress(CHILD_NAME) : {
    version: 1,
    childName: CHILD_NAME,
    lastPracticeAt: null,
    modules: {
      intro: {},
      practice: {}
    },
    randomPractice: {
      completedTexts: {}
    }
  };
}

function updateHomeProgress() {
  const storage = getProgressModule();
  const totalLessons = getAllLessons().length;
  const introCount = storage ? storage.countCompleted(progressData, "intro", totalLessons) : 0;
  const practiceCount = storage ? storage.countCompleted(progressData, "practice", totalLessons) : 0;
  const textIds = getPracticeTexts().map((textData) => textData.id);
  const randomTextCount = storage ? storage.countCompletedTexts(progressData, textIds) : 0;
  const lastPracticeText = formatLastPracticeTime(progressData.lastPracticeAt);
  const lastPracticeElement = document.querySelector("#home-last-practice");

  document.querySelector("#home-intro-progress").textContent = `入门了解 ${introCount} / ${totalLessons}`;
  document.querySelector("#home-practice-progress").textContent = `入门练习 ${practiceCount} / ${totalLessons}`;
  document.querySelector("#home-random-progress").textContent = `随机练习 已完成 ${randomTextCount} 篇`;
  lastPracticeElement.textContent = lastPracticeText;
  lastPracticeElement.hidden = !lastPracticeText;
}

function refreshProgressViews() {
  loadSavedProgress();
  updateStorageWarning();
  updateHomeProgress();
}

function setLessonHeading(kickerSelector, titleSelector, lesson, modeName) {
  document.querySelector(kickerSelector).textContent = `${modeName} · 第 ${lesson.order} 课`;
  document.querySelector(titleSelector).textContent = lesson.name;
}

function getBaseKeyLabel(keyData) {
  return getKeyDisplay(keyData.baseKey);
}

function createCourseCard(lesson, moduleName, onSelect) {
  const storage = getProgressModule();
  const isCompleted = Boolean(storage && storage.isLessonCompleted(progressData, moduleName, lesson));
  const card = document.createElement("button");
  card.type = "button";
  card.className = "course-card";
  card.dataset.lessonId = lesson.id;

  const order = document.createElement("span");
  order.className = "course-card__order";
  order.textContent = `第 ${lesson.order} 课`;

  const name = document.createElement("span");
  name.className = "course-card__name";
  name.textContent = lesson.name;

  const keys = document.createElement("span");
  keys.className = "course-card__keys";
  keys.textContent = getLessonKeyDisplay(lesson);

  card.append(order, name, keys);

  const status = document.createElement("span");
  status.className = isCompleted ? "course-card__done" : "course-card__todo";
  status.textContent = isCompleted ? "已完成" : "未完成";
  card.appendChild(status);

  card.addEventListener("click", () => onSelect(lesson));

  return card;
}

function renderCourseList(containerSelector, moduleName, onSelect) {
  const container = document.querySelector(containerSelector);
  container.replaceChildren();

  getLessonGroups().forEach((group) => {
    const groupElement = document.createElement("section");
    groupElement.className = "course-group";

    const title = document.createElement("h3");
    title.className = "course-group__title";
    title.textContent = group.name;

    const cards = document.createElement("div");
    cards.className = "course-group__cards";

    group.lessons.forEach((lesson) => {
      cards.appendChild(createCourseCard(lesson, moduleName, onSelect));
    });

    groupElement.append(title, cards);
    container.appendChild(groupElement);
  });
}

function renderAllCourseLists() {
  renderCourseList("#intro-course-list", "intro", startIntroLesson);
  renderCourseList("#practice-course-list", "practice", selectPracticeLesson);
}

function getPracticeTexts() {
  return textsData || [];
}

function getRandomModes() {
  return randomModesData || [];
}

function createRandomModeCard(modeData) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "text-card";
  card.dataset.randomModeId = modeData.id;

  const title = document.createElement("span");
  title.className = "text-card__title";
  title.textContent = modeData.title;

  const description = document.createElement("span");
  description.className = "text-card__description";
  description.textContent = modeData.description;

  card.append(title, description);
  card.addEventListener("click", () => startFreeRandomMode(modeData));

  return card;
}

function createTextGroupCard(group) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "text-card";
  card.dataset.textGroupId = group.id;

  const title = document.createElement("span");
  title.className = "text-card__title";
  title.textContent = group.title;

  const description = document.createElement("span");
  description.className = "text-card__description";
  description.textContent = group.description;

  const count = document.createElement("span");
  count.className = "text-card__lines";
  count.textContent = `内含 ${group.texts.length} 篇短文`;

  card.append(title, description, count);
  card.addEventListener("click", () => startRandomTextGroup(group));

  return card;
}

function getTextGroups(texts) {
  const groups = [];
  const groupLookup = new Map();

  texts.forEach((textData) => {
    const groupId = textData.groupId || "short-texts";
    const groupTitle = textData.groupTitle || "短文练习";
    const groupDescription = textData.groupDescription || textData.description || "随机练习短文。";

    if (!groupLookup.has(groupId)) {
      const group = {
        id: groupId,
        title: groupTitle,
        description: groupDescription,
        texts: []
      };
      groupLookup.set(groupId, group);
      groups.push(group);
    }

    groupLookup.get(groupId).texts.push(textData);
  });

  return groups;
}

function renderRandomModeList() {
  const container = document.querySelector("#random-mode-list");
  container.replaceChildren();

  const modes = getRandomModes();

  if (modes.length === 0) {
    const message = document.createElement("p");
    message.className = "keyboard-load-error";
    message.textContent = "自由随机练习配置没有加载成功，请确认 data/texts-data.js 与 index.html 在同一个项目目录中。";
    container.appendChild(message);
    return;
  }

  modes.forEach((modeData) => {
    container.appendChild(createRandomModeCard(modeData));
  });
}

function renderTextList() {
  const container = document.querySelector("#text-card-list");
  container.replaceChildren();

  const texts = getPracticeTexts();

  if (texts.length === 0) {
    const message = document.createElement("p");
    message.className = "keyboard-load-error";
    message.textContent = "随机练习文本没有加载成功，请确认 data/texts-data.js 与 index.html 在同一个项目目录中。";
    container.appendChild(message);
    return;
  }

  getTextGroups(texts).forEach((group) => {
    container.appendChild(createTextGroupCard(group));
  });
}

function enterRandomModule() {
  showView("random-view");
  showRandomSelection();
}

function showRandomSelection() {
  refreshProgressViews();
  renderRandomModeList();
  renderTextList();
  document.querySelector("#typing-input").value = "";
  document.querySelector("#typing-target-line").replaceChildren();
  document.querySelector("#random-line-counter").hidden = true;
  randomState.currentText = null;
  randomState.currentTextGroup = null;
  randomState.currentRandomMode = null;
  randomState.practiceType = null;
  randomState.currentTarget = "";
  randomState.currentLineIndex = 0;
  randomState.lineCompleted = false;
  document.querySelector("#random-select-view").hidden = false;
  document.querySelector("#random-drill-view").hidden = true;
}

function getRandomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function getRandomCharacter(characters) {
  const index = Math.floor(Math.random() * characters.length);
  return characters[index];
}

function generateRandomTarget(modeData) {
  const length = getRandomInteger(modeData.minLength, modeData.maxLength);
  const maxConsecutiveSpaces = modeData.maxConsecutiveSpaces || 1;
  const allCharacters = modeData.characters;
  const nonSpaceCharacters = allCharacters.filter((character) => character !== " ");
  const result = [];
  let consecutiveSpaces = 0;

  for (let index = 0; index < length; index += 1) {
    const isEdge = index === 0 || index === length - 1;
    const canUseSpace = !isEdge && consecutiveSpaces < maxConsecutiveSpaces;
    const candidates = canUseSpace ? allCharacters : nonSpaceCharacters;
    const character = getRandomCharacter(candidates);

    result.push(character);
    consecutiveSpaces = character === " " ? consecutiveSpaces + 1 : 0;
  }

  return result.join("");
}

function startFreeRandomMode(modeData) {
  randomState.practiceType = "free";
  randomState.currentRandomMode = modeData;
  randomState.currentText = null;
  randomState.currentTextGroup = null;
  randomState.currentLineIndex = 0;
  randomState.lineCompleted = false;
  document.querySelector("#random-select-view").hidden = true;
  document.querySelector("#random-drill-view").hidden = false;
  document.querySelector("#random-drill-title").textContent = modeData.title;
  document.querySelector("#random-line-counter").hidden = true;
  document.querySelector("#random-complete-actions").hidden = true;
  document.querySelector("#random-footer-actions").hidden = false;
  document.querySelector("#typing-input").disabled = false;
  document.querySelector(".typing-input-label").textContent = "在这里输入这一组";
  generateNextRandomGroup();
}

function generateNextRandomGroup() {
  const input = document.querySelector("#typing-input");

  randomState.currentTarget = generateRandomTarget(randomState.currentRandomMode);
  randomState.lineCompleted = false;
  input.value = "";
  input.disabled = false;
  document.querySelector("#random-line-counter").hidden = true;
  document.querySelector("#typing-status").textContent = "输入这一组字符。";
  document.querySelector("#typing-prompt").textContent = "完全正确后，按 Enter 继续下一组。";
  renderTypingTarget("");

  window.setTimeout(() => {
    input.focus();
  }, 0);
}

function chooseRandomTextFromGroup(group, excludedTextId) {
  const fallbackTexts = group.texts || [];
  const candidates = fallbackTexts.filter((textData) => textData.id !== excludedTextId);
  const availableTexts = candidates.length > 0 ? candidates : fallbackTexts;

  if (availableTexts.length === 0) {
    return null;
  }

  return availableTexts[getRandomInteger(0, availableTexts.length - 1)];
}

function startRandomTextGroup(group, excludedTextId) {
  const selectedText = chooseRandomTextFromGroup(group, excludedTextId);

  if (!selectedText) {
    return;
  }

  startRandomText(selectedText, group);
}

function startRandomText(textData, textGroup) {
  randomState.practiceType = "text";
  randomState.currentText = textData;
  randomState.currentTextGroup = textGroup || null;
  randomState.currentRandomMode = null;
  randomState.currentLineIndex = 0;
  randomState.currentTarget = "";
  randomState.lineCompleted = false;
  document.querySelector("#random-select-view").hidden = true;
  document.querySelector("#random-drill-view").hidden = false;
  document.querySelector("#random-drill-title").textContent = textGroup ? textGroup.title : textData.title;
  document.querySelector("#random-complete-actions").hidden = true;
  document.querySelector("#random-footer-actions").hidden = false;
  document.querySelector("#typing-input").disabled = false;
  document.querySelector(".typing-input-label").textContent = "在这里输入这一行";
  showRandomLine();
}

function getCurrentRandomLine() {
  if (randomState.practiceType === "free") {
    return randomState.currentTarget;
  }

  if (!randomState.currentText) {
    return "";
  }

  return randomState.currentText.lines[randomState.currentLineIndex] || "";
}

function createTypingChar(character, className) {
  const span = document.createElement("span");
  span.className = `typing-char ${className}`;
  span.textContent = character === " " ? "\u00a0" : character;
  return span;
}

function renderTypingTarget(inputValue) {
  const targetLine = getCurrentRandomLine();
  const container = document.querySelector("#typing-target-line");
  container.replaceChildren();

  for (let index = 0; index < targetLine.length; index += 1) {
    const targetCharacter = targetLine[index];
    const inputCharacter = inputValue[index];
    let className = "typing-char--pending";

    if (inputCharacter !== undefined) {
      className = inputCharacter === targetCharacter ? "typing-char--correct" : "typing-char--error";
    }

    container.appendChild(createTypingChar(targetCharacter, className));
  }

  if (inputValue.length > targetLine.length) {
    for (let index = targetLine.length; index < inputValue.length; index += 1) {
      container.appendChild(createTypingChar(inputValue[index], "typing-char--error"));
    }
  }
}

function getTypingLineState(inputValue) {
  const targetLine = getCurrentRandomLine();
  const isComplete = inputValue === targetLine;
  let hasError = inputValue.length > targetLine.length;

  for (let index = 0; index < inputValue.length && index < targetLine.length; index += 1) {
    if (inputValue[index] !== targetLine[index]) {
      hasError = true;
      break;
    }
  }

  return {
    isComplete,
    hasError
  };
}

function showRandomLine() {
  const input = document.querySelector("#typing-input");
  const lineCounter = document.querySelector("#random-line-counter");
  const totalLines = randomState.currentText.lines.length;
  const lineNumber = randomState.currentLineIndex + 1;

  randomState.currentTarget = getCurrentRandomLine();
  input.value = "";
  input.disabled = false;
  randomState.lineCompleted = false;
  lineCounter.hidden = false;
  lineCounter.textContent = `第 ${lineNumber} 行 / 共 ${totalLines} 行`;
  document.querySelector("#typing-status").textContent = "看清这一行，再开始输入。";
  document.querySelector("#typing-prompt").textContent = "输入完全正确后，按 Enter 继续。";
  renderTypingTarget("");

  window.setTimeout(() => {
    input.focus();
  }, 0);
}

function handleTypingInput(event) {
  if (!randomState.practiceType) {
    return;
  }

  const inputValue = event.target.value;
  const lineState = getTypingLineState(inputValue);

  renderTypingTarget(inputValue);

  if (lineState.isComplete) {
    const isLastTextLine = randomState.practiceType === "text"
      && randomState.currentLineIndex === randomState.currentText.lines.length - 1;
    randomState.lineCompleted = true;
    document.querySelector("#typing-status").textContent = randomState.practiceType === "free"
      ? `${CHILD_NAME}，这一组完成了。`
      : `${CHILD_NAME}，这一行完成了。`;
    document.querySelector("#typing-prompt").textContent = randomState.practiceType === "free"
      ? "按 Enter 继续下一组。"
      : isLastTextLine ? "按 Enter 完成本篇。" : "按 Enter 继续下一行。";
    return;
  }

  randomState.lineCompleted = false;

  if (lineState.hasError) {
    document.querySelector("#typing-status").textContent = "这里有一个小错误，改好以后再继续。";
    document.querySelector("#typing-prompt").textContent = "请把红色的位置改正确。";
    return;
  }

  document.querySelector("#typing-status").textContent = "继续输入这一行。";
  document.querySelector("#typing-prompt").textContent = "慢慢来，不着急。";
}

function handleTypingKeydown(event) {
  if (event.key !== "Enter" || !randomState.lineCompleted) {
    return;
  }

  event.preventDefault();

  if (randomState.practiceType === "free") {
    generateNextRandomGroup();
    return;
  }

  goToNextRandomLine();
}

function goToNextRandomLine() {
  if (!randomState.lineCompleted) {
    return;
  }

  if (randomState.currentLineIndex === randomState.currentText.lines.length - 1) {
    finishRandomText();
    return;
  }

  randomState.currentLineIndex += 1;
  showRandomLine();
}

function saveRandomTextProgress() {
  const storage = getProgressModule();

  if (!storage || !randomState.currentText) {
    updateStorageWarning();
    return false;
  }

  const result = storage.markRandomTextCompleted(randomState.currentText.id, CHILD_NAME);

  if (result.saved) {
    progressData = result.progress;
    updateHomeProgress();
  } else {
    updateStorageWarning();
  }

  return result.saved;
}

function finishRandomText() {
  const saved = saveRandomTextProgress();
  document.querySelector("#typing-input").disabled = true;
  document.querySelector("#typing-status").textContent = `${CHILD_NAME}，这一篇完成了。`;
  document.querySelector("#typing-prompt").textContent = saved
    ? "可以再练一篇，也可以返回随机练习。"
    : "本地保存暂时不可用。可以继续练习。";
  document.querySelector("#random-complete-actions").hidden = false;
  document.querySelector("#random-footer-actions").hidden = true;
}

function restartRandomText() {
  if (randomState.currentTextGroup) {
    startRandomTextGroup(randomState.currentTextGroup, randomState.currentText ? randomState.currentText.id : null);
    return;
  }

  if (randomState.currentText) {
    startRandomText(randomState.currentText, null);
  }
}

function createRoundState(config) {
  return {
    moduleName: config.moduleName,
    keyboard: config.keyboard,
    targetKeys: [],
    currentLesson: null,
    statusElement: document.querySelector(config.statusSelector),
    promptElement: document.querySelector(config.promptSelector),
    completeActions: document.querySelector(config.completeActionsSelector),
    footerActions: document.querySelector(config.footerActionsSelector),
    getTargetMessage: config.getTargetMessage,
    getRetryMessage: config.getRetryMessage,
    correctStatus: config.correctStatus,
    correctPrompt: config.correctPrompt,
    completePrompt: config.completePrompt,
    currentTarget: null,
    completedKeys: new Set(),
    shiftIntroStep: "shift",
    advanceTimer: null
  };
}

function clearRoundTimer(state) {
  if (state) {
    window.clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
  }
}

function isSpaceKey(keyData) {
  return keyData.baseKey === "space";
}

function isShiftKey(keyData) {
  return keyData.key === "shiftleft" || keyData.key === "shiftright";
}

function isShiftTarget(keyData) {
  return Boolean(keyData && keyData.shiftRequired);
}

function isCaseTarget(keyData) {
  return Boolean(keyData && keyData.caseTarget);
}

function createLessonTarget(keyboard, targetConfig) {
  const baseKey = targetConfig.baseKey || targetConfig.key;
  const baseKeyData = keyboard.getKeyData(baseKey);

  if (!baseKeyData) {
    return null;
  }

  return {
    ...baseKeyData,
    ...targetConfig,
    baseKey: baseKeyData.baseKey,
    hand: baseKeyData.hand,
    finger: baseKeyData.finger,
    colorGroup: baseKeyData.colorGroup,
    trainable: true
  };
}

function getLessonTargets(keyboard, lesson) {
  if (Array.isArray(lesson.targets)) {
    return lesson.targets
      .map((targetConfig) => createLessonTarget(keyboard, targetConfig))
      .filter(Boolean);
  }

  return lesson.keys
    .map((key) => keyboard.getKeyData(key))
    .filter(Boolean);
}

function getIntroTargetMessage(keyData) {
  if (isCaseTarget(keyData)) {
    const baseKeyLabel = getBaseKeyLabel(keyData);

    if (keyData.letterCase === "upper") {
      return `先点击任意一个 Shift，再点击 ${baseKeyLabel} 键，认识大写 ${keyData.display}。左边或右边的 Shift 都可以。`;
    }

    return `直接点击 ${baseKeyLabel} 键，认识小写 ${keyData.display}。`;
  }

  if (isShiftTarget(keyData)) {
    return `先点击任意一个 Shift，再点击 ${getBaseKeyLabel(keyData)} 键，认识 ${keyData.display} 符号。左边或右边的 Shift 都可以。`;
  }

  if (isSpaceKey(keyData)) {
    return "请用大拇指点击 Space 键";
  }

  return `请用${keyData.hand}${keyData.finger}点击 ${keyData.display} 键`;
}

function getIntroRetryMessage(keyData) {
  if (isCaseTarget(keyData)) {
    const baseKeyLabel = getBaseKeyLabel(keyData);

    if (keyData.letterCase === "upper") {
      return `再试一次，先点 Shift，再点 ${baseKeyLabel}。左边或右边的 Shift 都可以。`;
    }

    return `再试一次，直接点击 ${baseKeyLabel} 键，认识小写 ${keyData.display}。`;
  }

  if (isShiftTarget(keyData)) {
    return `再试一次，先点任意一个 Shift，再点 ${getBaseKeyLabel(keyData)} 键。左边或右边的 Shift 都可以。`;
  }

  if (isSpaceKey(keyData)) {
    return "再试一次，请找大拇指负责的 Space 键";
  }

  return `再试一次，请找${keyData.hand}${keyData.finger}负责的 ${keyData.display} 键`;
}

function getPracticeTargetMessage(keyData) {
  if (isCaseTarget(keyData)) {
    if (keyData.letterCase === "upper") {
      return `请按住 Shift，再按 ${keyData.baseKey}，输入大写 ${keyData.display}。练习时，先用 Shift 输入大写。`;
    }

    return `请按 ${keyData.baseKey} 键，输入小写 ${keyData.display}。`;
  }

  if (isShiftTarget(keyData)) {
    return `请按住 Shift，再按 ${getBaseKeyLabel(keyData)}，输入 ${keyData.display} 符号。左边或右边的 Shift 都可以。`;
  }

  if (isSpaceKey(keyData)) {
    return "请用大拇指按 Space 键";
  }

  return `请用${keyData.hand}${keyData.finger}按 ${keyData.display} 键`;
}

function getPracticeRetryMessage(keyData) {
  if (isCaseTarget(keyData)) {
    if (keyData.letterCase === "upper") {
      return `再试一次，请输入大写 ${keyData.display}。`;
    }

    return `再试一次，请输入小写 ${keyData.display}。`;
  }

  if (isShiftTarget(keyData)) {
    return `再试一次，请按住 Shift，再按 ${getBaseKeyLabel(keyData)}。左边或右边的 Shift 都可以。`;
  }

  return `再试一次，请按 ${keyData.display} 键`;
}

function chooseRandomTarget(candidates) {
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

function getTargetHighlightKeys(keyData) {
  if (!isShiftTarget(keyData)) {
    return [keyData.key];
  }

  return ["shiftleft", "shiftright", keyData.baseKey];
}

function renderKeyboardState(state) {
  state.keyboard.clearHighlights();

  state.completedKeys.forEach((key) => {
    state.keyboard.markCompleted(key);
  });

  if (state.currentTarget) {
    state.keyboard.highlightTargets(getTargetHighlightKeys(state.currentTarget));

    if (isShiftTarget(state.currentTarget)) {
      state.keyboard.pulseTargets(["shiftleft", "shiftright"]);
    }
  }
}

function setRoundTarget(state) {
  const remainingTargets = state.targetKeys.filter((target) => !state.completedKeys.has(target.key));

  if (remainingTargets.length === 0) {
    finishRound(state);
    return;
  }

  state.currentTarget = chooseRandomTarget(remainingTargets);
  state.shiftIntroStep = "shift";
  state.statusElement.textContent = isShiftTarget(state.currentTarget) ? "找到红色的两个键。" : "找到红色的键。";
  state.promptElement.textContent = state.getTargetMessage(state.currentTarget);
  renderKeyboardState(state);
}

function finishRound(state) {
  state.currentTarget = null;
  renderKeyboardState(state);
  state.statusElement.textContent = "本轮完成";
  state.promptElement.textContent = getCompletePrompt(state);
  saveLessonProgress(state);
  state.completeActions.hidden = false;
  state.footerActions.hidden = true;
}

function getCompletePrompt(state) {
  if (isCaseLesson(state.currentLesson)) {
    return `${CHILD_NAME}，认识了大小写切换`;
  }

  return state.completePrompt;
}

function saveLessonProgress(state) {
  const storage = getProgressModule();

  if (!storage || !state.currentLesson) {
    updateStorageWarning();
    return;
  }

  const result = storage.markLessonCompleted(state.moduleName, state.currentLesson, CHILD_NAME);

  if (result.saved) {
    progressData = result.progress;
    updateHomeProgress();
    renderAllCourseLists();
  } else {
    updateStorageWarning();
    state.promptElement.textContent = `${getCompletePrompt(state)}。本地保存暂时不可用。`;
  }
}

function startRound(state) {
  clearRoundTimer(state);
  state.completedKeys = new Set();
  state.currentTarget = null;
  state.shiftIntroStep = "shift";
  state.completeActions.hidden = true;
  state.footerActions.hidden = false;
  setRoundTarget(state);
}

function clearRoundState(state) {
  clearRoundTimer(state);
  state.currentLesson = null;
  state.targetKeys = [];
  state.currentTarget = null;
  state.completedKeys = new Set();
  state.shiftIntroStep = "shift";
  state.keyboard.clearHighlights();
  state.completeActions.hidden = true;
  state.footerActions.hidden = false;
}

function selectLesson(state, lesson) {
  state.currentLesson = lesson;
  state.targetKeys = getLessonTargets(state.keyboard, lesson);
}

function enterIntroModule() {
  showView("intro-view");
  showIntroCourseSelection();
}

function enterPracticeModule() {
  showView("practice-view");
  showPracticeCourseSelection();
}

function showIntroCourseSelection() {
  clearRoundState(introState);
  refreshProgressViews();
  renderAllCourseLists();
  document.querySelector("#intro-course-view").hidden = false;
  document.querySelector("#intro-case-guide-view").hidden = true;
  document.querySelector("#intro-drill-view").hidden = true;
}

function startIntroLesson(lesson) {
  selectLesson(introState, lesson);
  setLessonHeading("#intro-drill-kicker", "#intro-drill-title", lesson, "入门了解");

  if (isCaseLesson(lesson)) {
    showIntroCaseGuide();
    return;
  }

  startIntroDrill();
}

function showIntroCaseGuide() {
  document.querySelector("#intro-course-view").hidden = true;
  document.querySelector("#intro-case-guide-view").hidden = false;
  document.querySelector("#intro-drill-view").hidden = true;
  introState.keyboard.clearHighlights();
}

function startIntroDrill() {
  document.querySelector("#intro-course-view").hidden = true;
  document.querySelector("#intro-case-guide-view").hidden = true;
  document.querySelector("#intro-drill-view").hidden = false;
  startRound(introState);
}

function showPracticeCourseSelection() {
  clearRoundState(practiceState);
  refreshProgressViews();
  renderAllCourseLists();
  document.querySelector("#practice-course-view").hidden = false;
  document.querySelector("#practice-case-guide-view").hidden = true;
  document.querySelector("#practice-ready-view").hidden = true;
  document.querySelector("#practice-drill-view").hidden = true;
  document.querySelector("#practice-ready-number-reminder").hidden = true;
  document.querySelector("#practice-ready-punctuation-reminder").hidden = true;
  document.querySelector("#practice-ready-shift-reminder").hidden = true;
  document.querySelector("#practice-ready-case-reminder").hidden = true;
}

function selectPracticeLesson(lesson) {
  selectLesson(practiceState, lesson);
  document.querySelector("#practice-ready-kicker").textContent = `入门练习 · 第 ${lesson.order} 课`;
  document.querySelector("#practice-title").textContent = "先把手放在基准键上";
  document.querySelector("#practice-ready-number-reminder").hidden = !isNumberLesson(lesson);
  document.querySelector("#practice-ready-punctuation-reminder").hidden = !isPunctuationLesson(lesson);
  document.querySelector("#practice-ready-shift-reminder").hidden = !isShiftPunctuationLesson(lesson);
  document.querySelector("#practice-ready-case-reminder").hidden = !isCaseLesson(lesson);
  setLessonHeading("#practice-drill-kicker", "#practice-drill-title", lesson, "入门练习");

  if (isCaseLesson(lesson)) {
    showPracticeCaseGuide();
    return;
  }

  showPracticeReadyStep();
}

function showPracticeCaseGuide() {
  clearRoundTimer(practiceState);
  practiceState.currentTarget = null;
  document.querySelector("#practice-course-view").hidden = true;
  document.querySelector("#practice-case-guide-view").hidden = false;
  document.querySelector("#practice-ready-view").hidden = true;
  document.querySelector("#practice-drill-view").hidden = true;
}

function showPracticeReadyStep() {
  clearRoundTimer(practiceState);
  practiceState.currentTarget = null;
  document.querySelector("#practice-course-view").hidden = true;
  document.querySelector("#practice-case-guide-view").hidden = true;
  document.querySelector("#practice-ready-view").hidden = false;
  document.querySelector("#practice-drill-view").hidden = true;
}

function startPracticeDrill() {
  document.querySelector("#practice-ready-view").hidden = true;
  document.querySelector("#practice-drill-view").hidden = false;
  startRound(practiceState);
}

function returnHome() {
  clearRoundTimer(introState);
  clearRoundTimer(practiceState);

  if (introState) {
    introState.currentTarget = null;
  }

  if (practiceState) {
    practiceState.currentTarget = null;
  }

  if (randomState) {
    randomState.currentText = null;
    randomState.currentTextGroup = null;
    randomState.currentRandomMode = null;
    randomState.practiceType = null;
    randomState.currentTarget = "";
    randomState.lineCompleted = false;
  }

  showView("home-view");
  refreshProgressViews();
  renderAllCourseLists();
}

function handleIntroKeyClick(keyData) {
  if (!introState.currentTarget) {
    return;
  }

  if (isShiftTarget(introState.currentTarget)) {
    handleIntroShiftKeyClick(keyData);
    return;
  }

  if (keyData.baseKey !== introState.currentTarget.baseKey) {
    introState.statusElement.textContent = "慢慢找，不着急。";
    introState.promptElement.textContent = introState.getRetryMessage(introState.currentTarget);
    return;
  }

  completeCurrentTarget(introState);
}

function handleIntroShiftKeyClick(keyData) {
  const target = introState.currentTarget;

  if (introState.shiftIntroStep === "shift") {
    if (isShiftKey(keyData)) {
      introState.shiftIntroStep = "base";
      introState.statusElement.textContent = "很好，接着找另一个红色的键。";
      introState.promptElement.textContent = isCaseTarget(target)
        ? `再点击 ${getBaseKeyLabel(target)} 键，认识大写 ${target.display}。左边或右边的 Shift 都可以。`
        : `再点击 ${getBaseKeyLabel(target)} 键，认识 ${target.display} 符号。左边或右边的 Shift 都可以。`;
      return;
    }

    introState.statusElement.textContent = "慢慢来，先找任意一个 Shift。";
    introState.promptElement.textContent = introState.getRetryMessage(target);
    return;
  }

  if (!isShiftKey(keyData) && keyData.baseKey === target.baseKey) {
    completeCurrentTarget(introState);
    return;
  }

  introState.shiftIntroStep = "shift";
  introState.statusElement.textContent = "没关系，我们重新来一次。";
  introState.promptElement.textContent = introState.getRetryMessage(target);
}

function handlePracticeScreenClick(event) {
  if (!event.target.closest(".keyboard-key")) {
    return;
  }

  if (!practiceState.currentTarget) {
    return;
  }

  practiceState.statusElement.textContent = "这一关要按真正的键盘哦";
  practiceState.promptElement.textContent = practiceState.getTargetMessage(practiceState.currentTarget);
}

function getKeyboardInputKey(event) {
  if (event.key === " ") {
    return "space";
  }

  return event.key.toLowerCase();
}

function getExpectedKeyboardInput(keyData) {
  if (isShiftTarget(keyData)) {
    return keyData.key.toLowerCase();
  }

  return keyData.baseKey;
}

function isShiftKeyEvent(event) {
  return event.key === "Shift";
}

function handlePracticeCaseKeydown(event, target) {
  if (isShiftKeyEvent(event)) {
    return;
  }

  if (event.key === target.display) {
    event.preventDefault();
    completeCurrentTarget(practiceState);
    return;
  }

  if (target.letterCase === "lower" && event.key === target.display.toUpperCase()) {
    practiceState.statusElement.textContent = `这是大写 ${event.key}。`;
    practiceState.promptElement.textContent = `再试一次，输入小写 ${target.display}。`;
    return;
  }

  if (target.letterCase === "upper" && event.key === target.display.toLowerCase()) {
    practiceState.statusElement.textContent = `这是小写 ${event.key}。`;
    practiceState.promptElement.textContent = `再试一次，请输入大写 ${target.display}。`;
    return;
  }

  practiceState.statusElement.textContent = "慢慢来，不着急。";
  practiceState.promptElement.textContent = practiceState.getRetryMessage(target);
}

function handlePracticeKeydown(event) {
  if (!practiceState || document.querySelector("#practice-view").hidden || !practiceState.currentTarget) {
    return;
  }

  if (isCaseTarget(practiceState.currentTarget)) {
    handlePracticeCaseKeydown(event, practiceState.currentTarget);
    return;
  }

  if (isShiftTarget(practiceState.currentTarget) && isShiftKeyEvent(event)) {
    return;
  }

  const pressedKey = getKeyboardInputKey(event);
  const expectedKey = getExpectedKeyboardInput(practiceState.currentTarget);

  if (pressedKey !== expectedKey) {
    practiceState.statusElement.textContent = "慢慢来，不着急。";
    practiceState.promptElement.textContent = practiceState.getRetryMessage(practiceState.currentTarget);
    return;
  }

  event.preventDefault();
  completeCurrentTarget(practiceState);
}

function completeCurrentTarget(state) {
  state.completedKeys.add(state.currentTarget.key);
  state.currentTarget = null;
  state.shiftIntroStep = "shift";
  state.statusElement.textContent = state.correctStatus;
  state.promptElement.textContent = state.correctPrompt;
  renderKeyboardState(state);

  state.advanceTimer = window.setTimeout(() => {
    setRoundTarget(state);
  }, NEXT_TARGET_DELAY_MS);
}

function clearLocalProgress() {
  const confirmed = window.confirm("确定要清除仙贝的练习进度吗？");

  if (!confirmed) {
    return;
  }

  const storage = getProgressModule();

  if (storage && storage.clearProgress()) {
    refreshProgressViews();
    renderAllCourseLists();
  } else {
    updateStorageWarning();
  }
}

function bindIntroActions() {
  document.querySelector("#start-intro-button").addEventListener("click", enterIntroModule);
  document.querySelector("#intro-restart-button").addEventListener("click", () => startRound(introState));
  document.querySelector("#intro-course-home-button").addEventListener("click", returnHome);
  document.querySelector("#intro-case-guide-start-button").addEventListener("click", startIntroDrill);
  document.querySelector("#intro-case-guide-back-button").addEventListener("click", showIntroCourseSelection);
  document.querySelector("#intro-course-button-complete").addEventListener("click", showIntroCourseSelection);
  document.querySelector("#intro-home-button").addEventListener("click", returnHome);
  document.querySelector("#intro-home-button-complete").addEventListener("click", returnHome);
}

function bindPracticeActions() {
  document.querySelector("#start-practice-button").addEventListener("click", enterPracticeModule);
  document.querySelector("#practice-restart-button").addEventListener("click", () => startRound(practiceState));
  document.querySelector("#practice-course-home-button").addEventListener("click", returnHome);
  document.querySelector("#practice-case-guide-start-button").addEventListener("click", showPracticeReadyStep);
  document.querySelector("#practice-case-guide-back-button").addEventListener("click", showPracticeCourseSelection);
  document.querySelector("#practice-course-button-complete").addEventListener("click", showPracticeCourseSelection);
  document.querySelector("#practice-home-button").addEventListener("click", returnHome);
  document.querySelector("#practice-home-button-complete").addEventListener("click", returnHome);
  document.querySelector("#practice-ready-button").addEventListener("click", startPracticeDrill);
  document.querySelector("#practice-ready-home-button").addEventListener("click", returnHome);
  document.addEventListener("keydown", handlePracticeKeydown);
}

function bindHomeActions() {
  document.querySelector("#clear-progress-button").addEventListener("click", clearLocalProgress);
}

function bindRandomActions() {
  document.querySelector("#start-random-button").addEventListener("click", enterRandomModule);
  document.querySelector("#typing-input").addEventListener("input", handleTypingInput);
  document.querySelector("#typing-input").addEventListener("keydown", handleTypingKeydown);
  document.querySelector("#random-restart-button").addEventListener("click", restartRandomText);
  document.querySelector("#random-other-text-button").addEventListener("click", showRandomSelection);
  document.querySelector("#random-back-to-list-button").addEventListener("click", showRandomSelection);
  document.querySelector("#random-select-home-button").addEventListener("click", returnHome);
  document.querySelector("#random-home-button").addEventListener("click", returnHome);
  document.querySelector("#random-home-button-complete").addEventListener("click", returnHome);
}

async function startApp() {
  const keyboardRoot = document.querySelector("#keyboard-root");
  const practiceKeyboardRoot = document.querySelector("#practice-keyboard-root");
  renderAppVersion();

  if (keyboardRoot && practiceKeyboardRoot && window.KeyTrainKeyboard) {
    try {
      keymapData = await loadKeymap();
      lessonsData = await loadLessons();
      textsData = loadTexts();
      randomModesData = loadRandomModes();
      introKeyboard = window.KeyTrainKeyboard.create(keyboardRoot, { keymap: keymapData });
      practiceKeyboard = window.KeyTrainKeyboard.create(practiceKeyboardRoot, { keymap: keymapData });
      introKeyboard.render();
      practiceKeyboard.render();
      introKeyboard.onKeyClick(handleIntroKeyClick);
      practiceKeyboardRoot.addEventListener("click", handlePracticeScreenClick);
      introState = createRoundState({
        moduleName: "intro",
        keyboard: introKeyboard,
        statusSelector: "#intro-status",
        promptSelector: "#intro-prompt",
        completeActionsSelector: "#intro-complete-actions",
        footerActionsSelector: "#intro-footer-actions",
        getTargetMessage: getIntroTargetMessage,
        getRetryMessage: getIntroRetryMessage,
        correctStatus: `${CHILD_NAME}，做得很好`,
        correctPrompt: "这个键找对了。",
        completePrompt: `${CHILD_NAME}，完成了这一课练习`
      });
      practiceState = createRoundState({
        moduleName: "practice",
        keyboard: practiceKeyboard,
        statusSelector: "#practice-status",
        promptSelector: "#practice-prompt",
        completeActionsSelector: "#practice-complete-actions",
        footerActionsSelector: "#practice-footer-actions",
        getTargetMessage: getPracticeTargetMessage,
        getRetryMessage: getPracticeRetryMessage,
        correctStatus: `${CHILD_NAME}，按对了`,
        correctPrompt: "这个键按对了。",
        completePrompt: `${CHILD_NAME}，完成了这一课练习`
      });
      randomState = {
        practiceType: null,
        currentText: null,
        currentTextGroup: null,
        currentRandomMode: null,
        currentTarget: "",
        currentLineIndex: 0,
        lineCompleted: false
      };
      refreshProgressViews();
      renderAllCourseLists();
      renderRandomModeList();
      renderTextList();
      bindHomeActions();
      bindIntroActions();
      bindPracticeActions();
      bindRandomActions();
    } catch (error) {
      showKeymapLoadError(keyboardRoot, error);
      showKeymapLoadError(practiceKeyboardRoot, error);
    }
  }

  console.info(`${APP_DISPLAY_NAME} 已准备好。`);
}

document.addEventListener("DOMContentLoaded", startApp);
