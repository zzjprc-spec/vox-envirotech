// Cloudflare Worker: DeepSeek proxy for the VOx assistant.
// Deploy with: wrangler deploy (set the secret first):
//   wrangler secret put DEEPSEEK_API_KEY

const SYSTEM = [
  "You are VOx, the customer-service assistant for VOx Envirotech. Answer briefly, accurately and helpfully, and always reply in the same language as the user.",
  "",
  "Company facts:",
  "- VOx Envirotech was founded in St. Louis, MO in 2016 and expanded via a Shanghai-based joint venture in 2017.",
  "- Solutions: Pollution Control (incineration, exhaust gas treatment, integrated pollution control); Decarbonization (green methanol, green hydrogen + oxy-combustion, VOCs/biogas-to-liquid-fuels); Energy Saving (VOx-XiX PM ASD).",
  "- Products: VOx-XiX (PM ASD), VOx-HY (flue gas components), VOx-MT (catalysts).",
  "- Core technologies: Intelligent Combustion Control; High-Temperature Corrosive Quenching (to 1,300°C); Closed-Loop Scrubbing & Regeneration; High-Efficiency SNCR DeNOx (to 90%); Single-Bed Chemical-Looping Reaction.",
  "- Contact: James Zhou (Operations, Shanghai) James.zhou@voxenviro.com, +86 138 1645 2946; Thomas Dayton (Technical Advisory, St. Louis) tdayton@voxenviro.com, +1 636 557 2733 (US), +86 131 6205 1039 (China).",
  "",
  "Rules:",
  "- Only answer questions about VOx Envirotech or relevant industry knowledge. Decline unrelated questions and suggest contacting our team.",
  "- For quotes, pricing, proposals, appointments, or detailed technical discussions, recommend contacting James Zhou or Thomas Dayton (include contact details).",
  "- Keep answers concise. Use the same language as the user."
].join("\n");

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const question = payload.question || "";
    if (!String(question).trim()) {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const langName = payload.lang === "zh" ? "中文" : payload.lang === "es" ? "西班牙语" : "英语";

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.DEEPSEEK_API_KEY
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.4,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `请用${langName}回答：${question}` }
        ]
      })
    });

    const data = await r.json();
    const answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
};
