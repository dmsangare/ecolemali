import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, User, GraduationCap, Users, FileCheck, ArrowLeft } from "lucide-react";
import { Wizard, WizardStep, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui";
import { api } from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateStudent, useUpdateStudent, useStudentDetail } from "@/hooks/students";
import { useCreateGuardian, useLinkGuardianToStudent } from "@/hooks/guardians";
import { Step1Identity, IdentityData } from "./components/wizard/Step1Identity";
import { Step2School, SchoolData } from "./components/wizard/Step2School";
import { Step3Family, FamilyData } from "./components/wizard/Step3Family";
import { Step4Summary } from "./components/wizard/Step4Summary";

const DRAFT_KEY = "sis-mali-student-draft";

interface DraftData {
  identity: IdentityData;
  school: SchoolData;
  family: FamilyData;
  options: { generateInvoice: boolean; sendNotification: boolean };
}

const DEFAULT_IDENTITY: IdentityData = {
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  birthPlace: "",
  nationality: "Malienne",
  specialSituation: "",
};

const DEFAULT_SCHOOL: SchoolData = {
  cycle: "",
  levelId: "",
  classId: "",
  academicYearId: "",
  previousSchool: "",
};

const DEFAULT_FAMILY: FamilyData = {
  father: {
    selected: null,
    firstName: "",
    lastName: "",
    phone: "",
    profession: "",
    createNew: false,
  },
  mother: {
    selected: null,
    firstName: "",
    lastName: "",
    phone: "",
    profession: "",
    createNew: false,
  },
  primaryGuardianType: "FATHER",
};

