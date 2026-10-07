import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { messagesApi, MessageListFilters, CreateMessageInput } from "@/api/messages";
import { getErrorMessage } from "@/lib/axios";

const KEY = "messages";

export function useMessages(filters: MessageListFilters = {}) {
  return useQuery({
    queryKey: [KEY, "list", filters],
    queryFn: () => messagesApi.list(filters),
  });
}

export function useReminders(minDaysLate = 0, includeUpcoming = false) {
  return useQuery({
    queryKey: [KEY, "reminders", minDaysLate, includeUpcoming],
    queryFn: () => messagesApi.getReminders(minDaysLate, includeUpcoming),
    staleTime: 60_000,
  });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMessageInput) => messagesApi.create(input),
    onSuccess: () => {
      toast.success("Message enregistre");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
