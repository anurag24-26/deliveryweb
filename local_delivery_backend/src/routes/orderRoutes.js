// routes/orders.js  ← REPLACE your existing file with this

const router = require('express').Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const {
  notifyUserOrderPlaced,
  notifyRestaurantNewOrder,
  notifyUserStatusUpdate
} = require('../utils/whatsapp'); // ← adjust path if needed

// ─── Auth middleware ──────────────────────────────────────────────────────────

const isAuthenticated = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  next();
};

const isRestaurantOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'RESTAURANT')
    return res.status(403).json({ error: 'Access denied. Restaurant owners only.' });
  next();
};

// ─── Place a new order ────────────────────────────────────────────────────────

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { restaurantId, items, subtotal, taxes, deliveryFee, total, deliveryAddress } = req.body;

    if (!restaurantId || !items || items.length === 0 || !total) {
      return res.status(400).json({ error: 'Missing required order information' });
    }

    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurantId,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: subtotal || 0,
      taxes: taxes || 0,
      deliveryFee: deliveryFee || 0,
      total,
      deliveryAddress: deliveryAddress || null,
      status: 'PLACED',
      orderDate: new Date()
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant')
      .populate('user', 'name phone');

    // ── WhatsApp Notifications (non-blocking) ─────────────────────────────────
    // try {
    //   const restaurant = populatedOrder.restaurant;
    //   const user = populatedOrder.user;

    //   const orderDetails = {
    //     orderId: order._id,
    //     restaurantName: restaurant.name,
    //     userName: user.name,
    //     total,
    //     items,
    //     deliveryAddress
    //   };

    //   // Notify user their order was placed
    //   if (user.phone) {
    //     notifyUserOrderPlaced(user.phone, orderDetails);
    //   }

    //   // Notify restaurant of new order
    //   if (restaurant.phone) {
    //     notifyRestaurantNewOrder(restaurant.phone, orderDetails);
    //   }
    // } catch (notifErr) {
    //   console.error('Notification error (non-fatal):', notifErr.message);
    // }
    // ─────────────────────────────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// ─── Get all orders for current user ─────────────────────────────────────────

router.get('/my-orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant')
      .sort({ orderDate: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── Get a specific order ─────────────────────────────────────────────────────

router.get('/:orderId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Access denied' });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ─── Get all orders for a restaurant ─────────────────────────────────────────

router.get('/restaurant/:restaurantId', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (restaurant.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'You can only view orders for your own restaurant' });

    const orders = await Order.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address phone')
      .sort({ orderDate: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant orders' });
  }
});

// ─── Update order status (restaurant owner) ───────────────────────────────────

router.patch('/:orderId/status', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.restaurant.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'You can only update orders for your own restaurant' });

    if (['DELIVERED', 'CANCELLED'].includes(order.status))
      return res.status(400).json({ error: 'Cannot update status of completed or cancelled orders' });

    order.status = status;
    order.statusUpdatedAt = new Date();
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address phone')
      .populate('user', 'name email phone');

    // ── Notify user of status change ─────────────────────────────────────────
    try {
      if (updatedOrder.user?.phone) {
        notifyUserStatusUpdate(
          updatedOrder.user.phone,
          status,
          updatedOrder.restaurant.name,
          updatedOrder._id
        );
      }
    } catch (notifErr) {
      console.error('Status notification error (non-fatal):', notifErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.json({ success: true, message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─── Cancel order by restaurant ───────────────────────────────────────────────

router.patch('/:orderId/restaurant-cancel', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.restaurant.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'You can only cancel orders for your own restaurant' });

    if (!['PLACED', 'CONFIRMED'].includes(order.status))
      return res.status(400).json({ error: 'Can only cancel orders that are PLACED or CONFIRMED' });

    order.status = 'CANCELLED';
    order.statusUpdatedAt = new Date();
    order.cancellationReason = reason || 'Cancelled by restaurant';
    order.cancelledBy = 'RESTAURANT';
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address phone')
      .populate('user', 'name email phone');

    // Notify user
    try {
      if (updatedOrder.user?.phone) {
        notifyUserStatusUpdate(
          updatedOrder.user.phone,
          'CANCELLED',
          updatedOrder.restaurant.name,
          updatedOrder._id
        );
      }
    } catch (notifErr) {
      console.error('Cancel notification error (non-fatal):', notifErr.message);
    }

    res.json({ success: true, message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ─── Cancel order by user ─────────────────────────────────────────────────────

router.patch('/:orderId/cancel', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Access denied' });

    if (!['PLACED', 'CONFIRMED'].includes(order.status))
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });

    order.status = 'CANCELLED';
    order.statusUpdatedAt = new Date();
    order.cancelledBy = 'USER';
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate('restaurant');

    res.json({ success: true, message: 'Order cancelled successfully', order: updatedOrder });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;