import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Couple, Memory, LoveLetter, MoodLog, BucketItem, Countdown, MoodType, IQDuelAnswer, LiveGameRoom, QuizCategoryId } from '@/types';
import { generateInviteCode } from './auth';

interface LDRState {
  isAuthenticated: boolean;
  currentUser: User;
  partner: User;
  couple: Couple;
  memories: Memory[];
  loveLetters: LoveLetter[];
  moods: Record<string, MoodLog>; // user_id -> latest MoodLog
  bucketList: BucketItem[];
  countdowns: Countdown[];
  activePartnerId: string;

  // Games State
  quizAnswers: Record<string, Record<string, number>>; // questionId -> { [userId]: optionIndex }
  iqDuelAnswers: Record<string, Record<string, IQDuelAnswer>>; // matchId -> { [userId_questionId]: IQDuelAnswer }
  riddlesSolved: Record<string, boolean>; // `${riddleId}_${userId}` -> boolean
  activeGameRoom: LiveGameRoom | null;

  // Actions
  setAuthenticatedUser: (user: User, partner: User | null, couple: Couple) => void;
  updatePartnerProfile: (partnerUser: User) => void;
  logoutUser: () => void;
  switchActiveUser: (userId: string) => void;
  updateCoupleStartDate: (date: string) => void;
  addMemory: (memory: Omit<Memory, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteMemory: (id: string) => void;
  addLoveLetter: (letter: Omit<LoveLetter, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteLoveLetter: (id: string) => void;
  markLetterRead: (id: string) => void;
  setMood: (mood: MoodType, note?: string) => void;
  toggleBucketItem: (id: string) => void;
  addBucketItem: (item: Omit<BucketItem, 'id' | 'created_at' | 'couple_id' | 'completed'>) => void;
  deleteBucketItem: (id: string) => void;
  addCountdown: (countdown: Omit<Countdown, 'id' | 'created_at' | 'couple_id'>) => void;
  deleteCountdown: (id: string) => void;
  pairWithCode: (code: string) => boolean;

  // Games Actions
  answerQuizQuestion: (questionId: string, optionIndex: number) => void;
  saveIQDuelAnswer: (matchId: string, questionId: string, selectedIndex: number, timeTaken: number) => void;
  solveRiddle: (riddleId: string) => void;
  resetIQDuelMatch: (matchId: string) => void;
  createGameRoom: (gameType: 'know-me' | 'iq-duel' | 'riddle-night', category?: QuizCategoryId) => LiveGameRoom;
  joinGameRoom: (roomCode: string) => boolean;
  leaveGameRoom: () => void;
}

const DEFAULT_USER_1: User = {
  id: 'user-partner-1',
  name: 'Partner 1',
  email: 'partner1@ldr-space.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partner1',
  created_at: new Date().toISOString(),
};

const DEFAULT_USER_2: User = {
  id: 'user-partner-2',
  name: 'Partner 2',
  email: 'partner2@ldr-space.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Partner2',
  created_at: new Date().toISOString(),
};

const INITIAL_COUPLE: Couple = {
  id: 'couple-space-1',
  partner_one: DEFAULT_USER_1,
  partner_two: DEFAULT_USER_2,
  relationship_start_date: new Date().toISOString(),
  invite_code: 'LDR-742',
  is_connected: true,
};

const INITIAL_MEMORIES: Memory[] = [];
const INITIAL_LOVE_LETTERS: LoveLetter[] = [];
const INITIAL_MOODS: Record<string, MoodLog> = {};
const INITIAL_BUCKET_LIST: BucketItem[] = [];
const INITIAL_COUNTDOWNS: Countdown[] = [];

export const useLDRStore = create<LDRState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: DEFAULT_USER_1,
      partner: DEFAULT_USER_2,
      couple: INITIAL_COUPLE,
      memories: INITIAL_MEMORIES,
      loveLetters: INITIAL_LOVE_LETTERS,
      moods: INITIAL_MOODS,
      bucketList: INITIAL_BUCKET_LIST,
      countdowns: INITIAL_COUNTDOWNS,
      activePartnerId: DEFAULT_USER_1.id,

      // Games Initial State
      quizAnswers: {},
      iqDuelAnswers: {},
      riddlesSolved: {},
      activeGameRoom: null,

      setAuthenticatedUser: (user: User, partnerUser: User | null, coupleData: Couple) => {
        set({
          isAuthenticated: true,
          currentUser: user,
          partner: partnerUser || {
            id: 'waiting-partner',
            name: 'Waiting for Partner...',
            email: '',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WaitingPartner',
            created_at: new Date().toISOString(),
          },
          couple: coupleData,
          activePartnerId: user.id,
        });
      },

      updatePartnerProfile: (partnerUser: User) => {
        set((state) => ({
          partner: partnerUser,
          couple: {
            ...state.couple,
            partner_two: partnerUser,
            is_connected: true,
          },
        }));
      },

      logoutUser: () => {
        set({
          isAuthenticated: false,
          currentUser: DEFAULT_USER_1,
          partner: DEFAULT_USER_2,
          couple: INITIAL_COUPLE,
          activePartnerId: DEFAULT_USER_1.id,
          activeGameRoom: null,
        });
      },

      switchActiveUser: (userId: string) => {
        if (userId === DEFAULT_USER_1.id) {
          set({ currentUser: DEFAULT_USER_1, partner: DEFAULT_USER_2, activePartnerId: DEFAULT_USER_1.id });
        } else {
          set({ currentUser: DEFAULT_USER_2, partner: DEFAULT_USER_1, activePartnerId: DEFAULT_USER_2.id });
        }
      },

      updateCoupleStartDate: (date: string) => {
        set((state) => ({
          couple: { ...state.couple, relationship_start_date: date },
        }));
      },

      addMemory: (memoryData) => {
        const newMemory: Memory = {
          ...memoryData,
          id: `mem-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ memories: [newMemory, ...state.memories] }));
      },

      deleteMemory: (id: string) => {
        set((state) => ({ memories: state.memories.filter((m) => m.id !== id) }));
      },

      addLoveLetter: (letterData) => {
        const newLetter: LoveLetter = {
          ...letterData,
          id: `letter-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        set((state) => ({ loveLetters: [newLetter, ...state.loveLetters] }));
      },

      deleteLoveLetter: (id: string) => {
        set((state) => ({ loveLetters: state.loveLetters.filter((l) => l.id !== id) }));
      },

      markLetterRead: (id: string) => {
        set((state) => ({
          loveLetters: state.loveLetters.map((l) =>
            l.id === id ? { ...l, is_read: true } : l
          ),
        }));
      },

      setMood: (mood: MoodType, note?: string) => {
        const userId = get().currentUser.id;
        const newMood: MoodLog = {
          id: `mood-${Date.now()}`,
          user_id: userId,
          mood,
          note,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          moods: { ...state.moods, [userId]: newMood },
        }));
      },

