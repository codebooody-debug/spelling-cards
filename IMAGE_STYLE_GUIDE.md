# 图片生成风格统一规范

## 📐 尺寸规范
- **分辨率**: 1024x1024 像素 (1:1 正方形)
- **显示尺寸**: 260x260 像素 (卡片中)
- **显示方式**: `object-fit: cover` 确保填充整个区域
- **边框**: 2px 灰色边框 (#f3f4f6)

## 🎨 风格规范

### 颜色方案
- **背景**: 纯白色 (#FFFFFF)
- **主色调**: 柔和粉彩系
  - 柔和蓝: #B8D4E3
  - 柔和粉: #F4C2C2
  - 柔和黄: #F9E4B7
  - 柔和绿: #C1E1C1
  - 柔和紫: #D4C4E0

### 视觉风格
- **风格**: 扁平化2D矢量插图
- **复杂度**: 极简设计，几何形状优先
- **主体**: 单一中心主体，占画面65-75%
- **阴影**: 无阴影、无渐变、无深度效果
- **边框**: 无边框、无框架、无装饰元素
- **文字**: 无文字、无字母、无数字、无水印

### 构图要求
- **居中**: 主体完美居中（水平和垂直）
- **留白**: 四周有充足的白色空间
- **比例**: 主体占画面65-75%
- **背景**: 纯白色，无渐变或暗角

## 🔄 生成流程

1. **检查云端**: 优先从Supabase Storage加载
2. **检查本地**: 其次从IndexedDB缓存加载
3. **实时生成**: 如果都没有，使用优化后的prompt生成新图片
4. **立即显示**: 生成后立即显示本地base64图片
5. **后台上传**: 异步上传到云端Storage
6. **更新缓存**: 同时保存到本地IndexedDB

## ✅ 质量标准

所有生成的图片必须：
- [ ] 尺寸统一为1024x1024像素
- [ ] 风格统一为扁平化粉彩插图
- [ ] 背景统一为纯白色
- [ ] 无文字、无边框、无阴影
- [ ] 主体清晰可识别且居中
- [ ] 适合6-12岁儿童教育使用

## 📝 提示词模板

```
Create a clean, minimalist illustration of "[WORD]" for educational flashcards.

STRICT STYLE GUIDELINES (MUST FOLLOW):
- Background: Pure white (#FFFFFF) only, no gradients, no shadows, no vignettes
- Style: Flat 2D vector illustration, no 3D effects, no photorealism
- Colors: Limited pastel palette - soft blue (#B8D4E3), soft pink (#F4C2C2), soft yellow (#F9E4B7), soft green (#C1E1C1), soft purple (#D4C4E0)
- Composition: Single centered subject, taking up exactly 65-75% of the image area
- Subject: Simple, iconic representation of "[WORD]", immediately recognizable
- Borders: Absolutely NO borders, frames, or decorative edges
- Text: Absolutely NO text, letters, numbers, or watermarks
- Shadows: NO drop shadows, no depth effects, no gradients
- Complexity: Minimal details, clean lines, geometric shapes preferred
- Mood: Friendly, educational, suitable for children aged 6-12
- Consistency: Match the style of children's educational book illustrations

TECHNICAL SPECIFICATIONS:
- Aspect ratio: Perfect square (1:1)
- Resolution: 1024x1024 pixels
- Format: PNG with transparent or pure white background
- Centering: Subject perfectly centered both horizontally and vertically

CONTEXT: "[SENTENCE]"

Generate a consistent, professional educational illustration.
```

## 🚀 部署说明

修改后的代码需要：
1. 重新构建项目: `npm run build`
2. 部署到Vercel: `vercel --prod`
3. 清除浏览器缓存以测试新图片生成

## 📊 验证方法

1. 打开浏览器开发者工具 (F12)
2. 查看Console日志
3. 刷新页面，检查图片加载来源
4. 确认所有图片风格、尺寸一致

---
*最后更新: 2026-02-15*