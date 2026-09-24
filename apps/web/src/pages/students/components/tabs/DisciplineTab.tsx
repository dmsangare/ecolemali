import { useState } from "react";
import {
  Heart, AlertTriangle, Syringe, FileWarning, Plus, Save,
  ClipboardList, Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui";
import { StatusBadge } from "@/components/shared";
import { formatDate } from "@/lib/formatters";

interface DisciplineTabProps {
  studentId: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"];

export function DisciplineTab({ studentId }: DisciplineTabProps) {
  // Donnees locales (a migrer vers le backend plus tard)
  const [bloodType, setBloodType] = useState("Inconnu");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [disciplineNotes, setDisciplineNotes] = useState("");

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    alert("Sauvegarde a implementer dans la prochaine version");
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Informations medicales et disciplinaires
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Ces informations sont confidentielles et visibles uniquement par la direction
              et le personnel autorise.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Santé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-red-500" />
            Informations medicales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Groupe sanguin */}
          <div className="space-y-2">
            <Label htmlFor="bloodType" className="flex items-center gap-2">
              <Syringe className="h-3 w-3" />
              Groupe sanguin
            </Label>
            <select
              id="bloodType"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <Label>Allergies connues</Label>
            {allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune allergie enregistree
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-medium"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(idx)}
                      className="hover:text-orange-900 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 max-w-md">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Ex: Arachides, Penicilline..."
                onKeyPress={(e) => e.key === "Enter" && handleAddAllergy()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAllergy}
                disabled={!newAllergy.trim()}
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Notes medicales */}
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Notes medicales</Label>
            <textarea
              id="medicalNotes"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Observations medicales, traitements en cours, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Discipline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Suivi disciplinaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mt-2">
              Aucun incident disciplinaire enregistre
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Les incidents et sanctions apparaitront ici
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disciplineNotes">Observations generales</Label>
            <textarea
              id="disciplineNotes"
              value={disciplineNotes}
              onChange={(e) => setDisciplineNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Comportement general, points positifs, etc."
            />
          </div>
        </CardContent>
      </Card>

      {/* Sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4" />
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
