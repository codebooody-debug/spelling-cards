# 🔒 安全审计报告 - API Keys 全面检查

**审计时间**: 2026-02-20  
**项目路径**: /Users/codebody/.openclaw/workspace/spelling-cards  
**审计工具**: grep + manual review

---

## 🚨 发现的问题汇总

### 问题 1: 备份文件包含硬编码 API Keys
**风险等级**: 🔴 **高危**

**文件位置**:
- `proxy/.env.backup`
- `proxy/.env.save`

**包含的敏感信息**:
```bash
# MiniMax API Key
MINIMAX_API_KEY=sk-api-JQibVDDYI9oALh7Gqt6IzMAPOw4X7dxSWQi1kF67CE5AVfSEAwxZrudgmcq-hTeX-x4k9-WOawV7RbCZPTtOf8EmqK_tm4YT4kte-fegYb8IPrhXuSKcg0g

# Google Gemini API Key
GOOGLE_API_KEY=AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4
```

**风险**:
- 备份文件可能被意外提交到 Git
- 即使主文件清理了，备份文件仍保留敏感信息

**解决方案**:
```bash
# 1. 立即删除备份文件
rm proxy/.env.backup proxy/.env.save

# 2. 清理 Git 历史（如果已提交）
git filter-repo --path proxy/.env.backup --invert-paths --force
git filter-repo --path proxy/.env.save --invert-paths --force

# 3. 强制推送
git push origin --force
```

---

### 问题 2: 当前 .env 文件包含硬编码 Keys
**风险等级**: 🟡 **中危**

**文件位置**:
- `proxy/.env`
- `.env`

**包含的敏感信息**:
- MiniMax API Key
- Google Gemini API Key

**风险**:
- 当前正在使用的 Keys 硬编码在文件中
- 如果文件权限设置不当，可能被其他用户读取

**解决方案**:
使用 `.env.example` 作为模板，真实 Keys 通过环境变量或安全方式注入

---

## 📊 项目中使用的所有 API Keys

### 1. Google Gemini API
| 用途 | 位置 | 状态 |
|------|------|------|
| OCR (文字识别) | `proxy/gemini-ocr.js` | ✅ 使用环境变量 |
| 图片生成 | `proxy/gemini-image.js` | ✅ 使用环境变量 |
| 单词信息丰富 | `proxy/gemini-enrich.js` | ✅ 使用环境变量 |
| Supabase Functions | `supabase/functions/*` | ✅ 使用环境变量 |

**Key 值**: `AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4`

**建议**:
- 这个 Key 用于 Gemini API（OCR + 图片生成）
- 在 Google AI Studio 中管理

---

### 2. MiniMax API
| 用途 | 位置 | 状态 |
|------|------|------|
| TTS (语音合成) | `proxy/server.js` | ✅ 使用环境变量 |
| Supabase Functions | `supabase/functions/text-to-speech` | ✅ 使用环境变量 |

**Key 值**: `sk-api-JQibVDDYI9oALh7Gqt6IzMAPOw4X7dxSWQi1kF67CE5AVfSEAwxZrudgmcq-hTeX-x4k9-WOawV7RbCZPTtOf8EmqK_tm4YT4kte-fegYb8IPrhXuSKcg0g`

---

### 3. Supabase
| Key 类型 | 用途 | 位置 |
|---------|------|------|
| `SUPABASE_URL` | 数据库连接 | 环境变量 |
| `SUPABASE_ANON_KEY` | 客户端认证 | 环境变量 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端认证 | 环境变量 |

**状态**: ✅ 全部使用环境变量（之前泄露的已轮换）

---

## 🛡️ 安全加固建议

### 1. 立即执行（高危）

```bash
# 1. 删除所有备份文件
rm -f proxy/.env.backup proxy/.env.save

# 2. 添加到 .gitignore
echo "*.backup" >> .gitignore
echo "*.save" >> .gitignore
echo "proxy/.env" >> .gitignore

# 3. 提交删除
git add -A
git commit -m "🔒 删除包含 API Keys 的备份文件"

# 4. 如果备份文件曾提交到 Git，清理历史
git filter-repo --path proxy/.env.backup --invert-paths --force 2>/dev/null || true
git filter-repo --path proxy/.env.save --invert-paths --force 2>/dev/null || true

# 5. 强制推送
git push origin --force
```

### 2. 轮换 API Keys（推荐）

**Google Gemini**:
1. 访问 https://aistudio.google.com/app/apikey
2. 删除旧 Key: `AIzaSyD4BmQOjk_jib4vE7gK4Z8_QXoiJnLwas4`
3. 创建新 Key
4. 更新 `.env` 文件

**MiniMax**:
1. 访问 https://www.minimaxi.com/
2. 生成新 API Key
3. 删除旧 Key
4. 更新 `.env` 文件

### 3. 改进 .gitignore

```bash
# 添加到 .gitignore
cat >> .gitignore << 'EOF'

# 环境变量和敏感信息
.env
.env.local
.env.production
.env.*.local
*.env.backup
*.env.save
*.key
*.secret
*.pem

# 代理服务器环境变量
proxy/.env
proxy/.env.*

# 测试文件（可能包含敏感信息）
test-*.js
test-*.ts
EOF
```

### 4. 使用 .env.example

创建 `.env.example` 作为模板（不包含真实 Keys）:

```bash
cat > .env.example << 'EOF'
# Google APIs
GOOGLE_API_KEY=your_google_api_key_here

# MiniMax API
MINIMAX_API_KEY=your_minimax_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF
```

---

## ✅ 检查清单

- [ ] 删除 `proxy/.env.backup`
- [ ] 删除 `proxy/.env.save`
- [ ] 更新 `.gitignore`
- [ ] 轮换 Google Gemini API Key
- [ ] 轮换 MiniMax API Key
- [ ] 验证所有功能正常工作
- [ ] 设置文件权限（仅当前用户可读写 .env）

---

## 📞 后续支持

如需帮助执行以上步骤，请告诉我！
