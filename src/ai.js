import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCompanyKnowledge } from "./knowledge.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FORBIDDEN_REPLY =
  "Я могу помочь только с вопросами, связанными с компанией Центр Красок #1, подбором красок, покрытий, материалами, услугами, контактами и консультацией по ремонту.";

const CONSULTATION_REPLY = `Конечно, помогу подобрать подходящий материал.

Ответьте, пожалуйста, на несколько вопросов:

1. Что вы хотите покрасить: стены, фасад, дерево, металл, пол, лестницу или другую поверхность?
2. Где будет использоваться материал: внутри помещения или снаружи?
3. Какая сейчас поверхность: бетон, штукатурка, дерево, металл, старое покрытие?
4. Какой эффект нужен: матовый, полуматовый, глянцевый или декоративный?
5. Есть ли пожелания по стойкости: моющаяся краска, влагостойкость, защита от солнца, износостойкость?

После этого я подскажу, какой тип краски или покрытия лучше выбрать.`;

function normalizeText(text) {
  return String(text || "").toLowerCase().trim();
}

export function isProgrammingRequest(text) {
  const lower = normalizeText(text);

  const programmingWords = [
    "python",
    "пайтон",
    "javascript",
    "java",
    "html",
    "css",
    "react",
    "node",
    "express",
    "код",
    "скрипт",
    "программа",
    "функция",
    "api",
    "github",
    "сделай сайт",
    "создай сайт",
    "напиши сайт",
    "напиши код",
    "напиши функцию",
    "реши задачу",
    "домашка",
    "лабораторная",
    "курсовая",
    "диплом"
  ];

  return programmingWords.some((word) => lower.includes(word));
}

export function isClearlyForbiddenTopic(text) {
  const lower = normalizeText(text);

  const forbiddenWords = [
    "ставка",
    "прогноз",
    "коэффициент",
    "футбол",
    "теннис",
    "политика",
    "религия",
    "болезнь",
    "медицина",
    "лечение",
    "диагноз",
    "кредит",
    "инвестиции",
    "крипта",
    "отношения",
    "девушка",
    "парень"
  ];

  return forbiddenWords.some((word) => lower.includes(word));
}

export function isConsultationRequest(text) {
  const lower = normalizeText(text);

  const phrases = [
    "помоги выбрать",
    "помоги мне выбрать",
    "что выбрать",
    "что взять",
    "посоветуй",
    "подбери",
    "какую краску",
    "какой материал",
    "нужна краска",
    "хочу покрасить",
    "чем покрасить",
    "нужна консультация",
    "помоги подобрать",
    "выбрать краску",
    "подобрать краску"
  ];

  return phrases.some((phrase) => lower.includes(phrase));
}

export { FORBIDDEN_REPLY, CONSULTATION_REPLY };

export async function generateCompanyAnswer(userMessage, history = []) {
  const companyKnowledge = getCompanyKnowledge();

  if (!process.env.GEMINI_API_KEY) {
    return "Gemini API key не найден. Проверьте файл .env и добавьте GEMINI_API_KEY.";
  }

  if (isProgrammingRequest(userMessage) || isClearlyForbiddenTopic(userMessage)) {
    return FORBIDDEN_REPLY;
  }

  if (isConsultationRequest(userMessage)) {
    return CONSULTATION_REPLY;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 650,
    },
  });

  const formattedHistory = history
    .map((message) => {
      if (message.role === "user") {
        return `Пользователь: ${message.content}`;
      }

      if (message.role === "assistant") {
        return `Ассистент: ${message.content}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `
Ты — AI-консультант компании "Центр Красок #1" в Telegram.

Твоя задача — помогать клиентам по вопросам компании, красок, покрытий, ремонта, отделки и подбора материалов.

Разрешенные темы:
- компания Центр Красок #1;
- товары компании;
- услуги компании;
- контакты, адрес, сайт, время работы;
- интерьерные и фасадные краски;
- декоративные покрытия;
- лаки, грунтовки, штукатурки, шпаклевки;
- материалы для дерева, металла, пола, лестниц и стен;
- малярные инструменты;
- колеровка красок;
- консультация по подбору материалов;
- советы по выбору покрытия для ремонта.

Стиль общения:
- отвечай как живой консультант, а не как сухой справочник;
- будь дружелюбным, понятным и профессиональным;
- не отвечай слишком длинно;
- если клиенту нужен подбор, задавай уточняющие вопросы;
- если данных достаточно, предложи подходящий тип материала;
- объясняй простыми словами;
- не выдумывай точные цены, скидки, остатки на складе и бренды, если они не указаны в базе;
- если нужна точная информация по наличию или цене, предложи связаться с компанией.

Строгие ограничения:
Ты НЕ универсальный ChatGPT.
Ты НЕ должен:
- писать код;
- помогать с программированием;
- делать сайты;
- решать учебные задания;
- писать рефераты, сочинения и дипломы;
- обсуждать ставки, спорт, политику, религию, медицину, финансы, личные отношения;
- отвечать на темы, не связанные с компанией, красками, ремонтом и отделочными материалами.

Если пользователь просит что-то не по теме, ответь только так:
"${FORBIDDEN_REPLY}"

Важно:
Даже если пользователь пишет "напиши код про Центр Красок", "сделай сайт для Центр Красок", "напиши Python", "напиши JavaScript", ты должен отказаться.

База знаний о компании:
${companyKnowledge}

Контекст последних сообщений:
${formattedHistory || "Контекста пока нет."}

Вопрос пользователя:
${userMessage}

Сформируй ответ на русском языке:
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    if (!answer) {
      return "Не удалось сформировать ответ. Попробуйте задать вопрос ещё раз.";
    }

    return answer.trim();
  } catch (error) {
    console.error("Gemini API error:", error);

    return "Произошла ошибка при обращении к AI-модели Gemini. Проверьте API-ключ или попробуйте позже.";
  }
}
