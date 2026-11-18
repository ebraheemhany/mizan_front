// component/dashbord/AppDataProvider.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { mockTasks, type Task } from '@/lib/mock/tasks';

type AppData = {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
};

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  // TODO: لما نربط الـ API المهام دي تيجي من الباك إند (المصروفات بقت من الـ API)
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  return (
    <AppDataContext.Provider
      value={{ tasks, setTasks }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('AppDataProvider is missing in the dashboard layout');
  }
  return ctx;
}

export function useTasks() {
  const { tasks, setTasks } = useAppData();
  return { tasks, setTasks };
}
