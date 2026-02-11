# 🎙️ Google Cloud Text-to-Speech 完整指南

## 📊 免费额度

| 声音类型 | 每月免费额度 | 质量 |
|---------|------------|------|
| **标准声音** | **400万字符** | ⭐⭐⭐ 基础 |
| **WaveNet** | **100万字符** | ⭐⭐⭐⭐⭐ 超自然 |
| **Neural2** | 付费 | ⭐⭐⭐⭐⭐ 最佳 |

---

## 💰 价格详情

**超出免费额度后：**
- 标准声音: $4 / 100万字符
- WaveNet: $16 / 100万字符
- Neural2: $16 / 100万字符

---

## 🌟 WaveNet 技术特点

**什么是 WaveNet？**
- Google DeepMind 开发的深度学习语音合成技术
- 2016年发布，业界革命性突破
- 声音自然度接近真人

**技术优势：**
- ✅ 生成的语音带有自然的语调和停顿
- ✅ 不同语言的口音都很地道
- ✅ 支持调节语速、音调、音量
- ✅ 支持 SSML（语音标记语言）

---

## 🗣️ 声音选择

### 英语声音（推荐）

| 声音名称 | 性别 | 口音 | 类型 |
|---------|------|------|------|
| en-US-Wavenet-D | 男 | 美式 | WaveNet |
| en-US-Wavenet-C | 女 | 美式 | WaveNet |
| en-GB-Wavenet-B | 男 | 英式 | WaveNet |
| en-GB-Wavenet-A | 女 | 英式 | WaveNet |
| en-AU-Wavenet-A | 女 | 澳式 | WaveNet |

### 试听声音
https://cloud.google.com/text-to-speech/docs/voices

---

## 🔧 API 使用方法

### 请求格式

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "input": {
      "text": "Hello, how are you?"
    },
    "voice": {
      "languageCode": "en-US",
      "name": "en-US-Wavenet-D",
      "ssmlGender": "MALE"
    },
    "audioConfig": {
      "audioEncoding": "MP3",
      "speakingRate": 0.85,
      "pitch": 0,
      "volumeGainDb": 0
    }
  }' \
  "https://texttospeech.googleapis.com/v1/text:synthesize"
```

### 响应格式

```json
{
  "audioContent": "//NExAAS..."  // Base64 编码的 MP3
}
```

---

## 🛠️ 可调节参数

| 参数 | 范围 | 说明 |
|------|------|------|
| **speakingRate** | 0.25 - 4.0 | 语速（0.85=慢速，适合学习）|
| **pitch** | -20.0 - 20.0 | 音调（0=正常）|
| **volumeGainDb** | -96.0 - 16.0 | 音量（0=正常）|
| **effectsProfileId** | 数组 | 音效（耳机、音箱等）|

---

## 📱 SSML 高级功能

可以控制更精细的语音表现：

```xml
<speak>
  这里是正常语速。
  <prosody rate="slow" pitch="-2st">
    这里是慢速、低音调。
  </prosody>
  <break time="500ms"/>
  停顿 500 毫秒后继续。
</speak>
```

---

## 🎯 适合场景

✅ **完美适合：**
- 语言学习应用（如我们的单词卡片）
- 有声读物
- 导航系统
- 智能客服
- 视频配音

❌ **不适合：**
- 实时语音对话（延迟约 200-500ms）
- 需要情感表达的角色扮演

---

## 🚀 注册步骤

### 1. 创建 Google Cloud 账号
https://cloud.google.com
- 点击"免费开始使用"
- 登录 Google 账号

### 2. 启用结算（必需）
- 添加信用卡（验证用，不扣费）
- 获得 $300 免费试用金（90天）

### 3. 启用 Text-to-Speech API
- 进入控制台
- 导航菜单 → API和服务 → 库
- 搜索 "Text-to-Speech"
- 点击启用

### 4. 创建 API Key
- 导航菜单 → API和服务 → 凭据
- 创建凭据 → API密钥
- 复制密钥

---

## 💡 使用时长计算

**当前项目（每天练习10个单词）：**

| 使用强度 | 每天消耗 | 免费额度可用 |
|---------|---------|-------------|
| 轻度 | 400字符 | **27年** |
| 中度 | 800字符 | **13年** |
| 重度 | 2000字符 | **5.5年** |

---

## ⚠️ 注意事项

1. **信用卡验证**
   - 必须绑定信用卡才能使用免费层
   - 不会自动扣费，只是验证身份

2. **免费层永久有效**
   - 每月自动重置额度
   - 不是试用期，是永久免费

3. **配额限制**
   - 每分钟最多 300 次请求
   - 一般使用不会触达

---

## 🔍 与其他服务对比

| 服务 | 免费额度 | 质量 | 国内访问 | 注册难度 |
|------|---------|------|---------|---------|
| **Google Cloud** | 🥇 400万/月 | 🥇 WaveNet最佳 | ⭐⭐⭐ | 中等 |
| Azure | 50万/月 | ⭐⭐⭐⭐ | 🥇 最快 | 中等 |
| MiniMax | 不确定 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 简单 |
| ElevenLabs | 1万字符 | 🥇 最自然 | ⭐⭐ | 简单 |
| 浏览器原生 | 无限 | ⭐⭐⭐ | 🥇 最快 | 无需注册 |

---

## 🎯 总结

**Google Cloud TTS 优点：**
- ✅ 免费额度最大（400万字符/月）
- ✅ WaveNet 质量业界顶尖
- ✅ 27年免费使用（对单词卡片来说）
- ✅ Google 出品，稳定可靠

**缺点：**
- ⚠️ 需要绑定信用卡
- ⚠️ 国内访问速度一般（需代理）

---

## ❓ 常见问题

**Q: 免费额度会过期吗？**
A: 不会！每月自动重置，永久有效。

**Q: 超出免费额度会怎样？**
A: API 会返回错误，不会自动扣费。需要手动升级到付费。

**Q: 需要代理吗？**
A: 国内访问建议开代理，否则可能较慢或不稳定。

**Q: 可以商用吗？**
A: 可以！免费层允许商业使用。

---

**要注册 Google Cloud TTS 吗？**
