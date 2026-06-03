import "dotenv/config";
import { Telegraf } from "telegraf";
import {
  CONSULTATION_REPLY,
  FORBIDDEN_REPLY,
  generateCompanyAnswer,
  isClearlyForbiddenTopic,
  isConsultationRequest,
  isProgrammingRequest,
} from "./ai.js";
import { startServer } from "./server.js";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN не найден. Проверьте файл .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const userSessions = new Map();

const START_REPLY = `Здравствуйте! Я AI-ассистент компании Центр Красок #1.

Я помогу вам:
• узнать о компании;
• посмотреть контакты и адрес;
• разобраться в товарах и услугах;
• подобрать краску или покрытие;
• понять, какой материал лучше подходит для стен, фасада, дерева, металла или пола.

Можете написать, например:
"Помоги выбрать краску для стен"
"Где находится магазин?"
"Какие услуги есть?"
"Чем покрасить фасад?"`;

const HELP_REPLY = `Я AI-консультант компании Центр Красок #1.

Я могу помочь с вопросами:
• чем занимается компания;
• какие товары и услуги есть;
• где находится салон;
• как связаться с компанией;
• как выбрать краску или покрытие;
• какие материалы подходят для интерьера, фасада, дерева, металла, пола и других поверхностей.

Команды:
/start — запустить бота
/help — помощь
/about — о компании
/contacts — контакты
/services — услуги
/products — товары
/consultation — консультация`;

const ABOUT_REPLY = `Центр Красок #1 — компания в Казахстане, которая занимается продажей лакокрасочных материалов, декоративных покрытий, защитных составов, лаков, грунтовок, штукатурок, шпаклевок и малярных инструментов.

Компания помогает клиентам подобрать материалы для ремонта, строительства, отделки интерьера, фасадов, дерева, металла, пола и других поверхностей.`;

const CONTACTS_REPLY = `Контакты компании Центр Красок #1:

Телефоны:
+7 701 877 5000
+7 701 974 5000
+7 778 800 4442

Email:
info@centr-krasok.kz

Сайт:
https://centr-krasok.kz/

Адрес:
Казахстан, город Алматы, улица Кабдолова 1/8, блок 1, 1 ряд, линия D, 14 бутик.`;

const SERVICES_REPLY = `Компания Центр Красок #1 предоставляет следующие услуги:

• консультация по выбору красок и покрытий;
• подбор материалов для интерьера и фасада;
• подбор покрытий для дерева, металла, пола и лестниц;
• продажа лакокрасочных материалов;
• продажа декоративных покрытий;
• продажа грунтовок, штукатурок и шпаклевок;
• продажа малярных инструментов;
• колеровка красок.`;

const PRODUCTS_REPLY = `В Центре Красок #1 можно найти материалы для ремонта, строительства и отделки:

• интерьерные краски;
• фасадные краски;
• декоративные покрытия;
• лаки и защитные составы;
• грунтовки;
• штукатурки;
• шпаклевки;
• материалы для дерева;
• материалы для металла;
• материалы для пола и лестниц;
• малярные инструменты.

Для точного подбора напишите, что именно вы хотите покрасить и где будет использоваться материал.`;

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

  if (history.length > 8) {
    history.splice(0, history.length - 8);
  }

  userSessions.set(userId, history);
}

async function sendAndRemember(ctx, userMessage, answer) {
  const userId = ctx.from.id;
  updateUserHistory(userId, userMessage, answer);
  await ctx.reply(answer);
}

bot.start(async (ctx) => {
  await sendAndRemember(ctx, "/start", START_REPLY);
});

bot.help(async (ctx) => {
  await sendAndRemember(ctx, "/help", HELP_REPLY);
});

bot.command("about", async (ctx) => {
  await sendAndRemember(ctx, "/about", ABOUT_REPLY);
});

bot.command("contacts", async (ctx) => {
  await sendAndRemember(ctx, "/contacts", CONTACTS_REPLY);
});

bot.command("services", async (ctx) => {
  await sendAndRemember(ctx, "/services", SERVICES_REPLY);
});

bot.command("products", async (ctx) => {
  await sendAndRemember(ctx, "/products", PRODUCTS_REPLY);
});

bot.command("consultation", async (ctx) => {
  await sendAndRemember(ctx, "/consultation", CONSULTATION_REPLY);
});

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text.trim();
  const userId = ctx.from.id;

  try {
    await ctx.sendChatAction("typing");

    if (isProgrammingRequest(userMessage) || isClearlyForbiddenTopic(userMessage)) {
      await sendAndRemember(ctx, userMessage, FORBIDDEN_REPLY);
      return;
    }

    if (isConsultationRequest(userMessage)) {
      await sendAndRemember(ctx, userMessage, CONSULTATION_REPLY);
      return;
    }

    const history = getUserHistory(userId);
    const answer = await generateCompanyAnswer(userMessage, history);

    await sendAndRemember(ctx, userMessage, answer);
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
