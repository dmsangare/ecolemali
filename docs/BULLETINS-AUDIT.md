# SIS-MALI — Audit module Bulletins (BLOC 5)

Date : 2026-10-19
Branche : feat/bulletins-v2
Commit de départ : bff62f3

## Dépendances des modèles

```
### ReportCard
apps/api/dist/academic-years/academic-years.controller.d.ts
apps/api/dist/academic-years/academic-years.service.d.ts
apps/api/dist/report-cards/dto/index.d.ts
apps/api/dist/report-cards/report-cards.controller.d.ts
apps/api/dist/report-cards/report-cards.module.d.ts
apps/api/dist/report-cards/report-cards.service.d.ts
apps/api/dist/report-cards/utils/report-card-pdf.util.d.ts
apps/api/src/academic-years/academic-years.service.ts
apps/api/src/app.module.ts
apps/api/src/dashboard/dashboard.service.ts
apps/api/src/report-cards/annual-results.controller.ts
apps/api/src/report-cards/dto/index.ts
apps/api/src/report-cards/report-cards.controller.ts
apps/api/src/report-cards/report-cards.module.ts
apps/api/src/report-cards/report-cards.service.ts
apps/api/src/report-cards/utils/report-card-pdf.util.ts
apps/api/src/transfers/transfers.service.ts
apps/api/src/year-rollover/year-rollover.module.ts
apps/web/src/api/academic-years.ts
apps/web/src/api/report-cards.ts
apps/web/src/hooks/report-cards/index.ts
apps/web/src/hooks/report-cards/useReportCards.ts
apps/web/src/pages/dashboard/ClosingYearCard.tsx
apps/web/src/pages/report-cards/components/ExportReportCardButton.tsx
apps/web/src/pages/report-cards/components/GenerateReportCardsModal.tsx
apps/web/src/pages/report-cards/components/PublishClassModal.tsx
apps/web/src/pages/report-cards/index.ts
apps/web/src/pages/report-cards/ReportCardDetailPage.tsx
apps/web/src/pages/report-cards/ReportCardsListPage.tsx
apps/web/src/routes/index.tsx
apps/web/src/types/grades.ts
apps/web/src/types/report-cards.ts
packages/shared/dist/schemas.d.ts
packages/shared/src/schemas.ts

### StudentPathway
apps/api/src/admin-reports/report-data.builder.ts
apps/api/src/state-exams/state-exams.service.ts
apps/web/src/hooks/students/useStudentDetail.ts
apps/web/src/hooks/students/useStudents.ts
apps/web/src/pages/students/components/tabs/SchoolTab.tsx
apps/web/src/types/student.ts

### SubjectCoefficient
apps/api/src/report-cards/report-cards.service.ts
packages/shared/dist/schemas.d.ts
packages/shared/src/schemas.ts

### annual-calc / calculateWeightedAverage / calculateReportAverage
apps/api/dist/report-cards/annual-results.controller.d.ts
apps/api/dist/report-cards/annual-results.service.d.ts
apps/api/src/grades/grades.service.ts
apps/api/src/report-cards/annual-results.service.ts
apps/api/src/report-cards/report-cards.service.ts
packages/shared/dist/utils.d.ts
packages/shared/src/utils.ts
```

## Modèles existants

```
model School {
model AcademicYear {
model Term {
model Level {
model Room {
model Class {
model Setting {
model User {
model Role {
model Permission {
model RolePermission {
model UserRole {
model RefreshToken {
model AuthLog {
model Student {
model Guardian {
model StudentGuardian {
model StudentDocument {
model Enrollment {
model StudentPathway {
model Teacher {
model Subject {
model SubjectCoefficient {
model TeacherAssignment {
model TimetableSlot {
model AttendanceSession {
model AttendanceRecord {
model Assessment {
model Grade {
model ReportCard {
model ReportCardItem {
model Exam {
model ExamSession {
model ExamCandidate {
model FeeType {
model FeeStructure {
model Invoice {
model InvoiceItem {
model Payment {
model Receipt {
model CashSession {
model DocumentTemplate {
model GeneratedDocument {
model Notification {
model AuditLog {
model Backup {
model SystemLog {
model StudentTransfer {
model ExpenseCategory {
model Expense {
model TopStudent {
model MessageLog {
model StudentAccount {
model VerifiableDocument {
model AdminReportTemplate {
model AdminReport {
model AdminReportVersion {
model AdminReportTransmission {
model AdminReportDeadline {
model AdminReportAuditLog {
model StateExamSession {
model ExamDossier {
model ExamDossierPiece {
model InvoiceInstallment {
```

## School.academy / School.cap

```
  academy           String?      @db.VarChar(100)
  cap               String?      @db.VarChar(100)
```

## Assessment

```
  termId         String           @map("term_id") @db.Uuid
  type           AssessmentType
  maxScore       Decimal          @map("max_score") @db.Decimal(5, 2)
  term         Term         @relation(fields: [termId], references: [id])
  @@index([classId, termId])
```

## Grade

```
  isAbsent     Boolean  @default(false) @map("is_absent")
  observation  String?
```

## Term

```
  type           TermType
  isLocked       Boolean  @default(false) @map("is_locked")
```

## Jest

```
NON INSTALLÉ
```

## Moteurs de calcul existants

```
-rw-rw-r-- 1 adama adama 4663 Oct  8 14:58 apps/api/src/report-cards/annual-calc.ts
-rw-rw-r-- 1 adama adama 2358 Oct  8 15:21 apps/api/src/report-cards/grading-rules.ts
111:export function calculateWeightedAverage(
127:export function calculateReportAverage(
```
