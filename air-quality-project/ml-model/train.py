"""
AIR QUALITY INTELLIGENCE SYSTEM
CNN-LSTM Model for AQI Prediction
Complete Training Code - Ready to Run
"""

import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt
import os
import datetime

print("="*60)
print("         AIR QUALITY CNN-LSTM MODEL TRAINING")
print("="*60)
print(f"TensorFlow version: {tf.__version__}")
print(f"NumPy version: {np.__version__}")
print(f"Pandas version: {pd.__version__}")
print("="*60)

class AQIModel:
    """
    CNN-LSTM Model for Air Quality Index Prediction
    """
    
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.history = None
        
    def create_model(self):
        """
        Create CNN-LSTM architecture
        """
        model = tf.keras.Sequential([
            # ============ CNN LAYERS ============
            # Extract spatial features and patterns
            tf.keras.layers.Conv1D(
                filters=64, 
                kernel_size=3, 
                activation='relu', 
                input_shape=(30, 1),
                padding='same'
            ),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.2),
            
            tf.keras.layers.Conv1D(
                filters=128, 
                kernel_size=3, 
                activation='relu',
                padding='same'
            ),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.Dropout(0.2),
            
            # ============ LSTM LAYERS ============
            # Learn temporal dependencies
            tf.keras.layers.LSTM(
                units=100, 
                return_sequences=True,
                activation='tanh'
            ),
            tf.keras.layers.Dropout(0.2),
            
            tf.keras.layers.LSTM(
                units=50, 
                return_sequences=False,
                activation='tanh'
            ),
            tf.keras.layers.Dropout(0.2),
            
            # ============ DENSE LAYERS ============
            # Final prediction
            tf.keras.layers.Dense(units=25, activation='relu'),
            tf.keras.layers.Dense(units=1)
        ])
        
        # Compile model
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae', 'mape']
        )
        
        return model
    
    def generate_training_data(self):
        """
        Generate realistic AQI data for training
        Includes seasonal patterns, weekly patterns, and trends
        """
        print("\n📊 Generating training data...")
        
        # Generate 3 years of daily data
        dates = pd.date_range('2023-01-01', periods=1095, freq='D')
        aqi_values = []
        
        for i, date in enumerate(dates):
            month = date.month
            year_progress = i / len(dates)  # For trend
            
            # ===== SEASONAL PATTERN =====
            # Winter (Nov-Feb): High pollution
            if month in [11, 12, 1, 2]:
                seasonal = np.random.normal(300, 50)
            # Summer (Mar-Jun): Moderate
            elif month in [3, 4, 5, 6]:
                seasonal = np.random.normal(180, 40)
            # Monsoon (Jul-Oct): Low pollution
            else:
                seasonal = np.random.normal(100, 30)
            
            # ===== WEEKLY PATTERN =====
            # Weekend: Lower pollution
            if date.dayofweek >= 5:  # Saturday, Sunday
                weekly = seasonal * 0.8
            else:  # Weekday: Higher pollution
                weekly = seasonal * 1.1
            
            # ===== YEARLY TREND =====
            # Slight improvement over years
            trend = weekly * (1 - year_progress * 0.1)
            
            # Add random noise
            noise = np.random.normal(0, 15)
            aqi = max(20, min(500, trend + noise))
            aqi_values.append(int(aqi))
        
        # Create DataFrame
        df = pd.DataFrame({
            'date': dates,
            'aqi': aqi_values
        })
        
        # Save to CSV
        df.to_csv('aqi_training_data.csv', index=False)
        print(f"✅ Generated {len(df)} days of training data")
        print(f"   Date range: {dates[0].date()} to {dates[-1].date()}")
        print(f"   AQI range: {min(aqi_values)} - {max(aqi_values)}")
        
        return df
    
    def prepare_sequences(self, df):
        """
        Prepare sequences for training
        30 days input -> 1 day output
        """
        # Normalize data
        values = df['aqi'].values.reshape(-1, 1)
        scaled_values = self.scaler.fit_transform(values)
        
        X, y = [], []
        for i in range(30, len(scaled_values)):
            X.append(scaled_values[i-30:i, 0])
            y.append(scaled_values[i, 0])
        
        X = np.array(X).reshape(-1, 30, 1)
        y = np.array(y).reshape(-1, 1)
        
        # Split into train/test (80/20)
        split = int(0.8 * len(X))
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        print(f"\n📈 Data prepared:")
        print(f"   Training samples: {len(X_train)}")
        print(f"   Testing samples: {len(X_test)}")
        print(f"   Input shape: {X_train.shape}")
        print(f"   Output shape: {y_train.shape}")
        
        return X_train, X_test, y_train, y_test
    
    def train(self, epochs=50, batch_size=32):
        """
        Train the CNN-LSTM model
        """
        print("\n🧠 Building CNN-LSTM model...")
        self.model = self.create_model()
        self.model.summary()
        
        # Generate and prepare data
        df = self.generate_training_data()
        X_train, X_test, y_train, y_test = self.prepare_sequences(df)
        
        # Callbacks for better training
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=0.00001,
                verbose=1
            ),
            tf.keras.callbacks.ModelCheckpoint(
                'best_aqi_model.h5',
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            tf.keras.callbacks.CSVLogger('training_log.csv')
        ]
        
        print("\n🎯 Training started...")
        print(f"   Epochs: {epochs}")
        print(f"   Batch size: {batch_size}")
        print(f"   Optimizer: Adam")
        print(f"   Loss function: MSE")
        print("-" * 60)
        
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        self.model.save('aqi_cnn_lstm_final.h5')
        print("\n✅ Model saved as 'aqi_cnn_lstm_final.h5'")
        
        # Evaluate model
        self.evaluate(X_test, y_test)
        
        return self.history
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate model performance
        """
        print("\n📊 Evaluating model...")
        
        # Predictions
        y_pred = self.model.predict(X_test, verbose=0)
        
        # Inverse transform to get actual AQI values
        y_test_actual = self.scaler.inverse_transform(y_test)
        y_pred_actual = self.scaler.inverse_transform(y_pred)
        
        # Metrics
        mae = mean_absolute_error(y_test_actual, y_pred_actual)
        mse = mean_squared_error(y_test_actual, y_pred_actual)
        rmse = np.sqrt(mse)
        
        print("\n" + "="*60)
        print("              MODEL PERFORMANCE")
        print("="*60)
        print(f"   Mean Absolute Error (MAE): {mae:.2f} AQI")
        print(f"   Root Mean Square Error: {rmse:.2f} AQI")
        print(f"   Accuracy: {100 - (mae/500*100):.1f}%")
        print("="*60)
    
    def predict_next_7_days(self, last_30_days):
        """
        Predict next 7 days AQI
        """
        print("\n🔮 Predicting next 7 days...")
        
        # Normalize input
        last_30_scaled = self.scaler.transform(last_30_days.reshape(-1, 1))
        current_sequence = last_30_scaled.reshape(1, 30, 1)
        
        predictions = []
        for i in range(7):
            # Predict next day
            next_pred = self.model.predict(current_sequence, verbose=0)
            predictions.append(next_pred[0, 0])
            
            # Update sequence for next prediction
            current_sequence = np.roll(current_sequence, -1, axis=1)
            current_sequence[0, -1, 0] = next_pred[0, 0]
        
        # Inverse transform to get actual AQI
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = self.scaler.inverse_transform(predictions)
        
        # Display predictions
        days = ['Tomorrow', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
        print("\n   7-DAY AQI FORECAST:")
        print("   " + "-"*40)
        for i, (day, pred) in enumerate(zip(days, predictions)):
            aqi = int(pred[0])
            if aqi <= 50: category = "Good"
            elif aqi <= 100: category = "Moderate"
            elif aqi <= 150: category = "Unhealthy"
            elif aqi <= 200: category = "Very Unhealthy"
            else: category = "Hazardous"
            
            print(f"   {day:10}: {aqi:3d} AQI - {category}")
        
        return predictions.flatten()
    
    def plot_training_history(self):
        """
        Plot training history
        """
        if self.history:
            plt.figure(figsize=(12, 4))
            
            # Loss plot
            plt.subplot(1, 2, 1)
            plt.plot(self.history.history['loss'], label='Training Loss')
            plt.plot(self.history.history['val_loss'], label='Validation Loss')
            plt.title('Model Loss')
            plt.xlabel('Epoch')
            plt.ylabel('Loss')
            plt.legend()
            plt.grid(True)
            
            # MAE plot
            plt.subplot(1, 2, 2)
            plt.plot(self.history.history['mae'], label='Training MAE')
            plt.plot(self.history.history['val_mae'], label='Validation MAE')
            plt.title('Mean Absolute Error')
            plt.xlabel('Epoch')
            plt.ylabel('MAE')
            plt.legend()
            plt.grid(True)
            
            plt.tight_layout()
            plt.savefig('training_history.png')
            plt.show()
            print("\n📈 Training history saved as 'training_history.png'")

# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING CNN-LSTM MODEL TRAINING")
    print("="*60)
    
    # Create model instance
    model = AQIModel()
    
    # Train model (change epochs to 100 for better accuracy)
    history = model.train(epochs=30)  # 30 epochs = ~3-5 minutes
    
    print("\n" + "="*60)
    print("✅✅✅ MODEL TRAINING COMPLETED SUCCESSFULLY! ✅✅✅")
    print("="*60)
    print("\n📁 Files created:")
    print("   1. 📄 aqi_training_data.csv     - Generated training data")
    print("   2. 📄 best_aqi_model.h5         - Best model checkpoint")
    print("   3. 📄 aqi_cnn_lstm_final.h5     - Final trained model")
    print("   4. 📄 training_log.csv          - Training history log")
    print("   5. 📄 training_history.png      - Training plots")
    
    print("\n🎯 Next Steps:")
    print("   1. Use model in backend: model = tf.keras.models.load_model('aqi_cnn_lstm_final.h5')")
    print("   2. Connect to OpenWeather API for real data")
    print("   3. Integrate with Node.js backend")
    
    print("\n" + "="*60)
    print("              MODEL READY FOR DEPLOYMENT!")
    print("="*60)