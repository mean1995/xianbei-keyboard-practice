(function setupKeyboardModule(global) {
  const COMPLETED_GROUP_CLASSES = [
    "finger-left-pinky",
    "finger-left-ring",
    "finger-left-middle",
    "finger-left-index",
    "finger-right-index",
    "finger-right-middle",
    "finger-right-ring",
    "finger-right-pinky",
    "finger-thumbs"
  ];

  function normalizeKey(keyValue) {
    if (keyValue === " ") {
      return "space";
    }

    return String(keyValue).toLowerCase();
  }

  function validateKeymap(keymap) {
    if (!keymap || !Array.isArray(keymap.layout) || !Array.isArray(keymap.keys)) {
      throw new Error("Keyboard keymap must include layout and keys arrays.");
    }
  }

  function createLookup(keymap) {
    const lookup = new Map();

    keymap.keys.forEach((keyData) => {
      lookup.set(normalizeKey(keyData.key), keyData);
      lookup.set(normalizeKey(keyData.display), keyData);
    });

    return lookup;
  }

  function createKeyButton(keyData) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "keyboard-key";
    button.dataset.key = keyData.key;
    button.dataset.baseKey = keyData.baseKey;
    button.dataset.colorGroup = keyData.colorGroup;
    button.dataset.trainable = String(keyData.trainable);
    button.style.setProperty("--key-width", keyData.width || 1);
    button.setAttribute("aria-label", `${keyData.display}，${keyData.hand}${keyData.finger}`);

    if (!keyData.trainable) {
      button.setAttribute("aria-disabled", "true");
      button.classList.add("keyboard-key--disabled");
    }

    if (keyData.shiftDisplay) {
      const shifted = document.createElement("span");
      shifted.className = "keyboard-key__shift";
      shifted.textContent = keyData.shiftDisplay;
      button.appendChild(shifted);
    }

    const main = document.createElement("span");
    main.className = "keyboard-key__main";
    main.textContent = keyData.display;
    button.appendChild(main);

    return button;
  }

  function isShiftKeyData(keyData) {
    return keyData.key === "shiftleft" || keyData.key === "shiftright";
  }

  function createKeyboard(container, options = {}) {
    const keymap = options.keymap;
    validateKeymap(keymap);

    const lookup = createLookup(keymap);
    const elements = new Map();
    const clickCallbacks = new Set();

    function getKeyData(keyValue) {
      return lookup.get(normalizeKey(keyValue)) || null;
    }

    function getBaseKeyData(keyValue) {
      const keyData = getKeyData(keyValue);

      if (!keyData) {
        return null;
      }

      return lookup.get(normalizeKey(keyData.baseKey)) || keyData;
    }

    function getKeyElement(keyValue) {
      const keyData = getKeyData(keyValue);

      if (!keyData) {
        return null;
      }

      return elements.get(normalizeKey(keyData.baseKey));
    }

    function handleKeyClick(event) {
      const keyElement = event.target.closest(".keyboard-key");

      if (!keyElement) {
        return;
      }

      const keyData = getKeyData(keyElement.dataset.key);

      if (!keyData || (!keyData.trainable && !isShiftKeyData(keyData))) {
        return;
      }

      clickCallbacks.forEach((callback) => {
        callback(keyData, {
          element: keyElement,
          originalEvent: event
        });
      });
    }

    function render() {
      container.replaceChildren();
      elements.clear();

      const keyboard = document.createElement("div");
      keyboard.className = "keyboard";
      keyboard.setAttribute("role", "group");
      keyboard.setAttribute("aria-label", "屏幕键盘组件测试区");
      keyboard.addEventListener("click", handleKeyClick);

      keymap.layout.forEach((rowKeys) => {
        const row = document.createElement("div");
        row.className = "keyboard-row";

        rowKeys.forEach((keyValue) => {
          const keyData = getBaseKeyData(keyValue);

          if (!keyData) {
            return;
          }

          const keyButton = createKeyButton(keyData);
          elements.set(normalizeKey(keyData.key), keyButton);
          row.appendChild(keyButton);
        });

        keyboard.appendChild(row);
      });

      container.appendChild(keyboard);
      disableUntrainable();
    }

    function clearHighlights() {
      elements.forEach((element) => {
        element.classList.remove("keyboard-key--target", "keyboard-key--shift-pulse", "keyboard-key--completed", ...COMPLETED_GROUP_CLASSES);
      });
    }

    function highlightTargets(keyValues) {
      elements.forEach((element) => {
        element.classList.remove("keyboard-key--target", "keyboard-key--shift-pulse");
      });

      keyValues.forEach((keyValue) => {
        const element = getKeyElement(keyValue);

        if (element) {
          element.classList.add("keyboard-key--target");
        }
      });
    }

    function highlightTarget(keyValue) {
      highlightTargets([keyValue]);
    }

    function pulseTargets(keyValues) {
      keyValues.forEach((keyValue) => {
        const element = getKeyElement(keyValue);

        if (element) {
          element.classList.add("keyboard-key--shift-pulse");
        }
      });
    }

    function markCompleted(keyValue) {
      const keyData = getKeyData(keyValue);
      const element = getKeyElement(keyValue);

      if (!keyData || !element) {
        return;
      }

      element.classList.remove(...COMPLETED_GROUP_CLASSES);
      element.classList.add("keyboard-key--completed", `finger-${keyData.colorGroup}`);
    }

    function disableUntrainable() {
      elements.forEach((element) => {
        const isTrainable = element.dataset.trainable === "true";
        element.setAttribute("aria-disabled", String(!isTrainable));
        element.classList.toggle("keyboard-key--disabled", !isTrainable);
      });
    }

    function onKeyClick(callback) {
      if (typeof callback !== "function") {
        throw new Error("onKeyClick expects a callback function.");
      }

      clickCallbacks.add(callback);

      return function unsubscribeKeyClick() {
        clickCallbacks.delete(callback);
      };
    }

    return {
      render,
      highlightTarget,
      highlightTargets,
      pulseTargets,
      markCompleted,
      clearHighlights,
      disableUntrainable,
      onKeyClick,
      getKeyData,
      getKeyElement
    };
  }

  global.KeyTrainKeyboard = {
    create: createKeyboard
  };
})(window);
