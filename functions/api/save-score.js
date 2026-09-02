// functions/api/save-score.js
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("只允許 POST 請求", { status: 405 });
  }

  try {
    const data = await context.request.json();
    const { studentName, score } = data;

    if (!studentName || score === undefined) {
      return new Response("缺少必要資料", { status: 400 });
    }

    // 將學生成績存入 KV 資料庫
    // 我們用學生的名字當作 Key，分數當作 Value
    await context.env.LEADERBOARD.put(studentName, score.toString());

    return new Response(JSON.stringify({ success: true, message: "成績儲存成功！" }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });
  } catch (err) {
    console.log(err);
    return new Response("儲存失敗", { status: 500 });
  }
}
