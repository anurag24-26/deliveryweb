import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Restaurants from "./pages/Restaurants";
import Orders from "./pages/Orders";
import ProtectedRoute from "./components/ProtectedRoute";
import RestaurantMenu from "./pages/RestaurantMenu";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManager from "./pages/MenuManager";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Navbar from "./components/Navbar";
import RestaurantManagement from "./pages/RestaurantManagement.jsx"
import RestProfile from "./pages/RestProfile.jsx"
export default function App() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
         <Route path="/addmenu" element={<MenuManager />} />
        <Route path="/" element={<Login />} />
        <Route path="/restaurant-profile" element={<RestProfile />} />
<Route path="/restaurants/:id/menu" element={<RestaurantMenu />} />
<Route path="/manage" element={<RestaurantManagement />} />
<Route path="/profile" element={<Profile/>} />
 <Route path="/cart/:restaurantId" element={<Cart />} />
        <Route
          path="/restaurants"
          element={
            <ProtectedRoute>
              <Restaurants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
        
              <Orders />
            
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
