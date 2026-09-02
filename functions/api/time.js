export async function onRequest(context) {
  const currentTime = new Date().toISOString();
  return new Response(JSON.stringify({ time: currentTime, message: "這是一個動態 API" }), {
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  });
}
