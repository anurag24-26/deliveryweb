import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RestaurantOrderManagement.css';

const RestaurantOrderManagement = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ACTIVE');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuthAndFetchData();
    
    const interval = setInterval(() => {
      if (restaurant) {
        fetchOrders(restaurant._id, true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [restaurant]);

  // Helper function to safely parse JSON
  const safeJsonParse = async (response) => {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      
      if (text.includes('<!doctype') || text.includes('<!DOCTYPE')) {
        throw new Error('REDIRECT_TO_LOGIN');
      }
      
      throw new Error('Server returned non-JSON response');
    }
    
    return response.json();
  };

  const checkAuthAndFetchData = async () => {
    try {
      console.log('Fetching restaurant data...');
      
      const restaurantResponse = await fetch('/api/restaurants/my', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', restaurantResponse.status);

      // Handle authentication errors
      if (restaurantResponse.status === 401) {
        setError('Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (restaurantResponse.status === 403) {
        setError('Access denied. This page is for restaurant owners only.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (restaurantResponse.status === 404) {
        setError('No restaurant found. Please create a restaurant first.');
        setTimeout(() => navigate('/restaurant/dashboard'), 3000);
        return;
      }

      // Parse JSON safely
      let restaurantData;
      try {
        restaurantData = await safeJsonParse(restaurantResponse);
      } catch (parseError) {
        if (parseError.message === 'REDIRECT_TO_LOGIN') {
          setError('Session expired. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        throw parseError;
      }

      console.log('Restaurant data loaded:', restaurantData);
      setRestaurant(restaurantData);

      // Fetch orders
      await fetchOrders(restaurantData._id);

    } catch (err) {
      console.error('Error in checkAuthAndFetchData:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (restaurantId, silent = false) => {
    try {
      console.log('Fetching orders for restaurant:', restaurantId);
      
      const response = await fetch(`/api/orders/restaurant/${restaurantId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        if (!silent) {
          setError('Session expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      if (response.status === 403) {
        if (!silent) {
          setError('Access denied');
        }
        return;
      }

      let data;
      try {
        data = await safeJsonParse(response);
      } catch (parseError) {
        if (parseError.message === 'REDIRECT_TO_LOGIN' && !silent) {
          setError('Session expired. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      console.log('Orders loaded:', data.orders?.length || 0);
      setOrders(data.orders || []);
      
      if (!silent) {
        setError('');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (!silent) {
        setError('Failed to load orders');
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.status === 401) {
        showNotification('error', 'Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || 'Failed to update order status');
      }

      const data = await safeJsonParse(response);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? data.order : order
        )
      );

      showNotification('success', `✓ Order status updated to ${newStatus.replace('_', ' ')}`);

    } catch (err) {
      console.error('Error updating order:', err);
      showNotification('error', err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      showNotification('error', 'Please provide a cancellation reason');
      return;
    }

    setUpdatingOrderId(selectedOrder._id);
    try {
      const response = await fetch(`/api/orders/${selectedOrder._id}/restaurant-cancel`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: cancelReason })
      });

      if (response.status === 401) {
        showNotification('error', 'Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      const data = await safeJsonParse(response);
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === selectedOrder._id ? data.order : order
        )
      );

      showNotification('success', '✓ Order cancelled successfully');
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');

    } catch (err) {
      console.error('Error cancelling order:', err);
      showNotification('error', err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const showNotification = (type, message) => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        ${type === 'success' ? '✓' : '⚠'} ${message}
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignore errors if sound doesn't play
  };

   const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED'
    };
    return statusFlow[currentStatus];
  };

  const getStatusColor = (status) => {
    const colors = {
      'PLACED': '#FF9800',
      'CONFIRMED': '#2196F3',
      'PREPARING': '#9C27B0',
      'OUT_FOR_DELIVERY': '#00BCD4',
      'DELIVERED': '#4CAF50',
      'CANCELLED': '#F44336'
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PLACED': '🔔',
      'CONFIRMED': '✅',
      'PREPARING': '👨‍🍳',
      'OUT_FOR_DELIVERY': '🚚',
      'DELIVERED': '📦',
      'CANCELLED': '❌'
    };
    return icons[status] || '📋';
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    if (filter === 'ACTIVE') {
      filtered = filtered.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
    } else if (filter !== 'ALL') {
      filtered = filtered.filter(o => o.status === filter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search) ||
        order.user?.email?.toLowerCase().includes(search) ||
        order.items.some(item => item.name.toLowerCase().includes(search))
      );
    }

    return filtered;
  };

  const getStatistics = () => {
    return {
      total: orders.length,
      placed: orders.filter(o => o.status === 'PLACED').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      preparing: orders.filter(o => o.status === 'PREPARING').length,
      outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      active: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
      todayRevenue: orders
        .filter(o => {
          const today = new Date().toDateString();
          const orderDate = new Date(o.orderDate).toDateString();
          return today === orderDate && o.status === 'DELIVERED';
        })
        .reduce((sum, o) => sum + o.total, 0)
    };
  };

  const stats = getStatistics();
  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="order-management-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading order management...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="order-management-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-management-container">
      {/* Header */}
      <div className="management-header">
        <div className="header-left">
          <h1>🏪 Order Management</h1>
          {restaurant && (
            <div className="restaurant-details">
              <h2>{restaurant.name}</h2>
              <p>{restaurant.address}</p>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="refresh-button"
            onClick={() => fetchOrders(restaurant._id)}
            title="Refresh orders"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-icon">🔔</div>
          <div className="stat-info">
            <div className="stat-value">{stats.placed}</div>
            <div className="stat-label">New Orders</div>
          </div>
          {stats.placed > 0 && <div className="stat-pulse"></div>}
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.delivered}</div>
            <div className="stat-label">Completed Today</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">₹{stats.todayRevenue.toFixed(0)}</div>
            <div className="stat-label">Today's Revenue</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order ID, customer name, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-tabs">
          {['ACTIVE', 'ALL', 'PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.replace('_', ' ')}
              <span className="tab-count">
                {status === 'ALL' ? stats.total : 
                 status === 'ACTIVE' ? stats.active :
                 stats[status.toLowerCase()]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-section">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No orders found</h3>
            <p>
              {searchTerm ? 'Try adjusting your search criteria' : 
               filter !== 'ALL' ? `No ${filter.toLowerCase().replace('_', ' ')} orders at the moment` :
               'Orders will appear here once customers start placing them'}
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div 
                key={order._id} 
                className={`order-card ${order.status === 'PLACED' ? 'new-order-pulse' : ''}`}
              >
                {/* Order Header */}
                <div className="order-card-header">
                  <div className="order-id-group">
                    <span className="order-status-icon">
                      {getStatusIcon(order.status)}
                    </span>
                    <div>
                      <div className="order-number">
                        #{order._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="order-timestamp">
                        {new Date(order.orderDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Customer Information */}
                <div className="order-customer-info">
                  <div className="info-item">
                    <span className="info-icon">👤</span>
                    <span className="info-text">
                      {order.user?.name || order.user?.email || 'Guest Customer'}
                    </span>
                  </div>
                  {order.user?.phone && (
                    <div className="info-item">
                      <span className="info-icon">📞</span>
                      <a href={`tel:${order.user.phone}`} className="info-link">
                        {order.user.phone}
                      </a>
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <div className="info-item full-width">
                      <span className="info-icon">📍</span>
                      <span className="info-text">{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="order-items-section">
                  <div className="section-title">Items Ordered</div>
                  <div className="items-container">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="item-left">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="item-thumbnail"
                            />
                          )}
                          <div className="item-details">
                            <div className="item-name">{item.name}</div>
                            <div className="item-quantity">
                              Qty: {item.quantity} × ₹{item.price}
                            </div>
                          </div>
                        </div>
                        <div className="item-total">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.taxes > 0 && (
                    <div className="summary-row">
                      <span>Taxes:</span>
                      <span>₹{order.taxes.toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="summary-row">
                      <span>Delivery:</span>
                      <span>₹{order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span>Total:</span>
                    <span>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <div className="order-actions">
                    {getNextStatus(order.status) && (
                      <button
                        className="action-button primary"
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                        disabled={updatingOrderId === order._id}
                      >
                        {updatingOrderId === order._id ? (
                          <>
                            <span className="button-spinner"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            ✓ {getNextStatus(order.status).replace('_', ' ')}
                          </>
                        )}
                      </button>
                    )}
                    
                    {(['PLACED', 'CONFIRMED'].includes(order.status)) && (
                      <button
                        className="action-button danger"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowCancelModal(true);
                        }}
                        disabled={updatingOrderId === order._id}
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                )}

                {/* Status Badge for Completed/Cancelled */}
                {order.status === 'DELIVERED' && (
                  <div className="final-status completed">
                    ✓ Order Completed Successfully
                  </div>
                )}
                
                {order.status === 'CANCELLED' && (
                  <div className="final-status cancelled">
                    ✕ Order Cancelled
                    {order.cancellationReason && (
                      <div className="cancellation-reason">
                        Reason: {order.cancellationReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Order</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel order #{selectedOrder?._id.slice(-8).toUpperCase()}?</p>
              <p className="modal-warning">This action cannot be undone.</p>
              
              <div className="form-group">
                <label htmlFor="cancel-reason">Cancellation Reason *</label>
                <textarea
                  id="cancel-reason"
                  rows="4"
                  placeholder="Please provide a reason for cancelling this order..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                  setCancelReason('');
                }}
              >
                Go Back
              </button>
              <button 
                className="modal-button danger"
                onClick={handleCancelOrder}
                disabled={!cancelReason.trim() || updatingOrderId === selectedOrder?._id}
              >
                {updatingOrderId === selectedOrder?._id ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrderManagement;