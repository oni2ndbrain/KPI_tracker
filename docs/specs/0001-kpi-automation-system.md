# SPEC: KPI 자동화 시스템

## Problem Statement

취업을 준비 중인 개인(언희)은 반기/분기마다 자신이 수행한 프로젝트와 성과를 자소서·면접 준비를 위해 정리하는데, 그때마다 지난 기간에 무엇을 했는지 처음부터 다시 발굴해야 한다. 성과는 여러 문서(pdf/ppt/xlsx/docx)와 LLM Wiki(개인 지식 관리 노트, Claude 대화 기록)에 흩어져 있어 기억에 의존해 되짚어야 하고, 그 결과 자신이 목표로 하는 회사(삼성전자/SK하이닉스 등 반도체 공정·양산기술 직무)의 채용공고가 요구하는 역량과 자신의 준비 상태 사이에 얼마나 갭이 있는지도 한눈에 파악하기 어렵다. 준비가 잘 되고 있는지, 무엇을 더 해야 하는지에 대한 신호가 없어 방향성 없이 시간만 흘러갈 위험이 있다.

## Solution

성과 발굴부터 목표 추적, 리포트까지 자동화하는 개인용 KPI 자동화 시스템을 만든다. 문서와 LLM Wiki를 증거 소스로 삼아 성과를 자동으로 발굴하고, 목표 회사의 채용공고(JD)를 등록하면 요구 역량과 마감일을 추출해 KPI를 그 방향에 맞게 조정한다. 역량 채우기·프로젝트 완성 현황·활동 건수·퀴즈 점수 향상 네 가지 KPI 카테고리로 진행 상황을 추적하며, 역량 진단 퀴즈로 활동량이 아닌 실제 이해도를 보정한다. 매주/매월 정기 리포트와 KPI 달성 시 달성 리포트를 이메일로 받아보고, 마감일이 다가오는데 진행률이 낮거나 퀴즈를 오래 하지 않으면 알림을 받는다. 모든 데이터는 구글 드라이브(KPI_tracker 폴더)에 저장되어 노트북이 꺼져 있어도 정해진 시점에 리포트/알림이 발송되며, 링크로 여는 웹 대시보드(관리 화면)에서 직접 조회하고 조작할 수 있다.

## User Stories

