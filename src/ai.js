import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCompanyKnowledge } from "./knowledge.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY не найден. Проверьте .env или Environment Variables на Render.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const FORBIDDEN_REPLY =
  "Я могу помочь только с вопросами, связанными с компанией Центр Красок #1, подбором красок, покрытий, материалами, услугами, контактами и консультацией по ремонту.";

export const CONSULTATION_REPLY = `Конечно, помогу подобрать подходящий материал.

Ответьте, пожалуйста, на несколько вопросов:

1. Что вы хотите покрасить: стены, фасад, дерево, металл, пол, лестницу или другую поверхность?
2. Где будет использоваться материал: внутри помещения или снаружи?
3. Какая сейчас поверхность: бетон, штукатурка, дерево, металл, старое покрытие?
4. Какой эффект нужен: матовый, полуматовый, глянцевый или декоративный?
5. Есть ли пожелания по стойкости: моющаяся краска, влагостойкость, защита от солнца, износостойкость?

После этого я подскажу, какой тип краски или покрытия лучше выбрать.`;

export function isProgrammingRequest(text) {
  const lower = text.toLowerCase();

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
    "диплом",
    "sql",
    "database",
    "база данных"
  ];

  return programmingWords.some((word) => lower.includes(word));
}

export function isClearlyForbiddenTopic(text) {
  const lower = text.toLowerCase();

  const forbiddenWords = [
    "ставка",
    "прогноз",
    "коэффициент",
    "футбол",
    "теннис",
    "баскетбол",
    "политика",
    "религия",
    "болезнь",
    "медицина",
    "лечение",
    "диагноз",
    "кредит",
    "инвестиции",
    "крипта",
    "биткоин",
    "отношения",
    "девушка",
    "парень",
    "экзамен",
    "тест",
    "собеседование"
  ];

  return forbiddenWords.some((word) => lower.includes(word));
}

export function isConsultationRequest(text) {
  const lower = text.toLowerCase();

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
    "подобрать краску",
    "что лучше для стен",
    "что лучше для фасада",
    "какая краска лучше",
    "какое покрытие лучше"
  ];

  return phrases.some((phrase) => lower.includes(phrase));
}

function formatHistory(history = []) {
  if (!history || history.length === 0) {
    return "Истории диалога пока нет.";
  }

  return history
    .map((item) => {
      if (item.role === "user") {
        return `Клиент: ${item.content}`;
      }

      return `Ассистент: ${item.content}`;
    })
    .join("\n");
}

function buildPrompt(userMessage, history = []) {
  const companyKnowledge = getCompanyKnowledge();
  const dialogHistory = formatHistory(history);

  return `
Ты — AI-консультант компании "Центр Красок #1" в Telegram.

Твоя задача — помогать клиентам компании по вопросам:
- лакокрасочных материалов;
- интерьерных и фасадных красок;
- декоративных покрытий;
- лаков, грунтовок, штукатурок, шпаклевок;
- материалов для дерева, металла, пола, лестниц и стен;
- малярных инструментов;
- подбора краски и покрытий;
- колеровки;
- услуг компании;
- адреса, контактов, сайта и способов связи;
- общей информации о компании.

Ты должен вести себя как живой AI-консультант, а не как сухой справочник.

Стиль ответа:
- отвечай дружелюбно, понятно и профессионально;
- не делай слишком длинные ответы;
- используй списки, если так удобнее;
- объясняй простыми словами;
- если клиент просит подобрать материал, задай уточняющие вопросы;
- если данных достаточно, предложи подходящий тип материала;
- не выдумывай точные цены, скидки, остатки на складе и бренды, если их нет в базе знаний;
- если нужна точная информация по цене или наличию, предложи связаться с компанией.

Строгие ограничения:
Ты НЕ универсальный ChatGPT.
Ты НЕ должен:
- писать код;
- помогать с программированием;
- делать сайты;
- решать учебные задания;
- писать рефераты, сочинения и дипломы;
- обсуждать ставки, спорт, политику, религию, медицину, финансы, личные отношения;
- отвечать на темы, не связанные с компанией, красками, ремонтом, отделкой и материалами.

Если пользователь просит что-то не по теме, ответь только так:
"${FORBIDDEN_REPLY}"

Важно:
Даже если пользователь пишет "напиши код про Центр Красок", "сделай сайт для Центр Красок", "напиши Python", "напиши JavaScript", ты должен отказаться.

База знаний о компании:
${companyKnowledge}

История последних сообщений:
${dialogHistory}

Новое сообщение клиента:
${userMessage}

Ответь как AI-консультант компании Центр Красок #1.
Не выходи за ограничения.
`;
}

export async function generateCompanyAnswer(userMessage, history = []) {
  if (!GEMINI_API_KEY) {
    return "Сейчас AI-модель не настроена. Проверьте GEMINI_API_KEY в переменных окружения.";
  }

  try {
    const prompt = buildPrompt(userMessage, history);

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    if (!response || response.trim().length === 0) {
      return "Извините, сейчас не удалось подготовить ответ. Попробуйте задать вопрос чуть подробнее.";
    }

    return response.trim();
  } catch (error) {
console.error("Gemini error full:", error);
console.error("Gemini error message:", error.message);
console.error("Gemini error status:", error.status);
    return "Произошла ошибка при обращении к AI-модели Gemini. Проверьте API-ключ или попробуйте позже.";
  }
}