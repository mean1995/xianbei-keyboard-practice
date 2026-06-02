# Keyboard Data Structure

## 1. 数据源

RC1.0 使用本地 JS 数据文件作为运行时主数据源：

- `data/keymap-data.js`
- `data/lessons-data.js`
- `data/texts-data.js`

对应 JSON 文件保留为结构化说明和备用数据。应用不依赖服务器读取数据。

## 2. 键盘数据

键盘数据暴露为：

`window.KEY_TRAIN_KEYMAP`

顶层字段：

- `layout`：屏幕键盘按行排列。
- `keys`：每个键的数据。

每个可训练键包含：

- `key`
- `display`
- `row`
- `hand`
- `finger`
- `colorGroup`
- `trainable`
- `shiftRequired`
- `baseKey`

可选字段：

- `shiftDisplay`
- `width`

## 3. 功能键

功能键保留在键盘中，但不作为训练目标：

- Tab
- Caps Lock
- Shift
- Ctrl
- Alt
- Backspace
- Enter

Shift 本身 `trainable: false`，但可被高亮，并参与 Shift 组合键的两步点击流程。

Caps Lock `trainable: false`，在第 27 课中只作为讲解对象，不作为必须练习目标。

## 4. Shift 组合数据

Shift 组合符号包含：

- `key`：目标符号，例如 `!`
- `display`：目标符号，例如 `!`
- `baseKey`：基础键，例如 `1`
- `shiftRequired: true`
- `hand`
- `finger`
- `colorGroup`
- `trainable: true`

`hand` 和 `finger` 指 baseKey 负责的手指，不指 Shift 键本身。

## 5. 课程数据

课程数据暴露为：

`window.KEY_TRAIN_LESSONS`

结构：

- `version`
- `groups`
- `groups[].id`
- `groups[].name`
- `groups[].lessons`
- `lesson.id`
- `lesson.order`
- `lesson.name`
- `lesson.keys`
- `lesson.displayKeys`
- `lesson.targets`

当前共 27 课：

- 1-6：基准键课程。
- 7-15：字母扩展课程。
- 16-18：数字键课程。
- 19-21：普通标点课程。
- 22-26：Shift 标点课程。
- 27：大小写课程。

## 6. 大小写课程数据

第 27 课为：

- `id: case-toggle-27`
- `order: 27`
- `name: 大小写切换`
- `displayKeys: ["a", "A", "f", "F", "j", "J"]`

每个目标使用 `targets` 描述：

- `key`
- `display`
- `baseKey`
- `shiftRequired`
- `caseTarget`
- `letterCase`

小写目标 `shiftRequired: false`，大写目标 `shiftRequired: true`。

## 7. 自由随机练习数据

自由随机练习暴露为：

`window.KEY_TRAIN_RANDOM_MODES`

每个入口包含：

- `id`
- `title`
- `description`
- `minLength`
- `maxLength`
- `maxConsecutiveSpaces`
- `characters`

当前 4 个入口：

- 基础随机练习。
- 综合随机练习 - 进阶 1。
- 综合随机练习 - 进阶 2。
- 综合随机练习 - 进阶 3。

`minLength` 为 15，`maxLength` 为 20。该规则为内部生成规则，不显示在卡片上。

## 8. 短文练习数据

短文练习暴露为：

`window.KEY_TRAIN_TEXTS`

每篇短文包含：

- `id`
- `groupId`
- `groupTitle`
- `groupDescription`
- `title`
- `description`
- `lines`

当前分组：

- `Simple English`：30 篇短文。
- `Numbers and Signs`：30 篇短文。

前端只显示两个分组卡片，点击后从对应分组随机抽取 1 篇。

## 9. 本地进度数据

存储 key：

`keyTrainProgress`

顶层结构：

- `version`
- `childName`
- `lastPracticeAt`
- `modules`
- `modules.intro`
- `modules.practice`
- `randomPractice`
- `randomPractice.completedTexts`

课程完成记录：

```json
{
  "completed": true,
  "completedAt": "2026-xx-xxTxx:xx:xx"
}
```

课程 key 使用 `lesson-${order}`。第 27 课加入后，旧的 1-26 课进度仍然有效。

## 10. 数据边界

- 不保存数据库连接信息。
- 不保存服务器地址。
- 不保存账号令牌。
- 不保存云同步字段。
- 不保存头像、生日、年龄或其他隐私信息。
- “仙贝”只作为静态显示称呼。
