# Supabase数据清理指南

## 第一步：清理数据库表

1. 打开浏览器，访问 https://app.supabase.com
2. 登录您的Supabase账户
3. 选择项目 "prfdoxcixwpvlbgqydfq"
4. 在左侧导航栏点击 "Table Editor"

### 清理 study_records 表：
- 在表格列表中找到 `study_records`
- 点击表名进入详情页
- 点击右上角的 "Run SQL" 标签
- 在SQL编辑器中输入：
```sql
DELETE FROM study_records;
```
- 点击 "Run" 按钮执行

### 清理 word_media 表：
- 返回表列表，找到 `word_media`
- 点击表名进入详情页
- 点击右上角的 "Run SQL" 标签
- 在SQL编辑器中输入：
```sql
DELETE FROM word_media;
```
- 点击 "Run" 按钮执行

## 第二步：清理 Storage 文件

1. 在左侧导航栏点击 "Storage"
2. 在存储桶列表中找到 "spelling-images"
3. 点击进入，选中所有文件并删除
4. 回到存储桶列表，找到 "word-images"
5. 点击进入，选中所有文件并删除

## 验证清理结果

1. 返回 "Table Editor"
2. 检查 `study_records` 表应该显示 0 条记录
3. 检查 `word_media` 表应该显示 0 条记录
4. 返回 "Storage"，确认两个存储桶都基本为空

完成以上步骤后，您的Supabase数据就完全清理干净了！