import { useState, useMemo } from "react";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Search,
  DoorOpen,
  Users,
  MapPin,
} from "lucide-react";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from "@/hooks/classes";
import { useAuth } from "@/contexts/AuthContext";
import type { Room } from "@/types/class";

const ROOM_TYPE_LABELS: Record<string, string> = {
  CLASSROOM: "Salle de classe",
  LAB: "Laboratoire",
  COMPUTER_ROOM: "Salle informatique",
  LIBRARY: "Bibliothèque",
  MEETING_ROOM: "Salle de réunion",
  OTHER: "Autre",
};

interface RoomFormState {
  name: string;
  type: string;
  capacity: string;
  location: string;
}

const EMPTY_FORM: RoomFormState = {
  name: "",
  type: "CLASSROOM",
  capacity: "",
  location: "",
};

export function RoomsTab() {
  const { user } = useAuth();
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormState>(EMPTY_FORM);

  const roomsList: Room[] = useMemo(() => {
    if (!rooms) return [];
    return Array.isArray(rooms) ? rooms : (rooms as any).data || [];
  }, [rooms]);

  const filtered = useMemo(() => {
    if (!search.trim()) return roomsList;
    const q = search.toLowerCase();
    return roomsList.filter(
      (r) => r.name.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q),
    );
  }, [roomsList, search]);

  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      type: room.type ?? "CLASSROOM",
      capacity: room.capacity ? String(room.capacity) : "",
      location: room.location ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      type: form.type,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      location: form.location.trim() || undefined,
    };

    if (editingRoom) {
      await updateRoom.mutateAsync({ id: editingRoom.id, input: payload });
    } else {
      await createRoom.mutateAsync({ ...payload, schoolId: user?.schoolId } as any);
    }
    setModalOpen(false);
  };

  const handleDelete = (room: Room) => {
    if (
      window.confirm(
        `Supprimer "${room.name}" ?\n\nAttention : si cette salle est utilisée par des classes ou des créneaux, la suppression sera refusée.`,
      )
    ) {
      deleteRoom.mutate(room.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER + ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <DoorOpen className="h-5 w-5" />
            Salles ({roomsList.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez les salles de classe, laboratoires et autres espaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle salle
          </Button>
        </div>
      </div>

      {/* LISTE */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {search ? "Aucune salle ne correspond à la recherche." : "Aucune salle."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{room.name}</h3>
                    <span
                      className={cn(
                        "inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium",
                        "bg-blue-500/10 text-blue-700",
                      )}
                    >
                      {ROOM_TYPE_LABELS[room.type ?? "OTHER"] || room.type || "Autre"}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(room)}
                      title="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(room)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {room.capacity && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{room.capacity} places</span>
                    </div>
                  )}
                  {room.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{room.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => !createRoom.isPending && !updateRoom.isPending && setModalOpen(false)}
        >
          <div
            className="bg-background rounded-sis-lg shadow-2xl relative z-[10000] max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">
                  {editingRoom ? "Modifier la salle" : "Nouvelle salle"}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Nom *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Salle 6ème A"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    required
                  >
                    {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Capacité
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Emplacement
                    </label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Bâtiment A"
                      maxLength={120}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={createRoom.isPending || updateRoom.isPending}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!form.name.trim() || createRoom.isPending || updateRoom.isPending}
                >
                  {(createRoom.isPending || updateRoom.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingRoom ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
