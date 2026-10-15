import { useState, useMemo, useEffect } from "react";
import {
  Shield,
  Plus,
  Loader2,
  Save,
  Trash2,
  Lock,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  useRoles,
  usePermissions,
  useRole,
  useCreateRole,
  useUpdateRole,
  useSetPermissions,
  useDeleteRole,
} from "@/hooks/roles/useRoles";
import type { Role } from "@/api/roles";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Libelles francais pour les modules
const MODULE_LABELS: Record<string, string> = {
  academic_year: "Annee scolaire",
  assessment: "Evaluations",
  assignment: "Affectations",
  attendance: "Presences",
  audit: "Audit",
  backup: "Sauvegardes",
  cash: "Caisse",
  class: "Classes",
  document: "Documents",
  enrollment: "Inscriptions",
  exam: "Examens",
  fee: "Frais",
  grade: "Notes",
  invoice: "Factures",
  level: "Niveaux",
  notification: "Notifications",
  parent: "Parents",
  payment: "Paiements",
  report: "Rapports",
  report_card: "Bulletins",
  role: "Roles",
  school: "Etablissement",
  settings: "Parametres",
  student: "Eleves",
  subject: "Matieres",
  teacher: "Enseignants",
  timetable: "Emploi du temps",
  user: "Utilisateurs",
};

// Libelles francais pour les actions
const ACTION_LABELS: Record<string, string> = {
  view: "Voir",
  create: "Creer",
  update: "Modifier",
  delete: "Supprimer",
  validate: "Valider",
  export: "Exporter",
  print: "Imprimer",
  lock: "Verrouiller",
  close: "Cloturer",
  cancel: "Annuler",
  archive: "Archiver",
  restore: "Restaurer",
};

