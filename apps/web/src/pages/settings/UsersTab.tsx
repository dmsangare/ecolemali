import { useState, useMemo } from "react";
import {
  Users as UsersIcon, Plus, Loader2, Mail, Phone,
  Shield, Trash2, Key, Pencil,
} from "lucide-react";
import {
  useUsers, useRoles, useCreateUser, useDeleteUser, useUpdateUser,
} from "@/hooks/users";
import { useAvailableTeachers } from "@/hooks/teachers";
import { useAvailableGuardians } from "@/hooks/guardians";
import { useSchool } from "@/hooks/users";
import { formatDateTime, initials } from "@/lib/formatters";
import {
  Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Avatar, AvatarFallback,
} from "@/components/ui";

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-700",
  DIRECTOR: "bg-purple-500/10 text-purple-700",
  SECRETARY: "bg-blue-500/10 text-blue-700",
  TEACHER: "bg-green-500/10 text-green-700",
  ACCOUNTANT: "bg-orange-500/10 text-orange-700",
  SUPERVISOR: "bg-yellow-500/10 text-yellow-700",
  PARENT: "bg-pink-500/10 text-pink-700",
  STUDENT: "bg-gray-500/10 text-gray-700",
};

const EMAIL_SUGGESTIONS = ["directeur", "prof", "comptable", "secretaire", "surveillant", "admin"];

export function UsersTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { data: usersData, isLoading } = useUsers({ limit: 50 });
  const { data: roles } = useRoles();
  const { data: school } = useSchool();
  const deleteMutation = useDeleteUser();

  const users = usersData?.data || [];

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Supprimer l utilisateur ${name} ?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Utilisateurs ({users.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {school?.sigle
              ? `Domaine email : @${school.sigle.toLowerCase()}.ml`
              : "Definissez un sigle dans l onglet Etablissement pour les emails"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center gap-3">
              <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Derniere connexion</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.userRoles?.map((ur: any) => (
                            <span
                              key={ur.role.id}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                ROLE_COLORS[ur.role.code] || "bg-gray-500/10"
                              }`}
                            >
                              <Shield className="h-3 w-3" />
                              {ur.role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-green-500/10 text-green-700"
                              : "bg-gray-500/10 text-gray-700"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Actif" : user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Jamais"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Modifier"
                            onClick={() => setEditingUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            onClick={() =>
                              handleDelete(user.id, `${user.firstName} ${user.lastName}`)
                            }
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

      {showCreate && (
        <CreateUserModal
          roles={roles || []}
          schoolSigle={school?.sigle || null}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}

// ============================================================
// CREATE MODAL
// ============================================================

function CreateUserModal({
  roles, schoolSigle, onClose,
}: {
  roles: any[];
  schoolSigle: string | null;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailLocal, setEmailLocal] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("SisMali2026!");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedGuardianId, setSelectedGuardianId] = useState("");
  const createMutation = useCreateUser();

  const { data: availableTeachers = [] } = useAvailableTeachers();
  const { data: availableGuardians = [] } = useAvailableGuardians();

  // Detection des roles par code
  const selectedRoleCodes = useMemo(() => {
    return selectedRoles
      .map((id) => roles.find((r) => r.id === id)?.code)
      .filter(Boolean) as string[];
  }, [selectedRoles, roles]);

  const hasTeacherRole = selectedRoleCodes.includes("TEACHER");
  const hasParentRole = selectedRoleCodes.includes("PARENT");

  const emailDomain = schoolSigle ? `@${schoolSigle.toLowerCase()}.ml` : "@sis-mali.local";
  const fullEmail = emailLocal ? `${emailLocal}${emailDomain}` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullEmail || !password || selectedRoles.length === 0) {
      alert("Email, mot de passe et au moins un role sont requis");
      return;
    }
    await createMutation.mutateAsync({
      email: fullEmail,
      phone: phone || undefined,
      password,
      firstName,
      lastName,
      roleIds: selectedRoles,
      teacherId: hasTeacherRole && selectedTeacherId ? selectedTeacherId : undefined,
      guardianId: hasParentRole && selectedGuardianId ? selectedGuardianId : undefined,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Nouvel utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prenom *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <div className="flex gap-2">
                <Input
                  value={emailLocal}
                  onChange={(e) =>
                    setEmailLocal(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))
                  }
                  placeholder="directeur"
                  className="flex-1"
                  required
                />
                <div className="flex items-center px-3 bg-muted rounded-md text-sm font-mono whitespace-nowrap">
                  {emailDomain}
                </div>
              </div>
              {fullEmail && (
                <p className="text-xs text-muted-foreground">
                  Email final : <strong>{fullEmail}</strong>
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs text-muted-foreground mr-1">Suggestions :</span>
                {EMAIL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEmailLocal(s)}
                    className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+223 XX XX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe * (min 8 caracteres)</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                L utilisateur devra le changer a la premiere connexion.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Roles * (au moins un)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, role.id]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((r) => r !== role.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dropdown Fiche Enseignant (si role TEACHER selectionne) */}
            {hasTeacherRole && (
              <div className="space-y-2 border-l-4 border-primary/40 pl-4 bg-primary/5 rounded-md p-3">
                <Label>Fiche enseignant a lier</Label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">-- Aucune fiche liee --</option>
                  {availableTeachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.matricule} · {t.lastName} {t.firstName}
                      {t.specialty ? ` (${t.specialty})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {availableTeachers.length} fiche(s) enseignant disponible(s)
                </p>
              </div>
            )}

            {/* Dropdown Fiche Tuteur (si role PARENT selectionne) */}
            {hasParentRole && (
              <div className="space-y-2 border-l-4 border-blue-400/40 pl-4 bg-blue-50/30 rounded-md p-3">
                <Label>Fiche tuteur a lier</Label>
                <select
                  value={selectedGuardianId}
                  onChange={(e) => setSelectedGuardianId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">-- Aucune fiche liee --</option>
                  {availableGuardians.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.lastName} {g.firstName} · {g.phone || "—"} ({g.relationType})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {availableGuardians.length} fiche(s) tuteur disponible(s)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creation...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Creer l utilisateur
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// EDIT MODAL
// ============================================================

function EditUserModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone || "");
  const [status, setStatus] = useState(user.status);
  const updateMutation = useUpdateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: user.id,
      dto: { firstName, lastName, phone, status },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Modifier l utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prenom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="LOCKED">Verrouille</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
