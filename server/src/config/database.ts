import mongoose from 'mongoose';
import config from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Use the config mongoUri which handles both MONGO_URI and fallback
    const mongoURI = config.mongoUri;
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoURI.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB'}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('⚠️ Server will continue without database functionality');
    console.log('💡 To fix this: Install MongoDB locally or set MONGO_URI environment variable');
    
    // Don't exit the process - allow server to run without database for development
    return;
  }
};