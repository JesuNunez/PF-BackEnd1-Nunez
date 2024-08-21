const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart'); 
const Product = require('../models/Product');

// Ruta POST para agregar un producto al carrito 
router.post('/add', async (req, res) => {
    try {
        const { cartId, productId } = req.body;

        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const productIndex = cart.products.findIndex(p => p.product.toString() === productId);

        if (productIndex !== -1) {
            cart.products[productIndex].quantity += 1;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;