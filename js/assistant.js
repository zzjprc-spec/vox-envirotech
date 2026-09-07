(function () {
  "use strict";

  var fab = document.getElementById("assistantFab");
  var panel = document.getElementById("assistantPanel");
  var closeBtn = document.getElementById("assistantClose");
  var messages = document.getElementById("assistantMessages");
  var quick = document.getElementById("assistantQuick");
  var form = document.getElementById("assistantForm");
  var input = document.getElementById("assistantInput");

  if (!fab || !panel) return;

  function lang() {
    try { return localStorage.getItem("vox-lang") || "en"; } catch (e) { return "en"; }
  }

  // For GitHub Pages + DeepSeek, set this to your Cloudflare Worker URL,
  // e.g. "https://vox-assistant.yourname.workers.dev/api/assistant".
  var ASSISTANT_API = "/api/assistant";

  var T = {
    en: {
      header_title: "VOx Assistant",
      header_sub: "DeepSeek · Company & industry support",
      placeholder: "Ask about VOx Envirotech…",
      send: "Send",
      typing: "VOx is typing…",
      welcome: "Hello! I'm the VOx assistant. I can answer quick questions about VOx Envirotech — solutions, products, technologies, projects and contact details. For deeper or non-company topics, I'll suggest contacting our team.",
      quick: ["About VOx", "Solutions", "Products", "Contact"],
      referral: "For a detailed discussion or a tailored proposal, I recommend reaching out to our team directly:\n\n• James Zhou — Operations Office, Shanghai: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Technical Advisory Office, St. Louis: tdayton@voxenviro.com · +1 636 557 2733 (US) · +86 131 6205 1039 (China)",
      unrelated: "I'm here to answer questions about VOx Envirotech and related industry topics only, so I can't help with that. For anything else or a deeper discussion, please contact our team:\n\n• James Zhou — Operations Office, Shanghai: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Technical Advisory Office, St. Louis: tdayton@voxenviro.com · +1 636 557 2733 (US) · +86 131 6205 1039 (China)",
      fallback: "I can answer questions about VOx Envirotech and related industry topics. For anything else or a more detailed discussion, please contact our team:\n\n• James Zhou — Operations Office, Shanghai: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Technical Advisory Office, St. Louis: tdayton@voxenviro.com · +1 636 557 2733 (US) · +86 131 6205 1039 (China)"
    },
    zh: {
      header_title: "VOx 助手",
      header_sub: "DeepSeek · 公司与行业支持",
      placeholder: "咨询 VOx Envirotech…",
      send: "发送",
      typing: "VOx 正在输入…",
      welcome: "您好！我是 VOx 助手，可以回答关于 VOx Envirotech 的常见问题——解决方案、产品、技术、项目案例和联系方式。对于更深层或与公司无关的问题，我会建议联系我们的团队。",
      quick: ["关于 VOx", "解决方案", "产品", "联系方式"],
      referral: "如需深入交流或定制方案，建议直接联系我们的团队：\n\n• James Zhou — 上海运营办公室：James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — 美国技术咨询办公室：tdayton@voxenviro.com · +1 636 557 2733（美国）· +86 131 6205 1039（中国）",
      unrelated: "我仅回答与 VOx Envirotech 及行业知识相关的问题，无法回答此问题。其它事项或深入交流，请联系我们的团队：\n\n• James Zhou — 上海运营办公室：James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — 美国技术咨询办公室：tdayton@voxenviro.com · +1 636 557 2733（美国）· +86 131 6205 1039（中国）",
      fallback: "我可以回答与 VOx Envirotech 及行业知识相关的问题。其它事项或深入交流，请联系我们的团队：\n\n• James Zhou — 上海运营办公室：James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — 美国技术咨询办公室：tdayton@voxenviro.com · +1 636 557 2733（美国）· +86 131 6205 1039（中国）"
    },
    es: {
      header_title: "Asistente VOx",
      header_sub: "DeepSeek · Soporte de empresa e industria",
      placeholder: "Pregunte sobre VOx Envirotech…",
      send: "Enviar",
      typing: "VOx está escribiendo…",
      welcome: "¡Hola! Soy el asistente de VOx. Puedo responder preguntas rápidas sobre VOx Envirotech: soluciones, productos, tecnologías, proyectos y contacto. Para temas más profundos o ajenos a la empresa, le sugeriré contactar con nuestro equipo.",
      quick: ["Acerca de VOx", "Soluciones", "Productos", "Contacto"],
      referral: "Para una conversación detallada o una propuesta personalizada, le recomendamos contactar directamente con nuestro equipo:\n\n• James Zhou — Oficina de operaciones, Shanghái: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Oficina de asesoría técnica, San Luis: tdayton@voxenviro.com · +1 636 557 2733 (EE. UU.) · +86 131 6205 1039 (China)",
      unrelated: "Solo respondo preguntas sobre VOx Envirotech y temas relacionados con la industria, por lo que no puedo ayudarle con eso. Para otros asuntos o una conversación más profunda, contacte con nuestro equipo:\n\n• James Zhou — Oficina de operaciones, Shanghái: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Oficina de asesoría técnica, San Luis: tdayton@voxenviro.com · +1 636 557 2733 (EE. UU.) · +86 131 6205 1039 (China)",
      fallback: "Puedo responder preguntas sobre VOx Envirotech y temas relacionados con la industria. Para otros asuntos o una conversación más detallada, contacte con nuestro equipo:\n\n• James Zhou — Oficina de operaciones, Shanghái: James.zhou@voxenviro.com · +86 138 1645 2946\n• Thomas Dayton — Oficina de asesoría técnica, San Luis: tdayton@voxenviro.com · +1 636 557 2733 (EE. UU.) · +86 131 6205 1039 (China)"
    }
  };

  var KB = [
    {
      k: ["about", "company", "story", "who", "founded", "history", "overview", "envirotech", "mission", "关于", "公司", "简介", "故事", "成立", "历史", "使命", "背景", "sobre", "empresa", "historia", "fundada", "misión", "quién", "antecedentes"],
      a: {
        en: "VOx Envirotech was founded in St. Louis, MO in 2016 and expanded through a Shanghai-based joint venture in 2017. It brings together two industry veterans with decades of shared experience in chemical process and environmental technologies.",
        zh: "VOx Envirotech 于 2016 年在美国圣路易斯成立，并于 2017 年通过上海合资公司拓展，汇集了两位拥有数十年共同经验的行业资深人士，专注于化工工艺与环境技术。",
        es: "VOx Envirotech se fundó en San Luis, Misuri, en 2016 y se amplió mediante una empresa conjunta en Shanghái en 2017. Reúne a dos veteranos del sector con décadas de experiencia en tecnologías de procesos químicos y medioambientales."
      }
    },
    {
      k: ["solution", "service", "offer", "capabilit", "what do you do", "provide", "解决方案", "服务", "提供", "业务", "能力", "solución", "servicio", "ofrecen", "capacidad", "qué hacen"],
      a: {
        en: "We offer three connected solution areas: Pollution Control (incineration, exhaust gas treatment, integrated pollution control), Decarbonization (green methanol, green hydrogen + oxy-combustion, VOCs/biogas-to-liquid-fuels), and Energy Saving (permanent magnet adjustable speed drives).",
        zh: "我们提供三大解决方案：污染控制（焚烧、废气处理、综合污染控制）、脱碳（绿色甲醇、绿色氢+纯氧燃烧、VOCs/沼气制液体燃料）、节能（永磁调速器）。",
        es: "Ofrecemos tres áreas de soluciones: control de contaminación (incineración, tratamiento de gases, control integrado), descarbonización (metanol verde, hidrógeno verde + oxicombustión, conversión de COV/biogás a combustibles líquidos) y ahorro energético (variadores de imanes permanentes)."
      }
    },
    {
      k: ["pollution", "incinerat", "thermal oxid", "catalytic oxid", "exhaust gas", "scrubber", "absorber", "denox", "scr", "sncr", "voc", "particulate", "flue gas", "污染", "焚烧", "热氧化", "催化氧化", "废气", "洗涤", "吸收", "脱硝", "颗粒物", "烟气", "contaminación", "incineración", "oxidación", "gases de escape", "depuradora", "desnitrificación", "partículas"],
      a: {
        en: "Our pollution-control solutions include thermal and catalytic oxidation for waste incineration, hot gas quench, absorbers and scrubbers, dust and fine particulate collectors, and DeNOx (SCR/SNCR) tailored to flue gas composition.",
        zh: "我们的污染控制方案包括：用于废物焚烧的热力与催化氧化装置、热烟气急冷、吸收塔与洗涤塔、粉尘及细颗粒捕集装置，以及根据烟气组分定制的 DeNOx（SCR/SNCR）。",
        es: "Nuestras soluciones de control de contaminación incluyen oxidación térmica y catalítica para incineración, enfriamiento rápido de gases calientes, absorbedores y depuradores, colectores de polvo y partículas, y DeNOx (SCR/SNCR) adaptado a la composición del gas."
      }
    },
    {
      k: ["decarbon", "methanol", "hydrogen", "saf", "sustainable aviation", "biogas", "liquid fuel", "co2", "carbon", "green fuel", "oxy-combustion", "脱碳", "甲醇", "氢", "可持续航空燃料", "沼气", "液体燃料", "碳", "绿色燃料", "纯氧燃烧", "descarbonización", "metanol", "hidrógeno", "combustible de aviación", "biogás", "combustible líquido", "carbono", "oxicombustión"],
      a: {
        en: "Our decarbonization portfolio includes closed-loop green methanol for maritime shipping, coupled green hydrogen production with oxy-combustion, and cost-effective distributed conversion of VOCs and biogas into liquid fuels (including SAF).",
        zh: "我们的脱碳方案包括：用于航运的绿色甲醇闭环方案、绿色氢生产与纯氧燃烧耦合方案，以及将 VOCs 和沼气经济地分布式转化为液体燃料（含 SAF）。",
        es: "Nuestra cartera de descarbonización incluye metanol verde de circuito cerrado para transporte marítimo, producción acoplada de hidrógeno verde con oxicombustión, y conversión distribuida y rentable de COV y biogás en combustibles líquidos (incluido SAF)."
      }
    },
    {
      k: ["energy saving", "pm asd", "permanent magnet", "adjustable speed", "drive", "motor", "fan", "pump", "mixer", "vibration", "power consumption", "save energy", "节能", "永磁调速器", "电机", "风机", "泵", "搅拌器", "振动", "电耗", "ahorro de energía", "imanes permanentes", "velocidad", "variador", "ventilador", "bomba", "agitador", "vibración", "consumo"],
      a: {
        en: "The VOx-XiX Permanent Magnet Adjustable Speed Drive (PM ASD) reduces power consumption, vibration and maintenance for large rotating loads such as fans, pumps and mixers in demanding industrial environments. You can also use our Energy Saving Calculator.",
        zh: "VOx-XiX 永磁调速器（PM ASD）可降低风机、泵、搅拌器等大型旋转负载在严苛工业环境中的电耗、振动与维护量。您也可使用我们的节能计算器。",
        es: "El variador de velocidad de imanes permanentes VOx-XiX (PM ASD) reduce el consumo eléctrico, la vibración y el mantenimiento de grandes cargas rotativas como ventiladores, bombas y agitadores. También puede usar nuestra calculadora de ahorro energético."
      }
    },
    {
      k: ["product", "vox-xix", "vox-hy", "vox-mt", "catalyst", "flue gas component", "brochure", "expansion joint", "damper", "relief valve", "产品", "催化剂", "烟道部件", "膨胀节", "挡板门", "泄放阀", "资料", "producto", "catalizador", "conductos", "junta de expansión", "compuerta", "válvula de alivio", "folleto"],
      a: {
        en: "Our products are VOx-XiX (PM ASD), VOx-HY (flue gas components: expansion joints, flexible connectors, dampers and emergency relief valves), and VOx-MT (catalysts developed with Matros Technologies). Brochures are available on request.",
        zh: "我们的产品包括 VOx-XiX（永磁调速器）、VOx-HY（烟道部件：膨胀节、柔性连接件、挡板门、紧急泄放阀）和 VOx-MT（与 Matros Technologies 合作开发的催化剂）。可索取资料。",
        es: "Nuestros productos son VOx-XiX (PM ASD), VOx-HY (componentes de conductos de gases: juntas de expansión, conectores flexibles, compuertas y válvulas de alivio) y VOx-MT (catalizadores desarrollados con Matros Technologies). Disponemos de folletos bajo petición."
      }
    },
    {
      k: ["technolog", "combustion control", "quench", "chemical loop", "regeneration", "denox efficiency", "core technology", "技术", "燃烧控制", "急冷", "化学链", "再生", "脱硝效率", "核心", "tecnología", "control de combustión", "enfriamiento", "bucle químico", "regeneración", "desnitrificación"],
      a: {
        en: "Our core technologies include Intelligent Combustion Control, High-Temperature Corrosive Quenching (up to 1,300°C), Closed-Loop Scrubbing & Regeneration, High-Efficiency SNCR DeNOx (up to 90%), and Single-Bed Chemical-Looping Reaction.",
        zh: "我们的核心技术包括：智能燃烧控制、高温腐蚀气体急冷（最高 1,300°C）、闭环洗涤与再生、高效 SNCR 脱硝（最高 90%），以及单床化学链反应。",
        es: "Nuestras tecnologías principales incluyen control inteligente de combustión, enfriamiento rápido de gases corrosivos a alta temperatura (hasta 1.300 °C), lavado y regeneración en circuito cerrado, desnitrificación SNCR de alta eficiencia (hasta 90 %) y reacción de bucle químico de lecho único."
      }
    },
    {
      k: ["project", "case", "epc", "reference", "experience", "polycarbonate", "fluorochemical", "pam", "polyacrylamide", "petrochemical", "consulting", "feed", "vcm", "hcl", "项目", "案例", "业绩", "经验", "聚碳酸酯", "氟化工", "聚丙烯酰胺", "石化", "咨询", "proyecto", "caso", "referencia", "experiencia", "policarbonato", "fluorquímicos", "poliacrilamida", "petroquímica", "consultoría"],
      a: {
        en: "We have delivered EPC flue-gas treatment systems (polycarbonate, fluorochemical, PAM, petrochemical) and consulting / process-package projects (VOCs treatment, VCM incineration with HCl recovery, organic absorption + catalytic oxidation). Detailed case brochures are available on request.",
        zh: "我们已交付多套 EPC 烟气处理系统（聚碳酸酯、氟化工、PAM、石化），以及咨询/工艺包项目（VOCs 处理、带 HCl 回收的 VCM 焚烧、有机吸收+催化氧化）。可索取案例资料。",
        es: "Hemos entregado sistemas EPC de tratamiento de gases (policarbonato, fluorquímicos, PAM, petroquímica) y proyectos de consultoría / paquetes de proceso (tratamiento de COV, incineración de VCM con recuperación de HCl, absorción orgánica + oxidación catalítica). Disponemos de folletos de caso."
      }
    },
    {
      k: ["partner", "partnership", "supply", "shanghai xix", "taizhou huaye", "sulfuric", "matros", "合作伙伴", "供应", "上海", "台州", "socio", "alianza", "suministro"],
      a: {
        en: "Our supply partners are Shanghai XIX Electric Co., Ltd. and Taizhou Huaye Pipeline Equipment Ltd. (North America), plus Sulfuric Solutions LLC and Matros Technologies Inc. (China).",
        zh: "我们的供应合作伙伴：北美市场为 Shanghai XIX Electric Co., Ltd. 和 Taizhou Huaye Pipeline Equipment Ltd.；中国市场为 Sulfuric Solutions LLC 和 Matros Technologies Inc.。",
        es: "Nuestros socios proveedores: en América del Norte, Shanghai XIX Electric Co., Ltd. y Taizhou Huaye Pipeline Equipment Ltd.; en China, Sulfuric Solutions LLC y Matros Technologies Inc."
      }
    },
    {
      k: ["contact", "email", "phone", "reach", "james", "thomas", "zhou", "dayton", "call", "tel", "office", "联系", "邮箱", "电话", "联系方式", "办公室", "contacto", "correo", "teléfono", "oficina"],
      a: {
        en: "You can reach James Zhou (Operations Office, Shanghai) at James.zhou@voxenviro.com / +86 138 1645 2946, or Thomas Dayton (Technical Advisory Office, St. Louis) at tdayton@voxenviro.com / +1 636 557 2733 (US) / +86 131 6205 1039 (China).",
        zh: "您可以联系 James Zhou（上海运营办公室）：James.zhou@voxenviro.com / +86 138 1645 2946；或 Thomas Dayton（美国技术咨询办公室）：tdayton@voxenviro.com / +1 636 557 2733（美国）/ +86 131 6205 1039（中国）。",
        es: "Puede contactar con James Zhou (Oficina de operaciones, Shanghái): James.zhou@voxenviro.com / +86 138 1645 2946, o con Thomas Dayton (Oficina de asesoría técnica, San Luis): tdayton@voxenviro.com / +1 636 557 2733 (EE. UU.) / +86 131 6205 1039 (China)."
      }
    },
    {
      k: ["calculator", "estimate", "saving calculator", "payback", "energy calculator", "计算器", "估算", "回收期", "calculadora", "estimación", "ahorro"],
      a: {
        en: "Use our Energy Saving Calculator (linked in the Solutions → Energy Saving section) to estimate the energy, cost and CO2 savings from the VOx-XiX PM ASD.",
        zh: "请使用我们的节能计算器（位于“解决方案 → 节能”板块）估算 VOx-XiX 永磁调速器的节能、省钱与 CO2 减排。",
        es: "Utilice nuestra calculadora de ahorro energético (en la sección Soluciones → Ahorro de energía) para estimar el ahorro de energía, costes y CO2 del VOx-XiX PM ASD."
      }
    },
    {
      k: ["green methanol", "ammonia", "reverse water-gas", "catalytic combustion", "chemical looping", "oxygen carrier", "adsorbent", "绿色甲醇", "氨", "逆水煤气", "催化燃烧", "化学链", "载氧体", "吸附剂", "metanol verde", "amoníaco", "gas de agua inverso", "combustión catalítica", "bucle químico", "portador de oxígeno", "adsorbente"],
      a: {
        en: "Yes — we cover green methanol, ammonia synthesis, catalytic combustion, reverse water-gas shift, and chemical-looping oxygen carriers / catalytic adsorbents as part of our catalysts and decarbonization solutions.",
        zh: "是的，我们覆盖绿色甲醇、氨合成、催化燃烧、逆水煤气变换，以及化学链载氧体/催化吸附剂，属于我们的催化剂与脱碳方案。",
        es: "Sí, cubrimos metanol verde, síntesis de amoníaco, combustión catalítica, reacción inversa de desplazamiento de gas de agua y portadores de oxígeno / adsorbentes catalíticos, dentro de nuestras soluciones de catalizadores y descarbonización."
      }
    }
  ];

  var REFERRAL = ["quote", "quotation", "price", "pricing", "proposal", "schedule", "appointment", "meeting", "talk to", "speak with", "detailed", "in depth", "feasibility", "engineering support", "custom", "bespoke", "procurement", "order", "buy", "报价", "询价", "价格", "预约", "会议", "详细", "深入", "可行性", "定制", "采购", "cotización", "precio", "propuesta", "cita", "reunión", "detallado", "personalizado", "comprar"];

  var UNRELATED = ["weather", "joke", "movie", "sport", "recipe", "president", "football", "game", "music", "news", "crypto", "stock", "translation", "restaurant", "天气", "笑话", "电影", "体育", "菜谱", "总统", "足球", "游戏", "音乐", "新闻", "加密货币", "股票", "翻译", "餐厅", "tiempo", "chiste", "película", "deporte", "receta", "presidente", "fútbol", "juego", "música", "noticias", "cripto", "bolsa", "traducción", "restaurante"];

  function matches(text, keywords) {
    var t = text.toLowerCase();
    return keywords.some(function (k) { return t.indexOf(k.toLowerCase()) !== -1; });
  }

  function localAnswer(text) {
    var l = lang();
    if (matches(text, REFERRAL)) return T[l].referral;
    if (matches(text, UNRELATED)) return T[l].unrelated;
    for (var i = 0; i < KB.length; i++) {
      if (matches(text, KB[i].k)) return KB[i].a[l] || KB[i].a.en;
    }
    return T[l].fallback;
  }

  async function getAnswer(text) {
    try {
      var res = await fetch(ASSISTANT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, lang: lang() })
      });
      if (!res.ok) throw new Error("bad status");
      var data = await res.json();
      if (data && data.answer) return data.answer;
      throw new Error("no answer");
    } catch (e) {
      // Offline / no backend → fall back to the built-in knowledge base.
      return localAnswer(text);
    }
  }

  function addMessage(text, who) {
    var div = document.createElement("div");
    div.className = "assistant-msg assistant-msg--" + who;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function respond(text) {
    var typing = document.createElement("div");
    typing.className = "assistant-typing";
    typing.textContent = T[lang()].typing;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(function () {
      getAnswer(text).then(function (answer) {
        if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
        addMessage(answer, "bot");
      });
    }, 700);
  }

  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    addMessage(text, "user");
    respond(text);
    input.value = "";
  }

  function render() {
    var l = lang();
    var t = T[l] || T.en;
    var title = document.querySelector(".assistant-head-info strong");
    var sub = document.querySelector(".assistant-head-info span");
    if (title) title.textContent = t.header_title;
    if (sub) sub.textContent = t.header_sub;
    input.placeholder = t.placeholder;
    var sendBtn = form.querySelector('button[type="submit"]');
    if (sendBtn) sendBtn.textContent = t.send;
    var chips = quick.querySelectorAll("button");
    chips.forEach(function (btn, i) {
      if (t.quick[i]) btn.textContent = t.quick[i];
    });
  }

  function open() {
    panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    if (!messages.dataset.greeted) {
      messages.dataset.greeted = "1";
      addMessage(T[lang()].welcome, "bot");
    }
  }

  function close() {
    panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
  }

  fab.addEventListener("click", function () { panel.hidden ? open() : close(); });
  closeBtn.addEventListener("click", close);
  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
  quick.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (btn) send(btn.getAttribute("data-q"));
  });
  window.addEventListener("vox-lang-change", render);

  render();

  // The assistant now calls POST /api/assistant (DeepSeek proxy) when available,
  // and falls back to the local knowledge base when the backend is offline.
})();
