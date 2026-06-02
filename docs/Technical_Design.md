# Technical Design

## 1. 技术目标

RC1.0 是一个完全离线运行的静态网页应用。

必须持续满足：

- HTML。
- CSS。
- Vanilla JavaScript。
- 双击 `index.html` 即可运行。
- 不使用 React、Vue、Node、Electron。
- 不使用服务器。
- 不使用数据库。
- 不依赖 CDN、远程字体、远程图片或外部资源。
- 不加载外部 txt。

## 2. 运行入口

入口文件：`index.html`。

加载顺序：

1. `css/reset.css`
2. `css/style.css`
3. `data/keymap-data.js`
4. `data/lessons-data.js`
5. `data/texts-data.js`
6. `js/keyboard.js`
7. `js/storage.js`
8. `js/app.js`

主数据源使用本地 JS 文件暴露的全局数据，避免 `file://` 下读取 JSON 的兼容问题。JSON 文件保留为结构化说明和备用数据。

## 3. 应用常量

`js/app.js` 中维护：

- `APP_DISPLAY_NAME = "仙贝的键盘练习"`
- `CHILD_NAME = "仙贝"`
- `APP_VERSION = "RC1.0"`

这些常量只用于本地显示，不构成账号、登录名或多用户档案。

## 4. 模块划分

- `js/app.js`：页面流程、课程流程、随机练习流程、版本显示。
- `js/keyboard.js`：屏幕键盘渲染、点击回调、高亮、完成色、Shift 闪烁。
- `js/storage.js`：本地进度读取、保存、清除。
- `data/keymap-data.js`：键位、手指、颜色分区、Shift 组合信息。
- `data/lessons-data.js`：27 课课程配置。
- `data/texts-data.js`：自由随机字符池和短文库。

## 5. 键盘数据

键盘组件使用 `window.KEY_TRAIN_KEYMAP`。

支持：

- 完整 QWERTY 屏幕键盘。
- 可训练键高亮。
- 已完成键按手指颜色显示。
- 两个 Shift 同时高亮和缓慢闪烁。
- 不可训练键禁用训练目标。
- `onKeyClick(callback)` 支持入门了解鼠标点击判断。

## 6. 课程数据

课程使用 `window.KEY_TRAIN_LESSONS`。

当前共 27 课：

- 1-6：基准键课程。
- 7-15：字母扩展课程。
- 16-18：数字键课程。
- 19-21：普通标点课程。
- 22-26：Shift 标点课程。
- 27：大小写课程。

第 27 课使用 `targets` 描述 `a A f F j J`，并通过 `caseTarget` 和 `letterCase` 区分大小写。

## 7. 随机练习数据

自由随机练习使用 `window.KEY_TRAIN_RANDOM_MODES`。

4 个入口：

- 基础随机练习。
- 综合随机练习 - 进阶 1。
- 综合随机练习 - 进阶 2。
- 综合随机练习 - 进阶 3。

每组内部生成 15-20 个字符，避免连续过多空格。长度规则不显示给儿童。

短文练习使用 `window.KEY_TRAIN_TEXTS`。

- `Simple English` 分组内部 30 篇短文。
- `Numbers and Signs` 分组内部 30 篇短文。
- 前端只渲染两个分组卡片。
- 点击分组卡片后随机抽取 1 篇。

## 8. 输入判断

入门了解：

- 通过屏幕键盘点击判断。
- 普通目标点 baseKey。
- Shift 组合目标先点任意 Shift，再点 baseKey。
- 点错不继续。

入门练习：

- 通过实体键盘 `keydown` 判断。
- 普通目标比较输入键。
- Shift 组合目标比较浏览器返回的目标字符。
- 大小写目标比较实际输入的小写或大写字符。
- 按错不继续。

随机练习：

- 通过文本输入框实时校验。
- 错误字符红色显示。
- 完全匹配目标文本后才允许 `Enter` 继续。

## 9. 本地存储

存储 key：`keyTrainProgress`。

保存内容：

- `version`
- `childName`
- `lastPracticeAt`
- `modules.intro`
- `modules.practice`
- `randomPractice.completedTexts`

课程完成状态以 `lesson-${order}` 保存，因此从 26 课扩展到 27 课不会破坏旧进度。

如果 `localStorage` 不可用，应用仍可练习，并显示温和提示。

## 10. 不实现范围

RC1.0 不实现：

- 速度统计。
- 正确率统计。
- 错误次数统计。
- 排行榜。
- 成就系统。
- 多用户系统。
- 家长模式。
- 教师模式。
- 账号系统。
- 云同步。
- 自定义导入文本。
- 外部 txt 加载。
