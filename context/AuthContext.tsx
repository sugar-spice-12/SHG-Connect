// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "../src/supabase";
import { Role, AuthSettings, User } from "../types";

interface AuthContextType {
  user: User | null;
  currentUserRole: Role;
  isLocked: boolean;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  login: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  enableAppLock: () => Promise<boolean>;
  disableAppLock: () => void;
  lockApp: () => void;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  settings: AuthSettings;
  switchRole: (role: Role) => Promise<void>;
  updateSettings: (updates: Partial<AuthSettings>) => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
  otpAttempts: number;
  isOtpBlocked: boolean;
  otpBlockedUntil: number | null;
  isBiometricSupported: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "shakti_auth_v4";
const USER_STORAGE_KEY = "shakti_user_v4";
const SECURITY_STORAGE_KEY = "shakti_security_v2";

// Security constants
const MAX_OTP_ATTEMPTS = 5;
const OTP_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

// Simple encryption for local storage
const ENCRYPTION_KEY = "shg_secure_2024";
const encrypt = (data: string): string => {
  try {
    const encoded = encodeURIComponent(data);
    let result = "";
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(
        encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return btoa(result);
  } catch {
    return btoa(encodeURIComponent(data));
  }
};

const decrypt = (data: string): string => {
  try {
    const decoded = atob(data);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    }
    return decodeURIComponent(result);
  } catch {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return "";
    }
  }
};

// Sanitize email input
const sanitizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>\"'&]/g, "")
    .slice(0, 254);
};

// Validate email format
const isValidEmailStrict = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Check if WebAuthn/Biometric is supported
const checkBiometricSupport = async (): Promise<boolean> => {
  try {
    // Check if running in secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.log("Not in secure context");
      return false;
    }
    
    // Check if PublicKeyCredential is available
    if (!window.PublicKeyCredential) {
      console.log("PublicKeyCredential not available");
      return false;
    }
    
    // Check if platform authenticator is available (fingerprint, face, device PIN)
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log("Platform authenticator available:", available);
    return available;
  } catch (error) {
    console.error("Error checking biometric support:", error);
    return false;
  }
};

