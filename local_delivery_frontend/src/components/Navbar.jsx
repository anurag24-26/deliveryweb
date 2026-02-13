import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import { 
  Search, 
  ShoppingBag, 
  LayoutDashboard, 
  PlusCircle, 
  User, 
  LogOut,
  ShoppingCart,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navbar if user isn't logged in
  if (!user) return null;

  const logout = async () => {
    try {
      await API.post("/auth/logout");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const isActive = (path) => location.pathname === path;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.inner}>
          {/* Brand Section */}
          <div 
            style={styles.brandContainer} 
            onClick={() => {
              navigate("/");
              closeMobileMenu();
            }}
          >
            <div style={styles.logoWrapper}>
              <img 
                src="/Delivery.png" 
                alt="Barhalganj Food Delivery" 
                style={styles.logo} 
              />
            </div>
            <div style={styles.brandText}>
              <span style={styles.brandName}>Barhalganj</span>
              <span style={styles.brandTagline}>Food Delivery</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div style={styles.desktopLinks}>
            {user.role === "USER" && (
              <>
                <NavLink 
                  to="/restaurants" 
                  active={isActive("/restaurants")}
                  icon={<Search size={18} />}
                  label="Explore"
                />
                <NavLink 
                  to="/orders" 
                  active={isActive("/orders")}
                  icon={<ShoppingBag size={18} />}
                  label="Orders"
                />
                {/* <NavLink 
                  to="/cart/:restaurantId" 
                  active={isActive("/cart")}
                  icon={<ShoppingCart size={18} />}
                  label="Cart"
                  badge={3} // You can make this dynamic
                /> */}
              </>
            )}

            {user.role === "RESTAURANT" && (
              <>
                <NavLink 
                  to="/restaurant/dashboard" 
                  active={isActive("/restaurant/dashboard")}
                  icon={<LayoutDashboard size={18} />}
                  label="Dashboard"
                />
                <NavLink 
                  to="/addmenu" 
                  active={isActive("/addmenu")}
                  icon={<PlusCircle size={18} />}
                  label="Add Menu"
                />
              </>
            )}

            <NavLink 
              to={user.role === "RESTAURANT" ? "/restaurant-profile" : "/profile"} 
              active={isActive("/profile") || isActive("/restaurant-profile")}
              icon={<User size={18} />}
              label="Profile"
            />

            <button onClick={logout} style={styles.logoutBtn}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            style={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div style={styles.overlay} onClick={closeMobileMenu} />
          <div style={styles.mobileMenu}>
            {user.role === "USER" && (
              <>
                <MobileNavLink 
                  to="/restaurants" 
                  active={isActive("/restaurants")}
                  icon={<Search size={20} />}
                  label="Explore Restaurants"
                  onClick={closeMobileMenu}
                />
                <MobileNavLink 
                  to="/orders" 
                  active={isActive("/orders")}
                  icon={<ShoppingBag size={20} />}
                  label="My Orders"
                  onClick={closeMobileMenu}
                />
                {/* <MobileNavLink 
                  to="/cart" 
                  active={isActive("/cart")}
                  icon={<ShoppingCart size={20} />}
                  label="Cart"
                  badge={3}
                  onClick={closeMobileMenu}
                /> */}
              </>
            )}

            {user.role === "RESTAURANT" && (
              <>
                <MobileNavLink 
                  to="/restaurant/dashboard" 
                  active={isActive("/restaurant/dashboard")}
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  onClick={closeMobileMenu}
                />
                <MobileNavLink 
                  to="/addmenu" 
                  active={isActive("/addmenu")}
                  icon={<PlusCircle size={20} />}
                  label="Add Menu Items"
                  onClick={closeMobileMenu}
                />
              </>
            )}

            <MobileNavLink 
              to={user.role === "RESTAURANT" ? "/restaurant-profile" : "/profile"} 
              active={isActive("/profile") || isActive("/restaurant-profile")}
              icon={<User size={20} />}
              label="My Profile"
              onClick={closeMobileMenu}
            />

            <div style={styles.mobileDivider} />

            <button 
              onClick={() => {
                logout();
                closeMobileMenu();
              }} 
              style={styles.mobileLogoutBtn}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

// Desktop Nav Link Component
function NavLink({ to, icon, label, active, badge }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.link,
        ...(active ? styles.activeLink : {}),
      }}
    >
      <span style={styles.iconWrapper}>
        {icon}
        {badge && <span style={styles.badge}>{badge}</span>}
      </span>
      <span>{label}</span>
    </Link>
  );
}

