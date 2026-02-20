# Jasper 项目 API 使用情况报告

## 📊 发现的所有 API

### 1. Google APIs
| 功能 | 服务 | 状态 |
|------|------|------|
| OCR (文字识别) | Vision API / Gemini | ✅ 通过环境变量 |
| TTS (语音合成) | Text-to-Speech API | ✅ 通过环境变量 |
| 图片生成 | Imagen / Gemini | ✅ 通过环境变量 |

**注意**: 之前 `proxy/server-google.js` 中有硬编码的 `AIzaSyCc_oN4icJPqQ3c3-Wr8t0y4m8sS_euU6c`，**已删除并清理历史**

---

### 2. MiniMax API
| 功能 | 用途 | 状态 |
|------|------|------|
| TTS (语音合成) | 文字转语音 | ✅ 通过环境变量 |

**文件位置**:
- `proxy/server.js` - 使用 `process.env.MINIMAX_API_KEY`

---

### 3. Supabase
| 功能 | 用途 | 状态 |
|------|------|------|
| 数据库 | PostgreSQL | ✅ 通过环境变量 |
| 存储 | 图片存储 | ✅ 通过环境变量 |
| 认证 | 用户管理 | ✅ 通过环境变量 |

**Keys**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`（客户端使用）
- `SUPABASE_SERVICE_ROLE_KEY`（服务端使用）⚠️ **之前泄露，已轮换**

---

## 🔧 建议的 .env 配置

```bash
# Google APIs (可以共用同一个 Key，或分别创建)
GOOGLE_API_KEY=your_google_api_key_here
# 或者分别设置：
# GOOGLE_VISION_API_KEY=...
# GOOGLE_TTS_API_KEY=...
# GOOGLE_IMAGEN_API_KEY=...

# MiniMax API
MINIMAX_API_KEY=your_minimax_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
```

---

## ⚠️ 安全状态

| API | 风险等级 | 状态 |
|-----|---------|------|
| Google API | 🟡 中 | 旧 Key 已删除，需确认是否撤销 |
| MiniMax API | 🟢 低 | 使用环境变量，安全 |
| Supabase Service Role | 🔴 高 | **已泄露，已轮换** |
| Supabase Anon Key | 🟢 低 | 公开使用，安全 |

---

## ✅ 已完成的安全修复

1. ✅ 删除硬编码的 Google API Key 文件
2. ✅ 清理 Git 历史（filter-repo）
3. ✅ 强制推送到 GitHub
4. ✅ 轮换 Supabase Service Role Key
5. ✅ 创建 .env 文件模板
6. ✅ 更新 .gitignore

---

## 📋 待办事项

- [ ] 在 Google Cloud Console 撤销旧的 API Key: `AIzaSyCc_oN4icJPqQ3c3-Wr8t0y4m8sS_euU6c`
- [ ] 在 .env 文件中填入真实的 API Keys
- [ ] 测试所有功能是否正常工作
- [ ] 考虑为不同功能创建单独的 Google API Keys（更安全）

---

## 🔗 相关链接

- Google Cloud Console: https://console.cloud.google.com/
- Supabase Dashboard: https://app.supabase.com/
- MiniMax 控制台: https://www.minimaxi.com/

---

**报告生成时间**: 2026-02-20
**扫描工具**: Jarvis + grep
**项目路径**: /Users/codebody/.openclaw/workspace/spelling-cards
