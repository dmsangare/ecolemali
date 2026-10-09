import {
  Settings as SettingsIcon,
  Palette,
  MessageSquare,
  Award,
  Building2,
  Users,
  Cog,
  Shield,
  HardDrive,
  Trophy,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SchoolTab } from "./SchoolTab";
import { UsersTab } from "./UsersTab";
import { SystemTab } from "./SystemTab";
import { RolesTab } from "./RolesTab";
import { BackupsTab } from "./BackupsTab";
import { AppearanceTab } from "./AppearanceTab";
import { TemplatesTab } from "./TemplatesTab";
import { ThresholdsTab } from "./ThresholdsTab";
import { HonorRollTab } from "./HonorRollTab";

export function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Parametres
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration de l etablissement, gestion des utilisateurs, des roles
          et reglages systeme
        </p>
      </div>

      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full max-w-6xl grid-cols-9">
          <TabsTrigger value="school" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Etablissement
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Seuils
          </TabsTrigger>
          <TabsTrigger value="honorRoll" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Honneur
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Sauvegardes
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Systeme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <SchoolTab />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="thresholds">
          <ThresholdsTab />
        </TabsContent>

        <TabsContent value="honorRoll">
          <HonorRollTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="backups">
          <BackupsTab />
        </TabsContent>

        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
