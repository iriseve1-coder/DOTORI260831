import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoint to parse schedule from document text
  app.post("/api/parse-schedule", async (req, res) => {
    try {
      const { text, referenceDate, userTimeZone } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "문서 내용을 입력해주세요." });
      }

      const todayStr = referenceDate || new Date().toISOString().split("T")[0];
      const timeZone = userTimeZone || "Asia/Seoul";

      // Check Gemini API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY가 설정되지 않았습니다. Settings > Secrets에서 API 키를 설정해주세요.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `
You are an expert schedule extraction AI assistant.
Your task is to analyze unstructured Korean/English document text (such as meeting notes, emails, event announcements, syllabi, travel plans, shift rosters) and extract all distinct events or scheduled items.

Rules & Guidelines:
1. Reference Today's Date: Today is ${todayStr} (Timezone: ${timeZone}). Use this reference date to resolve relative dates like "내일", "모레", "이번주 금요일", "다음주 월요일", "7/25", "매주 수요일" accurately into absolute YYYY-MM-DD or YYYY-MM-DDTHH:mm format.
2. If time is specified (e.g., "오후 2시", "14:00~15:30"), set 'allDay' to false, and format startDate as 'YYYY-MM-DDTHH:mm' (e.g., '${todayStr}T14:00') and endDate as 'YYYY-MM-DDTHH:mm' (e.g. '${todayStr}T15:30' or +1 hour default).
3. If no specific time is mentioned (e.g. "7월 25일 출장"), set 'allDay' to true, with startDate 'YYYY-MM-DD' and endDate 'YYYY-MM-DD'.
4. Extract location if mentioned (room, online link, city, address, etc.).
5. Provide a rich but concise description with key notes related to that event.
6. Categorize each event into one of: ["업무", "개인", "학업", "여행", "건강", "중요", "기타"].
7. Assign priority ("high", "medium", "low").
8. Generate 1-3 concise tags (e.g., ["회의", "주간보고"], ["수강", "중간고사"]).
9. Provide confidence rating ("HIGH", "MEDIUM", "LOW").

Return a structured JSON object containing an array of events.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            text: `[Document Text]\n${text}`,
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Short overall summary of extracted schedules in Korean",
              },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Event title" },
                    startDate: {
                      type: Type.STRING,
                      description: "ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm",
                    },
                    endDate: {
                      type: Type.STRING,
                      description: "ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm",
                    },
                    allDay: { type: Type.BOOLEAN, description: "True if all day event without specific time" },
                    location: { type: Type.STRING, description: "Location or platform link if available" },
                    description: { type: Type.STRING, description: "Summary or detail notes" },
                    category: {
                      type: Type.STRING,
                      description: "Category: 업무, 개인, 학업, 여행, 건강, 중요, 기타",
                    },
                    priority: { type: Type.STRING, description: "high, medium, or low" },
                    confidence: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of relevant tags",
                    },
                  },
                  required: ["title", "startDate", "endDate", "allDay", "category", "priority"],
                },
              },
            },
            required: ["summary", "events"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        summary: parsedData.summary || `${parsedData.events?.length || 0}개의 일정이 추출되었습니다.`,
        events: parsedData.events || [],
      });
    } catch (error: any) {
      console.error("Error parsing schedule:", error);
      return res.status(500).json({
        error: "일정 파싱 처리 중 오류가 발생했습니다: " + (error.message || "알 수 없는 오류"),
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
