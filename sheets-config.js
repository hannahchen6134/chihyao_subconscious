// ============================================
// 智堯專欄 · Google Sheets 文章資料來源設定
// ============================================
//
// 設定步驟（青青）：
//
// 1. 開啟 Google 試算表，建立一個新試算表
//    （建議命名：「智堯專欄」）
//
// 2. 把第一個工作表「Sheet1」改名為「文章」
//    （或用任何名稱，但要跟下面 SHEET_NAME 對應）
//
// 3. 第一列填入欄位標題（按以下順序，欄位名可自訂）：
//    A: 文章ID  B: 大標題  C: 副標題  D: 分類
//    E: 日期    F: 摘要    G: 封面圖URL  H: 內文
//
// 4. 點右上角「共用」→「一般存取權」改成
//    「知道連結的使用者」→ 權限「檢視者」→ 完成
//
// 5. 複製試算表網址，找出 ID：
//    https://docs.google.com/spreadsheets/d/【這串就是ID】/edit
//
// 6. 把 ID 貼到下面 SHEET_ID 替換掉「XXXXX...」
//
// ============================================
//
// 給智堯老師的 Markdown 寫法（H 欄內文）：
//   ## 小標題
//   ### 三級小標
//   一般段落直接寫，段落之間空一行
//   **粗體文字**
//   *金色強調底線*
//   > 引言文字
//   - 條列項目
//   ![](圖片URL)  ← 內文圖片
//
// 詳細教學：見「老師上稿教學.html」
//
// ============================================

window.SHEETS_CONFIG = {
  // 把下面這串換成你 Google Sheet 的 ID
  SHEET_ID: '1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',

  // 工作表名稱（預設「文章」，要跟你 Sheet 裡的分頁名一致）
  SHEET_NAME: '文章',

  // 自動快取分鐘數（避免每次讀取都打 Google）
  // 老師新增文章後，最多等這麼久才會看到
  CACHE_MINUTES: 5
};

// 取得 CSV 公開連結（不要修改）
window.getSheetCsvUrl = function() {
  var cfg = window.SHEETS_CONFIG;
  return 'https://docs.google.com/spreadsheets/d/' + cfg.SHEET_ID +
         '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(cfg.SHEET_NAME);
};