// Generate a random challenge for WebAuthn
const generateChallenge = (): Uint8Array => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [settings, setSettings] = useState<AuthSettings>({
    isPinEnabled: false, // Now represents "isAppLockEnabled"
    pin: "",
    isBiometricEnabled: false,
    onboardingCompleted: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Security state
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpBlockedUntil, setOtpBlockedUntil] = useState<number | null>(null);
  const [otpRequestTimestamps, setOtpRequestTimestamps] = useState<number[]>([]);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const credentialIdRef = useRef<string | null>(null);

  // Check if OTP verification is blocked
  const isOtpBlocked = otpBlockedUntil !== null && Date.now() < otpBlockedUntil;

  // Check biometric support on mount
  useEffect(() => {
    checkBiometricSupport().then(supported => {
      setIsBiometricSupported(supported);
      console.log("Biometric support:", supported);
    });
  }, []);

  // Session timeout - lock app after inactivity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = () => {
      if (user && settings.isBiometricEnabled && !isLocked) {
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime > SESSION_TIMEOUT) {
          setIsLocked(true);
          toast("Session timed out. Please authenticate to continue.", { icon: "🔒" });
        }
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    sessionTimeoutRef.current = setInterval(checkInactivity, 60000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (sessionTimeoutRef.current) {
        clearInterval(sessionTimeoutRef.current);
      }
    };
  }, [user, settings.isBiometricEnabled, isLocked]);

  // Load security state from storage
  useEffect(() => {
    try {
      const securityData = localStorage.getItem(SECURITY_STORAGE_KEY);
      if (securityData) {
        const parsed = JSON.parse(decrypt(securityData));
        if (parsed.otpBlockedUntil && Date.now() < parsed.otpBlockedUntil) {
          setOtpBlockedUntil(parsed.otpBlockedUntil);
          setOtpAttempts(parsed.otpAttempts || 0);
        }
        if (parsed.credentialId) {
          credentialIdRef.current = parsed.credentialId;
        }
        if (parsed.otpRequestTimestamps) {
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          setOtpRequestTimestamps(
            parsed.otpRequestTimestamps.filter((ts: number) => ts > oneHourAgo)
          );
        }
      }
    } catch (e) {
      console.error("Failed to load security state:", e);
    }
  }, []);

  // Persist security state
  useEffect(() => {
    const securityData = {
      otpAttempts,
      otpBlockedUntil,
      otpRequestTimestamps,
      credentialId: credentialIdRef.current,
    };
    localStorage.setItem(SECURITY_STORAGE_KEY, encrypt(JSON.stringify(securityData)));
  }, [otpAttempts, otpBlockedUntil, otpRequestTimestamps]);

  // Load saved state
  const loadState = async () => {
    try {
      const savedSettings = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(decrypt(savedSettings));
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        // Lock app if biometric is enabled
        if (parsedSettings.isBiometricEnabled) {
          setIsLocked(true);
        }
      }

      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(decrypt(savedUser));
        setUser(parsedUser);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
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
          setSettings(prev => ({
            ...prev,
            onboardingCompleted: dbUser.onboarding_completed || false,
          }));
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

            await supabase.from("users").insert({
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
          setIsLocked(false);
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

  // LOGIN
  const login = async (email: string): Promise<boolean> => {
    try {
      const sanitizedEmail = sanitizeEmail(email);
      if (!isValidEmailStrict(sanitizedEmail)) {
        toast.error("Please enter a valid email address");
        return false;
      }

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const recentRequests = otpRequestTimestamps.filter(ts => ts > oneHourAgo);
      
      if (recentRequests.length >= MAX_OTP_REQUESTS_PER_HOUR) {
        const oldestRequest = Math.min(...recentRequests);
        const waitTime = Math.ceil((oldestRequest + 60 * 60 * 1000 - now) / 60000);
        toast.error(`Too many OTP requests. Please wait ${waitTime} minutes.`);
        return false;
      }

      console.log("Attempting to send OTP to:", sanitizedEmail);
      const { data, error } = await supabase.auth.signInWithOtp({
        email: sanitizedEmail,
        options: { shouldCreateUser: true },
      });
      console.log("OTP response:", { data, error });
      
      if (error) throw error;
      
      setOtpRequestTimestamps(prev => [...prev.filter(ts => ts > oneHourAgo), now]);
      setOtpAttempts(0);
      setOtpBlockedUntil(null);
      
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Failed to send OTP";
      if (error.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message?.includes("rate limit") || error.status === 429) {
        errorMessage = "Too many requests. Please wait a minute.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return false;
    }
  };

  // VERIFY OTP
  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    if (isOtpBlocked) {
      const remainingTime = Math.ceil((otpBlockedUntil! - Date.now()) / 60000);
      toast.error(`Too many failed attempts. Try again in ${remainingTime} minutes.`);
      return false;
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedOtp = otp.replace(/\D/g, "").slice(0, 6);

    if (sanitizedOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return false;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: sanitizedEmail,
        token: sanitizedOtp,
        type: "email",
      });
      
      if (error) throw error;
      
      if (data.user) {
        setOtpAttempts(0);
        setOtpBlockedUntil(null);
        toast.success("Login successful!");
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      
      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        const blockUntil = Date.now() + OTP_BLOCK_DURATION;
        setOtpBlockedUntil(blockUntil);
        toast.error(`Too many failed attempts. Account locked for 15 minutes.`);
      } else {
        const remaining = MAX_OTP_ATTEMPTS - newAttempts;
        toast.error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
      
      return false;
    }
  };

  // ENABLE APP LOCK - Register with device biometric/screen lock
  const enableAppLock = async (): Promise<boolean> => {
    if (!isBiometricSupported) {
      toast.error("Device authentication not supported on this device/browser");
      return false;
    }

    try {
      const challenge = generateChallenge();
      const userId = user?.id || "shg-user";
      
      // Create credential options for registration
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "SHG Connect",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: user?.phoneNumber || "user@shgconnect.app",
            displayName: user?.name || "SHG User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },   // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Use device's built-in authenticator
            userVerification: "required",        // Require biometric/PIN
            residentKey: "preferred",
          },
          timeout: 60000,
          attestation: "none",
        },
      };

      console.log("Creating credential...");
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;
      
      if (credential) {
        // Store credential ID for future authentication
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        credentialIdRef.current = credentialId;
        
        // Save to localStorage
        const securityData = {
          otpAttempts,
          otpBlockedUntil,
          otpRequestTimestamps,
          credentialId,
        };
        localStorage.setItem(SECURITY_STORAGE_KEY, encrypt(JSON.stringify(securityData)));
        
        setSettings(prev => ({
          ...prev,
          isBiometricEnabled: true,
          isPinEnabled: true, // For backward compatibility
        }));
        
        toast.success("App lock enabled! Use your fingerprint, face, or device PIN to unlock.");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Enable app lock error:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Authentication was cancelled or denied");
      } else if (error.name === "SecurityError") {
        toast.error("Security error. Make sure you're using HTTPS.");
      } else {
        toast.error("Failed to enable app lock: " + (error.message || "Unknown error"));
      }
      return false;
    }
  };

  // UNLOCK WITH BIOMETRIC - Use device's fingerprint/face/PIN
  const unlockWithBiometric = async (): Promise<boolean> => {
    if (!settings.isBiometricEnabled) {
      setIsLocked(false);
      return true;
    }

    try {
      const challenge = generateChallenge();
      
      // Build allowCredentials if we have a stored credential ID
      let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
      if (credentialIdRef.current) {
        try {
          const credentialIdBytes = Uint8Array.from(atob(credentialIdRef.current), c => c.charCodeAt(0));
          allowCredentials = [{
            id: credentialIdBytes,
            type: "public-key",
            transports: ["internal"],
          }];
        } catch (e) {
          console.warn("Could not parse stored credential ID");
        }
      }

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000,
          allowCredentials,
        },
      };

      console.log("Requesting authentication...");
      const assertion = await navigator.credentials.get(getOptions);
      
      if (assertion) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
        toast.success("Unlocked!");
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Unlock error:", error);
      
      if (error.name === "NotAllowedError") {
        toast.error("Authentication cancelled or failed");
      } else if (error.name === "SecurityError") {
        toast.error("Security error during authentication");
      } else {
        toast.error("Failed to authenticate: " + (error.message || "Unknown error"));
      }
      return false;
    }
  };

  // DISABLE APP LOCK
  const disableAppLock = () => {
    credentialIdRef.current = null;
    setSettings(prev => ({
      ...prev,
      isBiometricEnabled: false,
      isPinEnabled: false,
    }));
    setIsLocked(false);
    toast.success("App lock disabled");
  };

  // LOCK APP
  const lockApp = () => {
    if (settings.isBiometricEnabled) {
      setIsLocked(true);
    }
  };

  // ONBOARDING
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

  // LOGOUT
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
    if (!user) return false;
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
    login,
    verifyOtp,
    unlockWithBiometric,
    enableAppLock,
    disableAppLock,
    lockApp,
    logout,
    completeOnboarding,
    settings,
    switchRole,
    updateSettings: updates => setSettings(prev => ({ ...prev, ...updates })),
    updateUser,
    isLoading,
    otpAttempts,
    isOtpBlocked,
    otpBlockedUntil,
    isBiometricSupported,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
