"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { UserRound } from "lucide-react";

const profileAppearance = {
  variables: {
    colorBackground: "#fffdf6",
    colorForeground: "#171d1a",
    colorPrimary: "#13332c",
    colorMutedForeground: "#606960",
    borderRadius: "10px",
    fontFamily: "var(--font-body-stack)",
  },
  elements: {
    modalContent: {
      backgroundColor: "#f4efe2",
    },
    cardBox: {
      border: "1.5px solid #171d1a",
      boxShadow: "6px 6px 0 #171d1a",
    },
    navbar: {
      backgroundColor: "#ece5d2",
    },
    profileSection: {
      border: "1px solid rgba(23, 29, 26, 0.16)",
      borderRadius: "10px",
      backgroundColor: "#fffdf6",
      padding: "16px",
    },
    profileSectionContent: {
      boxShadow: "none",
    },
  },
};

export function AccountProfileControl({
  email,
  businessName,
  compact = false,
}: {
  email: string;
  businessName: string;
  compact?: boolean;
}) {
  const clerk = useClerk();
  const { user } = useUser();
  const displayName = user?.fullName?.trim() || businessName;

  return (
    <div
      className={
        compact ? "account-profile account-profile-mobile" : "account-profile"
      }
    >
      <button
        type="button"
        className="account-profile-trigger"
        onClick={() => clerk.openUserProfile({ appearance: profileAppearance })}
        aria-label="Edit profile"
      >
        <span className="account-avatar" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <span className="sidebar-account-identity">
          <strong>{displayName}</strong>
          <small>{email}</small>
        </span>
      </button>
      <button
        type="button"
        className="account-sign-out"
        onClick={() => clerk.signOut({ redirectUrl: "/" })}
      >
        Sign out
      </button>
    </div>
  );
}
