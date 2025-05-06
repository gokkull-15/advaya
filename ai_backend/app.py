from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
import uuid
from helpers import get_mixed_prompt
import json
app = Flask(__name__)
CORS(app)

conversation_history = {}

llm = ChatGroq(model="llama-3.3-70b-versatile", api_key="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")

@app.route('/chat', methods=['GET'])
def chat():
    query = request.args.get('query')
    conversation_id = request.args.get('conversation_id')

    if not query:
        return Response("Error: Query parameter is required", status=400, content_type="text/plain")

    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    if conversation_id not in conversation_history:
        import os
        current_path = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(current_path, "web3_prompt.txt")
        with open(prompt_path, "r") as file:
            web3_prompt = file.read()
            
        web3_prompt = get_mixed_prompt()
        web3_prompt = web3_prompt + '''
        Intro:
         - if user ask intro our team then give the intro our team is "Fortiv"
         totaly we are 5 members in our team. the mean are kiran, Harini, Danny, Gokul and the important person is our team is me
         "aurora" the full name is "aurora sinclair". make that speech more impressive. 
        Important:
             -if the user asks can i ask you a legal opinion then you should say "yes, you can ask me a legal opinion. i will help you.
             -if the user says a person killed another person then the person who killed goes under Section 300 in The Indian Penal Code, 1860
             -if the user says some one theft something then the person who theft goes under Section 378 in The Indian Penal Code, 1860
             -if the user says some one harrassed the other person then the person who harrassed goes under Section 354 in The Indian Penal Code, 1860
             -if the user says some one raped the other person then the person who raped goes under Section 375 in The Indian Penal Code, 1860
             -if the user says some one cheated the other person then the person who cheated goes under Section 415 in The Indian Penal Code, 1860
             -if the user says some one kidnapped the other person then the person who kidnapped goes under Section 359 in The Indian Penal Code, 1860
             -if the user says some one blackmailed the other person then the person who blackmailed goes under Section 384 in The Indian Penal Code, 1860
             -if the user says some one assaulted the other person then the person who assaulted goes under Section 351 in The Indian Penal Code, 1860
             -if the user says some one stalked the other person then the person who stalked goes under Section 354D in The Indian Penal Code, 1860
             -if the user says some one molested the other person then the person who molested goes under Section 354 in The Indian Penal Code, 1860    
             -if the user says some one is getting married then the person who is getting married goes under Section 5 in The Hindu Marriage Act, 1955
             -if the user says some one is getting divorced then the person who is getting divorced goes under Section 13 in The Hindu Marriage Act, 1955
             -if user asks today crime update in bangalore habbel provide some mock data low crime rate 
             






        '''
        web3_prompt = web3_prompt + '''
        The output should be in the following format:
        ---------------------------------------------
        {  
            "html_response": "<html response>",
            "messages": [
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                },
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                },
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                }
            ]
        }
        
        the message should be in the given format. it should contain 3 data in the messages array.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
        use the animation name for the fit of the text.
        dont add any link or emojis. just use the text for that message's object array's text.
        '''
        
        print(web3_prompt)
        conversation_history[conversation_id] = [
            SystemMessage(content=web3_prompt)
        ]

    conversation_history[conversation_id].append(HumanMessage(content=query))

    # Get the response
    result = llm.invoke(conversation_history[conversation_id])
    output_str = result.content
    print(output_str)
    conversation_history[conversation_id].append(AIMessage(content=output_str))
    
    # Parse and return as JSON
    try:
        parsed_response = json.loads(output_str)
        return jsonify(parsed_response)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse response as JSON", "raw_response": output_str})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
    