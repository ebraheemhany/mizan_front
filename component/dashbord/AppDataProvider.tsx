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

import { mockExpenses, type Expense } from '@/lib/mock/expenses';
import { mockTasks, type Task } from '@/lib/mock/tasks';

type AppData = {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  expenses: Expense[];
  setExpenses: Dispatch<SetStateAction<Expense[]>>;
};

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  // TODO: لما نربط الـ API المهام والمصروفات دي تيجي من الباك إند
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  return (
    <AppDataContext.Provider
      value={{ tasks, setTasks, expenses, setExpenses }}
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

export function useExpenses() {
  const { expenses, setExpenses } = useAppData();
  return { expenses, setExpenses };
}