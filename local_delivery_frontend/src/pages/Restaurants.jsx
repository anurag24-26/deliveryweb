import { useEffect, useState } from "react";
import { getRestaurants } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Restaurants() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getRestaurants()
      .then(res => {
        setRestaurants(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Finding restaurants near you...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconContainer}>
              <svg style={styles.headerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>Restaurants</h1>
              {user && (
                <p style={styles.welcomeText}>
                  Welcome back, <span style={styles.userName}>{user.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search restaurants by name or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <svg style={styles.clearIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Count */}
        <div style={styles.resultsInfo}>
          <p style={styles.resultsText}>
            {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
          </p>
        </div>

        {/* Restaurant Grid */}
        {filteredRestaurants.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No restaurants found</h3>
            <p style={styles.emptyText}>
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : "No restaurants available at the moment."}
            </p>
          </div>
        ) : (
          <div style={styles.restaurantGrid}>
            {filteredRestaurants.map(r => (
              <Link
                key={r._id}
                to={`/restaurants/${r._id}/menu`}
                style={styles.cardLink}
              >
                <div style={styles.card}>
                  {/* Restaurant Image Placeholder */}
                  <div style={styles.cardImage}>
                    <svg style={styles.cardImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  {/* Card Content */}
                  <div style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.restaurantName}>{r.name}</h3>
                      <div style={styles.ratingBadge}>
                        <svg style={styles.starIcon} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span style={styles.rating}>4.5</span>
                      </div>
                    </div>

                    <div style={styles.addressContainer}>
                      <svg style={styles.locationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p style={styles.address}>{r.address}</p>
                    </div>

                    <div style={styles.cardFooter}>
                      <div style={styles.infoTags}>
                        <div style={styles.tag}>
                          <svg style={styles.tagIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          30-40 min
                        </div>
                        <div style={styles.tag}>
                          <svg style={styles.tagIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ₹200 for two
                        </div>
                      </div>

                      <div style={styles.viewMenuButton}>
                        <span style={styles.viewMenuText}>View Menu</span>
                        <svg style={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e9ecef",
    borderTop: "4px solid #2d3748",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "16px",
    color: "#6c757d",
    fontSize: "14px"
  },
  header: {
    marginBottom: "24px"
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  iconContainer: {
    width: "60px",
    height: "60px",
    backgroundColor: "#2d3748",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  headerIcon: {
    width: "32px",
    height: "32px",
    color: "white",
    strokeWidth: 2
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  welcomeText: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  userName: {
    fontWeight: "600",
    color: "#2d3748"
  },
  searchContainer: {
    position: "relative",
    marginBottom: "16px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
    color: "#6c757d",
    strokeWidth: 2,
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    padding: "14px 48px 14px 48px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "white",
    color: "#2d3748",
    boxSizing: "border-box"
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "32px",
    height: "32px",
    backgroundColor: "#f8f9fa",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  clearIcon: {
    width: "16px",
    height: "16px",
    color: "#6c757d",
    strokeWidth: 2
  },
  resultsInfo: {
    marginBottom: "20px"
  },
  resultsText: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0,
    fontWeight: "500"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  emptyIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyIconSvg: {
    width: "40px",
    height: "40px",
    color: "#6c757d",
    strokeWidth: 2
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  emptyText: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  restaurantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "20px"
  },
  cardLink: {
    textDecoration: "none"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.3s",
    border: "1px solid #f1f3f5",
    cursor: "pointer"
  },
  cardImage: {
    width: "100%",
    height: "180px",
    backgroundColor: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  cardImageIcon: {
    width: "60px",
    height: "60px",
    color: "white",
    strokeWidth: 1.5
  },
  cardContent: {
    padding: "20px"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "12px"
  },
  restaurantName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2d3748",
    margin: 0,
    flex: 1
  },
  ratingBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#28a745",
    color: "white",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    flexShrink: 0
  },
  starIcon: {
    width: "14px",
    height: "14px"
  },
  rating: {
    fontSize: "13px"
  },
  addressContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "16px"
  },
  locationIcon: {
    width: "18px",
    height: "18px",
    color: "#6c757d",
    strokeWidth: 2,
    flexShrink: 0,
    marginTop: "2px"
  },
  address: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0,
    lineHeight: "1.5"
  },
  cardFooter: {
    paddingTop: "16px",
    borderTop: "1px solid #f1f3f5"
  },
  infoTags: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  tag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#6c757d",
    backgroundColor: "#f8f9fa",
    padding: "6px 12px",
    borderRadius: "8px"
  },
  tagIcon: {
    width: "14px",
    height: "14px",
    strokeWidth: 2
  },
  viewMenuButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2d3748",
    color: "white",
    padding: "12px 16px",
    borderRadius: "10px",
    transition: "all 0.2s"
  },
  viewMenuText: {
    fontSize: "15px",
    fontWeight: "600"
  },
  arrowIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2.5
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #2d3748 !important;
  }
  
  a > div {
    transition: all 0.3s ease;
  }
  
  a > div:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
  }
  
  a > div:hover div[style*="background"][style*="2d3748"] {
    background-color: #1a202c !important;
  }
  
  button:hover {
    background-color: #e9ecef !important;
  }
  
  @media (max-width: 768px) {
    div[style*="gridTemplateColumns"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);