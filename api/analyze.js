export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      vacancy,
      polishLevel,
      city,
      studentStatus,
      udt,
      nightShifts,
      jobType,
      salaryType,
      minSalary,
      hoursPerMonth,
      language
    } = req.body || {};

    if (!vacancy || vacancy.trim().length < 20) {
      return res.status(400).json({
        error: "Встав повний текст вакансії."
      });
    }

    const userProfile = `
Рівень польської: ${polishLevel || "не вказано"}
Місто: ${city || "не вказано"}
Статус студента: ${studentStatus || "не вказано"}
UDT / допуск на навантажувач: ${udt || "не вказано"}
Нічні зміни: ${nightShifts || "не вказано"}
Бажаний тип роботи: ${jobType || "не вказано"}
Бажана зарплата: ${minSalary || "не вказано"}
Тип зарплати: ${salaryType || "не вказано"}
Годин на місяць: ${hoursPerMonth || "не вказано"}
Мова відповіді: ${language || "Українська"}
`;

    const prompt = `
Ти — JobMate, AI-помічник для людей, які шукають роботу в Польщі.

Твоя задача — не просто переказати вакансію, а пояснити її людині максимально зрозуміло.

ПРОФІЛЬ КОРИСТУВАЧА:
${userProfile}

ТЕКСТ ВАКАНСІЇ:
"""
${vacancy}
"""

Зроби практичний розбір вакансії.

Обов'язково розбери:
1. Що це за робота і що реально треба буде робити.
2. Місто та місце роботи.
3. Зарплату — brutto/netto, за годину чи місяць. Не вигадуй цифри, яких немає.
4. Тип договору: umowa zlecenie, umowa o pracę, B2B або інший.
5. Графік, кількість годин, зміни, нічні та вихідні.
6. Вимоги — окремо обов'язкові та бажані.
7. Незрозумілі польські терміни та скорочення. Наприклад UDT пояснюй простою мовою.
8. Що роботодавець НЕ вказав, але це важливо уточнити.
9. Потенційні red flags, хитрі формулювання та ризики.
10. Наскільки вакансія підходить конкретно цьому користувачу.
11. Дай оцінку відповідності від 0 до 100%.
12. Що може завадити отримати цю роботу.
13. Які питання треба поставити роботодавцю перед погодженням.
14. Напиши коротке повідомлення роботодавцю польською, яке можна одразу відправити.
15. Дай короткий сценарій першого телефонного дзвінка польською.
16. Підкажи, до яких питань підготуватися на співбесіді.

ВАЖЛИВО:
- Не вигадуй інформацію, якої немає у вакансії.
- Якщо чогось немає — прямо напиши, що це треба уточнити.
- Враховуй профіль користувача.
- Пояснюй польські юридичні та робочі терміни просто.
- Не називай вакансію хорошою лише через красиві рекламні слова.
- Відділяй факти з вакансії від своїх припущень.
- Відповідай мовою, яку вибрав користувач.
- Форматуй відповідь чітко, короткими секціями.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: prompt,
        reasoning: {
          effort: "low"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error: "Помилка AI",
        details: data?.error?.message || "OpenAI API request failed"
      });
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap(item => item.content || [])
        ?.filter(item => item.type === "output_text")
        ?.map(item => item.text)
        ?.join("\n") ||
      "AI не повернув текст.";

    return res.status(200).json({
      success: true,
      analysis: text
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Не вдалося проаналізувати вакансію."
    });
  }
}
