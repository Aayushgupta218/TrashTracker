from flask import Flask, request, jsonify
from google.cloud import dialogflow_v2 as dialogflow
import os
from google.api_core.exceptions import InvalidArgument
from pymongo import MongoClient
from bson import ObjectId
import logging

app = Flask(__name__)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "C:/Users/gagan/OneDrive/Desktop/chatbot-ywf9-b703d9a3ae41.json"
DIALOGFLOW_PROJECT_ID = "chatbot-ywf9"
DIALOGFLOW_LANGUAGE_CODE = 'en'
SESSION_ID = 'me'

connection_string = "mongodb://localhost:27017/Cleanliness"
client = MongoClient(connection_string)
db = client['Cleanliness']
collection = db['garbagereports']

logging.basicConfig(level=logging.DEBUG)

def get_request_status(parameters: dict):
    _id = parameters.get("Requestid")
    logging.debug(f"Received Requestid: {_id}")

    if not _id:
        return {"fulfillmentText": "Please provide a valid request ID."}

    try:
        _id = ObjectId(_id)
    except Exception as e:
        logging.error(f"Invalid ObjectId: {e}")
        return {"fulfillmentText": "The provided request ID is not valid. Please check and try again."}

    logging.debug(f"Converted Requestid to ObjectId: {_id}")
    request_data = collection.find_one({"_id": _id})
    logging.debug(f"Request Data: {request_data}")

    if request_data:
        status = request_data.get("status", "Unknown")
        location = request_data.get("location", "Not specified")
        date = request_data.get("date", "Not specified")

        fulfillment_text = f"Request ID: {str(_id)}\nStatus: {status}\nLocation: {location}\nDate: {date}"
    else:
        fulfillment_text = f"No request found with ID: {str(_id)}. Please check the ID and try again."

    return {"fulfillmentText": fulfillment_text}

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.get_json(silent=True)
    logging.debug(f"Received Data: {data}")

    intent = data['queryResult']['intent']['displayName']
    parameters = data['queryResult']['parameters']

    logging.debug(f"Intent: {intent}")
    logging.debug(f"Parameters: {parameters}")

    if intent == "Request_id":
        response_text = get_request_status(parameters)
    elif intent == "environment_measures":
        response_text = {"fulfillmentText": "Here are some of our environmental measures: 1. Recycling program, 2. Energy-efficient lighting, 3. Water conservation initiatives. Would you like more details?"}
    elif intent == "positive_response_final":
        response_text = {"fulfillmentText": "Great! I'd be happy to provide more information. What specific aspect of our environmental measures would you like to know more about?"}
    elif intent == "negative_response_final":
        response_text = {"fulfillmentText": "Thank you for your time. Have a great day!"}
    else:
        response_text = {"fulfillmentText": "I'm not sure how to help with that. Can you rephrase or choose from the options I provided?"}
    
    logging.debug(f"Response Text: {response_text}")
    return jsonify(response_text)

@app.route('/send_message', methods=['POST'])
def send_message():
    message = request.json['message']
    logging.debug(f"Message Received: {message}")

    session_client = dialogflow.SessionsClient()
    session = session_client.session_path(DIALOGFLOW_PROJECT_ID, SESSION_ID)

    text_input = dialogflow.TextInput(text=message, language_code=DIALOGFLOW_LANGUAGE_CODE)
    query_input = dialogflow.QueryInput(text=text_input)

    try:
        response = session_client.detect_intent(session=session, query_input=query_input)
        fulfillment_text = response.query_result.fulfillment_text
        logging.debug(f"Fulfillment Text: {fulfillment_text}")
    except InvalidArgument as e:
        logging.error(f"InvalidArgument: {e}")
        return jsonify({"error": "Invalid argument provided"})
    
    return jsonify({"response": fulfillment_text})

@app.route('/')
def home():
    return "Welcome to the Chatbot API.."

if __name__ == "__main__":
    app.run(debug=True)
