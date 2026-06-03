import "dotenv/config";
import { Telegraf } from "telegraf";
import { generateCompanyAnswer } from "./ai.js";
import { startServer } from "./server.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN не найден. Проверьте файл .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Простая память диалога для каждого пользователя
const userSessions = new Map();

function getUserHistory(userId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, []);
  }

  return userSessions.get(userId);
}

function updateUserHistory(userId, userMessage, botAnswer) {
  const history = getUserHistory(userId);

  history.push({
    role: "user",
    content: userMessage,
  });

  history.push({
    role: "assistant",
    content: botAnswer,
  });

  // Храним только последние 6 сообщений, чтобы не перегружать AI
  if (history.length > 6) {
    history.splice(0, history.length - 6);
  }

  userSessions.set(userId, history);
}

bot.start(async (ctx) => {
  await ctx.reply(
    "Здравствуйте! Я AI-ассистент компании Центр Красок #1. Вы можете задать мне вопрос о компании, товарах, услугах, контактах, адресе или открытой информации."
  );
});

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from.id;

  try {
    await ctx.sendChatAction("typing");

    const history = getUserHistory(userId);

    const answer = await generateCompanyAnswer(userMessage, history);

    updateUserHistory(userId, userMessage, answer);

    await ctx.reply(answer);
  } catch (error) {
    console.error("Bot error:", error);

    await ctx.reply(
      "Произошла ошибка при обработке сообщения. Попробуйте написать вопрос ещё раз."
    );
  }
});

bot.on("message", async (ctx) => {
  await ctx.reply(
    "Пожалуйста, отправьте текстовый вопрос о компании Центр Красок #1."
  );
});

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});

startServer();

bot.launch();

console.log("Telegram bot is running...");