import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCompanyKnowledge } from "./knowledge.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateCompanyAnswer(userMessage, history = []) {
  const companyKnowledge = getCompanyKnowledge();

  if (!process.env.GEMINI_API_KEY) {
    return "Gemini API key не найден. Проверьте файл .env и добавьте GEMINI_API_KEY.";
  }

  const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 700,
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
Ты — AI-ассистент компании "Центр Красок #1".

Твоя задача — отвечать пользователю только на основе базы знаний о компании.

Главные правила:
1. Отвечай только по теме компании "Центр Красок #1".
2. Не выдумывай факты.
3. Не придумывай цены, актуальные вакансии, клиентов, владельцев, зарплаты, технологии или сотрудников.
4. Если информации нет в базе знаний, честно скажи: "В открытых данных компании такой информации нет."
5. Если вопрос не связан с компанией, скажи: "Я могу отвечать только на вопросы, связанные с компанией Центр Красок #1, её товарами, услугами, контактами и открытой информацией."
6. Отвечай вежливо, понятно и кратко.
7. Если пользователь спрашивает про вакансии, скажи, что актуальные вакансии нужно проверять на hh.kz или связываться с компанией напрямую.
8. Если пользователь спрашивает про технологии, не называй конкретные языки программирования, CRM или базы данных, если их нет в базе знаний.
9. Не отвечай на вопросы про программирование, учебу, политику, личные темы и всё, что не относится к компании.
10. Ответ должен быть на русском языке.

База знаний о компании:
${companyKnowledge}

Контекст последних сообщений:
${formattedHistory || "Контекста пока нет."}

Вопрос пользователя:
${userMessage}

Сформируй ответ:
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