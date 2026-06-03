import fs from "fs";
import path from "path";

export function getCompanyKnowledge() {
  try {
    const filePath = path.join(process.cwd(), "data", "company.md");
    const knowledge = fs.readFileSync(filePath, "utf-8");

    return knowledge;
  } catch (error) {
    console.error("Error reading company knowledge base:", error);

    return `
Информация о компании временно недоступна.
AI-ассистент должен сообщить пользователю, что база знаний не загрузилась.
`;
  }
}