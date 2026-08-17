import { createServer } from "node:http";
import { buildDashboardViewModel, renderDashboardPage } from "../src/packages/dashboard/index.js";
import { createDriveAuthFromEnv, createGoogleApiDriveClient } from "../src/packages/kpi-storage/google-drive.js";
import {
  createKpiStorage,
  createQuizActivityStorage,
  createQuizResultStorage,
  createTargetCompanyStorage,
} from "../src/packages/kpi-storage/index.js";

const port = Number(process.env.DASHBOARD_PORT ?? 4310);

const drive = createGoogleApiDriveClient(createDriveAuthFromEnv());
const kpiStorage = createKpiStorage(drive);
const targetCompanyStorage = createTargetCompanyStorage(drive);
const quizResultStorage = createQuizResultStorage(drive);
const quizActivityStorage = createQuizActivityStorage(drive);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const server = createServer(async (_req, res) => {
  try {
    const [kpis, targetCompanies, quizAnswers, lastQuizAt] = await Promise.all([
      kpiStorage.list(),
      targetCompanyStorage.list(),
      quizResultStorage.list(),
      quizActivityStorage.lastCompletedAt(),
    ]);

    const model = buildDashboardViewModel({ kpis, targetCompanies, quizAnswers, lastQuizAt, today: todayIsoDate() });
    const html = renderDashboardPage(model);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`대시보드를 불러오는 중 오류가 발생했어요: ${error instanceof Error ? error.message : String(error)}`);
  }
});

server.listen(port, () => {
  console.log(`OK: KPI_tracker 관리 화면이 http://localhost:${port} 에서 실행 중이에요.`);
});
