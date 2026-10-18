import { useState, useEffect } from "react";
import { Save, Plus, Trash2, GripVertical, FileText, Calendar, Award, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { api } from "@/lib/axios";

interface SubjectConfig { name: string; coefficient: number; order: number; }
interface PeriodConfig { name: string; order: number; }
interface AssessmentTypeConfig { name: string; type: string; maxScore: number; order: number; }

export function BulletinConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    header1: "RÉPUBLIQUE DU MALI",
    header2: "Un Peuple - Un But - Une Foi",
    academy: "",
    cap: "",
    periodType: "TRIMESTRE",
    calculationMode: "WEIGHTED",
    useCoefficients: true,
    showQrCode: true,
    subjects: [],
    periods: [],
    assessmentTypes: [],
  });

  useEffect(() => {
    api.get("/bulletin-config").then((res) => {
      setConfig(res.data.data || res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/bulletin-config", config);
      alert("✅ Configuration sauvegardée !");
    } catch (err: any) {
      alert("❌ Erreur : " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // --- Matières ---
  const addSubject = () => {
    setConfig({ ...config, subjects: [...config.subjects, { name: "Nouvelle matière", coefficient: 1, order: config.subjects.length }] });
  };
  const updateSubject = (idx: number, field: keyof SubjectConfig, value: any) => {
    const newSubjects = [...config.subjects];
    newSubjects[idx] = { ...newSubjects[idx], [field]: value };
    setConfig({ ...config, subjects: newSubjects });
  };
  const removeSubject = (idx: number) => {
    setConfig({ ...config, subjects: config.subjects.filter((_: any, i: number) => i !== idx) });
  };

  // --- Périodes ---
  const addPeriod = () => {
    setConfig({ ...config, periods: [...config.periods, { name: "Nouvelle période", order: config.periods.length }] });
  };
  const updatePeriod = (idx: number, value: string) => {
    const newPeriods = [...config.periods];
    newPeriods[idx] = { ...newPeriods[idx], name: value };
    setConfig({ ...config, periods: newPeriods });
  };
  const removePeriod = (idx: number) => {
    setConfig({ ...config, periods: config.periods.filter((_: any, i: number) => i !== idx) });
  };

  // --- Types d'évaluations ---
  const addAssessmentType = () => {
    setConfig({ ...config, assessmentTypes: [...config.assessmentTypes, { name: "Nouvelle évaluation", type: "DEVOIR", maxScore: 20, order: config.assessmentTypes.length }] });
  };
  const updateAssessmentType = (idx: number, field: keyof AssessmentTypeConfig, value: any) => {
    const newTypes = [...config.assessmentTypes];
    newTypes[idx] = { ...newTypes[idx], [field]: value };
    setConfig({ ...config, assessmentTypes: newTypes });
  };
  const removeAssessmentType = (idx: number) => {
    setConfig({ ...config, assessmentTypes: config.assessmentTypes.filter((_: any, i: number) => i !== idx) });
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration du bulletin
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Personnalisez le modèle de bulletin utilisé par votre école
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="header" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="header">En-tête</TabsTrigger>
          <TabsTrigger value="periods">Périodes</TabsTrigger>
          <TabsTrigger value="subjects">Matières</TabsTrigger>
          <TabsTrigger value="assessments">Évaluations</TabsTrigger>
        </TabsList>

        {/* EN-TÊTE */}
        <TabsContent value="header">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Ligne 1 (République)</Label>
                <Input value={config.header1 || ""} onChange={(e) => setConfig({ ...config, header1: e.target.value })} />
              </div>
              <div>
                <Label>Ligne 2 (Devise)</Label>
                <Input value={config.header2 || ""} onChange={(e) => setConfig({ ...config, header2: e.target.value })} />
              </div>
              <div>
                <Label>Académie d'Enseignement</Label>
                <Input value={config.academy || ""} onChange={(e) => setConfig({ ...config, academy: e.target.value })} placeholder="Ex: Académie d'Enseignement de Bamako" />
              </div>
              <div>
                <Label>Centre d'Animation Pédagogique (CAP)</Label>
                <Input value={config.cap || ""} onChange={(e) => setConfig({ ...config, cap: e.target.value })} placeholder="Ex: CAP de Bamako" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="qr" checked={config.showQrCode || false} onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })} className="rounded" />
                <Label htmlFor="qr" className="cursor-pointer">Afficher un QR code de vérification sur chaque bulletin</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PÉRIODES */}
        <TabsContent value="periods">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Périodes de l'année</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Définissez les périodes (trimestres ou mois)</p>
              </div>
              <Button onClick={addPeriod} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config.periods?.map((p: PeriodConfig, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                    <Input value={p.name} onChange={(e) => updatePeriod(idx, e.target.value)} className="flex-1" placeholder="Ex: 1er Trimestre" />
                    <Button variant="ghost" size="icon" onClick={() => removePeriod(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              {(!config.periods || config.periods.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune période. Cliquez sur "Ajouter".</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MATIÈRES */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Matières et Coefficients</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Définissez les matières de votre école et leur coefficient</p>
              </div>
              <Button onClick={addSubject} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config.subjects?.map((s: SubjectConfig, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input value={s.name} onChange={(e) => updateSubject(idx, "name", e.target.value)} className="flex-1" placeholder="Ex: Rédaction" />
                    <Input type="number" value={s.coefficient} onChange={(e) => updateSubject(idx, "coefficient", Number(e.target.value))} className="w-20" min={1} />
                    <span className="text-xs text-muted-foreground">coef.</span>
                    <Button variant="ghost" size="icon" onClick={() => removeSubject(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              {(!config.subjects || config.subjects.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune matière. Cliquez sur "Ajouter".</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ÉVALUATIONS */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Types d'évaluations</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Devoirs, Compositions, Interrogations...</p>
              </div>
              <Button onClick={addAssessmentType} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config.assessmentTypes?.map((a: AssessmentTypeConfig, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                    <Input value={a.name} onChange={(e) => updateAssessmentType(idx, "name", e.target.value)} className="flex-1" placeholder="Ex: Devoir 1" />
                    <select value={a.type} onChange={(e) => updateAssessmentType(idx, "type", e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="DEVOIR">Devoir</option>
                      <option value="COMPOSITION">Composition</option>
                      <option value="INTERROGATION">Interrogation</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                    <Input type="number" value={a.maxScore} onChange={(e) => updateAssessmentType(idx, "maxScore", Number(e.target.value))} className="w-20" min={1} />
                    <span className="text-xs text-muted-foreground">/ notes</span>
                    <Button variant="ghost" size="icon" onClick={() => removeAssessmentType(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              {(!config.assessmentTypes || config.assessmentTypes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun type d'évaluation. Cliquez sur "Ajouter".</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer la configuration"}
        </Button>
      </div>
    </div>
  );
}