1. As a job-seeking user, I want the system to scan my written documents (pdf/ppt/xlsx/docx) for evidence of work I've done, so that I don't have to manually recall every project from scratch each review cycle.
2. As a job-seeking user, I want the system to also scan my LLM Wiki folder (new/edited notes and Claude conversation history), so that insights and analysis I've already captured there count as evidence too.
3. As a job-seeking user, I want each discovered achievement to be recorded as a reusable record I can pull into a self-introduction or interview answer, so that I don't rewrite the same accomplishment from memory every time.
4. As a job-seeking user, I want to register a target company (e.g. Samsung Electronics, SK Hynix) by pasting a job posting, so that the system knows which company and role I'm preparing for.
5. As a job-seeking user, I want the system to automatically extract the required competencies and application deadline from a pasted job posting, so that I don't have to manually transcribe them.
6. As a job-seeking user, I want the extracted required competencies to be cross-referenced against my LLM Wiki notes, so that the gap between what's required and what I already know is identified automatically.
7. As a job-seeking user, I want to track multiple target companies at the same time, each with its own deadline and required-competency gap, so that I can prepare for several applications in parallel without losing track.
8. As a job-seeking user, I want a "역량 채우기" KPI category that tracks how much of a target company's required competencies I've covered, so that I can see readiness as a single trackable number.
9. As a job-seeking user, I want a "프로젝트 완성 현황" KPI category tracked as a percentage, so that I can see how close an in-progress project (like this AX portfolio project) is to done.
10. As a job-seeking user, I want an "활동 건수" KPI category that counts events like "number of applications submitted this month," so that count-based goals are tracked distinctly from percentage-based ones.
11. As a job-seeking user, I want a "퀴즈 점수 향상" KPI category that tracks whether my average competency-quiz score is trending up over time, so that improving understanding is itself a visible goal.
12. As a job-seeking user, I want the "역량 채우기" score to be corrected by my competency-quiz results rather than relying only on activity volume, so that the score reflects real understanding, not just how much I did.
13. As a job-seeking user, I want a weekly short-summary report and a separate monthly deep-dive report sent to my email, so that I get a quick pulse check weekly and a fuller picture monthly.
14. As a job-seeking user, I want every regular report to be structured as facts (what I did) → gaps (what's missing) → suggestions (what to do next), so that I always know the next action, not just the current status.
15. As a job-seeking user, I want regular reports formatted as a colorful table-style layout (not a monochrome formal document), so that I can scan status at a glance.
16. As a job-seeking user, I want a separate "달성 리포트" email sent every time an individual KPI reaches its target, so that hitting a goal is celebrated and summarized independently of the regular cadence.
17. As a job-seeking user, I want the 달성 리포트 to show an achievement banner, what I did, my overall competency progress bars, and a concrete suggestion for my most-lagging KPI, so that a single email tells me both the win and the next priority.
18. As a job-seeking user, I want every email report to be plain HTML/CSS only (tables, colored boxes, progress bars — no JavaScript-driven charts), so that it renders correctly in real email clients that can't execute JavaScript.
19. As a job-seeking user, I want every email report to include a button linking to the 관리 화면, so that I can go see the interactive charts and full detail when I want them.
20. As a job-seeking user, I want a link-based web dashboard (관리 화면) styled to match the agreed pastel macOS-style mockup, so that I have one place to view and operate everything, not just read emails.
21. As a job-seeking user, I want to register a target company, start a competency quiz, mark an application as submitted, and manually adjust a competency score directly from the 관리 화면, so that I'm not limited to passive viewing.
22. As a job-seeking user, I want to click on any KPI item in the 관리 화면 and see its 지표 정의서 (a reference doc explaining exactly what it measures and how it's calculated), so that I can trust and understand the number without it cluttering every report.
23. As a job-seeking user, I want a deadline alert email at D-14, D-7, and D-1 before a target company's application deadline whenever my progress is behind target, so that I'm warned with enough lead time to react.
24. As a job-seeking user, I want each deadline alert to say specifically what I should do right now to catch up, so that the alert is actionable, not just a warning.
25. As a job-seeking user, I want a nudge email if I haven't done a competency quiz in 7 or more days, asking whether I want to start one this week, so that I don't quietly stop practicing.
26. As a job-seeking user, I want the competency quiz to be suggested to me by the regular report but only start when I choose to begin it, so that I stay in control of when I'm quizzed.
27. As a job-seeking user, I want quiz questions to be generated from both the target company's JD required competencies and my LLM Wiki technical notes, so that questions are relevant to both what's demanded and what I've already studied.
28. As a job-seeking user, I want to answer quiz questions by voice (via Windows' built-in dictation for now, since no direct speech connector exists), so that answering feels like a spoken interview, not typing.
29. As a job-seeking user, I want each answer scored 1–5 based on whether I connect it to my own experience and whether I structure it as phenomenon → downstream process impact → cause → solution, so that scoring reflects interview-answer depth, not just correctness.
30. As a job-seeking user, I want questions I got wrong to reappear in a later quiz, so that I get another chance to close the gap instead of it being forgotten.
31. As a job-seeking user, I want an item I've missed two times in a row to be flagged as a "취약 항목" (weak item) and highlighted in my reports, so that I know exactly what's chronically weak.
32. As a job-seeking user, I want each weak item to come with a study recommendation — pulled from my LLM Wiki if related material already exists there, or freshly searched if not — so that I know exactly what to study to close that specific gap.
33. As a job-seeking user, I want my target company deadlines to be written automatically into my Google Calendar when extracted from a job posting, so that I see them in the calendar I already use.
34. As a job-seeking user, I want the system to also read application-period entries I've manually added to my Google Calendar, so that dates I enter by hand are picked up too, not just ones the system extracted itself.
35. As a job-seeking user, I want all my KPI data (achievements, KPI progress, target company info) stored in a Google Drive folder named "KPI_tracker," so that I can trust the storage location and access it independently of this tool if needed.
36. As a job-seeking user, I want regular reports and deadline/quiz alerts to still be generated and sent on schedule even when my laptop is turned off, so that I never miss a report just because I forgot to leave my laptop on.
37. As a job-seeking user, I want the regular and achievement email formats to stay exactly as already agreed (colorful table-style report + colorful achievement banner), not redesigned again, so that the visual direction I already approved is preserved into implementation.

## Implementation Decisions

### Core seam: KPI 엔진 (하나의 중심 모듈)

시스템의 테스트 가능한 핵심은 **KPI 엔진** 하나로 둔다. 나머지 모든 구성 요소는 이 엔진에 데이터를 넣거나(쓰기) 엔진의 결과를 꺼내 쓰는(읽기) **어댑터**로만 존재한다. 이렇게 나누면 특정 어댑터(예: 캘린더를 구글에서 다른 서비스로 바꾸는 것)가 바뀌어도 핵심 판단 로직은 그대로 유지된다.

- **KPI 엔진의 입력**: 발굴된 성과(Achievement) 레코드, 목표 회사(Target Company)별 요구 역량·마감일, 역량 진단 퀴즈 결과(문항별 1~5점, 정오답 이력), 캘린더에서 읽어온 지원 기간 엔트리, 사용자가 관리 화면에서 직접 조정한 역량 점수.
- **KPI 엔진의 출력**: KPI 카테고리별(역량 채우기/프로젝트 완성 현황/활동 건수/퀴즈 점수 향상) 현재 값·목표 대비 달성률, 알림 발송 여부 결정(마감일 D-14/D-7/D-1 시 목표 미달 여부, 퀴즈 7일 이상 미실행 여부), 정기 리포트·달성 리포트에 들어갈 데이터(팩트/갭/제안, 가장 뒤처진 항목), 취약 항목 목록과 그에 대한 학습 추천 후보.
- KPI 엔진은 순수 로직으로 구현하고, 구글 드라이브/Gmail/구글 캘린더/문서 파싱/LLM Wiki 읽기/퀴즈 채점 자체(LLM 호출)/노트북 활동 추적/관리 화면(웹 UI)은 모두 이 엔진 바깥의 어댑터로 분리한다.

### 어댑터 목록과 책임

- **증거 소스 리더**: 문서 파일(pdf/ppt/xlsx/docx) 파싱과 LLM Wiki 폴더(신규·수정 노트 + Claude 대화 내역) 읽기를 담당. 결과를 성과 후보 레코드로 변환해 KPI 엔진에 전달.
- **목표 회사 JD 추출기**: 채용공고 원문(붙여넣기)에서 요구 역량과 마감일을 추출. LLM Wiki 내용도 함께 참고해 KPI 엔진에 전달할 갭 분석 입력을 만든다.
- **역량 진단 퀴즈 채점기**: JD 요구 역량 + LLM Wiki 기술 노트를 바탕으로 문항을 생성하고, 사용자의 (음성 입력 → Windows 내장 음성 입력으로 텍스트화된) 답변을 1~5점 척도로 채점. 채점 기준은 (1) 본인 경험과의 연관 설명 여부, (2) 현상 → 후속공정 영향 → 원인 → 해결 구조화 여부.
- **Google Drive 어댑터**: KPI_tracker 폴더에 성과/KPI 진행 상황/목표 회사 정보를 읽고 쓴다. 노트북이 꺼져 있어도 리포트/알림이 나갈 수 있도록 하는 저장소([[storage-and-execution-architecture]] ADR 참고).
- **Gmail 어댑터**: 정기 리포트(주간/월간), 달성 리포트, 알림(마감일/퀴즈 비활동) 이메일 발송. 모든 이메일은 순수 HTML/CSS만 사용(표, 색상 박스, 진행바) — 자바스크립트 기반 캔버스 차트는 포함하지 않는다.
- **Google Calendar 어댑터**: 양방향 동기화 — JD에서 추출한 마감일을 캘린더에 쓰고, 사용자가 캘린더에 직접 적어둔 지원 기간을 읽어온다. 네이버 캘린더는 지원하지 않는다.
- **노트북 활동 추적 에이전트**: 2단계 확장 항목(증거 소스 1단계는 문서+LLM Wiki만). 이번 스펙에서는 인터페이스 자리만 남겨두고 실제 구현은 범위에서 제외한다 (Out of Scope 참고).
- **예약 실행(스케줄러)**: 주간/월간 정기 리포트 발송 시점, D-14/D-7/D-1 마감일 체크, 7일 퀴즈 비활동 체크를 정해진 시점에 트리거. 클라우드에서 실행되어 노트북 전원 상태와 무관하게 동작.
- **관리 화면(웹 대시보드)**: `docs/design/kpi-dashboard-mockup.html`에 저장된 파스텔 macOS 스타일 디자인을 그대로 구현 기준으로 삼는다. KPI 엔진의 출력을 조회하고, 목표 회사 등록/퀴즈 시작/지원 완료 체크/역량 점수 직접 조정 등 조작을 KPI 엔진에 반영하는 프론트엔드. 1단계는 웹페이지, 설치형 앱화는 이번 스펙 범위 밖.

### 리포트 렌더러

정기 리포트와 달성 리포트는 별도의 렌더러로 두되, 둘 다 KPI 엔진이 만든 동일한 데이터 모델(팩트/갭/제안, 달성 배지 여부, 진행률, 취약 항목)을 입력으로 받는다. 렌더러는 플레인 HTML/CSS만 생성하며 이미 합의된 색상 팔레트(민트/코랄/앰버/퍼플)와 레이아웃(표 리포트 / 달성 배너+진행바)을 그대로 따른다.

## Testing Decisions

좋은 테스트는 외부에서 관찰 가능한 동작(입력 → 출력)만 검증하고, 내부 구현 방식은 자유롭게 바꿀 수 있어야 한다는 원칙을 따른다.

- **KPI 엔진**: 가장 두꺼운 테스트 커버리지를 둔다. 순수 로직이므로 고정된 fixture(성과 레코드, 목표 회사 JD 갭, 퀴즈 이력, 캘린더 엔트리)를 입력해 KPI 진행률·알림 발송 여부·리포트 데이터 모델·취약 항목 판정이 기대한 대로 나오는지 단위 테스트로 검증한다. 외부 API 호출이 전혀 없으므로 빠르고 결정적인 테스트가 가능하다.
- **어댑터(Google Drive/Gmail/Calendar)**: 실제 API를 호출하지 않고, 녹화된 응답 fixture를 사용한 계약(contract) 테스트로 검증한다 — "이 입력이 오면 이 어댑터가 KPI 엔진이 기대하는 형태로 변환해내는가"만 확인한다.
- **JD 추출기 / 퀴즈 채점기**: LLM 호출을 포함하므로, 실시간 LLM 호출 대신 기록된 프롬프트-응답 fixture로 파싱/채점 로직(척도 매핑, 채점 기준 판정)을 테스트한다.
- **리포트 렌더러**: KPI 엔진 출력 데이터 모델을 입력으로 준 뒤 생성된 HTML이 골든 파일(스냅샷)과 일치하는지 확인한다. 특히 이메일 클라이언트 제약(자바스크립트 없음)을 어기지 않는지(예: `<script>`, `<canvas>` 미포함)도 검증한다.
- **관리 화면**: UI이므로 자동화 테스트보다 실제 브라우저에서 골든 패스(목표 회사 등록 → 퀴즈 시작 → 결과 반영 → 리포트 링크 클릭)를 직접 확인하는 것을 우선한다. `docs/design/kpi-dashboard-mockup.html`과 시각적으로 일치하는지도 함께 확인한다.
- 프로젝트 내 기존 코드가 없는 그린필드 빌드이므로, 각 어댑터/엔진 모듈이 만들어질 때 그 모듈에 대한 테스트 방식(단위/계약/스냅샷 중 무엇을 쓸지)은 위 분류를 그대로 prior art로 삼는다.

## Out of Scope

- **노트북 활동(스크린타임) 추적**: 증거 소스 2단계 확장 항목으로 CONTEXT.md에 이미 명시되어 있음. 이번 스펙에서는 어댑터 인터페이스 자리만 예약하고 실제 수집/분석 로직은 구현하지 않는다.
- **자체 음성 인식(STT) 구축**: 이 환경에 연결된 음성 인식 도구가 없어, 윈도우 내장 음성 입력으로 텍스트화하는 것을 그대로 사용한다. 자체 STT 파이프라인은 만들지 않는다.
- **네이버 캘린더 연동**: 검토 후 명시적으로 채택하지 않기로 함 — 구글 캘린더로 통일.
- **팀/부서/동료 데이터 기반 KPI 추천**: 원 요청에는 포함되어 있었으나, 세션 중 현재 재직 중인 회사·팀이 없는 개인 구직 준비 도구임이 확인되어 범위에서 제외되었다. 대신 목표 회사 JD 갭 분석 + 본인 LLM Wiki 데이터로 대체.
- **관리 화면의 설치형 앱 버전**: 1단계는 링크로 여는 웹페이지로 한정. 앱화는 이후 별도 스펙에서 다룬다.
- **무채색 공식 문서 스타일 리포트**: 세션 중 시안으로 검토했으나 명시적으로 폐기됨 — 컬러풀한 표 리포트/달성 배너 스타일만 구현한다.
- **정기 리포트/달성 리포트 외의 추가 리포트 형식**: 두 가지 리포트 유형(정기/달성)과 두 가지 알림 트리거(마감일/퀴즈 비활동) 외의 새로운 리포트·알림 종류는 이번 스펙에 포함하지 않는다.

## Further Notes

- 이 스펙은 `CONTEXT.md`의 용어 정의를 그대로 사용한다. 특히 "KPI"는 회사의 공식 인사평가가 아니라 개인 구직 준비 목표를 뜻하며, "성과"·"증거 소스"·"목표 회사"·"알림" 등의 용어도 CONTEXT.md 정의를 따른다.
- 저장/실행 구조는 이미 `docs/adr/0001-storage-and-execution-architecture.md`에 결정되어 있다: 활동 추적만 로컬, 나머지(저장/리포트 생성/발송)는 구글 드라이브 + 예약 클라우드 작업.
- 관리 화면의 시각 디자인은 이미 `docs/design/kpi-dashboard-mockup.html`에 최종 확정되어 있으며, 새로 디자인을 고민하지 않고 이 파일의 팔레트·레이아웃을 그대로 구현 기준으로 삼는다.
- 이 스펙 하나로 전체 시스템을 커버하므로, 다음 단계(`/to-tickets`)에서 KPI 엔진, 각 어댑터, 리포트 렌더러, 관리 화면 등으로 티켓을 쪼갤 때 이 문서의 "Implementation Decisions" 구획을 그대로 티켓 경계로 삼을 수 있다.
- 이 스펙 작성 시점 기준으로 이 저장소에는 `gh` (GitHub CLI)가 설치되어 있지 않아 GitHub 이슈로 즉시 발행하지 못했다. `gh` 설치 및 인증 후 이 파일 내용을 이슈로 옮기고 `ready-for-agent` 라벨을 적용해야 한다.