export function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [identity, setIdentity] = useState<IdentityData>(DEFAULT_IDENTITY);
  const [school, setSchool] = useState<SchoolData>(DEFAULT_SCHOOL);
  const [family, setFamily] = useState<FamilyData>(DEFAULT_FAMILY);
  const [options, setOptions] = useState({
    generateInvoice: true,
    sendNotification: false,
  });

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const createGuardian = useCreateGuardian();
  const linkGuardian = useLinkGuardianToStudent();

  // Charger l'eleve si mode edition
  const { data: existingStudent, isLoading: isLoadingStudent } = useStudentDetail(id);

  // Charger niveaux + classes + années pour le récap
  const { data: levelsData } = useQuery({
    queryKey: ["levels", "for-summary"],
    queryFn: async () => {
      const { data } = await api.get("/levels");
      return data.data || data;
    },
  });
  const { data: classesData } = useQuery({
    queryKey: ["classes", "for-summary"],
    queryFn: async () => {
      const { data } = await api.get("/classes");
      return data.data || data;
    },
  });
  const { data: yearsData } = useQuery({
    queryKey: ["academic-years", "for-summary"],
    queryFn: async () => {
      const { data } = await api.get("/academic-years");
      return data.data || data;
    },
  });

  // Restaurer brouillon (uniquement en creation)
  useEffect(() => {
    if (isEdit) return;  // Pas de brouillon en mode edition
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft: DraftData = JSON.parse(saved);
        if (draft.identity) setIdentity(draft.identity);
        if (draft.school) setSchool(draft.school);
        if (draft.family) setFamily(draft.family);
        if (draft.options) setOptions(draft.options);
      } catch {}
    }
  }, [isEdit]);

  // Hydrater le formulaire avec les donnees existantes (mode edition)
  useEffect(() => {
    if (!isEdit || !existingStudent) return;

    setIdentity({
      firstName: existingStudent.firstName || "",
      lastName: existingStudent.lastName || "",
      gender: (existingStudent.gender as "M" | "F" | "") || "",
      birthDate: existingStudent.birthDate
        ? String(existingStudent.birthDate).slice(0, 10)
        : "",
      birthPlace: existingStudent.birthPlace || "",
      nationality: existingStudent.nationality || "Malienne",
      specialSituation: (existingStudent as any).specialSituation || "",
    });

    // Recuperer l'enrollment courante
    const enrollment = existingStudent.enrollments?.find(
      (e: any) => e.academicYear?.isCurrent
    ) || existingStudent.enrollments?.[0];

    setSchool({
      cycle: (enrollment?.level?.cycle as any) || "",
      levelId: enrollment?.level?.id || "",
      classId: enrollment?.class?.id || "",
      academicYearId: enrollment?.academicYear?.id || "",
      previousSchool: "",
    });

    // Note : les guardians sont charges dans existingStudent.guardians
    // On ne les hydrate pas dans FamilyData (structure complexe)
    // Ils resteront tels quels en base lors de l'update
  }, [isEdit, existingStudent]);

  // Sauvegarder brouillon
  useEffect(() => {
    const draft: DraftData = { identity, school, family, options };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [identity, school, family, options]);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!identity.lastName || identity.lastName.length < 2) {
      errs.lastName = "Le nom est requis (min. 2 caracteres)";
    }
    if (!identity.firstName || identity.firstName.length < 2) {
      errs.firstName = "Le prenom est requis (min. 2 caracteres)";
    }
    if (!identity.gender) errs.gender = "Le sexe est requis";
    if (!identity.birthDate) errs.birthDate = "La date de naissance est requise";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!school.cycle) errs.cycle = "Le cycle est requis";
    if (!school.levelId) errs.levelId = "Le niveau est requis";
    if (!school.classId) errs.classId = "La classe est requise";
    if (!school.academicYearId) errs.academicYearId = "L année scolaire est requise";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};

    const fatherValid =
      family.father.selected ||
      (family.father.lastName && family.father.firstName && family.father.phone);
    const motherValid =
      family.mother.selected ||
      (family.mother.lastName && family.mother.firstName && family.mother.phone);

    if (!fatherValid && !motherValid) {
      errs.family = "Au moins un parent ou tuteur est requis";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!user?.schoolId) {
      toast.error("Vous devez etre rattache a un etablissement");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Créer l'élève
      // MODE EDITION : mettre a jour l'eleve existant
      if (isEdit && id) {
        await updateStudent.mutateAsync({
          id,
          data: {
            firstName: identity.firstName.trim(),
            lastName: identity.lastName.trim(),
            gender: identity.gender as "M" | "F",
            birthDate: identity.birthDate,
            birthPlace: identity.birthPlace || undefined,
            nationality: identity.nationality || "Malienne",
            specialSituation: identity.specialSituation || undefined,
          },
        });
        toast.success("Eleve mis a jour");
        navigate(`/students/${id}`);
        return;
      }

      const student = await createStudent.mutateAsync({
        schoolId: user.schoolId,
        firstName: identity.firstName.trim(),
        lastName: identity.lastName.trim(),
        gender: identity.gender as "M" | "F",
        birthDate: identity.birthDate,
        birthPlace: identity.birthPlace || undefined,
        nationality: identity.nationality || "Malienne",
        specialSituation: identity.specialSituation || undefined,
      });

      // 2. Créer / lier les tuteurs
      const guardianTasks: Promise<any>[] = [];

      // Père
      if (family.father.selected) {
        guardianTasks.push(
          linkGuardian.mutateAsync({
            guardianId: family.father.selected.id,
            studentId: student.id,
            isPrimary: family.primaryGuardianType === "FATHER",
          }),
        );
      } else if (
        family.father.lastName &&
        family.father.firstName &&
        family.father.phone
      ) {
        const father = await createGuardian.mutateAsync({
          schoolId: user.schoolId,
          firstName: family.father.firstName.trim(),
          lastName: family.father.lastName.trim(),
          phone: family.father.phone,
          profession: family.father.profession || undefined,
          relationType: "FATHER",
          gender: "M",
        });
        guardianTasks.push(
          linkGuardian.mutateAsync({
            guardianId: father.id,
            studentId: student.id,
            isPrimary: family.primaryGuardianType === "FATHER",
          }),
        );
      }

      // Mère
      if (family.mother.selected) {
        guardianTasks.push(
          linkGuardian.mutateAsync({
            guardianId: family.mother.selected.id,
            studentId: student.id,
            isPrimary: family.primaryGuardianType === "MOTHER",
          }),
        );
      } else if (
        family.mother.lastName &&
        family.mother.firstName &&
        family.mother.phone
      ) {
        const mother = await createGuardian.mutateAsync({
          schoolId: user.schoolId,
          firstName: family.mother.firstName.trim(),
          lastName: family.mother.lastName.trim(),
          phone: family.mother.phone,
          profession: family.mother.profession || undefined,
          relationType: "MOTHER",
          gender: "F",
        });
        guardianTasks.push(
          linkGuardian.mutateAsync({
            guardianId: mother.id,
            studentId: student.id,
            isPrimary: family.primaryGuardianType === "MOTHER",
          }),
        );
      }

      await Promise.all(guardianTasks);

      // 3. Créer l'inscription
      await api.post("/enrollments", {
        studentId: student.id,
        academicYearId: school.academicYearId,
        classId: school.classId,
        levelId: school.levelId,
        status: "VALIDATED",
        previousSchool: school.previousSchool || undefined,
      });

      // 4. Facture auto (si demandé)
      if (options.generateInvoice) {
        try {
          await api.post(
            `/invoices/auto/${student.id}/year/${school.academicYearId}`,
          );
        } catch (err) {
          // Pas bloquant si la facture échoue
          console.warn("Facture auto echouee:", err);
        }
      }

      toast.success(
        `Eleve cree avec succes — Matricule : ${student.matricule}`,
      );
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/students/${student.id}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Erreur lors de la creation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: WizardStep[] = [
    {
      id: "identity",
      title: "Identite",
      description: "Nom, naissance",
      icon: <User className="h-4 w-4" />,
      content: (
        <Step1Identity
          data={identity}
          onChange={(d) => setIdentity({ ...identity, ...d })}
          errors={errors}
        />
      ),
      validate: validateStep1,
    },
    {
      id: "school",
      title: "Scolarité",
      description: "Classe, niveau",
      icon: <GraduationCap className="h-4 w-4" />,
      content: (
        <Step2School
          data={school}
          onChange={(d) => setSchool({ ...school, ...d })}
          errors={errors}
        />
      ),
      validate: validateStep2,
    },
    {
      id: "family",
      title: "Famille",
      description: "Parents, tuteurs",
      icon: <Users className="h-4 w-4" />,
      content: (
        <Step3Family
          data={family}
          onChange={(d) => setFamily({ ...family, ...d })}
          errors={errors}
        />
      ),
      validate: validateStep3,
    },
    {
      id: "summary",
      title: "Recapitulatif",
      description: "Verification",
      icon: <FileCheck className="h-4 w-4" />,
      content: (
        <Step4Summary
          identity={identity}
          school={school}
          family={family}
          levels={levelsData || []}
          classes={classesData || []}
          academicYears={yearsData || []}
          options={options}
          onOptionsChange={setOptions}
        />
      ),
    },
  ];

  const handleCancel = () => {
    if (confirm("Annuler la creation ? Les donnees saisies seront perdues.")) {
      localStorage.removeItem(DRAFT_KEY);
      navigate("/students");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={isEdit ? "Modifier l eleve" : "Nouvel eleve"}
          description={isEdit ? "Modifiez les informations puis enregistrez" : "Remplissez les informations etape par etape"}
          icon={<UserPlus className="h-5 w-5" />}
        />
      </div>

      <Wizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onComplete={handleSubmit}
        isSubmitting={isSubmitting}
        completeLabel={isEdit ? "Enregistrer" : "Creer l eleve"}
        allowStepClick={true}
      />

      <div className="flex justify-start">
        <Button variant="ghost" onClick={handleCancel} type="button">
          Annuler
        </Button>
      </div>
    </div>
  );
}
