window.KEY_TRAIN_LESSONS = {
  "version": 1,
  "groups": [
    {
      "id": "home-row",
      "name": "基准键课程",
      "lessons": [
        {
          "id": "home-row-1",
          "order": 1,
          "name": "找到食指",
          "keys": ["f", "j"]
        },
        {
          "id": "home-row-2",
          "order": 2,
          "name": "认识中指",
          "keys": ["d", "k"]
        },
        {
          "id": "home-row-3",
          "order": 3,
          "name": "认识无名指",
          "keys": ["s", "l"]
        },
        {
          "id": "home-row-4",
          "order": 4,
          "name": "认识小指",
          "keys": ["a", ";"]
        },
        {
          "id": "home-row-5",
          "order": 5,
          "name": "认识大拇指",
          "keys": ["space"]
        },
        {
          "id": "home-row-6",
          "order": 6,
          "name": "基准键综合练习",
          "keys": ["a", "s", "d", "f", "j", "k", "l", ";", "space"]
        }
      ]
    },
    {
      "id": "letters",
      "name": "字母扩展课程",
      "lessons": [
        {
          "id": "letters-7",
          "order": 7,
          "name": "上排食指",
          "keys": ["r", "t", "y", "u"]
        },
        {
          "id": "letters-8",
          "order": 8,
          "name": "上排中指",
          "keys": ["e", "i"]
        },
        {
          "id": "letters-9",
          "order": 9,
          "name": "上排无名指",
          "keys": ["w", "o"]
        },
        {
          "id": "letters-10",
          "order": 10,
          "name": "上排小指",
          "keys": ["q", "p"]
        },
        {
          "id": "letters-11",
          "order": 11,
          "name": "下排食指",
          "keys": ["v", "b", "n", "m"]
        },
        {
          "id": "letters-12",
          "order": 12,
          "name": "下排中指",
          "keys": ["c", ","]
        },
        {
          "id": "letters-13",
          "order": 13,
          "name": "下排无名指",
          "keys": ["x", "."]
        },
        {
          "id": "letters-14",
          "order": 14,
          "name": "下排小指",
          "keys": ["z", "/"]
        },
        {
          "id": "letters-15",
          "order": 15,
          "name": "A-Z 综合练习",
          "keys": [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q",
            "r",
            "s",
            "t",
            "u",
            "v",
            "w",
            "x",
            "y",
            "z"
          ]
        }
      ]
    },
    {
      "id": "numbers",
      "name": "数字键课程",
      "lessons": [
        {
          "id": "numbers-16",
          "order": 16,
          "name": "左手数字",
          "keys": ["1", "2", "3", "4", "5"]
        },
        {
          "id": "numbers-17",
          "order": 17,
          "name": "右手数字",
          "keys": ["6", "7", "8", "9", "0"]
        },
        {
          "id": "numbers-18",
          "order": 18,
          "name": "数字综合练习",
          "keys": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        }
      ]
    },
    {
      "id": "punctuation",
      "name": "普通标点课程",
      "lessons": [
        {
          "id": "punctuation-19",
          "order": 19,
          "name": "右上标点",
          "keys": ["-", "=", "[", "]", "\\"]
        },
        {
          "id": "punctuation-20",
          "order": 20,
          "name": "中下标点",
          "keys": [";", "'", ",", ".", "/"]
        },
        {
          "id": "punctuation-21",
          "order": 21,
          "name": "普通标点综合练习",
          "keys": ["-", "=", "[", "]", "\\", ";", "'", ",", ".", "/"]
        }
      ]
    },
    {
      "id": "shift-punctuation",
      "name": "Shift 标点课程",
      "lessons": [
        {
          "id": "shift-punctuation-22",
          "order": 22,
          "name": "数字上方符号",
          "keys": ["!", "@", "#", "$", "%"]
        },
        {
          "id": "shift-punctuation-23",
          "order": 23,
          "name": "右手数字符号",
          "keys": ["^", "&", "*", "(", ")"]
        },
        {
          "id": "shift-punctuation-24",
          "order": 24,
          "name": "右上 Shift 标点",
          "keys": ["_", "+", "{", "}", "|"]
        },
        {
          "id": "shift-punctuation-25",
          "order": 25,
          "name": "中下 Shift 标点",
          "keys": [":", "\"", "<", ">", "?"]
        },
        {
          "id": "shift-punctuation-26",
          "order": 26,
          "name": "Shift 标点综合练习",
          "keys": [
            "!",
            "@",
            "#",
            "$",
            "%",
            "^",
            "&",
            "*",
            "(",
            ")",
            "_",
            "+",
            "{",
            "}",
            "|",
            ":",
            "\"",
            "<",
            ">",
            "?"
          ]
        }
      ]
    },
    {
      "id": "case",
      "name": "大小写课程",
      "lessons": [
        {
          "id": "case-toggle-27",
          "order": 27,
          "name": "大小写切换",
          "keys": ["a", "A", "f", "F", "j", "J"],
          "displayKeys": ["a", "A", "f", "F", "j", "J"],
          "targets": [
            {"key":"a","display":"a","baseKey":"a","shiftRequired":false,"caseTarget":true,"letterCase":"lower"},
            {"key":"A","display":"A","baseKey":"a","shiftRequired":true,"caseTarget":true,"letterCase":"upper"},
            {"key":"f","display":"f","baseKey":"f","shiftRequired":false,"caseTarget":true,"letterCase":"lower"},
            {"key":"F","display":"F","baseKey":"f","shiftRequired":true,"caseTarget":true,"letterCase":"upper"},
            {"key":"j","display":"j","baseKey":"j","shiftRequired":false,"caseTarget":true,"letterCase":"lower"},
            {"key":"J","display":"J","baseKey":"j","shiftRequired":true,"caseTarget":true,"letterCase":"upper"}
          ]
        }
      ]
    }
  ]
};
