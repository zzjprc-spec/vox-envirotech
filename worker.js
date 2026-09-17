// Cloudflare Worker: DeepSeek proxy for the VOx assistant.
// Uses DeepSeek's Responses API with the native web_search tool so the
// assistant can answer with up-to-date information.
// Includes off-topic interception and per-IP rate limiting (5/min, 50/day).

const RESPONSES_API = "https://api.deepseek.com/responses";
const CHAT_API = "https://api.deepseek.com/chat/completions";

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

const UNRELATED = [
  "weather", "joke", "movie", "film", "sport", "recipe", "president", "football",
  "game", "music", "crypto", "stock", "translation", "restaurant", "cooking",
  "horoscope", "fortune", "poem", "letter", "essay", "homework", "date",
  "天气", "笑话", "电影", "体育", "菜谱", "总统", "足球", "游戏", "音乐",
  "加密货币", "股票", "翻译", "餐厅", "星座", "占卜", "诗", "作文"
];

const REFERRAL = [
  "quote", "quotation", "price", "pricing", "proposal", "schedule", "appointment",
  "meeting", "talk to", "speak with", "detailed", "in depth", "feasibility",
  "engineering support", "custom", "bespoke", "procurement", "order", "buy",
  "报价", "询价", "价格", "预约", "会议", "详细", "深入", "可行性", "定制",
  "采购", "cotización", "precio", "propuesta", "cita", "reunión", "detallado",
  "personalizado", "comprar"
];

const MESSAGES = {
  en: {
    unrelated: "I'm here to answer questions about VOx Envirotech and related industry topics only, so I can't help with that. For anything else or a deeper discussion, please contact our team:\n\n• James Zhou — Operations Office, Shanghai: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Technical Advisory Office, St. Louis: tdayton@voxenviro.com · +1 636 557 2733 (US) · +86 131 6205 1039 (China)",
    referral: "For a detailed discussion or a tailored proposal, I recommend reaching out to our team directly:\n\n• James Zhou — Operations Office, Shanghai: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Technical Advisory Office, St. Louis: tdayton@voxenviro.com · +1 636 557 2733 (US) · +86 131 6205 1039 (China)",
    rate: "I'm receiving many questions right now. Please try again in a moment, or contact our team for immediate support."
  },
  zh: {
    unrelated: "我仅回答与 VOx Envirotech 及行业知识相关的问题，无法回答此问题。其它事项或深入交流，请联系我们的团队：\n\n• James Zhou — 上海运营办公室：James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — 美国技术咨询办公室：tdayton@voxenviro.com · +1 636 557 2733（美国）· +86 131 6205 1039（中国）",
    referral: "如需深入交流或定制方案，建议直接联系我们的团队：\n\n• James Zhou — 上海运营办公室：James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — 美国技术咨询办公室：tdayton@voxenviro.com · +1 636 557 2733（美国）· +86 131 6205 1039（中国）",
    rate: "当前咨询请求较多，请稍后再试，或直接联系我们的团队获取即时支持。"
  },
  es: {
    unrelated: "Solo respondo preguntas sobre VOx Envirotech y temas relacionados con la industria, por lo que no puedo ayudarle con eso. Para otros asuntos o una conversación más profunda, contacte con nuestro equipo:\n\n• James Zhou — Oficina de operaciones, Shanghái: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Oficina de asesoría técnica, San Luis: tdayton@voxenviro.com · +1 636 557 2733 (EE. UU.) · +86 131 6205 1039 (China)",
    referral: "Para una conversación detallada o una propuesta personalizada, le recomendamos contactar directamente con nuestro equipo:\n\n• James Zhou — Oficina de operaciones, Shanghái: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Oficina de asesoría técnica, San Luis: tdayton@voxenviro.com · +1 636 557 2733 (EE. UU.) · +86 131 6205 1039 (China)",
    rate: "Estoy recibiendo muchas preguntas ahora mismo. Inténtelo de nuevo en un momento o contacte con nuestro equipo para recibir soporte inmediato."
  }
};

// Best-effort in-memory rate limiting fallback (used if no Rate Limiting
// bindings are configured). The native bindings are more reliable.
const MEM = { minute: new Map(), day: new Map() };

function memoryRateOk(ip) {
  const now = Date.now();
  const m = (MEM.minute.get(ip) || { start: now, count: 0 });
  const d = (MEM.day.get(ip) || { start: now, count: 0 });
  if (now - m.start >= 60000) { m.start = now; m.count = 0; }
  if (now - d.start >= 86400000) { d.start = now; d.count = 0; }
  m.count++; d.count++;
  MEM.minute.set(ip, m);
  MEM.day.set(ip, d);
  if (MEM.minute.size > 10000) MEM.minute.clear();
  if (MEM.day.size > 10000) MEM.day.clear();
  return m.count <= 5 && d.count <= 50;
}

async function rateOk(env, ip) {
  if (env.RATE_LIMIT_MINUTE && env.RATE_LIMIT_DAY) {
    const m = await env.RATE_LIMIT_MINUTE.limit({ key: ip });
    const d = await env.RATE_LIMIT_DAY.limit({ key: ip });
    return m.success && d.success;
  }
  return memoryRateOk(ip);
}

function matches(text, keywords) {
  const t = text.toLowerCase();
  return keywords.some((k) => t.indexOf(k.toLowerCase()) !== -1);
}

function langName(lang) {
  return lang === "zh" ? "中文" : lang === "es" ? "西班牙语" : "英语";
}

function extractResponsesText(resp) {
  if (!resp || !Array.isArray(resp.output)) return "";
  let text = "";
  for (const item of resp.output) {
    if (item && item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part && part.type === "output_text" && part.text) text += part.text;
      }
    }
  }
  return text.trim();
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    const jsonHeaders = { ...cors, "Content-Type": "application/json" };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: jsonHeaders });
    }

    const question = String(payload.question || "").trim();
    if (!question) {
      return new Response(JSON.stringify({ error: "question required" }), { status: 400, headers: jsonHeaders });
    }

    const lang = payload.lang === "zh" ? "zh" : payload.lang === "es" ? "es" : "en";
    const msg = MESSAGES[lang] || MESSAGES.en;

    if (matches(question, UNRELATED)) {
      return new Response(JSON.stringify({ answer: msg.unrelated }), { status: 200, headers: jsonHeaders });
    }
    if (matches(question, REFERRAL)) {
      return new Response(JSON.stringify({ answer: msg.referral }), { status: 200, headers: jsonHeaders });
    }

    if (!env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }), { status: 500, headers: jsonHeaders });
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!(await rateOk(env, ip))) {
      return new Response(JSON.stringify({ error: "rate limited", answer: msg.rate }), { status: 429, headers: jsonHeaders });
    }

    const userPrompt = `请用${langName(payload.lang)}回答：${question}`;
    let answer = "";
    try {
      const resp = await fetch(RESPONSES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + env.DEEPSEEK_API_KEY
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          instructions: SYSTEM,
          input: [{ role: "user", content: userPrompt }],
          tools: [{ type: "web_search" }]
        })
      });
      const data = await resp.json();
      answer = extractResponsesText(data);
      if (!answer && !resp.ok) throw new Error("responses failed");
    } catch (e) {
      const r = await fetch(CHAT_API, {
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
            { role: "user", content: userPrompt }
          ]
        })
      });
      const data = await r.json();
      answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    }

    return new Response(JSON.stringify({ answer }), { status: 200, headers: jsonHeaders });
  }
};
