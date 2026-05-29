const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function PaymentGate({ clientData, onPay }) {
  const status = clientData?.billing_status || 'trial';
  const trialEnd = clientData?.trial_ends_at ? new Date(clientData.trial_ends_at) : null;
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)) : 0;

  if (status === 'active' || status === 'complimentary') return null;

  const isPastDue = status === 'past_due';
  const isCancelled = status === 'cancelled';
  const isTrialExpired = status === 'trial' && trialDaysLeft === 0;
  const isInTrial = status === 'trial' && trialDaysLeft > 0;

  // Trial banner — non-blocking
  if (isInTrial) {
    return (
      <div style={{
        background: "#1a1a1a", color: "#f5f5f7",
        padding: "10px 16px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        fontSize: "11px", ...F,
      }}>
        <span style={{ color: "#aaa" }}>
          {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your trial
        </span>
        <button
          onClick={onPay}
          style={{ background: "#f5f5f7", color: "#111", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "10px", cursor: "pointer", fontWeight: "600", ...F }}
        >
          Subscribe
        </button>
      </div>
    );
  }

  // Full blocking gate — trial expired, cancelled, or past due
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#f7f6f3",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", zIndex: 500, ...F,
    }}>
      <div style={{ maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#bbb", marginBottom: "16px" }}>
          Tara Mattimiro Fitness
        </div>

        {isPastDue && (
          <>
            <div style={{ fontSize: "20px", fontWeight: "normal", color: "#111", marginBottom: "12px" }}>
              Payment issue
            </div>
            <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.8", marginBottom: "24px" }}>
              Your last payment didn't go through. Update your payment method to continue accessing your program.
            </div>
          </>
        )}

        {(isTrialExpired || isCancelled) && (
          <>
            <div style={{ fontSize: "20px", fontWeight: "normal", color: "#111", marginBottom: "12px" }}>
              {isCancelled ? "Subscription ended" : "Trial complete"}
            </div>
            <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.8", marginBottom: "24px" }}>
              {isCancelled
                ? "Your subscription has ended. Subscribe to continue working with Tara and access your program."
                : "Your free trial has ended. Subscribe to continue accessing your personalized program and coaching."
              }
            </div>
          </>
        )}

        <button
          onClick={onPay}
          style={{
            width: "100%", background: "#111", color: "#fff",
            border: "none", borderRadius: "9px", padding: "15px",
            fontSize: "14px", cursor: "pointer", marginBottom: "12px", ...F,
          }}
        >
          {isPastDue ? "Update payment method" : "Subscribe — $X/month"}
        </button>

        <div style={{ fontSize: "10px", color: "#bbb", lineHeight: "1.6" }}>
          Questions? Message Tara directly or email tara@tmffitness.com
        </div>
      </div>
    </div>
  );
}
