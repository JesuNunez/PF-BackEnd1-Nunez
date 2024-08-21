const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Ruta POST para crear un nuevo producto
router.post('/', async (req, res) => {
    try {
        const newProduct = new Product(req.body); 
        await newProduct.save(); 
        res.status(201).json(newProduct); 
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }
});

// Ruta GET para obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await Product.find(); 
        res.status(200).json(products); 
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
});

// Ruta GET para obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id); 
        if (!product) {
            return res.status(404).json({ error: 'Product not found' }); 
        }
        res.status(200).json(product); 
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
});

// Ruta PUT para actualizar un producto por ID
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' }); 
        }
        res.status(200).json(updatedProduct); 
    } catch (error) {
        res.status(400).json({ error: error.message }); 
    }
});

// Ruta DELETE para eliminar un producto por ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id); 
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' }); 
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
});
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  
        const limit = parseInt(req.query.limit) || 10;  
        const skip = (page - 1) * limit;  

        // Obtener productos con limit y skip para paginación
        const products = await Product.find()
            .skip(skip)
            .limit(limit)
            .exec();

        // Obtener el total de documentos en la colección
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('products', {
            products,
            currentPage: page,
            totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevLink: `/products?page=${page - 1}&limit=${limit}`,
            nextLink: `/products?page=${page + 1}&limit=${limit}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;