export function RolesTab() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<Set<string>>(
    new Set(),
  );
  const [hasChanges, setHasChanges] = useState(false);

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permsLoading } = usePermissions();
  const { data: roleDetail, isLoading: detailLoading } = useRole(
    selectedRoleId,
  );

  const setPermissionsMutation = useSetPermissions();
  const deleteRoleMutation = useDeleteRole();

  // Auto-selectionner le premier role non-systeme
  useEffect(() => {
    if (roles && roles.length > 0 && !selectedRoleId) {
      const promoteur = roles.find((r) => r.code === "PROMOTEUR");
      setSelectedRoleId(promoteur?.id || roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Charger les permissions du role selectionne
  useEffect(() => {
    if (roleDetail) {
      setEditedPermissions(new Set(roleDetail.permissions));
      setHasChanges(false);
    }
  }, [roleDetail]);

  const togglePermission = (permId: string) => {
    setEditedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
    setHasChanges(true);
  };

  const toggleModuleAll = (module: string, enable: boolean) => {
    if (!permissions) return;
    setEditedPermissions((prev) => {
      const next = new Set(prev);
      const modulePerms = permissions.modules[module] || [];
      modulePerms.forEach((p) => {
        if (enable) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!selectedRoleId) return;
    setPermissionsMutation.mutate({
      id: selectedRoleId,
      permissionIds: Array.from(editedPermissions),
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    if (roleDetail) {
      setEditedPermissions(new Set(roleDetail.permissions));
      setHasChanges(false);
    }
  };

  const handleDelete = (role: Role | typeof roleDetail) => {
    if (!role) return;
    if (
      confirm(
        `Supprimer le role "${role.name}" ? Cette action est irreversible.`,
      )
    ) {
      deleteRoleMutation.mutate(role.id);
      if (selectedRoleId === role.id) setSelectedRoleId(null);
    }
  };

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = selectedRole?.code === "SUPER_ADMIN";

  const sortedModules = useMemo(() => {
    if (!permissions) return [];
    return Object.keys(permissions.modules).sort((a, b) => {
      const la = MODULE_LABELS[a] || a;
      const lb = MODULE_LABELS[b] || b;
      return la.localeCompare(lb);
    });
  }, [permissions]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Definissez les acces de chaque role. Cliquez sur un role pour
            voir et modifier ses permissions par module.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau role
        </Button>
      </div>

      {/* DEUX COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLONNE GAUCHE : LISTE DES ROLES */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {roles?.length || 0} role{(roles?.length || 0) > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {rolesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {roles?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md transition-colors",
                      "hover:bg-accent",
                      selectedRoleId === role.id
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {role.code}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium">
                          {role.permissionsCount}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          perms
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLONNE DROITE : DETAIL DU ROLE */}
        <Card className="lg:col-span-2">
          {!selectedRoleId ? (
            <CardContent className="py-16 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                Selectionnez un role pour gerer ses permissions
              </p>
            </CardContent>
          ) : detailLoading || permsLoading ? (
            <CardContent className="py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </CardContent>
          ) : roleDetail && permissions ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {roleDetail.name}
                      {roleDetail.isSystem && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded font-normal">
                          Systeme
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-mono">{roleDetail.code}</span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {roleDetail.usersCount} utilisateur
                        {roleDetail.usersCount > 1 ? "s" : ""}
                      </span>
                      <span>
                        {editedPermissions.size} permission
                        {editedPermissions.size > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          disabled={setPermissionsMutation.isPending}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={setPermissionsMutation.isPending}
                        >
                          {setPermissionsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Enregistrer
                        </Button>
                      </>
                    )}
                    {!roleDetail.isSystem && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => roleDetail && handleDelete(roleDetail)}
                        disabled={deleteRoleMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {roleDetail.isSystem && (
                  <div className="mt-3 flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 p-2 rounded border border-amber-200 dark:border-amber-900">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Role systeme : le code et le nom ne peuvent pas etre
                    modifies. Les permissions sont verrouillees pour
                    SUPER_ADMIN.
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-6">
                {isSuperAdmin ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium text-foreground">
                      SUPER_ADMIN a toutes les permissions
                    </p>
                    <p className="text-sm mt-1">
                      Ce role ne peut pas etre modifie pour des raisons de
                      securite.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedModules.map((moduleKey) => {
                      const modulePerms = permissions.modules[moduleKey];
                      const allChecked = modulePerms.every((p) =>
                        editedPermissions.has(p.id),
                      );
                      const someChecked =
                        !allChecked &&
                        modulePerms.some((p) => editedPermissions.has(p.id));

                      return (
                        <div
                          key={moduleKey}
                          className="border rounded-lg overflow-hidden"
                        >
                          <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {allChecked ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : someChecked ? (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/40" />
                              )}
                              <span className="font-medium text-sm">
                                {MODULE_LABELS[moduleKey] || moduleKey}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (
                                {
                                  modulePerms.filter((p) =>
                                    editedPermissions.has(p.id),
                                  ).length
                                }
                                /{modulePerms.length})
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  toggleModuleAll(moduleKey, true)
                                }
                                disabled={allChecked}
                              >
                                Tout
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  toggleModuleAll(moduleKey, false)
                                }
                                disabled={!someChecked && !allChecked}
                              >
                                Rien
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3">
                            {modulePerms.map((perm) => {
                              const checked = editedPermissions.has(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                                    "hover:bg-accent transition-colors",
                                    checked && "bg-primary/5",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      togglePermission(perm.id)
                                    }
                                    className="h-4 w-4 rounded border-input accent-primary"
                                  />
                                  <span className="truncate">
                                    {ACTION_LABELS[perm.action] ||
                                      perm.action}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </>
          ) : null}
        </Card>
      </div>

      {/* MODALE DE CREATION */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRole) => {
            setShowCreateModal(false);
            setSelectedRoleId(newRole.id);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// MODALE DE CREATION
// ============================================================
function CreateRoleModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (role: Role) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = useCreateRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        code: code.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
        name,
        description: description || undefined,
      });
      onSuccess(result);
    } catch (err) {
      // erreur geree par le hook
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Nouveau role</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Creez un role personnalise pour votre etablissement.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="role-code">Code (unique)</Label>
                <Input
                  id="role-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: PROMOTEUR"
                  className="mt-1 font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Identifiant technique en majuscules. Ex: PROMOTEUR,
                  CENSEUR, BIBLIOTHECAIRE.
                </p>
              </div>

              <div>
                <Label htmlFor="role-name">Nom affiche</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Promoteur"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role-desc">Description (optionnel)</Label>
                <textarea
                  id="role-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Proprietaire de l etablissement..."
                  className="mt-1 w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending || !code.trim() || !name.trim()
              }
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Creer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
