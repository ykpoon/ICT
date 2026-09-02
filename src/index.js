export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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
      
      // 確保 4 個資料都有填寫
      if (data.stuClass && data.stuNum && data.stuId && data.stuName && data.score !== undefined) {
        
        // 將 4 個資料與分數打包成一個 JSON 物件
        const studentRecord = JSON.stringify({
          stuClass: data.stuClass,
          stuNum: data.stuNum,
          stuId: data.stuId,
          stuName: data.stuName,
          score: data.score,
          timestamp: new Date().toISOString() // 順便記錄交卷時間
        });

        // 使用「學生編號」作為資料庫的 Key，確保不會重複
        await env.LEADERBOARD.put(data.stuId, studentRecord);
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response("缺少資料", { status: 400 });
    }

    // ==========================================
    // 3. 讀取公開排行榜 API (保護私隱版)
    // ==========================================
    if (url.pathname === '/api/get-leaderboard' && request.method === 'GET') {
      const list = await env.LEADERBOARD.list();
      let leaderboard = [];
      
      for (const key of list.keys) {
        const rawValue = await env.LEADERBOARD.get(key.name);
        if (rawValue) {
          try {
            const studentData = JSON.parse(rawValue);
            // ⚠️ 關鍵：公開榜單只 push 班別、學號、分數，過濾掉姓名與學生編號
            leaderboard.push({ 
              displayTitle: `${studentData.stuClass} 班 ${studentData.stuNum} 號`, 
              score: studentData.score 
            });
          } catch(e) {
             // 略過舊的非 JSON 格式資料
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
      // 回傳完整且排好版的 JSON 數據
      return new Response(JSON.stringify(allData, null, 2), { headers: { "Content-Type": "application/json;charset=utf-8" } });
    }

    // ==========================================
    // 5. 自動處理靜態網頁
    // ==========================================
    return env.ASSETS.fetch(request);
  }
};
