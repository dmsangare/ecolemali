import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { StudentsListPage, StudentDetailPage, StudentFormPage } from "@/pages/students";
import { ClassesListPage } from "@/pages/classes";
import { TeachersListPage } from "@/pages/teachers";
import { SubjectsListPage } from "@/pages/subjects";
import { AttendanceListPage, AttendanceDetailPage } from "@/pages/attendance";
import { AssessmentsListPage, AssessmentGradesPage } from "@/pages/assessments";
import { ReportCardsListPage } from "@/pages/report-cards";
import { InvoicesListPage, PaymentsListPage, CashSessionsListPage } from "@/pages/finance";
import { ExamsListPage, ExamDetailPage } from "@/pages/exams";
import { ReportsPage } from "@/pages/reports";
import { SettingsPage } from "@/pages/settings";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/students" element={<StudentsListPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />

          <Route path="/classes" element={<ClassesListPage />} />
          <Route path="/teachers" element={<TeachersListPage />} />
          <Route path="/subjects" element={<SubjectsListPage />} />

          <Route path="/attendance" element={<AttendanceListPage />} />
          <Route path="/attendance/:id" element={<AttendanceDetailPage />} />

          <Route path="/grades" element={<AssessmentsListPage />} />
          <Route path="/grades/:id" element={<AssessmentGradesPage />} />

          <Route path="/report-cards" element={<ReportCardsListPage />} />

          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/payments" element={<PaymentsListPage />} />
          <Route path="/cash-sessions" element={<CashSessionsListPage />} />

          <Route path="/exams" element={<ExamsListPage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
