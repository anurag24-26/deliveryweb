const router = require('express').Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
};

// Middleware to check if user is a restaurant owner
const isRestaurantOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'RESTAURANT') {
    return res.status(403).json({ error: 'Access denied. Restaurant owners only.' });
  }
  next();
};

// Place a new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { restaurantId, items, subtotal, taxes, deliveryFee, total, deliveryAddress } = req.body;

    // Validate required fields
    if (!restaurantId || !items || items.length === 0 || !total) {
      return res.status(400).json({ error: 'Missing required order information' });
    }

    // Create order
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

    // Populate restaurant details
    const populatedOrder = await Order.findById(order._id).populate('restaurant');

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

// Get all orders for the current user
router.get('/my-orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get a specific order by ID
router.get('/:orderId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ensure user can only view their own orders
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get all orders for a restaurant (restaurant owner only)
router.get('/restaurant/:restaurantId', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    // Verify the restaurant belongs to this user
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only view orders for your own restaurant' });
    }
    
    const orders = await Order.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address phone')
      .sort({ orderDate: -1 });

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant orders' });
  }
});

// Update order status (restaurant owner only)
router.patch('/:orderId/status', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify the restaurant belongs to this user
    if (order.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update orders for your own restaurant' });
    }

    // Prevent status updates for already completed/cancelled orders
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot update status of completed or cancelled orders' });
    }

    order.status = status;
    order.statusUpdatedAt = new Date();
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address phone')
      .populate('user', 'name email phone');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order by restaurant (restaurant owner only)
router.patch('/:orderId/restaurant-cancel', isAuthenticated, isRestaurantOwner, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.orderId).populate('restaurant');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify the restaurant belongs to this user
    if (order.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only cancel orders for your own restaurant' });
    }

    // Only allow cancellation if order is PLACED or CONFIRMED
    if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Can only cancel orders that are PLACED or CONFIRMED' 
      });
    }

    order.status = 'CANCELLED';
    order.statusUpdatedAt = new Date();
    order.cancellationReason = reason || 'Cancelled by restaurant';
    order.cancelledBy = 'RESTAURANT';
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name address phone')
      .populate('user', 'name email phone');

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Cancel order (user only, within time limit)
router.patch('/:orderId/cancel', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fixed: Changed from req.session.userId to req.user._id
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'CANCELLED';
    order.statusUpdatedAt = new Date();
    order.cancelledBy = 'USER';
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate('restaurant');

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

module.exports = router;