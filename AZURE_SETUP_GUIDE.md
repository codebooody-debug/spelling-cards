# 🔑 Azure Speech Service API Key 获取指南

## 步骤 1: 登录 Azure Portal

1. 访问: https://portal.azure.com
2. 使用你的微软账号登录

---

## 步骤 2: 创建 Speech Service 资源

1. 点击左上角 **"创建资源"** (Create a resource)
2. 在搜索框输入 **"Speech"**
3. 选择 **"Speech"** (语音服务)
4. 点击 **"创建"** (Create)

---

## 步骤 3: 配置基本信息

填写以下信息:

| 字段 | 建议填写 |
|------|---------|
| **订阅** (Subscription) | 选择你的订阅（通常有"免费试用"）|
| **资源组** (Resource group) | 点击"新建"，输入 "spelling-cards-rg" |
| **区域** (Region) | 选择 **"East Asia"** (东亚，香港) 或 **"Southeast Asia"** (东南亚，新加坡) |
| **名称** (Name) | 输入 "spelling-cards-speech" |
| **定价层** (Pricing tier) | 选择 **"Free F0"** (免费层) |

⚠️ **注意**: 一定要选择 **"Free F0"**，这是免费额度！

点击 **"审阅 + 创建"** → **"创建"**

等待部署完成（约 1-2 分钟）

---

## 步骤 4: 获取 API Key

1. 部署完成后，点击 **"转到资源"** (Go to resource)
2. 在左侧菜单点击 **"密钥和终结点"** (Keys and Endpoint)
3. 你会看到:
   - **密钥 1** (KEY 1) - 复制这个！
   - **密钥 2** (KEY 2) - 备用
   - **位置/区域** (Location) - 如 "eastasia"
   - **终结点** (Endpoint) - API 地址

---

## 步骤 5: 保存信息

把以下信息发给我:

```
API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Location: eastasia (或其他你选择的区域)
```

---

## 📋 完整配置信息示例

```
API Key: 1234567890abcdef1234567890abcdef
Location: eastasia
```

---

## ⚠️ 重要提醒

1. **免费层限制**:
   - 每月 50万字符（文本转语音）
   - 每分钟 20个请求

2. **不要分享 Key**: API Key 是你的私人凭证

3. **安全保存**: 建议保存在密码管理器中

---

## 🚀 下一步

获取到 API Key 后，告诉我:
1. 粘贴 API Key
2. 告诉我 Location (区域)

我会帮你:
- ✅ 修改代码适配 Azure
- ✅ 测试语音效果
- ✅ 确保稳定运行

---

## 💡 常见问题

**Q: 免费层会过期吗？**
A: 不会！每月自动重置 50万字符额度，永久免费。

**Q: 超出免费额度会怎样？**
A: 会被限制调用，不会自动扣费。需要升级到付费层才能继续使用。

**Q: 可以创建多个免费资源吗？**
A: 每个订阅只能创建 1 个免费 Speech 资源。

---

**获取到 Key 后贴给我！**
