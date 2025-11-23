// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "../src/supabase";
import { Role, AuthSettings, User } from "../types";

interface AuthContextType {
  user: User | null;
  currentUserRole: Role;
  isLocked: boolean;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  showPinSetup: boolean;
  login: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  setupSecurity: (pin: string, enableBiometric: boolean) => void;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  settings: AuthSettings;
  switchRole: (role: Role) => Promise<void>;
  updateSettings: (updates: Partial<AuthSettings>) => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "shakti_auth_v2";
const USER_STORAGE_KEY = "shakti_user_v2";

const encrypt = (data: string) => btoa(encodeURIComponent(data));
const decrypt = (data: string) => decodeURIComponent(atob(data));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [settings, setSettings] = useState<AuthSettings>({
    isPinEnabled: false,
    pin: "",
    isBiometricEnabled: false,
    onboardingCompleted: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------
  // Load saved state
  // ---------------------------
  const loadState = async () => {
    try {
      // Load settings
      const savedSettings = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(decrypt(savedSettings));
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        setIsLocked(parsedSettings.isPinEnabled);
      }

      // Load user
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(decrypt(savedUser));
        setUser(parsedUser);
      }

      // Check current Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user data from database
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (dbUser) {
          const localUser: User = {
            id: dbUser.id,
            name: dbUser.name || session.user.email?.split("@")[0] || "SHG Member",
            phoneNumber: dbUser.email || session.user.email || "",
            role: dbUser.role || "Member",
            memberId: dbUser.id,
          };

          setUser(localUser);
          
          // Update settings with onboarding status from database
          setSettings(prev => ({
            ...prev,
            onboardingCompleted: dbUser.onboarding_completed || false,
          }));

          // Only lock if PIN is enabled
          if (!savedSettings || !JSON.parse(decrypt(savedSettings)).isPinEnabled) {
            setIsLocked(false);
          }
        }
      }
    } catch (e) {
      console.error("Auth load error", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Persist settings
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(AUTH_STORAGE_KEY, encrypt(JSON.stringify(settings)));
    }
  }, [settings, isLoading]);

  // Persist user
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, encrypt(JSON.stringify(user)));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, [user, isLoading]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        
        if (event === "SIGNED_IN" && session?.user) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          let role: Role = "Member";
          let name = session.user.email?.split("@")[0] || "SHG Member";
          let onboardingCompleted = false;

          if (!existingUser) {
            const { data: allUsers } = await supabase
              .from("users")
              .select("id")
              .limit(1);

            role = !allUsers || allUsers.length === 0 ? "SHG Leader" : "Member";

            const { data: newUser } = await supabase.from("users").insert({
              id: session.user.id,
              email: session.user.email,
              name,
              role,
              onboarding_completed: false,
              created_at: new Date().toISOString(),
            }).select().single();

            onboardingCompleted = false;
          } else {
            role = existingUser.role || "Member";
            name = existingUser.name || name;
            onboardingCompleted = existingUser.onboarding_completed || false;
          }

          const localUser: User = {
            id: session.user.id,
            name,
            phoneNumber: session.user.email || "",
            role,
            memberId: session.user.id,
          };

          setUser(localUser);
          setSettings(prev => ({
            ...prev,
            onboardingCompleted,
          }));
          
          // Unlock if no PIN is set
          if (!settings.isPinEnabled) {
            setIsLocked(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setSettings({
            isPinEnabled: false,
            pin: "",
            isBiometricEnabled: false,
            onboardingCompleted: false,
          });
          setIsLocked(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------
  // LOGIN
  // ---------------------------------------------
  const login = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to send OTP");
      return false;
    }
  };

  // ---------------------------------------------
  // VERIFY OTP
  // ---------------------------------------------
  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      if (data.user) {
        toast.success("Login successful!");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || "Invalid OTP");
      return false;
    }
  };

  // ---------------------------------------------
  // ONBOARDING
  // ---------------------------------------------
  const completeOnboarding = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, onboardingCompleted: true }));
      toast.success("Onboarding completed");
    } catch (e) {
      console.error("Onboarding error:", e);
      toast.error("Failed to complete onboarding");
    }
  };

  // ---------------------------------------------
  // PIN / SECURITY
  // ---------------------------------------------
  const setupSecurity = (pin: string, enableBiometric: boolean = false) => {
    const isPinEnabled = pin.length >= 4;
    setSettings(prev => ({
      ...prev,
      isPinEnabled,
      pin,
      isBiometricEnabled: false, // Always false - biometric removed
    }));
    
    if (isPinEnabled) {
      toast.success("PIN setup complete");
    } else {
      toast.success("Skipped security setup");
    }
    
    setIsLocked(false);
  };

  const unlockApp = (pin: string) => {
    // If no PIN is set, allow unlock
    if (!settings.isPinEnabled || !settings.pin) {
      setIsLocked(false);
      return true;
    }
    
    // Verify PIN
    if (pin === settings.pin) {
      setIsLocked(false);
      return true;
    }
    
    return false;
  };

  const lockApp = () => {
    if (settings.isPinEnabled) {
      setIsLocked(true);
    }
  };

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSettings({
        isPinEnabled: false,
        pin: "",
        isBiometricEnabled: false,
        onboardingCompleted: false,
      });
      setIsLocked(false);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      toast.success("Logged out");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const switchRole = async (role: Role) => {
    if (!user) return;
    try {
      await supabase
        .from("users")
        .update({ role })
        .eq("id", user.id);
      setUser(prev => (prev ? { ...prev, role } : prev));
      toast.success(`Role switched to ${role}`);
    } catch (e) {
      toast.error("Failed to switch role");
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: updates.name,
          role: updates.role,
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser(prev => (prev ? { ...prev, ...updates } : prev));
      toast.success("Profile updated successfully");
      return true;
    } catch (e) {
      toast.error("Failed to update profile");
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    currentUserRole: (user?.role as Role) || "SHG Leader",
    isLocked,
    isAuthenticated: !!user,
    showOnboarding: !!user && !settings.onboardingCompleted,
    showPinSetup: !!user && settings.onboardingCompleted && !settings.isPinEnabled,
    login,
    verifyOtp,
    setupSecurity,
    unlockApp,
    lockApp,
    logout,
    completeOnboarding,
    settings,
    switchRole,
    updateSettings: updates => setSettings(prev => ({ ...prev, ...updates })),
    updateUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};