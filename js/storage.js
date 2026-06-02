(function () {
  const STORAGE_KEY = "keyTrainProgress";
  const VERSION = 1;
  let storageAvailable = null;

  function getDefaultProgress(childName) {
    return {
      version: VERSION,
      childName,
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

  function canUseStorage() {
    if (storageAvailable !== null) {
      return storageAvailable;
    }

    try {
      const testKey = `${STORAGE_KEY}:test`;
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
    }

    return storageAvailable;
  }

  function normalizeProgress(rawProgress, childName) {
    const progress = getDefaultProgress(childName);

    if (!rawProgress || typeof rawProgress !== "object") {
      return progress;
    }

    progress.version = VERSION;
    progress.childName = childName;
    progress.lastPracticeAt = rawProgress.lastPracticeAt || null;

    if (rawProgress.modules && typeof rawProgress.modules === "object") {
      progress.modules.intro = rawProgress.modules.intro || {};
      progress.modules.practice = rawProgress.modules.practice || {};
    }

    if (rawProgress.randomPractice && typeof rawProgress.randomPractice === "object") {
      progress.randomPractice.completedTexts = rawProgress.randomPractice.completedTexts || {};
    }

    return progress;
  }

  function loadProgress(childName) {
    if (!canUseStorage()) {
      return getDefaultProgress(childName);
    }

    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);

      if (!rawValue) {
        return getDefaultProgress(childName);
      }

      return normalizeProgress(JSON.parse(rawValue), childName);
    } catch (error) {
      console.warn("读取本地进度失败，将使用空进度。", error);
      return getDefaultProgress(childName);
    }
  }

  function saveProgress(progress) {
    if (!canUseStorage()) {
      return false;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.warn("保存本地进度失败。", error);
      return false;
    }
  }

  function getLessonStorageKey(lesson) {
    return `lesson-${lesson.order}`;
  }

  function markLessonCompleted(moduleName, lesson, childName) {
    const progress = loadProgress(childName);
    const now = new Date().toISOString();
    const lessonKey = getLessonStorageKey(lesson);

    progress.lastPracticeAt = now;
    progress.modules[moduleName][lessonKey] = {
      completed: true,
      completedAt: now
    };

    return {
      progress,
      saved: saveProgress(progress)
    };
  }

  function isLessonCompleted(progress, moduleName, lesson) {
    const lessonProgress = progress.modules[moduleName][getLessonStorageKey(lesson)];
    return Boolean(lessonProgress && lessonProgress.completed);
  }

  function markRandomTextCompleted(textId, childName) {
    const progress = loadProgress(childName);
    const now = new Date().toISOString();

    progress.lastPracticeAt = now;
    progress.randomPractice.completedTexts[textId] = {
      completed: true,
      completedAt: now
    };

    return {
      progress,
      saved: saveProgress(progress)
    };
  }

  function countCompletedTexts(progress, allowedTextIds) {
    const allowedSet = Array.isArray(allowedTextIds) ? new Set(allowedTextIds) : null;

    return Object.entries(progress.randomPractice.completedTexts).filter(([textId, textProgress]) => {
      return textProgress && textProgress.completed;
    }).filter(([textId]) => {
      return !allowedSet || allowedSet.has(textId);
    }).length;
  }

  function countCompleted(progress, moduleName, totalLessons) {
    let completedCount = 0;

    for (let index = 1; index <= totalLessons; index += 1) {
      const lessonProgress = progress.modules[moduleName][`lesson-${index}`];

      if (lessonProgress && lessonProgress.completed) {
        completedCount += 1;
      }
    }

    return completedCount;
  }

  function clearProgress() {
    if (!canUseStorage()) {
      return false;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.warn("清除本地进度失败。", error);
      return false;
    }
  }

  window.KeyTrainStorage = {
    STORAGE_KEY,
    isAvailable: canUseStorage,
    loadProgress,
    saveProgress,
    markLessonCompleted,
    isLessonCompleted,
    markRandomTextCompleted,
    countCompletedTexts,
    countCompleted,
    clearProgress
  };
})();
