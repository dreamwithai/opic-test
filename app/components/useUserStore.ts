"use client";

import { create } from 'zustand';

interface Member {
  id?: number;
  name?: string;
  type?: string;
  [key: string]: any;
}

interface UserStore {
  member: Member | null;
  setMember: (member: Member | null) => void;
  logout: () => void;
  initFromStorage: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  member: null,
  setMember: (member) => {
    set({ member });
    if (typeof window !== 'undefined') {
      if (member) {
        localStorage.setItem('member', JSON.stringify(member));
        if (member.type === 'admin') {
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.setItem('isAdmin', 'false');
        }
      } else {
        localStorage.removeItem('member');
        localStorage.removeItem('isAdmin');
      }
    }
  },
  logout: () => {
    set({ member: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('member');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userData');
    }
  },
  initFromStorage: () => {
    if (typeof window !== 'undefined') {
      const syncMember = () => {
        const m = localStorage.getItem('member');
        set({ member: m ? JSON.parse(m) : null });
      };
      window.addEventListener('storage', syncMember);
      syncMember(); // 최초 1회 동기화
    }
  },
})); 