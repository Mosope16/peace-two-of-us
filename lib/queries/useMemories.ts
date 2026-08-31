// Deprecated: Memories tab and properties removed
export function useMemories() {
  return { data: [], isLoading: false };
}

export function useAddMemory() {
  return { mutate: () => {}, isPending: false };
}

export function useDeleteMemory() {
  return { mutate: () => {}, isPending: false };
}

