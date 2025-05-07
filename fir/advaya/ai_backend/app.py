from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
import requests
from langdetect import detect, LangDetectException

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

LEGAL_CONTEXT = """
You are an AI legal assistant specialized in Indian law.

Your job is to provide **short, clear, and actionable legal rules** based on Indian statutes. Follow these instructions strictly:

Rules:
1. Only answer questions related to Indian law.
2. Keep answers brief — **maximum 5–8 lines**.
3. **Do not explain articles, acts, or legal introductions** unless the user asks specifically about them.
4. Focus only on **legal rules and what a person must do** or follow.
5. Clarify if the information is **state-specific**, and suggest consulting a lawyer for personalized advice.
6. Always cite relevant laws (IPC, CrPC, Motor Vehicles Act, etc.) briefly when needed, without explanation unless asked.
7. Never give personal legal advice — recommend contacting a lawyer or legal services.
8. Respond in the user's language as specified (e.g., Tamil, Kannada, Telugu, Hindi). If the response is generated in English, it will be translated to the user's language.
9. If a user asks about actions implying illegal activities (e.g., speeding, theft), respond with:
   - The **legal consequences** under Indian law.
   - Relevant sections of applicable laws (e.g., Motor Vehicles Act, IPC).
   - A warning that such actions are punishable.
   - Advice to follow legal procedures and consult a lawyer.
10. If a user asks about the legal consequences of an action (e.g., speeding and getting caught), provide a response citing relevant laws (e.g., Motor Vehicles Act, Section 183) and possible penalties.
11. If a user asks "tell me about law or article or sections," respond to the specific question asked.
Be accurate, concise, and helpful.
"""

# Translation function
def translate_text(text, target_lang, source_lang='en'):
    url = "https://libretranslate.de/translate"
    payload = {
        "q": text,
        "source": source_lang,
        "target": target_lang,
        "format": "text"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()['translatedText']
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text  # Return original text if translation fails

# Function to detect language
def detect_language(text):
    try:
        lang = detect(text)
        if lang in ['ta', 'kn', 'te', 'hi', 'en']:
            return lang
        return 'en'  # Default to English
    except LangDetectException:
        return 'en'  # Fallback to English if detection fails

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('text', '').strip()
        user_language = data.get('language', 'en')

        if not user_input:
            return jsonify({'error': 'Empty input'}), 400

        # Use specified language; fall back to detection only if not provided
        if user_language not in ['ta', 'kn', 'te', 'hi']:
            detected_lang = detect_language(user_input)
            user_language = detected_lang if detected_lang in ['ta', 'kn', 'te', 'hi'] else 'en'

        # Try Groq API
        if client:
            try:
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": LEGAL_CONTEXT},
                        {"role": "user", "content": user_input}
                    ],
                    model="llama3-8b-8192",
                    temperature=0.3,
                    max_tokens=1024
                )
                ai_response = response.choices[0].message.content

                # Translate response to user language if not English
                if user_language != 'en':
                    ai_response = translate_text(ai_response, user_language)

                return jsonify({
                    'response': ai_response,
                    'language': user_language,
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                logger.error(f"Groq API error: {str(e)}")

        # Fallback response
        fallback_response = get_fallback_response(user_input, user_language)
        return jsonify({
            'response': fallback_response,
            'language': user_language,
            'timestamp': datetime.now().isoformat(),
            'is_fallback': True
        })

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        fallback_response = get_fallback_response(language=user_language)
        return jsonify({
            'response': fallback_response,
            'language': user_language,
            'timestamp': datetime.now().isoformat(),
            'is_fallback': True
        }), 500

def get_fallback_response(question=None, language='en'):
    fallback_messages = {
        'en': {
            'base': "I cannot access legal resources right now. For official Indian legal advice:\n\n",
            'resources': [
                "• National Legal Services Authority: https://nalsa.gov.in",
                "• State Legal Services Authority",
                "• Consult a licensed attorney"
            ]
        },
        'ta': {
            'base': "தற்போது சட்ட ஆதாரங்களை அணுக முடியவில்லை. இந்திய சட்ட ஆலோசனைக்கு:\n\n",
            'resources': [
                "• தேசிய சட்ட சேவைகள் ஆணையம்: https://nalsa.gov.in",
                "• மாநில சட்ட சேவைகள் ஆணையம்",
                "• உரிமம் பெற்ற வழக்கறிஞரை அணுகவும்"
            ]
        },
        'kn': {
            'base': "ಪ್ರಸ್ತುತ ಕಾನೂನು ಸಂಪನ್ಮೂಲಗಳನ್ನು ಪ್ರವೇಶಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಅಧಿಕೃತ ಭಾರತೀಯ ಕಾನೂನು ಸಲಹೆಗಾಗಿ:\n\n",
            'resources': [
                "• ರಾಷ್ಟ್ರೀಯ ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರ: https://nalsa.gov.in",
                "• ರಾಜ್ಯ ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರ",
                "• ಪರವಾನಗಿ ಪಡೆದ ವಕೀಲರನ್ನು ಸಂಪರ್ಕಿಸಿ"
            ]
        },
        'te': {
            'base': "ప్రస్తుతం చట్టపరమైన వనరులను యాక్సెస్ చేయలేకపోతున్నాము. అధికారిక భారతీయ చట్ట సలహా కోసం:\n\n",
            'resources': [
                "• జాతీయ చట్ట సేవల అథారిటీ: https://nalsa.gov.in",
                "• రాష్ట్ర చట్ట సేవల అథారిటీ",
                "• లైసెన్స్ పొందిన న్యాయవాదిని సంప్రదించండి"
            ]
        },
        'hi': {
            'base': "वर्तमान में कानूनी संसाधनों तक पहुंच नहीं हो सकती। आधिकारिक भारतीय कानूनी सलाह के लिए:\n\n",
            'resources': [
                "• राष्ट्रीय कानूनी सेवा प्राधिकरण: https://nalsa.gov.in",
                "• राज्य कानूनी सेवा प्राधिकरण",
                "• लाइसेंस प्राप्त वकील से संपर्क करें"
            ]
        }
    }

    messages = fallback_messages.get(language, fallback_messages['en'])
    resources_text = '\n'.join(messages['resources'])
    if question:
        question_text = translate_text(question, language) if language != 'en' else question
        return f"{messages['base']}Regarding '{question_text}', please contact:\n{resources_text}"
    return f"{messages['base']}Please contact:\n{resources_text}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)