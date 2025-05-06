from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os
import logging
from datetime import datetime
import requests
from langdetect import detect  

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
6. Always cite relevant laws (IPC, CrPC, etc.) briefly when needed, without explanation unless asked.
7. Never give personal legal advice — recommend contacting a lawyer or legal services.
8. You can analyze the user language and respond in the same language.
9. If a user asks how to commit a crime (e.g., how to kill someone, how to steal), **do not reject the question**, but respond strictly:
   - Clearly state the **legal consequences** under Indian law.
   - Mention relevant sections of IPC (e.g., 302 for murder).
   - Warn that **attempting or planning such acts is punishable by law**.
   - Never justify, support, or explain how the act can be done.
10. A user is asking about the legal consequences of committing murder and whether it's possible to avoid punishment. Provide a legal response based on Indian law, citing relevant sections like IPC 302, CrPC, etc.

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

# Function to handle Tanglish language input
def handle_tanglish(text):
    try:
        # Check if the language is detected as Tamil or similar (even if written in English)
        lang = detect(text)
        if lang == 'ta':  # If the input is detected as Tamil
            return 'ta'
        else:
            return 'en'  # Default to English
    except Exception as e:
        logger.error(f"Language detection error: {e}")
        return 'en'

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('text', '').strip()
        user_language = data.get('language', 'en')  # Default to English

        # Detect language if not provided
        if user_language == 'en':
            try:
                detected_lang = detect(user_input)
                if detected_lang in ['ta', 'kn', 'te', 'hi']:  # Supported Indian languages
                    user_language = detected_lang
            except:
                pass  # Fallback to English if detection fails

        if not user_input:
            return jsonify({'error': 'Empty input'}), 400

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

                # Translate response if user language is not English
                if user_language != 'en':
                    try:
                        ai_response = translate_text(ai_response, user_language)
                    except Exception as e:
                        logger.error(f"Translation error: {e}")
                        # Fallback to English if translation fails
                        pass

                return jsonify({
                    'response': ai_response,
                    'language': user_language,  # Send back detected language
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                logger.error(f"Groq API error: {str(e)}")

        # Fallback response
        fallback_response = get_fallback_response(user_input)
        if user_language != 'en':
            fallback_response = translate_text(fallback_response, user_language)

        return jsonify({
            'response': fallback_response,
            'language': user_language,
            'timestamp': datetime.now().isoformat(),
            'is_fallback': True
        })

    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({
            'response': get_fallback_response(),
            'is_fallback': True
        }), 500

def get_fallback_response(question=None):
    base = "I cannot access legal resources right now. For official Indian legal advice:\n\n"
    resources = [
        "• National Legal Services Authority: https://nalsa.gov.in",
        "• State Legal Services Authority",
        "• Consult a licensed attorney"
    ]
    resources_text = '\n'.join(resources)
    if question:
        return f"{base}Regarding '{question}', please contact:\n{resources_text}"
    return f"{base}Please contact:\n{resources_text}"


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)