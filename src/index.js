export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // 🚨 系統檢查：確認 KV 資料庫是否有綁定成功
      if (!env.LEADERBOARD && url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: "KV_MISSING", message: "找不到 LEADERBOARD 資料庫綁定！請去 Cloudflare 設定。" }), { status: 500, headers: { "Content-Type": "application/json" } });
      }

      // ==========================================
      // 1. 批改測驗 API
      // ==========================================
      if (url.pathname === '/api/check-answer' && request.method === 'POST') {
        const data = await request.json();
        const secretAnswers = { 1: 'B', 2: 'C', 3: 'D' };
        const isCorrect = (data.selectedOption === secretAnswers[data.questionId]);
        
        return new Response(JSON.stringify({
          isCorrect: isCorrect,
          message: isCorrect ? "✓ 回答正確！" : `✗ 回答錯誤，正確答案是 (${secretAnswers[data.questionId]})`
        }), { headers: { "Content-Type": "application/json" } });
      }

      // ==========================================
      // 2. 儲存成績 API (升級版：打包 4 項資料)
      // ==========================================
      if (url.pathname === '/api/save-score' && request.method === 'POST') {
        const data = await request.json();
        
        if (data.stuClass && data.stuNum && data.stuId && data.stuName && data.score !== undefined) {
          const studentRecord = JSON.stringify({
            stuClass: data.stuClass,
            stuNum: data.stuNum,
            stuId: data.stuId,
            stuName: data.stuName,
            score: data.score,
            timestamp: new Date().toISOString()
          });

          await env.LEADERBOARD.put(data.stuId, studentRecord);
          return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response("缺少資料", { status: 400 });
      }

      // ==========================================
      // 3. 讀取公開排行榜 API (保護私隱版 + 自動過濾舊資料)
      // ==========================================
      if (url.pathname === '/api/get-leaderboard' && request.method === 'GET') {
        const list = await env.LEADERBOARD.list();
        let leaderboard = [];
        
        for (const key of list.keys) {
          const rawValue = await env.LEADERBOARD.get(key.name);
          if (rawValue) {
            try {
              const studentData = JSON.parse(rawValue);
              // ⚠️ 確保資料是新版 (有班別) 才放入排行榜，過濾掉以前的錯誤測試資料
              if (studentData.stuClass && studentData.stuNum) {
                leaderboard.push({ 
                  displayTitle: `${studentData.stuClass} 班 ${studentData.stuNum} 號`, 
                  score: studentData.score 
                });
              }
            } catch(e) {
               // 略過舊的非 JSON 格式資料，避免系統崩潰
            }
          }
        }
        
        leaderboard.sort((a, b) => b.score - a.score);
        return new Response(JSON.stringify(leaderboard), { headers: { "Content-Type": "application/json" } });
      }

      // ==========================================
      // 4. 🤫 教師專屬：隱藏後台數據匯出 API
      // ==========================================
      if (url.pathname === '/api/admin-export-secret-2026' && request.method === 'GET') {
        const list = await env.LEADERBOARD.list();
        let allData = [];
        for (const key of list.keys) {
          const rawValue = await env.LEADERBOARD.get(key.name);
          if (rawValue) {
            try {
              allData.push(JSON.parse(rawValue));
            } catch(e) {}
          }
        }
        allData.sort((a, b) => b.score - a.score);
        return new Response(JSON.stringify(allData, null, 2), { headers: { "Content-Type": "application/json;charset=utf-8" } });
      }

      // ==========================================
      // 5. 自動處理靜態網頁
      // ==========================================
      return env.ASSETS.fetch(request);
      
    } catch (err) {
      // 萬一有任何未知的嚴重錯誤，回傳明確的錯誤訊息
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
