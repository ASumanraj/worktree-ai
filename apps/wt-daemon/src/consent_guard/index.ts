export interface CalendarVerificationContext {
  isVerifiedInternalHuddle: boolean;
  attendeeEmails: string[];
  tenantDomain: string; // e.g. "company.com"
}

export interface WindowAccessibilityContext {
  windowTitle: string;
  hasExternalBadge: boolean;
  hasGuestBadge: boolean;
}

export type AudioCaptureMode = "MUTED" | "CH1_MIC_ONLY" | "DUAL_CH1_CH2";

export interface GuardEvaluationResult {
  allowedMode: AudioCaptureMode;
  channel2Muted: boolean;
  reason: string;
}

export class FailClosedChannel2Guard {
  constructor(private tenantDomain: string) {}

  /**
   * INVARIANT 4: Fail-Closed Channel-2 Wiretapping Guard
   * Evaluates both calendar attendee domains and accessibility tree tags.
   * If any check fails, Channel 2 is HARD-MUTED at the buffer level.
   */
  public evaluateCall(
    calendar: CalendarVerificationContext | null,
    windowCtx: WindowAccessibilityContext | null
  ): GuardEvaluationResult {
    // If no context is available (e.g. ad-hoc call, untracked meeting), fail-closed to Channel 1 only
    if (!calendar || !windowCtx) {
      return {
        allowedMode: "CH1_MIC_ONLY",
        channel2Muted: true,
        reason: "Fail-Closed: Missing calendar or meeting window verification. Capturing local mic only.",
      };
    }

    // Condition 1: Check External/Guest badges in window accessibility tree
    if (windowCtx.hasExternalBadge || windowCtx.hasGuestBadge) {
      return {
        allowedMode: "CH1_MIC_ONLY",
        channel2Muted: true,
        reason: "Fail-Closed: Window contains [External] or [Guest] participants. Channel 2 hard-muted.",
      };
    }

    // Condition 2: Verified internal Slack/Teams workspace huddle
    if (calendar.isVerifiedInternalHuddle) {
      return {
        allowedMode: "DUAL_CH1_CH2",
        channel2Muted: false,
        reason: "Verified internal Workspace Huddle. Dual-channel capture active.",
      };
    }

    // Condition 3: Check 100% attendee domain match
    if (calendar.attendeeEmails.length === 0) {
      return {
        allowedMode: "CH1_MIC_ONLY",
        channel2Muted: true,
        reason: "Fail-Closed: No verified attendee roster found. Capturing local mic only.",
      };
    }

    const domainSuffix = `@${this.tenantDomain.toLowerCase()}`;
    const allInternal = calendar.attendeeEmails.every((email) =>
      email.toLowerCase().endsWith(domainSuffix)
    );

    if (!allInternal) {
      return {
        allowedMode: "CH1_MIC_ONLY",
        channel2Muted: true,
        reason: `Fail-Closed: Non-${this.tenantDomain} attendee detected. Channel 2 hard-muted to protect client privacy.`,
      };
    }

    return {
      allowedMode: "DUAL_CH1_CH2",
      channel2Muted: false,
      reason: "Verified 100% internal tenant meeting. Dual-channel capture enabled.",
    };
  }
}
