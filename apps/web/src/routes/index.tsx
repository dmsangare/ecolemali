import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { StudentsListPage } from "@/pages/students/StudentsListPage";
import { StudentDetailPage } from "@/pages/students/StudentDetailPage";
import { StudentFormPage } from "@/pages/students/StudentFormPage";
import { ClassesListPage, ClassDetailPage } from "@/pages/classes";
import { TeachersListPage, TeacherFormPage, TeacherDetailPage } from "@/pages/teachers";
import { SubjectsListPage, SubjectFormPage } from "@/pages/subjects";
import { AttendanceListPage, AttendanceDetailPage } from "@/pages/attendance";
import { AssessmentsListPage, AssessmentGradesPage } from "@/pages/assessments";
import { ReportCardsListPage, ReportCardDetailPage } from "@/pages/report-cards";
import {
  InvoicesListPage,
  InvoiceDetailPage,
  PaymentDetailPage,
  PaymentsListPage,
  CashSessionsListPage,
  FeeTypesListPage,
  FeeStructuresListPage,
} from "@/pages/finance";
import { ExamsListPage, ExamDetailPage } from "@/pages/exams";
import { ReportsPage } from "@/pages/reports";
import { SettingsPage } from "@/pages/settings";
import TimetablePage from '@/pages/timetable/TimetablePage';

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

          {/* Eleves */}
          <Route path="/students" element={<StudentsListPage />} />
          <Route path="/students/new" element={<StudentFormPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/students/:id/edit" element={<StudentFormPage />} />

          {/* Autres modules */}
          <Route path="/classes" element={<ClassesListPage />} />
          <Route path="/classes/:id" element={<ClassDetailPage />} />
          <Route path="/teachers" element={<TeachersListPage />} />
          <Route path="/teachers/new" element={<TeacherFormPage />} />
          <Route path="/teachers/:id/edit" element={<TeacherFormPage />} />
          <Route path="/teachers/:id" element={<TeacherDetailPage />} />
          <Route path="/subjects" element={<SubjectsListPage />} />
          <Route path="/subjects/new" element={<SubjectFormPage />} />
          <Route path="/subjects/:id/edit" element={<SubjectFormPage />} />

          <Route path="/attendance" element={<AttendanceListPage />} />
          <Route path="/attendance/:id" element={<AttendanceDetailPage />} />

          <Route path="/assessments" element={<AssessmentsListPage />} />
          <Route path="/assessments/:id/grades" element={<AssessmentGradesPage />} />

          <Route path="/report-cards" element={<ReportCardsListPage />} />
          <Route path="/report-cards/:id" element={<ReportCardDetailPage />} />

          <Route path="/fee-types" element={<FeeTypesListPage />} />
          <Route path="/fee-structures" element={<FeeStructuresListPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/payments" element={<PaymentsListPage />} />
          <Route path="/payments/:id" element={<PaymentDetailPage />} />
          <Route path="/cash-sessions" element={<CashSessionsListPage />} />

          <Route path="/exams" element={<ExamsListPage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
