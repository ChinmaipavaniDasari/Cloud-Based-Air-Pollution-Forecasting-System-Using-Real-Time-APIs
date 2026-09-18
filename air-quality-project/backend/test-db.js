// backend/test-db.js
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...');
console.log('Mongoose version:', mongoose.version);

async function testConnection() {
    try {
        // Check if MONGODB_URI exists
        if (!process.env.MONGODB_URI) {
            console.log('❌ MONGODB_URI not found in .env file');
            console.log('Please add your MongoDB connection string to .env');
            return;
        }

        console.log('📡 Connecting to:', process.env.MONGODB_URI.split('@')[1] || 'MongoDB Atlas');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ SUCCESS! Connected to MongoDB Atlas');

        // Get connection info
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🌐 Host:', mongoose.connection.host);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length > 0) {
            console.log('📚 Collections:', collections.map(c => c.name).join(', '));
        } else {
            console.log('📚 No collections yet (database is empty)');
        }

        // Close connection
        await mongoose.disconnect();
        console.log('👋 Connection closed');

    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('Error:', error.message);

        // Helpful error messages
        if (error.message.includes('Authentication failed')) {
            console.log('\n🔧 FIX: Check your username and password in .env file');
            console.log('   Format: mongodb+srv://USERNAME:PASSWORD@cluster...');
        } else if (error.message.includes('getaddrinfo')) {
            console.log('\n🔧 FIX: Check your cluster address in .env file');
            console.log('   Make sure cluster address is correct');
        } else if (error.message.includes('timed out')) {
            console.log('\n🔧 FIX: Check Network Access in MongoDB Atlas');
            console.log('   Add your IP address: 192.140.155.68/32');
        }
    }
}

testConnection();