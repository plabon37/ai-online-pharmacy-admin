"use client";

import { useEffect, useState } from "react";

import GlobalSearch from "@/components/dashboard/GlobalSearch";

type NavbarProps = {
  onMenuClick?: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    const handleOutsideClick = () => {
      setIsProfileOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex min-h-[72px] items-center gap-2 px-3 sm:min-h-[76px] sm:gap-3 sm:px-5 lg:min-h-[84px] lg:px-8">
          {/* =================================================
              LEFT SECTION
          ================================================= */}
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            {/* Mobile / Tablet Menu */}
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 md:hidden"
            >
              <MenuIcon />
            </button>

            {/* Brand / Title */}
            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:block">
                Smart Pharmacy
              </p>

              <h2 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg lg:text-xl">
                Administration
              </h2>
            </div>
          </div>

          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}
          <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex lg:px-8">
            <GlobalSearch />
          </div>

          {/* Spacer for small screen */}
          <div className="min-w-0 flex-1 md:hidden" />

          {/* =================================================
              RIGHT SECTION
          ================================================= */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Mobile Search */}
            <button
              type="button"
              aria-label="Open search"
              onClick={() =>
                setIsMobileSearchOpen((value) => !value)
              }
              className={`
                flex h-10 w-10 items-center justify-center
                rounded-xl border
                transition-all duration-200
                active:scale-95
                md:hidden
                ${
                  isMobileSearchOpen
                    ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                }
              `}
            >
              {isMobileSearchOpen ? (
                <CloseIcon />
              ) : (
                <SearchIcon />
              )}
            </button>

            {/* Notification */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
            >
              <BellIcon />

              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
            </button>

            {/* Divider */}
            <div className="mx-0.5 hidden h-8 w-px bg-slate-200 sm:block" />

            {/* =================================================
                PROFILE
            ================================================= */}
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsProfileOpen((value) => !value);
                }}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                className="group flex items-center gap-2 rounded-xl p-1.5 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] sm:gap-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                  SP
                </div>

                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[125px] truncate text-xs font-semibold text-slate-800 lg:max-w-[160px] lg:text-sm">
                    Smart Pharmacy
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500 lg:text-[11px]">
                    Administrator
                  </p>
                </div>

                <ChevronDownIcon
                  className={
                    isProfileOpen
                      ? "rotate-180 text-slate-500"
                      : "text-slate-400"
                  }
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div
                  role="menu"
                  onMouseDown={(event) => event.stopPropagation()}
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                >
                  {/* Header */}
                  <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                        SP
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          Smart Pharmacy
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          Administrator
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserIcon />
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <SettingsIcon />
                      Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================
            MOBILE SEARCH PANEL
        ================================================= */}
        <div
          className={`
            overflow-hidden border-t border-slate-100 transition-all duration-300 md:hidden
            ${
              isMobileSearchOpen
                ? "max-h-28 opacity-100"
                : "max-h-0 opacity-0"
            }
          `}
        >
          <div className="px-3 pb-3 pt-2 sm:px-5">
            <div className="w-full">
              <GlobalSearch />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

/* ============================================================
   ICONS
============================================================ */

function MenuIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 9C18 5.7 15.3 3 12 3C8.7 3 6 5.7 6 9V13.5L4.5 16H19.5L18 13.5V9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 19C10.1 20 10.9 20.5 12 20.5C13.1 20.5 13.9 20 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon({
  className = "text-slate-400",
}: {
  className?: string;
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${className}`}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.6 16.4 8 14.5 12 14.5C16 14.5 18.4 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 8.5C10.1 8.5 8.5 10.1 8.5 12C8.5 13.9 10.1 15.5 12 15.5C13.9 15.5 15.5 13.9 15.5 12C15.5 10.1 13.9 8.5 12 8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19.4 15L21 16L19 19L17.4 18C16.8 18.4 16.1 18.7 15.3 18.9L15 21H11L10.7 18.9C9.9 18.7 9.2 18.4 8.6 18L7 19L5 16L6.6 15C6.4 14.3 6.1 13.6 6 12.8L4 12V8L6 7.7C6.1 6.9 6.4 6.2 6.6 5.5L5 4L7 1L8.6 2C9.2 1.6 9.9 1.3 10.7 1.1L11 0H15L15.3 1.1C16.1 1.3 16.8 1.6 17.4 2L19 1L21 4L19.4 5.5C19.6 6.2 19.9 7.7 19.4 9L21 10L19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}