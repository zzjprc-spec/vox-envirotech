import os
from flask import Flask, jsonify, request
from openai import OpenAI

app = Flask(__name__, static_folder=".", static_url_path="")
client = OpenAI(
    api_key=os.environ["DEEPSEEK_API_KEY"],
    base_url="https://api.deepseek.com",
)

SYSTEM = "\n".join(
    [
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
        "- Partnerships: Shanghai XIX Electric Co., Ltd. and Taizhou Huaye Pipeline Equipment Ltd. (North America); Sulfuric Solutions LLC and Matros Technologies Inc. (China).",
        "- Contact: James Zhou (Operations Office, Shanghai) James.zhou@voxenviro.com, +86 138 1645 2946; Thomas Dayton (Technical Advisory Office, St. Louis) tdayton@voxenviro.com, +1 636 557 2733 (US), +86 131 6205 1039 (China).",
        "",
        "Rules:",
        "- Only answer questions related to VOx Envirotech or relevant industry knowledge. For unrelated questions, politely decline and suggest contacting our team.",
        "- For quotes, pricing, proposals, appointments, or detailed technical discussions, recommend contacting James Zhou or Thomas Dayton (include their contact details).",
        "- Keep answers concise. Use the same language as the user's question.",
    ]
)


@app.post("/api/assistant")
def assistant():
    if not os.environ.get("DEEPSEEK_API_KEY"):
        return jsonify({"error": "DEEPSEEK_API_KEY is not set"}), 503

    payload = request.get_json(silent=True) or {}
    question = payload.get("question")
    if not question or not str(question).strip():
        return jsonify({"error": "question is required"}), 400

    lang_name = {"zh": "中文", "es": "西班牙语"}.get(payload.get("lang"), "英语")
    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            temperature=0.4,
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"请用{lang_name}回答：{question}"},
            ],
        )
        return jsonify({"answer": resp.choices[0].message.content})
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


@app.get("/")
def index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3000)))
