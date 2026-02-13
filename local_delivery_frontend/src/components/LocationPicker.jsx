import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

// Reverse geocoding using OpenStreetMap (Nominatim)
const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await res.json();
  return data.display_name || "";
};

function LocationMarker({ position, setPosition, setAddress }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });

      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    }
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function LocationPicker({ onSelect, initialLocation }) {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState("");

  // Get user's current location
  useEffect(() => {
    if (!initialLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // fallback to India
          setPosition({ lat: 20.5937, lng: 78.9629 });
        }
      );
    }
  }, [initialLocation]);

  const confirmLocation = () => {
    if (!position) return;

    onSelect({
      lat: position.lat,
      lng: position.lng,
      address
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.mapBox}>
        {position && (
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={position}
              setPosition={setPosition}
              setAddress={setAddress}
            />
          </MapContainer>
        )}
      </div>

      <div style={styles.info}>
        <p style={styles.address}>
          {address || "Tap on map to select location"}
        </p>

        <button style={styles.button} onClick={confirmLocation}>
          Use this location
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  mapBox: {
    height: "280px",
    width: "100%"
  },
  info: {
    padding: "16px"
  },
  address: {
    fontSize: "14px",
    color: "#2d3748",
    marginBottom: "12px"
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer"
  }
};
