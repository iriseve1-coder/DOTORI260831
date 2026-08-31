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
      const { text, referenceDate, userTimeZone, teamMembers } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "문서 내용을 입력해주세요." });
      }

      const todayStr = referenceDate || new Date().toISOString().split("T")[0];
      const timeZone = userTimeZone || "Asia/Seoul";
      const membersListText = Array.isArray(teamMembers) && teamMembers.length > 0
        ? `Team Members available: ${teamMembers.map((m: any) => `${m.name}(${m.role || ""})`).join(", ")}`
        : "5 Team Members: 김민지(PM/총괄), 박지훈(서비스 기획), 이수아(UI/UX 디자인), 정도윤(풀스택 개발), 최서연(마케팅/운영)";

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
You are an expert collaborative schedule extraction AI assistant for a 5-member team.
Your task is to analyze unstructured Korean/English document text (such as team meeting notes, emails, sprint plans, announcements, shift rosters) and extract all distinct events or scheduled items.

${membersListText}

Rules & Guidelines:
1. Reference Today's Date: Today is ${todayStr} (Timezone: ${timeZone}). Use this reference date to resolve relative dates like "내일", "모레", "이번주 금요일", "다음주 월요일", "7/25", "매주 수요일" accurately into absolute YYYY-MM-DD or YYYY-MM-DDTHH:mm format.
2. If time is specified (e.g., "오후 2시", "14:00~15:30"), set 'allDay' to false, and format startDate as 'YYYY-MM-DDTHH:mm' (e.g., '${todayStr}T14:00') and endDate as 'YYYY-MM-DDTHH:mm' (e.g. '${todayStr}T15:30' or +1 hour default).
3. If no specific time is mentioned (e.g. "7월 25일 출장"), set 'allDay' to true, with startDate 'YYYY-MM-DD' and endDate 'YYYY-MM-DD'.
4. Extract location if mentioned (room, online link, city, address, etc.).
5. Provide a rich but concise description with key notes related to that event.
6. Categorize each event into one of: ["업무", "개인", "학업", "여행", "건강", "중요", "기타"].
7. Assign priority ("high", "medium", "low").
8. Generate 1-3 concise tags (e.g., ["회의", "주간보고"], ["스프린트", "디자인"]).
9. Detect Team Member Assignees: Check if specific team member names or roles are mentioned as responsible, attendees, or owners (e.g., "담당: 지훈, 민지", "디자인팀 수아", "도윤 개발"). If "전원", "팀 전체", or everyone is involved, list all 5 member names in 'suggestedMemberNames'.
10. Provide confidence rating ("HIGH", "MEDIUM", "LOW").

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
                    suggestedMemberNames: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Names of team members assigned or involved in this event",
                    },
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
