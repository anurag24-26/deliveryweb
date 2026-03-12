// components/PhoneVerification.jsx
// Reusable component — drop it into Profile.jsx and RestaurantProfile.jsx

import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebase"; // adjust path if needed

/**
 * Props:
 *   phone         — the current phone number (string)
 *   onVerified    — callback(phone) called when OTP confirmed successfully
 *   isVerified    — boolean, whether this phone is already verified
 */
export default function PhoneVerification({ phone, onVerified, isVerified }) {
  const [step, setStep] = useState("idle");         // idle | sending | otp | verifying | done
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch (_) {}
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const setupRecaptcha = () => {
    // Avoid duplicate reCAPTCHA
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {}
      });
    }
    return recaptchaRef.current;
  };

  const sendOtp = async () => {
    setError("");
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number first");
      return;
    }

    setStep("sending");
    try {
      const verifier = setupRecaptcha();
      const fullPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmationRef.current = confirmation;
      setStep("otp");
      startCountdown();
    } catch (err) {
      console.error("OTP send error:", err);
      setError(getFriendlyError(err.code));
      setStep("idle");
      // Reset reCAPTCHA so user can retry
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); recaptchaRef.current = null; } catch (_) {}
      }
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the 6-digit OTP"); return; }

    setError("");
    setStep("verifying");
    try {
      await confirmationRef.current.confirm(code);
      setStep("done");
      onVerified(phone); // Tell parent the phone is verified
    } catch (err) {
      console.error("OTP verify error:", err);
      setError("Invalid OTP. Please try again.");
      setStep("otp");
    }
  };

  const handleOtpInput = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    // Auto-focus next
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const getFriendlyError = (code) => {
    switch (code) {
      case "auth/invalid-phone-number":    return "Invalid phone number format";
      case "auth/too-many-requests":       return "Too many attempts. Please wait a few minutes.";
      case "auth/quota-exceeded":          return "OTP quota exceeded. Please try later.";
      case "auth/captcha-check-failed":    return "reCAPTCHA failed. Please refresh the page.";
      default:                             return "Failed to send OTP. Please try again.";
    }
  };

  // ── If already verified, show green badge only ──
  if (isVerified || step === "done") {
    return (
      <div style={s.verifiedBadge}>
        <span style={s.verifiedIcon}>✓</span>
        <span style={s.verifiedText}>Phone number verified</span>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container"></div>

      {/* Step: idle — show Verify button */}
      {step === "idle" && (
        <button
          type="button"
          onClick={sendOtp}
          disabled={!/^\d{10}$/.test(phone)}
          style={{
            ...s.sendBtn,
            ...(!/^\d{10}$/.test(phone) ? s.btnDisabled : {})
          }}
        >
          📱 Verify via OTP
        </button>
      )}

      {/* Step: sending */}
      {step === "sending" && (
        <div style={s.infoBox}>
          <div style={s.miniSpinner}></div>
          <span>Sending OTP to +91 {phone}…</span>
        </div>
      )}

      {/* Step: OTP entry */}
      {step === "otp" && (
        <div style={s.otpBox}>
          <p style={s.otpHint}>
            OTP sent to <strong>+91 {phone}</strong>. Enter below:
          </p>
          <div style={s.otpRow} onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(e.target.value, i)}
                onKeyDown={e => handleOtpKeyDown(e, i)}
                style={s.otpInput}
              />
            ))}
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="button" onClick={verifyOtp} style={s.confirmBtn}>
            ✅ Confirm OTP
          </button>

          <div style={s.resendRow}>
            {countdown > 0 ? (
              <span style={s.countdown}>Resend in {countdown}s</span>
            ) : (
              <button type="button" onClick={sendOtp} style={s.resendBtn}>
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step: verifying */}
      {step === "verifying" && (
        <div style={s.infoBox}>
          <div style={s.miniSpinner}></div>
          <span>Verifying OTP…</span>
        </div>
      )}

      {error && step === "idle" && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  wrapper: { marginTop: "8px" },
  sendBtn: {
    padding: "10px 20px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  infoBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    backgroundColor: "#f0f4ff",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#2d3748"
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    border: "3px solid #c7d2fe",
    borderTop: "3px solid #2d3748",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0
  },
  otpBox: {
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    border: "2px solid #e9ecef"
  },
  otpHint: { fontSize: "13px", color: "#495057", margin: "0 0 12px 0" },
  otpRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-start",
    marginBottom: "14px"
  },
  otpInput: {
    width: "44px",
    height: "52px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "700",
    border: "2px solid #dee2e6",
    borderRadius: "10px",
    outline: "none",
    backgroundColor: "white",
    color: "#2d3748",
    transition: "border-color 0.2s"
  },
  confirmBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "10px"
  },
  resendRow: { textAlign: "center" },
  countdown: { fontSize: "13px", color: "#6c757d" },
  resendBtn: {
    background: "none",
    border: "none",
    color: "#2d3748",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0
  },
  error: {
    color: "#dc3545",
    fontSize: "13px",
    margin: "8px 0 0 0",
    padding: "8px 12px",
    backgroundColor: "#fff5f5",
    borderRadius: "8px"
  },
  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    backgroundColor: "#d4edda",
    borderRadius: "8px",
    marginTop: "8px"
  },
  verifiedIcon: { color: "#28a745", fontWeight: "bold", fontSize: "16px" },
  verifiedText: { color: "#155724", fontSize: "13px", fontWeight: "600" }
};