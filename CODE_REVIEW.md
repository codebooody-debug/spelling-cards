# 🔍 代码审查报告 - 单词听写助手

## 执行日期：2026-02-12

---

## 🐛 发现的 BUG

### 1. 严重问题

#### BUG-1: FlipCard 组件内存泄漏风险
**位置**: `src/components/FlipCard.jsx`
**问题**: `useEffect` 中使用了 `hasGeneratedRef` 来防止重复生成图片，但在组件卸载时不会重置，可能导致内存泄漏。
**建议**: 
```javascript
useEffect(() => {
  // ... 现有代码 ...
  
  return () => {
    hasGeneratedRef.current = false;
  };
}, [item.target_word]);
```

#### BUG-2: 语音播放竞态条件
**位置**: `src/components/FlipCard.jsx:generateGoogleAudio`
**问题**: 多个并发语音请求可能导致状态混乱，`audioCache` 更新可能有竞态条件。
**建议**: 使用队列或防抖控制播放。

### 2. 中等问题

#### BUG-3: Edge Function 超时未处理
**位置**: `src/pages/HomePage.jsx:86`
**问题**: Edge Function 调用没有设置超时，可能导致请求挂起。
**建议**:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
const edgeResponse = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-spelling`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData }),
    signal: controller.signal
  }
);
clearTimeout(timeoutId);
```

#### BUG-4: 错误边界缺失
**位置**: 所有页面组件
**问题**: 没有错误边界 (Error Boundary)，任何组件崩溃都会导致整个应用白屏。
**建议**: 添加 Error Boundary 组件。

#### BUG-5: localStorage 配额限制
**位置**: `src/services/imageCache.js`
**问题**: 图片缓存使用 localStorage，配额通常为 5MB，容易溢出。
**建议**: 使用 IndexedDB 或限制缓存大小。

### 3. 轻微问题

#### BUG-6: 缺少输入验证
**位置**: `src/pages/ConfirmPage.jsx`
**问题**: 用户输入的数据没有验证，可能导致存储问题。
**建议**: 添加字段验证。

#### BUG-7: 图片 Base64 处理未优化
**位置**: 多处
**问题**: 大图片的 Base64 字符串直接存储在内存中，可能导致性能问题。
**建议**: 压缩图片后再处理。

---

## ⚡ 性能优化建议

### 1. 前端性能

#### OPT-1: 组件懒加载
**问题**: 所有组件一次性加载，首屏渲染慢。
**建议**:
```javascript
const ConfirmPage = lazy(() => import('./pages/ConfirmPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
```

#### OPT-2: 图片懒加载
**位置**: `FlipCard.jsx`
**问题**: 所有单词图片同时加载，造成网络拥堵。
**建议**: 使用 Intersection Observer 实现懒加载。

#### OPT-3: useMemo/useCallback 优化
**位置**: `HomePage.jsx`
**问题**: `groupedByTerm` 和 `sortedTermGroups` 每次渲染都重新计算。
**建议**:
```javascript
const groupedByTerm = useMemo(() => {
  // 计算逻辑
}, [studyRecords]);
```

#### OPT-4: 虚拟列表
**位置**: `StudyPage.jsx`
**问题**: 单词卡片多时会渲染大量 DOM 节点。
**建议**: 使用 react-window 实现虚拟列表。

### 2. 网络优化

#### OPT-5: 请求合并
**位置**: `ConfirmPage.jsx`
**问题**: 每个单词单独调用 enrich-word，并发量过大。
**建议**: 批量处理或使用队列限制并发数。

#### OPT-6: 缓存策略
**问题**: 相同单词的图片和音频重复生成。
**建议**: 已实现缓存，但需要添加缓存过期策略。

---

## 🔒 安全问题

### SEC-1: 环境变量暴露风险
**位置**: `.env`
**问题**: Supabase ANON_KEY 和 URL 在客户端暴露，但这是设计上的，可以接受。但需要确保 RLS 策略正确。
**建议**: ✅ 已配置 RLS，安全。

### SEC-2: 缺少请求限流
**位置**: Edge Functions
**问题**: 没有限流，可能被滥用。
**建议**: 在 Supabase Dashboard 配置 rate limiting。

### SEC-3: 图片上传未限制
**位置**: 文件上传
**问题**: 虽然限制了 10MB，但没有限制文件类型黑名单。
**建议**: 添加 MIME 类型白名单。

---

## 🛠️ 代码质量问题

### 1. 代码重复

#### DUP-1: API 调用逻辑重复
**位置**: 多处
**问题**: Edge Function 调用逻辑在多个文件中重复。
**建议**: 封装统一 API 调用函数。

#### DUP-2: 错误处理重复
**位置**: 多处
**问题**: 错误处理逻辑重复。
**建议**: 封装错误处理 hook。

### 2. 类型安全

#### TYP-1: 缺少 TypeScript
**问题**: 项目使用 JS，缺少类型检查。
**建议**: 迁移到 TypeScript。

#### TYP-2: PropTypes 缺失
**问题**: 组件 props 没有类型验证。
**建议**: 添加 PropTypes。

### 3. 测试覆盖

#### TST-1: 缺少单元测试
**问题**: 没有测试文件。
**建议**: 添加 Jest + React Testing Library。

#### TST-2: 缺少 E2E 测试
**问题**: 没有端到端测试。
**建议**: 添加 Cypress。

---

## 📝 其他建议

### 1. 用户体验

- 添加加载骨架屏
- 添加操作成功/失败提示 (Toast)
- 添加键盘快捷键支持
- 添加离线提示
- 优化移动端体验

### 2. 可访问性 (Accessibility)

- 缺少 ARIA 标签
- 颜色对比度需要检查
- 键盘导航支持不完整

### 3. SEO

- 缺少 meta 标签
- 缺少 sitemap
- 缺少 robots.txt

---

## 🎯 优先级建议

### 高优先级 (立即修复)
1. BUG-3: Edge Function 超时处理
2. BUG-4: 添加 Error Boundary
3. OPT-3: useMemo 优化计算

### 中优先级 (本周修复)
1. BUG-5: localStorage 配额问题
2. OPT-1: 组件懒加载
3. OPT-5: 请求合并优化
4. DUP-1: 封装 API 调用

### 低优先级 (后续优化)
1. TYP-1: TypeScript 迁移
2. TST-1: 添加测试
3. 用户体验改进

---

## 📊 代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能性 | 8/10 | 核心功能完整 |
| 性能 | 6/10 | 有优化空间 |
| 安全性 | 7/10 | 基本安全，可加强 |
| 可维护性 | 6/10 | 代码重复较多 |
| 可测试性 | 4/10 | 缺少测试 |
| **总分** | **6.2/10** | 良好，需改进 |

---

## ✅ 已修复的问题

1. ✅ Edge Function JWT 认证问题
2. ✅ createStudyRecord 异步问题
3. ✅ 前端 Edge Function 调用方式

---

## 🚀 下一步行动

1. **立即**: 修复高优先级 BUG
2. **本周**: 实施中优先级优化
3. **本月**: 完成低优先级改进
4. **持续**: 添加测试和文档
