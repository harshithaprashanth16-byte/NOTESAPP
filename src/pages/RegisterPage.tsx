import React, { useState } from "react";
import { GraduationCap, ArrowRight, Lock, Mail, User, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all registration fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please check your information.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] hacker-grid flex flex-col justify-center items-center p-4 selection:bg-[#00FF41] selection:text-black">
      {/* Background subtle green glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00FF41]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-[#00FF41] mb-3 shadow-[0_0_20px_rgba(0,255,65,0.15)]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            ACAD<span className="text-[#00FF41]">NOTE</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">Create your private student academic workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[#08080c] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Create Account</h2>
            <p className="text-xs text-zinc-400 mt-1">Start organizing your course notes and files</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-950/30 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Harshitha"
                  className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <ShieldCheck className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#050508] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FF41]/60 focus:ring-1 focus:ring-[#00FF41]/30 transition-all font-sans"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00FF41] hover:bg-[#8AFF9B] text-black font-semibold text-xs font-mono tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2 subtle-glow disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#8AFF9B] hover:text-[#00FF41] font-mono font-semibold underline underline-offset-4 ml-1"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
