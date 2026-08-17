"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Admin login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8f7]">
      {/* =====================================================
          BACKGROUND
      ====================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft background gradients */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-cyan-200/30 blur-3xl" />

        {/* Medical glow */}
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 blur-3xl" />

        {/* Floating medical cross */}
        <div className="pharmacy-float absolute left-[8%] top-[16%] text-emerald-300/50">
          <MedicalCross size={62} />
        </div>

        <div className="pharmacy-float-slow absolute right-[10%] top-[18%] text-cyan-300/50">
          <MedicalCross size={45} />
        </div>

        <div className="pharmacy-float-reverse absolute bottom-[18%] left-[12%] text-teal-300/40">
          <MedicalCross size={40} />
        </div>

        <div className="pharmacy-float absolute bottom-[14%] right-[12%] text-emerald-300/40">
          <MedicalCross size={55} />
        </div>

        {/* Floating capsules */}
        <Capsule
          className="absolute left-[17%] top-[38%]"
          color="emerald"
          rotation="-rotate-12"
          delay="0s"
        />

        <Capsule
          className="absolute right-[18%] top-[43%]"
          color="cyan"
          rotation="rotate-12"
          delay="1.2s"
        />

        <Capsule
          className="absolute bottom-[24%] left-[25%]"
          color="teal"
          rotation="rotate-45"
          delay="2.2s"
        />

        <Capsule
          className="absolute bottom-[27%] right-[24%]"
          color="emerald"
          rotation="-rotate-45"
          delay="0.8s"
        />

        {/* Floating tablets */}
        <div className="tablet-float absolute left-[6%] top-[58%] h-8 w-16 rotate-12 rounded-full border border-emerald-300/30 bg-white/50 shadow-sm backdrop-blur-sm" />

        <div className="tablet-float-reverse absolute right-[7%] bottom-[38%] h-7 w-14 -rotate-12 rounded-full border border-cyan-300/30 bg-white/50 shadow-sm backdrop-blur-sm" />

        {/* Small floating particles */}
        <span className="particle absolute left-[26%] top-[20%]" />
        <span className="particle absolute left-[78%] top-[28%] animation-delay-1000" />
        <span className="particle absolute left-[20%] bottom-[28%] animation-delay-2000" />
        <span className="particle absolute right-[24%] bottom-[20%] animation-delay-1500" />
        <span className="particle absolute left-[88%] top-[60%] animation-delay-500" />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
              <PharmacyIcon />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Smart Pharmacy
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Healthcare Management Administration
            </p>
          </div>

          {/* Login Card */}
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_25px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="p-6 sm:p-8 lg:p-9">
              {/* Card Header */}
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Admin Portal
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Sign in to manage your Smart Pharmacy system.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  role="alert"
                >
                  <span className="mt-0.5 font-semibold">!</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <MailIcon />
                    </span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@smartpharmacy.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LockIcon />
                    </span>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-200/70 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/15 transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Info */}
              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldIcon />
                <span>Secure administrator authentication</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Smart Pharmacy & Healthcare Management System
          </p>
        </div>
      </div>

      {/* =====================================================
          LOCAL ANIMATION STYLES
      ====================================================== */}
      <style jsx>{`
        .pharmacy-float {
          animation: pharmacyFloat 6s ease-in-out infinite;
        }

        .pharmacy-float-slow {
          animation: pharmacyFloat 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .pharmacy-float-reverse {
          animation: pharmacyFloatReverse 7s ease-in-out infinite;
        }

        .tablet-float {
          animation: tabletFloat 7s ease-in-out infinite;
        }

        .tablet-float-reverse {
          animation: tabletFloatReverse 8s ease-in-out infinite;
        }

        .particle {
          height: 7px;
          width: 7px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.28);
          animation: particleFloat 5s ease-in-out infinite;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        @keyframes pharmacyFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(-18px) rotate(5deg);
          }
        }

        @keyframes pharmacyFloatReverse {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }

          50% {
            transform: translateY(15px) rotate(-6deg);
          }
        }

        @keyframes tabletFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(12deg);
          }

          50% {
            transform: translateY(-12px) rotate(18deg);
          }
        }

        @keyframes tabletFloatReverse {
          0%,
          100% {
            transform: translateY(0px) rotate(-12deg);
          }

          50% {
            transform: translateY(14px) rotate(-5deg);
          }
        }

        @keyframes particleFloat {
          0%,
          100% {
            transform: translateY(0px);
            opacity: 0.25;
          }

          50% {
            transform: translateY(-15px);
            opacity: 0.8;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pharmacy-float,
          .pharmacy-float-slow,
          .pharmacy-float-reverse,
          .tablet-float,
          .tablet-float-reverse,
          .particle {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   SMALL SVG COMPONENTS
============================================================ */

function PharmacyIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="4"
        stroke="white"
        strokeWidth="1.8"
      />

      <path
        d="M12 8V16M8 12H16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MedicalCross({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3H15V9H21V15H15V21H9V15H3V9H9V3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Capsule({
  className,
  color,
  rotation,
  delay,
}: {
  className?: string;
  color: "emerald" | "cyan" | "teal";
  rotation?: string;
  delay?: string;
}) {
  const colorMap = {
    emerald: {
      body: "bg-emerald-400/20",
      border: "border-emerald-400/30",
      divider: "bg-emerald-500/25",
    },
    cyan: {
      body: "bg-cyan-400/20",
      border: "border-cyan-400/30",
      divider: "bg-cyan-500/25",
    },
    teal: {
      body: "bg-teal-400/20",
      border: "border-teal-400/30",
      divider: "bg-teal-500/25",
    },
  };

  const colors = colorMap[color];

  return (
    <div
      className={`${className ?? ""} pharmacy-float ${rotation ?? ""} relative h-8 w-16 overflow-hidden rounded-full border ${colors.border} ${colors.body} shadow-sm backdrop-blur-sm`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <div
        className={`absolute right-0 top-0 h-full w-1/2 ${colors.divider}`}
      />
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6H20C21.1 6 22 6.9 22 8V16C22 17.1 21.1 18 20 18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M2.5 7.5L10.7 13.2C11.48 13.74 12.52 13.74 13.3 13.2L21.5 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle cx="12" cy="15.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.7 16.1 19.7 12 21C7.9 19.7 5 15.7 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}