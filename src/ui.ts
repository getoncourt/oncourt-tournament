import { create } from 'zustand'

type Ui = {
  playId: string | null
  finishId: string | null
  openPlay: (id: string | null) => void
  openFinish: (id: string | null) => void
}

/** Which action sheet is open. Sheets are rendered once in App. */
export const useUi = create<Ui>((set) => ({
  playId: null,
  finishId: null,
  openPlay: (playId) => set({ playId }),
  openFinish: (finishId) => set({ finishId }),
}))
