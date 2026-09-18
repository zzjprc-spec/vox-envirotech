const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

const SYSTEM = [
  "You are VOx, the customer-service assistant for VOx Envirotech. Answer briefly, accurately and helpfully, and always reply in the same language as the user.",
  "",
  "Company facts:",
  "- VOx Envirotech was founded in St. Louis, MO in 2016 and expanded via a Shanghai-based joint venture in 2017.",
  "- Solutions:",
  "  1) Pollution Control: waste incineration (thermal & catalytic oxidizers), exhaust gas treatment (hot gas quench, absorbers/scrubbers, dust & particulate collectors, DeNOx SCR/SNCR), and integrated pollution control with energy/material recovery.",
  "  2) Decarbonization: closed-loop green methanol for maritime shipping; green hydrogen + oxy-combustion; distributed conversion of VOCs and biogas to liquid fuels (including SAF).",
  "  3) Energy Saving: VOx-XiX Permanent Magnet Adjustable Speed Drive (PM ASD), reducing power use, vibration and maintenance for fans/pumps/mixers.",
  "- Products: VOx-XiX (PM ASD), VOx-HY (flue gas components), VOx-MT (catalysts, developed with Matros Technologies).",
  "- Core technologies: Intelligent Combustion Control; High-Temperature Corrosive Quenching (to 1,300°C); Closed-Loop Scrubbing & Regeneration; High-Efficiency SNCR DeNOx (to 90%); Single-Bed Chemical-Looping Reaction.",
  "- Partnerships: XIX Electric Ltd. and Huaye Pipeline Equipment Ltd. (North America); Sulfuric Solutions LLC and Matros Technologies Inc. (China).",
  "- Contact: James Zhou (Operations Office, Shanghai) James.zhou@voxenviro.com, +86 138 1645 2946; Thomas Dayton (Technical Advisory Office, St. Louis) tdayton@voxenviro.com, +1 636 557 2733 (US), +86 131 6205 1039 (China).",
  "",
  "Rules:",
  "- Only answer questions related to VOx Envirotech or relevant industry knowledge. For unrelated questions, politely decline and suggest contacting our team.",
  "- For quotes, pricing, proposals, appointments, or detailed technical discussions, recommend contacting James Zhou or Thomas Dayton (include their contact details).",
  "- Keep answers concise. Use the same language as the user's question."
].join("\n");

app.post("/api/assistant", async (req, res) => {
  if (!DEEPSEEK_KEY) {
    return res.status(503).json({ error: "DEEPSEEK_API_KEY is not set" });
  }

  const { question, lang } = req.body || {};
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  const langName = lang === "zh" ? "中文" : lang === "es" ? "西班牙语" : "英语";

  try {
    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + DEEPSEEK_KEY
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
    const answer =
      data && data.choices && data.choices[0] &&
      data.choices[0].message && data.choices[0].message.content;

    res.json({ answer: answer || "" });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

// Serve the static site from this same folder.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`VOx Envirotech site + assistant running at http://localhost:${PORT}`);
});
