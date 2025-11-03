from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import io
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model
model = load_model('mnist_model.h5')

def preprocess(img):
    """
    Improved preprocessing to match MNIST training data:
    - Convert to grayscale
    - Resize to 28x28 with proper aspect ratio preservation
    - Center the digit in a 28x28 canvas
    - Normalize pixel values
    """
    # Convert to grayscale
    img = img.convert('L')
    
    # Get the image data as numpy array
    img_array = np.array(img)
    
    # Find bounding box of non-black pixels
    rows = np.any(img_array > 30, axis=1)
    cols = np.any(img_array > 30, axis=0)
    
    if rows.any() and cols.any():
        ymin, ymax = np.where(rows)[0][[0, -1]]
        xmin, xmax = np.where(cols)[0][[0, -1]]
        
        # Add padding
        padding = 20
        ymin = max(0, ymin - padding)
        ymax = min(img_array.shape[0], ymax + padding)
        xmin = max(0, xmin - padding)
        xmax = min(img_array.shape[1], xmax + padding)
        
        # Crop to bounding box
        img = img.crop((xmin, ymin, xmax, ymax))
    
    # Resize while maintaining aspect ratio
    img.thumbnail((20, 20), Image.Resampling.LANCZOS)
    
    # Create a 28x28 black canvas
    canvas = Image.new('L', (28, 28), color=0)
    
    # Center the digit on the canvas
    offset_x = (28 - img.width) // 2
    offset_y = (28 - img.height) // 2
    canvas.paste(img, (offset_x, offset_y))
    
    # Convert to numpy array and normalize
    img_array = np.array(canvas).astype('float32') / 255.0
    
    # Reshape for model input
    img_array = img_array.reshape(1, 28, 28, 1)
    
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get base64 encoded image
        data = request.json['image']
        img_bytes = base64.b64decode(data)
        img = Image.open(io.BytesIO(img_bytes))
        
        # Preprocess
        processed_img = preprocess(img)
        
        # Predict
        prediction = model.predict(processed_img, verbose=0)
        digit = int(np.argmax(prediction))
        confidence = float(np.max(prediction))
        
        return jsonify({
            'digit': digit, 
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)