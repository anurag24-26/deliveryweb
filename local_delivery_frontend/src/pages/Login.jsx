export default function Login() {
  const loginAsUser = () => {
    window.location.href =
      "http://localhost:5000/api/auth/google?role=USER";
  };

  const loginAsRestaurant = () => {
    window.location.href =
      "http://localhost:5000/api/auth/google?role=RESTAURANT";
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Image */}
        <img
          src="/Delivery.png"
          alt="Barhalganj Food Delivery"
          style={styles.image}
        />

        {/* App Name */}
        <h1 style={styles.title}>Barhalganj Food Delivery</h1>
        <p style={styles.subtitle}>
          Fast • Local • Reliable
        </p>

        {/* Buttons */}
        <button onClick={loginAsUser} style={styles.primaryBtn}>
          Continue as User
        </button>

        <button onClick={loginAsRestaurant} style={styles.secondaryBtn}>
          Continue as Restaurant
        </button>

        {/* Footer */}
        <p style={styles.footerText}>
          Sign in securely with Google
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont"
  },

  card: {
    background: "#fff",
    padding: "32px",
    width: "100%",
    maxWidth: "360px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
  },

  image: {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    borderRadius: "60px",
    marginBottom: "16px"
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#222"
  },

  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "24px"
  },

  primaryBtn: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#000",
    color: "#fff",
    marginBottom: "12px"
  },

  secondaryBtn: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    borderRadius: "10px",
    border: "1px solid #ddd",
    cursor: "pointer",
    backgroundColor: "#fff",
    color: "#000"
  },

  footerText: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#888"
  }
};
