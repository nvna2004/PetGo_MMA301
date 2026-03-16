const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');


dotenv.config();


const app = express();


connectDB();


app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userRoutes = require('./routes/userRoutes');
const petRoutes = require('./routes/petRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shopRoutes = require('./routes/shopRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/users', userRoutes); 
app.use('/api/pets', petRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.send('PetGo API is running...');
});


const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
