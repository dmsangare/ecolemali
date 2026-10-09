import { useState, useEffect } from "react";
import { MessageCircle, Receipt, FileText, Loader2, Check, RotateCcw, Info } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from "@/components/ui";
import { useSettings, useUpdateTemplates } from "@/hooks/settings/useSettings";

// Templates par defaut
const DEFAULT_TEMPLATES = {
  whatsappReminder: `Bonjour {parentName},

Nous esperons que vous et votre famille allez bien.

Nous vous informons que la scolarite de votre enfant {studentName} presente un solde de {balance} pour l'annee scolaire en cours.

Nous vous serions reconnaissants de bien vouloir passer au bureau de l'ecole a votre convenance pour regulariser la situation.

Nous restons a votre disposition pour toute information complementaire.

Cordialement,
{schoolName}
{schoolAddress}
Tel : {schoolPhone}`,

  receiptFooter: `Merci pour votre paiement.

{schoolName}
{schoolAddress}
Tel : {schoolPhone}`,

  reportCardComment: `Felicitations pour votre travail.

{schoolName}`,
};

const VARIABLES_INFO = [
  { var: "{parentName}", desc: "Nom du parent/tuteur" },
  { var: "{studentName}", desc: "Nom complet de l'eleve" },
  { var: "{balance}", desc: "Solde impaye (ex: 110 000 FCFA)" },
  { var: "{schoolName}", desc: "Nom de l'ecole" },
  { var: "{schoolPhone}", desc: "Telephone de l'ecole" },
  { var: "{schoolAddress}", desc: "Adresse de l'ecole" },
];

export function TemplatesTab() {
  const { data: settings, isLoading } = useSettings();
  const updateTemplates = useUpdateTemplates();

  const savedTemplates = {
    whatsappReminder:
      settings?.data?.templates?.whatsappReminder ||
      DEFAULT_TEMPLATES.whatsappReminder,
    receiptFooter:
      settings?.data?.templates?.receiptFooter ||
      DEFAULT_TEMPLATES.receiptFooter,
    reportCardComment:
      settings?.data?.templates?.reportCardComment ||
      DEFAULT_TEMPLATES.reportCardComment,
  };

  const [templates, setTemplates] = useState(savedTemplates);

  useEffect(() => {
    setTemplates(savedTemplates);
  }, [settings?.data?.templates]);

  const hasChanges =
    templates.whatsappReminder !== savedTemplates.whatsappReminder ||
    templates.receiptFooter !== savedTemplates.receiptFooter ||
    templates.reportCardComment !== savedTemplates.reportCardComment;

  const handleSave = async () => {
    await updateTemplates.mutateAsync(templates);
  };

  const handleReset = (key: keyof typeof DEFAULT_TEMPLATES) => {
    setTemplates({ ...templates, [key]: DEFAULT_TEMPLATES[key] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[200px]";

  return (
    <div className="space-y-6">
      {/* VARIABLES DISPONIBLES */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-blue-900">
                Variables disponibles
              </p>
              <p className="text-xs text-blue-700 mt-0.5 mb-2">
                Utilisez ces variables dans vos messages, elles seront remplacees
                automatiquement.
              </p>
              <div className="flex flex-wrap gap-2">
                {VARIABLES_INFO.map((v) => (
                  <span
                    key={v.var}
                    className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 rounded px-2 py-1"
                    title={v.desc}
                  >
                    <code className="font-mono text-blue-700">{v.var}</code>
                    <span className="text-blue-600">·</span>
                    <span className="text-blue-600">{v.desc}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TEMPLATE WHATSAPP RELANCE */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Message de relance WhatsApp
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Message envoye aux parents pour les impayes.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleReset("whatsappReminder")}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Defaut
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={templates.whatsappReminder}
            onChange={(e) =>
              setTemplates({ ...templates, whatsappReminder: e.target.value })
            }
            className={inputClass}
          />
        </CardContent>
      </Card>

      {/* TEMPLATE RECU */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-5 w-5 text-blue-600" />
                Pied de page des recus
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Message affiche en bas des recus de paiement.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleReset("receiptFooter")}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Defaut
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={templates.receiptFooter}
            onChange={(e) =>
              setTemplates({ ...templates, receiptFooter: e.target.value })
            }
            className={inputClass}
          />
        </CardContent>
      </Card>

      {/* TEMPLATE BULLETIN */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-purple-600" />
                Commentaire par defaut des bulletins
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Appreciation automatique ajoutee aux bulletins.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleReset("reportCardComment")}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Defaut
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={templates.reportCardComment}
            onChange={(e) =>
              setTemplates({ ...templates, reportCardComment: e.target.value })
            }
            className={inputClass}
          />
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateTemplates.isPending}
        >
          {updateTemplates.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Enregistrer les templates
        </Button>
      </div>
    </div>
  );
}
