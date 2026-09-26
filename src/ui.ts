import { create } from 'zustand'

type Ui = {
  playId: string | null
  finishId: string | null
  actionsId: string | null
  openPlay: (id: string | null) => void
  openFinish: (id: string | null) => void
  openActions: (id: string | null) => void
}

/** Which action sheet is open. Sheets are rendered once in App. */
export const useUi = create<Ui>((set) => ({
  playId: null,
  finishId: null,
  actionsId: null,
  openPlay: (playId) => set({ playId }),
  openFinish: (finishId) => set({ finishId }),
  openActions: (actionsId) => set({ actionsId }),
}))
