// functions/api/get-leaderboard.js
export async function onRequest(context) {
  try {
    // 從 KV 資料庫抓取所有的 Key (學生名字)
    const listResult = await context.env.LEADERBOARD.list();
    const keys = listResult.keys;
    
    let leaderboard = [];

    // 迴圈讀取每個學生的分數
    for (const key of keys) {
      const score = await context.env.LEADERBOARD.get(key.name);
      leaderboard.push({ name: key.name, score: parseInt(score) });
    }

    // 將排行榜依分數從高到低排序
    leaderboard.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify(leaderboard), {
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
  } catch (err) {
    return new Response("讀取失敗", { status: 500 });
  }
}
