const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://ERPCHA>:ERPCHA@basededatos1.hwq53bl.mongodb.net/?retryWrites=true&w=majority&appName=Basededatos1';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection established');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