// Mobile Nav Link Component
function MobileNavLink({ to, icon, label, active, badge, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        ...styles.mobileLink,
        ...(active ? styles.mobileActiveLink : {}),
      }}
    >
      <span style={styles.mobileIconWrapper}>
        {icon}
        {badge && <span style={styles.mobileBadge}>{badge}</span>}
      </span>
      <span style={styles.mobileLinkText}>{label}</span>
    </Link>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #e9ecef",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  inner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "transform 0.2s ease",
    zIndex: 1001,
  },
  logoWrapper: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(230, 57, 70, 0.15)",
    border: "2px solid #ffe0e3",
    flexShrink: 0,
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    color: "#e63946",
    lineHeight: "1",
  },
  brandTagline: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.3px",
    color: "#868e96",
    textTransform: "uppercase",
    lineHeight: "1",
  },
  desktopLinks: {
    display: "none",
    alignItems: "center",
    gap: "6px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#495057",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    position: "relative",
  },
  activeLink: {
    backgroundColor: "#fff0f1",
    color: "#e63946",
  },
  iconWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    backgroundColor: "#e63946",
    color: "white",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 5px",
    borderRadius: "10px",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #fff1f2 0%, #ffe0e3 100%)",
    border: "1px solid #ffccd0",
    padding: "10px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#e63946",
    cursor: "pointer",
    marginLeft: "6px",
    transition: "all 0.2s ease",
  },
  mobileMenuBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    color: "#495057",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    animation: "fadeIn 0.2s ease",
  },
  mobileMenu: {
    position: "fixed",
    top: "75px",
    right: "20px",
    width: "calc(100% - 40px)",
    maxWidth: "320px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    zIndex: 1000,
    padding: "12px",
    animation: "slideDown 0.3s ease",
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#495057",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    marginBottom: "4px",
  },
  mobileActiveLink: {
    backgroundColor: "#fff0f1",
    color: "#e63946",
  },
  mobileIconWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#f8f9fa",
  },
  mobileBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#e63946",
    color: "white",
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 5px",
    borderRadius: "10px",
    minWidth: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white",
  },
  mobileLinkText: {
    flex: 1,
  },
  mobileDivider: {
    height: "1px",
    backgroundColor: "#e9ecef",
    margin: "8px 0",
  },
  mobileLogoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #fff1f2 0%, #ffe0e3 100%)",
    border: "1px solid #ffccd0",
    fontSize: "15px",
    fontWeight: "600",
    color: "#e63946",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

// Add CSS for hover effects and responsive behavior
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Desktop hover effects */
  nav a:hover {
    background-color: #f8f9fa !important;
    color: #e63946 !important;
    transform: translateY(-1px);
  }

  nav a[style*="fff0f1"]:hover {
    background-color: #fff0f1 !important;
  }

  nav button:hover {
    background: linear-gradient(135deg, #ffe0e3 0%, #ffccd0 100%) !important;
    border-color: #ffb3b9 !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(230, 57, 70, 0.2) !important;
  }

  nav button:active {
    transform: translateY(0);
  }

  /* Mobile menu button hover */
  nav > div > button:hover {
    background-color: #f8f9fa !important;
  }

  /* Mobile link hover effects */
  div[style*="mobileMenu"] a:hover {
    background-color: #f8f9fa !important;
  }

  div[style*="mobileMenu"] a[style*="fff0f1"]:hover {
    background-color: #ffe8ea !important;
  }

  div[style*="mobileMenu"] button:hover {
    background: linear-gradient(135deg, #ffe0e3 0%, #ffccd0 100%) !important;
    transform: translateY(-1px);
  }

  /* Brand hover */
  div[style*="brandContainer"]:hover {
    transform: scale(1.02);
  }

  /* Desktop view */
  @media (min-width: 768px) {
    div[style*="desktopLinks"] {
      display: flex !important;
    }

    button[style*="mobileMenuBtn"],
    div[style*="overlay"],
    div[style*="mobileMenu"] {
      display: none !important;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 767px) {
    div[style*="desktopLinks"] {
      display: none !important;
    }

    button[style*="mobileMenuBtn"] {
      display: flex !important;
    }
  }

  /* Small mobile screens */
  @media (max-width: 480px) {
    nav > div {
      padding: 10px 16px !important;
    }

    div[style*="brandName"] {
      font-size: 18px !important;
    }

    div[style*="brandTagline"] {
      font-size: 10px !important;
    }

    div[style*="logoWrapper"] {
      width: 45px !important;
      height: 45px !important;
    }

    div[style*="mobileMenu"] {
      right: 16px !important;
      width: calc(100% - 32px) !important;
    }
  }

  /* Extra small screens */
  @media (max-width: 360px) {
    div[style*="brandText"] {
      display: none !important;
    }
  }
`;
document.head.appendChild(styleSheet);