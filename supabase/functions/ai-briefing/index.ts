// AI 채용 브리핑 요약 (Supabase Edge Function)
// 브라우저에서 집계 숫자만 받아 Claude로 한국어 요약을 만들어 돌려준다.
// API 키는 브라우저 코드에 두지 않고 Supabase 시크릿(ANTHROPIC_API_KEY)으로만 보관한다.
//
// 배포:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy ai-briefing
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `당신은 속기사 교육기관 취업지원팀의 업무 보조입니다.
아래 JSON은 채용 공고·지원 현황을 집계한 숫자입니다. 이 숫자만 근거로, 담당자가 아침에 30초 안에 읽을 수 있는 한국어 브리핑을 쓰세요.

형식:
**한 줄 요약**
(전체 상황 한 문장)

**눈여겨볼 점**
- 2~4개. 숫자를 그대로 인용하고, 왜 중요한지 짧게.

**이번 주 할 일**
1. 2~3개. 누가 무엇을 하면 되는지 구체적으로. 마감이 가까운 공고가 있으면 공고명과 날짜를 적으세요.

JSON에 없는 사실은 지어내지 말고, 데이터가 부족하면 그렇다고 쓰세요. 존댓말, 짧은 문장.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: { period?: string; stats?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "잘못된 요청 형식입니다." }, 400);
  }
  const statsText = JSON.stringify({ period: body.period ?? "전체 기간", stats: body.stats ?? {} });
  if (statsText.length > 20000) return json({ error: "요청 데이터가 너무 큽니다." }, 413);

  const client = new Anthropic(); // ANTHROPIC_API_KEY 시크릿을 자동으로 읽는다
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: statsText }],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "AI가 이 요청에 답하지 않았습니다. 잠시 후 다시 시도해 주세요." }, 502);
    }
    const summary = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return json({ summary, model: response.model });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return json({ error: "ANTHROPIC_API_KEY 시크릿이 없거나 올바르지 않습니다." }, 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return json({ error: "요청이 많아 잠시 후 다시 시도해 주세요." }, 429);
    }
    if (err instanceof Anthropic.APIError) {
      return json({ error: `AI 요청 오류 (${err.status ?? "?"})` }, 502);
    }
    return json({ error: "AI 요약을 만들지 못했습니다." }, 500);
  }
});