      toggleBucketItem: (id: string) => {
        set((state) => ({
          bucketList: state.bucketList.map((item) =>
            item.id === id
              ? {
                  ...item,
                  completed: !item.completed,
                  completed_at: !item.completed ? new Date().toISOString() : undefined,
                }
              : item
          ),
        }));
      },

      addBucketItem: (itemData) => {
        const newItem: BucketItem = {
          ...itemData,
          id: `bucket-${Date.now()}`,
          couple_id: get().couple.id,
          completed: false,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ bucketList: [newItem, ...state.bucketList] }));
      },

      deleteBucketItem: (id: string) => {
        set((state) => ({ bucketList: state.bucketList.filter((b) => b.id !== id) }));
      },

      addCountdown: (countdownData) => {
        const newCountdown: Countdown = {
          ...countdownData,
          id: `cd-${Date.now()}`,
          couple_id: get().couple.id,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ countdowns: [...state.countdowns, newCountdown] }));
      },

      deleteCountdown: (id: string) => {
        set((state) => ({ countdowns: state.countdowns.filter((c) => c.id !== id) }));
      },

      pairWithCode: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length >= 5) {
          const connectedPartner: User = {
            id: `partner-${cleanCode}`,
            name: 'Connected Partner ❤️',
            email: 'partner@ldr-space.com',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanCode}`,
            created_at: new Date().toISOString(),
          };

          set((state) => ({
            partner: connectedPartner,
            couple: {
              ...state.couple,
              partner_two: connectedPartner,
              invite_code: cleanCode,
              is_connected: true,
            },
          }));
          return true;
        }
        return false;
      },

      // Games Store Logic
      answerQuizQuestion: (questionId: string, optionIndex: number) => {
        const currentUserId = get().currentUser.id;
        set((state) => {
          const currentQuestionAnswers = state.quizAnswers[questionId] || {};
          return {
            quizAnswers: {
              ...state.quizAnswers,
              [questionId]: {
                ...currentQuestionAnswers,
                [currentUserId]: optionIndex,
              },
            },
          };
        });
      },

      saveIQDuelAnswer: (matchId: string, questionId: string, selectedIndex: number, timeTaken: number) => {
        const currentUserId = get().currentUser.id;
        const answerKey = `${currentUserId}_${questionId}`;
        const newAnswer: IQDuelAnswer = {
          question_id: questionId,
          user_id: currentUserId,
          selected_index: selectedIndex,
          time_taken: timeTaken,
          is_locked: true,
        };

        set((state) => {
          const currentMatchAnswers = state.iqDuelAnswers[matchId] || {};
          return {
            iqDuelAnswers: {
              ...state.iqDuelAnswers,
              [matchId]: {
                ...currentMatchAnswers,
                [answerKey]: newAnswer,
              },
            },
          };
        });
      },

      solveRiddle: (riddleId: string) => {
        const currentUserId = get().currentUser.id;
        const solveKey = `${riddleId}_${currentUserId}`;
        set((state) => ({
          riddlesSolved: {
            ...state.riddlesSolved,
            [solveKey]: true,
          },
        }));
      },

      resetIQDuelMatch: (matchId: string) => {
        set((state) => {
          const updatedMatches = { ...state.iqDuelAnswers };
          delete updatedMatches[matchId];
          return { iqDuelAnswers: updatedMatches };
        });
      },

      createGameRoom: (gameType, category) => {
        const roomCode = `ROOM-${get().couple.invite_code}`;
        const newRoom: LiveGameRoom = {
          roomCode,
          couple_id: get().couple.id,
          gameType,
          category,
          hostUserId: get().currentUser.id,
          status: 'waiting',
          created_at: new Date().toISOString(),
        };
        set({ activeGameRoom: newRoom });
        return newRoom;
      },

      joinGameRoom: (roomCode) => {
        const currentCode = `ROOM-${get().couple.invite_code}`;
        if (roomCode.trim().toUpperCase() === currentCode.toUpperCase() || roomCode.toUpperCase().includes('LDR')) {
          if (!get().activeGameRoom) {
            const newRoom: LiveGameRoom = {
              roomCode,
              couple_id: get().couple.id,
              gameType: 'know-me',
              hostUserId: get().partner.id,
              status: 'in_progress',
              created_at: new Date().toISOString(),
            };
            set({ activeGameRoom: newRoom });
          }
          return true;
        }
        return false;
      },

      leaveGameRoom: () => {
        set({ activeGameRoom: null });
      },
    }),
    {
      name: 'ldr-app-storage-v7',
    }
  )
);
