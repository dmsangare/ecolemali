import { ReactNode } from "react";
import { ArrowRight, ArrowLeftRight, FileCheck, User, School, Upload } from "lucide-react";

export interface TransferWizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  content: ReactNode;
}

export const TRANSFER_IN_STEPS: TransferWizardStep[] = [
  {
    id: "school",
    title: "Ecole d origine",
    description: "Informations sur l etablissement quitte",
    icon: <School className="h-4 w-4" />,
    content: null,
  },
  {
    id: "student",
    title: "Identite de l eleve",
    description: "Informations personnelles",
    icon: <User className="h-4 w-4" />,
    content: null,
  },
  {
    id: "decision",
    title: "Decision de passage",
    description: "Classe admise et resultats",
    icon: <FileCheck className="h-4 w-4" />,
    content: null,
  },
  {
    id: "documents",
    title: "Documents",
    description: "Certificat de transfert et bulletins",
    icon: <Upload className="h-4 w-4" />,
    content: null,
  },
  {
    id: "placement",
    title: "Placement",
    description: "Choix de la classe dans l etablissement",
    icon: <ArrowRight className="h-4 w-4" />,
    content: null,
  },
];

export const TRANSFER_OUT_STEPS: TransferWizardStep[] = [
  {
    id: "destination",
    title: "Ecole de destination",
    description: "Informations sur l etablissement d accueil",
    icon: <School className="h-4 w-4" />,
    content: null,
  },
  {
    id: "reason",
    title: "Motif du depart",
    description: "Raison du transfert",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    content: null,
  },
  {
    id: "confirmation",
    title: "Confirmation",
    description: "Verification et validation",
    icon: <FileCheck className="h-4 w-4" />,
    content: null,
  },
];

export function getTransferSteps(type: "IN" | "OUT"): TransferWizardStep[] {
  return type === "IN" ? TRANSFER_IN_STEPS : TRANSFER_OUT_STEPS;
}
