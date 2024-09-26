from flask import Flask, request, jsonify
from transformers import AutoTokenizer

app = Flask(__name__)


granite_tokenizer = AutoTokenizer.from_pretrained("instructlab/granite-7b-lab")
merlinite_tokenizer = AutoTokenizer.from_pretrained("instructlab/merlinite-7b-lab")

def count_tokens(tokenizer, text):
    tokens = tokenizer.tokenize(text)
    return len(tokens)

# Endpoint for the 'granite-7b-lab' model
@app.route('/granite-7b-lab', methods=['POST'])
def granite_token_count():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "Text is required"}), 400
    
    text = data['text']
    num_tokens = count_tokens(granite_tokenizer, text)
    return jsonify({"model": "instructlab/granite-7b-lab", "tokens": num_tokens})

# Endpoint for the 'merlinite' model
@app.route('/merlinite-7b-lab', methods=['POST'])
def merlinite_token_count():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "Text is required"}), 400
    
    text = data['text']
    num_tokens = count_tokens(merlinite_tokenizer, text)
    return jsonify({"model": "instructlab/merlinite-7b-lab", "tokens": num_tokens})

if __name__ == '__main__':
    app.run(debug=True)
