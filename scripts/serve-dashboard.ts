import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createCalendarAuthFromEnv, createGoogleApiCalendarClient } from "../src/packages/calendar/google-calendar.js";
import type { CalendarClient } from "../src/packages/calendar/index.js";
import {
  buildDashboardViewModel,
  renderActionErrorPage,
  renderDashboardPage,
  renderQuizAnswerResultPage,
  renderQuizQuestionsPage,
} from "../src/packages/dashboard/index.js";
import { createEmptyWikiReader, createFsWikiReader } from "../src/packages/evidence-source/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import {
  createKpiStorage,
  createQuizActivityStorage,
  createQuizResultStorage,
  createTargetCompanyStorage,
} from "../src/packages/kpi-storage/index.js";
import {
  createHeuristicQuizGradingClient,
  createHeuristicQuizQuestionGenerationClient,
  createHeuristicStudyRecommendationClient,
  createQuizSession,
} from "../src/packages/quiz/index.js";
import {
  adjustCompetencyScore,
  createHeuristicJdExtractionClient,
  createNoCoverageWikiSearch,
  createTargetCompanyTracker,
  markApplicationComplete,
} from "../src/packages/target-company/index.js";

const port = Number(process.env.DASHBOARD_PORT ?? 4310);

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const kpiStorage = createKpiStorage(drive);
const targetCompanyStorage = createTargetCompanyStorage(drive);
const quizResultStorage = createQuizResultStorage(drive);
const quizActivityStorage = createQuizActivityStorage(drive);

// Built lazily, only when a registration actually needs it — Google Calendar credentials are a
// separate, optional setup step (scripts/setup-google-calendar-credentials.sh) from the Drive
// credentials the read-only dashboard already depends on; viewing the dashboard shouldn't require
// them too.
let calendarClient: CalendarClient | undefined;
function getCalendarClient(): CalendarClient {
  calendarClient ??= createGoogleApiCalendarClient(createCalendarAuthFromEnv());
  return calendarClient;
}

// LLM_WIKI_NOTES_FOLDER points at the real LLM Wiki notes folder (e.g. Obsidian's "wiki" folder
// synced via Google Drive for Desktop). Falls back to the empty reader when unset, so the
// dashboard still runs on a machine without that folder mounted. Conversation transcripts aren't
// wired in yet — no exported-conversations folder exists yet (see WikiFolders' optional field).
const wikiReader = process.env.LLM_WIKI_NOTES_FOLDER
  ? createFsWikiReader({ notesFolder: process.env.LLM_WIKI_NOTES_FOLDER })
  : createEmptyWikiReader();

const quizSession = createQuizSession({
  questionClient: createHeuristicQuizQuestionGenerationClient(),
  gradingClient: createHeuristicQuizGradingClient(),
  studyRecommendationClient: createHeuristicStudyRecommendationClient(),
  wikiReader,
  kpiStorage,
  quizResultStorage,
  quizActivityStorage,
  targetCompanyStorage,
});

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function renderDashboardHtml(): Promise<string> {
  const [kpis, targetCompanies, quizAnswers, lastQuizAt] = await Promise.all([
    kpiStorage.list(),
    targetCompanyStorage.list(),
    quizResultStorage.list(),
    quizActivityStorage.lastCompletedAt(),
  ]);

  const model = buildDashboardViewModel({ kpis, targetCompanies, quizAnswers, lastQuizAt, today: todayIsoDate() });
  return renderDashboardPage(model);
}

async function readFormBody(req: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf-8"));
}

function requireField(form: URLSearchParams, name: string): string {
  const value = form.get(name);
  if (!value) {
    throw new Error(`"${name}" 값이 없어요.`);
  }
  return value;
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function redirectHome(res: ServerResponse): void {
  res.writeHead(303, { Location: "/" });
  res.end();
}

async function handleRegisterTargetCompany(form: URLSearchParams): Promise<void> {
  const name = requireField(form, "name");
  const jdText = requireField(form, "jdText");

  const tracker = createTargetCompanyTracker({
    jdExtractor: createHeuristicJdExtractionClient(),
    wikiSearch: createNoCoverageWikiSearch(),
    kpiStorage,
    targetCompanyStorage,
    calendarClient: getCalendarClient(),
  });
  await tracker.register({ id: randomUUID(), name, jdText });
}

async function handleMarkApplied(form: URLSearchParams): Promise<void> {
  const companyId = requireField(form, "companyId");
  await markApplicationComplete({ targetCompanyStorage, kpiStorage }, companyId, new Date().toISOString());
}

async function handleAdjustCompetencyScore(form: URLSearchParams): Promise<void> {
  const kpiId = requireField(form, "kpiId");
  const amount = Number(requireField(form, "amount"));
  if (!Number.isFinite(amount)) {
    throw new Error("역량 점수 조정 값이 올바르지 않아요.");
  }
  await adjustCompetencyScore({ kpiStorage }, kpiId, amount);
}

async function handleStartQuiz(form: URLSearchParams, res: ServerResponse): Promise<void> {
  const companyId = requireField(form, "companyId");
  const company = (await targetCompanyStorage.list()).find((c) => c.id === companyId);
  if (!company) {
    throw new Error("등록되지 않은 목표 회사예요.");
  }

  const questions = await quizSession.generateQuestions(company.requiredCompetencies);
  sendHtml(res, 200, renderQuizQuestionsPage({ companyId: company.id, companyName: company.name, questions }));
}

async function handleSubmitQuizAnswer(form: URLSearchParams, res: ServerResponse): Promise<void> {
  const question = {
    id: requireField(form, "questionId"),
    competency: requireField(form, "competency"),
    prompt: requireField(form, "prompt"),
  };
  const answerText = requireField(form, "answerText");
  const companyId = form.get("companyId");

  const record = await quizSession.submitAnswer({ question, answerText });
  sendHtml(res, 200, renderQuizAnswerResultPage({ companyId: companyId || null, record }));
}

// Actions that mutate state and then send the user back to the refreshed dashboard (post/redirect/get).
const REDIRECT_ACTIONS: Record<string, (form: URLSearchParams) => Promise<void>> = {
  "/actions/register-target-company": handleRegisterTargetCompany,
  "/actions/mark-applied": handleMarkApplied,
  "/actions/adjust-competency-score": handleAdjustCompetencyScore,
};

// Actions that render their own follow-up page (a quiz question list, a grading result) instead
// of bouncing straight back to the dashboard.
const PAGE_ACTIONS: Record<string, (form: URLSearchParams, res: ServerResponse) => Promise<void>> = {
  "/actions/start-quiz": handleStartQuiz,
  "/actions/submit-quiz-answer": handleSubmitQuizAnswer,
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url && req.url in REDIRECT_ACTIONS) {
      const form = await readFormBody(req);
      await REDIRECT_ACTIONS[req.url]!(form);
      redirectHome(res);
      return;
    }

    if (req.method === "POST" && req.url && req.url in PAGE_ACTIONS) {
      const form = await readFormBody(req);
      await PAGE_ACTIONS[req.url]!(form, res);
      return;
    }

    sendHtml(res, 200, await renderDashboardHtml());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendHtml(res, 400, renderActionErrorPage(message));
  }
});

server.listen(port, () => {
  console.log(`OK: KPI_tracker 관리 화면이 http://localhost:${port} 에서 실행 중이에요.`);
});
