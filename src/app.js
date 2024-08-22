const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); 
const { Server } = require('socket.io');
const http = require('http');
const exphbs = require('express-handlebars');
const path = require('path');
const Product = require('./models/Product');
const Cart = require('./models/Cart'); 

// Rutas
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/cart.router.js');

// Inicializar la aplicación
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conectar a MongoDB
mongoose.connect('mongodb+srv://Estudiante:Nuñez@cluster0.ybe8o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Configuración de Handlebars
app.engine('handlebars', exphbs.engine({
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Middleware para crear un carrito si no existe
app.use(async (req, res, next) => {
    if (!req.session.cartId) {
        const newCart = new Cart();
        try {
            await newCart.save();
            req.session.cartId = newCart._id; 
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.get('/', (req, res) => {
    res.redirect('/products');
});

// Vistas
app.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const products = await Product.find().skip(skip).limit(limit).exec();
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        const cartId = req.session.cartId;

        res.render('index', {
            products,
            cartId, 
            currentPage: page,
            totalPages,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevLink: page > 1 ? `/products?page=${page - 1}&limit=${limit}` : null,
            nextLink: page < totalPages ? `/products?page=${page + 1}&limit=${limit}` : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/products/:pid', async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid);
        if (!product) {
            return res.status(404).send('Producto no encontrado');
        }

        const cartId = req.session.cartId;  

        res.render('product', {
            product,
            cartId  
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/carts/:cid', async (req, res) => {
    const cart = {}; 
    res.render('cart', { cart });
});

// WebSockets
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('productAdded', (product) => {
        io.emit('productListUpdated', product);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Iniciar el servidor
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
