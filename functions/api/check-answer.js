// functions/api/check-answer.js
export async function onRequest(context) {
  // 只允許 POST 請求
  if (context.request.method !== "POST") {
    return new Response("只允許 POST 請求", { status: 405 });
  }

  try {
    // 取得前端傳來的資料 (例如 { "questionId": 1, "selectedOption": "B" })
    const data = await context.request.json();
    const { questionId, selectedOption } = data;

    // 將正確答案藏在後端（學生在瀏覽器絕對看不到）
    const secretAnswers = {
      1: 'B',
      2: 'C',
      3: 'D'
    };

    // 判斷對錯
    const correctAnswer = secretAnswers[questionId];
    const isCorrect = (selectedOption === correctAnswer);

    // 回傳結果給前端
    return new Response(JSON.stringify({
      isCorrect: isCorrect,
      correctAnswer: correctAnswer, // 可選：回傳正確答案讓前端顯示
      message: isCorrect ? "✓ 回答正確！" : `✗ 回答錯誤，正確答案是 (${correctAnswer})`
    }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" }
    });

  } catch (err) {
    return new Response("處理請求發生錯誤", { status: 400 });
  }
}

