import test from "node:test";
import assert from "node:assert/strict";
import { FailClosedChannel2Guard } from "../src/consent_guard/index.js";

test("TASK-06 / Invariant 4: FailClosedChannel2Guard Wiretapping Guard", () => {
  const guard = new FailClosedChannel2Guard("acme.com");

  // 1. External Client Call: Contains client email (e.g. client@bank.com)
  const externalCall = guard.evaluateCall(
    {
      isVerifiedInternalHuddle: false,
      attendeeEmails: ["dev@acme.com", "partner@bank.com"],
      tenantDomain: "acme.com",
    },
    {
      windowTitle: "Zoom Meeting - Architecture Review",
      hasExternalBadge: false,
      hasGuestBadge: false,
    }
  );
  assert.equal(externalCall.allowedMode, "CH1_MIC_ONLY", "External client call must fail-closed to Channel 1 mic only");
  assert.equal(externalCall.channel2Muted, true, "Channel 2 must be hard-muted for external participants");

  // 2. Window Accessibility Tree Tag: [External] participant badge present
  const badgedCall = guard.evaluateCall(
    {
      isVerifiedInternalHuddle: false,
      attendeeEmails: ["dev1@acme.com", "dev2@acme.com"],
      tenantDomain: "acme.com",
    },
    {
      windowTitle: "Google Meet - Sync (1 external)",
      hasExternalBadge: true,
      hasGuestBadge: false,
    }
  );
  assert.equal(badgedCall.allowedMode, "CH1_MIC_ONLY", "External badge must hard-mute Channel 2");
  assert.equal(badgedCall.channel2Muted, true);

  // 3. Ad-hoc unverified call (Missing calendar context)
  const adHocCall = guard.evaluateCall(null, null);
  assert.equal(adHocCall.allowedMode, "CH1_MIC_ONLY", "Untracked/ad-hoc call must default fail-closed to Channel 1");
  assert.equal(adHocCall.channel2Muted, true);

  // 4. Verified 100% Internal Meeting: All @acme.com + 0 external badges
  const internalMeeting = guard.evaluateCall(
    {
      isVerifiedInternalHuddle: false,
      attendeeEmails: ["alice@acme.com", "bob@acme.com", "carol@acme.com"],
      tenantDomain: "acme.com",
    },
    {
      windowTitle: "Teams - Core Platform Weekly",
      hasExternalBadge: false,
      hasGuestBadge: false,
    }
  );
  assert.equal(internalMeeting.allowedMode, "DUAL_CH1_CH2", "100% internal tenant meeting allows dual-channel capture");
  assert.equal(internalMeeting.channel2Muted, false);
});
