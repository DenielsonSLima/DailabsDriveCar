import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    profile: any | null;
    loading: boolean;
    setSession: (session: Session | null) => void;
    setProfile: (profile: any | null) => void;
    setLoading: (loading: boolean) => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    profile: null,
    loading: true,
    setSession: (session) => set({ session, loading: false }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    isAuthenticated: () => !!get().session,
}));
