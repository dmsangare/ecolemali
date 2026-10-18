import { useState } from "react";
import {
  FileText, Upload, Download, Trash2, Eye, AlertCircle, FileCheck,
  Image as ImageIcon, FileWarning,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatusBadge, EmptyState, ConfirmDialog } from "@/components/shared";
import { formatDate, formatFileSize } from "@/lib/formatters";
import {
  useStudentDocumentsList,
  useRemoveStudentDocument,
} from "@/hooks/students";
import type { StudentDocument } from "@/types/student";

interface DocumentsTabProps {
  studentId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BIRTH_CERTIFICATE: "Acte de naissance",
  SCHOOL_CERTIFICATE: "Certificat de scolarite",
  TRANSFER: "Dossier de transfert",
  PHOTO: "Photo d identite",
  OTHER: "Autre document",
};

const DOCUMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  BIRTH_CERTIFICATE: <FileText className="h-5 w-5" />,
  SCHOOL_CERTIFICATE: <FileCheck className="h-5 w-5" />,
  TRANSFER: <FileWarning className="h-5 w-5" />,
  PHOTO: <ImageIcon className="h-5 w-5" />,
  OTHER: <FileText className="h-5 w-5" />,
};

export function DocumentsTab({ studentId }: DocumentsTabProps) {
  const { data: documents, isLoading } = useStudentDocumentsList(studentId);
  const removeMutation = useRemoveStudentDocument();

  const [deleteTarget, setDeleteTarget] = useState<StudentDocument | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await removeMutation.mutateAsync({
        studentId,
        documentId: deleteTarget.id,
      });
      setDeleteTarget(null);
    }
  };

  const handleUpload = () => {
    alert(
      "L upload de documents sera disponible dans la prochaine version.\n\n" +
      "En attendant, vous pouvez noter les documents a collecter :\n" +
      "- Acte de naissance\n" +
      "- Certificat de scolarite\n" +
      "- Photo d identite\n" +
      "- Dossier de transfert (si applicable)"
    );
  };

  const handleDownload = (doc: StudentDocument) => {
    window.open(doc.fileUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Info importante */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Documents a collecter progressivement
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Au Mali, tous les documents ne sont pas toujours disponibles au moment de l inscription.
              Vous pouvez les ajouter au fur et a mesure qu ils vous sont remis par les parents.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Ajouter un document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={handleUpload}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium mt-3">
              Cliquez pour uploader un document
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG — max 10 Mo
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documents existants
            </span>
            {documents && documents.length > 0 && (
              <StatusBadge label={`${documents.length}`} variant="info" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground/50" />}
              title="Aucun document"
              description="Les documents de l élève apparaitront ici une fois ajoutes."
              className="h-40"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Fichier</th>
                    <th className="px-4 py-3">Taille</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {DOCUMENT_TYPE_ICONS[doc.type] || <FileText className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-medium">
                            {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {doc.fileName || "Document"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {doc.sizeBytes ? formatFileSize(doc.sizeBytes) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(doc.uploadedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                            title="Telecharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(doc)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4 text-primary" />
            Checklist des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => {
              const hasDoc = documents?.some((d) => d.type === key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        hasDoc
                          ? "bg-green-600 border-green-600"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {hasDoc && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{label}</span>
                  </div>
                  {hasDoc ? (
                    <StatusBadge label="Fourni" variant="success" />
                  ) : (
                    <StatusBadge label="A collecter" variant="warning" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le document"
        description={`Voulez-vous vraiment supprimer "${deleteTarget?.fileName || "ce document"}" ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
