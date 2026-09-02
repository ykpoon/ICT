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
      // 2. 儲存成績 API (打包 4 項資料)
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
      // 3. 讀取公開排行榜 API (保護私隱版，過濾無效資料)
      // ==========================================
      if (url.pathname === '/api/get-leaderboard' && request.method === 'GET') {
        const list = await env.LEADERBOARD.list();
        let leaderboard = [];
        
        for (const key of list.keys) {
          const rawValue = await env.LEADERBOARD.get(key.name);
          if (rawValue) {
            try {
              const studentData = JSON.parse(rawValue);
              if (studentData.stuClass && studentData.stuNum) {
                leaderboard.push({ 
                  displayTitle: `${studentData.stuClass} 班 ${studentData.stuNum} 號`, 
                  score: studentData.score 
                });
              }
            } catch(e) {}
          }
        }
        
        leaderboard.sort((a, b) => b.score - a.score);
        return new Response(JSON.stringify(leaderboard), { headers: { "Content-Type": "application/json" } });
      }

      // ==========================================
      // 4. 🤫 教師專屬：隱藏後台數據匯出 API (精美網頁版)
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
        // 依分數由高至低排序
        allData.sort((a, b) => b.score - a.score);

        // 動態生成精美 HTML 表格
        let html = `
        <!DOCTYPE html>
        <html lang="zh-HK">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>👨‍🏫 教師專屬後台 - 完整成績表</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>body { font-family: system-ui, sans-serif; }</style>
        </head>
        <body class="bg-gray-50 text-gray-800 p-8">
            <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="bg-amber-600 px-6 py-5 flex justify-between items-center">
                    <h1 class="text-white text-xl font-bold flex items-center gap-2">
                        📚 電腦網絡基礎 - 完整學生成績表 (私密)
                    </h1>
                    <span class="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">共 ${allData.length} 份紀錄</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-100 text-gray-600 border-b border-gray-200">
                            <tr>
                                <th class="px-6 py-4 font-bold">排名</th>
                                <th class="px-6 py-4 font-bold">班別</th>
                                <th class="px-6 py-4 font-bold">學號</th>
                                <th class="px-6 py-4 font-bold">學生編號</th>
                                <th class="px-6 py-4 font-bold text-amber-900">姓名</th>
                                <th class="px-6 py-4 font-bold text-right text-green-700">分數</th>
                                <th class="px-6 py-4 font-bold text-right">交卷時間</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
        `;

        allData.forEach((student, index) => {
            const dateOpts = { timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            const displayDate = student.timestamp ? new Date(student.timestamp).toLocaleString('zh-HK', dateOpts) : '-';
            
            html += `
                            <tr class="hover:bg-amber-50 transition-colors">
                                <td class="px-6 py-3 font-medium text-gray-900">${index + 1}</td>
                                <td class="px-6 py-3 font-bold">${student.stuClass || '-'}</td>
                                <td class="px-6 py-3">${student.stuNum || '-'}</td>
                                <td class="px-6 py-3 font-mono text-gray-500">${student.stuId || '-'}</td>
                                <td class="px-6 py-3 font-bold text-amber-700">${student.stuName || '-'}</td>
                                <td class="px-6 py-3 text-right font-extrabold text-green-600">${student.score}</td>
                                <td class="px-6 py-3 text-right text-xs text-gray-400">${displayDate}</td>
                            </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;

        return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      }

      // ==========================================
      // 5. 自動處理靜態網頁
      // ==========================================
      return env.ASSETS.fetch(request);
      
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
