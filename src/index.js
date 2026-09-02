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
    // 2. 儲存成績 API
    // ==========================================
    if (url.pathname === '/api/save-score' && request.method === 'POST') {
      const data = await request.json();
      if (data.studentName && data.score !== undefined) {
        // 使用綁定的 KV 資料庫儲存
        await env.LEADERBOARD.put(data.studentName, data.score.toString());
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response("缺少資料", { status: 400 });
    }

    // ==========================================
    // 3. 讀取排行榜 API
    // ==========================================
    if (url.pathname === '/api/get-leaderboard' && request.method === 'GET') {
      const list = await env.LEADERBOARD.list();
      let leaderboard = [];
      
      for (const key of list.keys) {
        const score = await env.LEADERBOARD.get(key.name);
        leaderboard.push({ name: key.name, score: parseInt(score) });
      }
      // 依照分數從高排到低
      leaderboard.sort((a, b) => b.score - a.score);
      
      return new Response(JSON.stringify(leaderboard), { headers: { "Content-Type": "application/json" } });
    }

    // ==========================================
    // 4. 自動處理靜態網頁 (非常重要)
    // 如果網址不是 /api/ 開頭，就自動從 public 資料夾回傳 HTML 畫面
    // ==========================================
    return env.ASSETS.fetch(request);
  }
};
