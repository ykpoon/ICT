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

      // 迴圈將每個學生的資料填入表格
      allData.forEach((student, index) => {
          // 將系統時間轉換為香港時區 (Asia/Hong_Kong)
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

      // 注意這裡的 Content-Type 變成了 text/html，告訴瀏覽器這是一個網頁
      return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }
