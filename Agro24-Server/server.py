from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from flask_cors import CORS
from sklearn.metrics import accuracy_score
import logging
import time
from datetime import datetime

from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the datasets
try:
    logger.info("Loading datasets...")
    cropdf = pd.read_csv("./models/Crop_recommendation.csv")
    data = pd.read_csv('./models/ICRISAT.csv')
    price_data = pd.read_csv('./models/ICRISAT_PRIZE.csv')

    # Load disease detection model
    processor = AutoImageProcessor.from_pretrained("linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification")
    disease_model = AutoModelForImageClassification.from_pretrained("linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification")
    logger.info("All models loaded successfully")

    logger.info("Datasets loaded successfully")
except Exception as e:
    logger.error(f"Error loading datasets: {str(e)}")
    raise

# Prepare the data for crop recommendation
try:
    logger.info("Preparing crop recommendation data...")
    X = cropdf.drop('label', axis=1)
    y = cropdf['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, shuffle=True, random_state=0)
    logger.info("Data preparation completed")
except Exception as e:
    logger.error(f"Error preparing data: {str(e)}")
    raise

# Train the LightGBM model
try:
    logger.info("Training LightGBM model...")
    model = lgb.LGBMClassifier(verbose=-1)
    model.fit(X_train, y_train)
    logger.info("Model training completed")
except Exception as e:
    logger.error(f"Error training model: {str(e)}")
    raise

def predict_top_crops(model, sample_input, top_n=5):
    try:
        probas = model.predict_proba(sample_input)
        top_crops_list = []
        for probas_row in probas:
            top_indices = np.argsort(probas_row)[-top_n:][::-1]
            top_crops = [model.classes_[i] for i in top_indices]
            top_probas = probas_row[top_indices]
            top_crops_list.append(list(zip(top_crops, top_probas)))
        return top_crops_list
    except Exception as e:
        logger.error(f"Error in predict_top_crops: {str(e)}")
        raise


@app.route('/detect_disease', methods=['POST'])
def detect_disease():
    start_time = time.time()
    request_id = datetime.now().strftime('%Y%m%d%H%M%S')
    logger.info(f"Request {request_id}: Disease detection endpoint called")

    try:
        if 'image' not in request.files:
            logger.error(f"Request {request_id}: No image file provided")
            return jsonify({"error": "No image file provided"}), 400

        image_file = request.files['image']
        logger.info(f"Received image: {image_file.filename}, Size: {len(image_file.read())} bytes")
        image_file.seek(0)  # Reset the file pointer after reading

        # Validate file type
        if not image_file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            logger.error(f"Request {request_id}: Invalid file type")
            return jsonify({"error": "Invalid file type. Please upload PNG or JPEG images"}), 400

        # Read and process the image
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')

        # Process image through the model
        inputs = processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            outputs = disease_model(**inputs)
            logits = outputs.logits
            predicted_class_idx = logits.argmax(-1).item()

        # Get the predicted label and confidence
        predicted_label = disease_model.config.id2label[predicted_class_idx]
        confidence = torch.nn.functional.softmax(logits, dim=-1)[0][predicted_class_idx].item()

        response = {
            "disease": predicted_label,
            "confidence": float(confidence),
            "processing_time": f"{time.time() - start_time:.2f} seconds"
        }

        logger.info(f"Request {request_id}: Disease detection completed successfully")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Request {request_id}: Error processing image - {str(e)}")
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500


@app.route('/crop_recommendation', methods=['GET'])
def crop_recommendation():
    start_time = time.time()
    request_id = datetime.now().strftime('%Y%m%d%H%M%S')
    logger.info(f"Request {request_id}: Crop recommendation endpoint called")
    
    try:
        # Log input parameters
        params = {
            'n': request.args.get('n'),
            'p': request.args.get('p'),
            'k': request.args.get('k'),
            'temperature': request.args.get('temperature'),
            'humidity': request.args.get('humidity'),
            'ph': request.args.get('ph'),
            'rainfall': request.args.get('rainfall')
        }
        logger.info(f"Request {request_id}: Input parameters - {params}")

        # Convert parameters to float
        n = float(params['n'])
        p = float(params['p'])
        k = float(params['k'])
        temperature = float(params['temperature'])
        humidity = float(params['humidity'])
        ph = float(params['ph'])
        rainfall = float(params['rainfall'])

        sample_input = np.array([[n, p, k, temperature, humidity, ph, rainfall]])
        top_crops_list = predict_top_crops(model, sample_input, top_n=5)

        response = []
        for top_crops in top_crops_list:
            for crop, probability in top_crops:
                response.append({"crop": crop, "probability": float(probability)})

        execution_time = time.time() - start_time
        logger.info(f"Request {request_id}: Completed successfully in {execution_time:.2f} seconds")
        print(response)
        return jsonify(response)

    except Exception as e:
        logger.error(f"Request {request_id}: Error processing request - {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/market_insights', methods=['GET'])
def market_insights():
    start_time = time.time()
    request_id = datetime.now().strftime('%Y%m%d%H%M%S')
    logger.info(f"Request {request_id}: Market insights endpoint called")

    try:
        state = request.args.get('state')
        city = request.args.get('city')
        crop_type = request.args.get('crop_type')

        logger.info(f"Request {request_id}: Parameters - state: {state}, city: {city}, crop_type: {crop_type}")

        if not state or not city or not crop_type:
            logger.error(f"Request {request_id}: Missing required parameters")
            return jsonify({"error": "Missing required parameters"}), 400

        states = get_states()
        if state not in states:
            logger.error(f"Request {request_id}: State not found - {state}")
            return jsonify({"error": "State not found"}), 404

        districts = filter_districts(state)
        if city not in districts:
            logger.error(f"Request {request_id}: District not found - {city}")
            return jsonify({"error": "District not found"}), 404

        crops = filter_crops(state, city)
        if crop_type not in crops:
            logger.error(f"Request {request_id}: Crop type not available - {crop_type}")
            return jsonify({"error": "Crop type not available"}), 404

        data_points = get_data_points(state, city, crop_type)
        if isinstance(data_points, str):
            logger.error(f"Request {request_id}: Error getting data points - {data_points}")
            return jsonify({"error": data_points}), 404

        response = [{"year": year, "value": value} for year, value in data_points]
        
        execution_time = time.time() - start_time
        logger.info(f"Request {request_id}: Completed successfully in {execution_time:.2f} seconds")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Request {request_id}: Error processing request - {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/market_prize', methods=['GET'])
def market_prize():
    start_time = time.time()
    request_id = datetime.now().strftime('%Y%m%d%H%M%S')
    logger.info(f"Request {request_id}: Market prize endpoint called")

    try:
        state = request.args.get('state')
        city = request.args.get('city')
        crop_type = request.args.get('crop_type')

        logger.info(f"Request {request_id}: Parameters - state: {state}, city: {city}, crop_type: {crop_type}")

        if not state or not city or not crop_type:
            logger.error(f"Request {request_id}: Missing required parameters")
            return jsonify({"error": "Missing required parameters"}), 400

        result = get_crop_data(state, city, crop_type)
        if isinstance(result, list):
            response = [{"year": year, "price": price} for year, price in result]
            execution_time = time.time() - start_time
            logger.info(f"Request {request_id}: Completed successfully in {execution_time:.2f} seconds")
            return jsonify(response)
        else:
            logger.error(f"Request {request_id}: Error getting crop data - {result}")
            return jsonify({"error": result}), 404

    except Exception as e:
        logger.error(f"Request {request_id}: Error processing request - {str(e)}")
        return jsonify({"error": str(e)}), 500

# Helper functions remain the same but with added logging
def get_states():
    return data['State Name'].unique().tolist()

def filter_districts(selected_state):
    return data[data['State Name'] == selected_state]['Dist Name'].unique().tolist()

def filter_crops(selected_state, selected_district):
    filtered_data = data[(data['State Name'] == selected_state) & (data['Dist Name'] == selected_district)]
    crop_columns = [col for col in data.columns if 'AREA' in col or 'PRODUCTION' in col or 'YIELD' in col]
    available_crops = [col for col in crop_columns if not filtered_data[col].dropna().empty]
    return available_crops

def get_data_points(selected_state, selected_district, selected_crop):
    filtered_data = data[(data['State Name'] == selected_state) & (data['Dist Name'] == selected_district)]
    if 'Year' in filtered_data.columns and selected_crop in filtered_data.columns:
        crop_data = filtered_data[['Year', selected_crop]].dropna().reset_index(drop=True)
        if not crop_data.empty:
            return crop_data.values.tolist()
        else:
            return "No data available for the selected crop."
    else:
        return "Year column or selected crop not found in dataset."

def get_crop_data(selected_state, selected_district, selected_crop):
    filtered_data = price_data[(price_data['State Name'] == selected_state) & (price_data['Dist Name'] == selected_district)]
    if 'Year' in filtered_data.columns:
        if selected_crop in filtered_data.columns:
            crop_data = filtered_data[['Year', selected_crop]].dropna().reset_index(drop=True)
            crop_data = crop_data[crop_data[selected_crop] != -1]
            if crop_data.empty:
                return "No data available for the selected crop in this district."
            return crop_data[['Year', selected_crop]].values.tolist()
        else:
            return "Selected crop not found in dataset."
    else:
        return "Year column not found in dataset."

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    app.run(host="0.0.0.0",debug=True)