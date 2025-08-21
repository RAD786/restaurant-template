const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newAdmin = new Admin({ email: 'admin@example.com', password: hashedPassword });
    await newAdmin.save();
    console.log('Admin created!');
    mongoose.disconnect();
  })
  .catch(err => console.log(err));
