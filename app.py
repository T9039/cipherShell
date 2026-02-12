from flask import Flask, jsonify, render_template, request

import cipher_logic

app = Flask(__name__)

# --- ROUTES ---


@app.route("/")
def home():
    # Serves the frontend HTML (which we will build next)
    return render_template("index.html")


@app.route("/api/generate-password", methods=["POST"])
def generate_password():
    data = request.json
    mode = data.get("mode", "random")  # 'random' or 'memorable'

    if mode == "memorable":
        pwd = cipher_logic.generate_memorable_password()
    else:
        # Default to random, length 16
        pwd = cipher_logic.generate_random_password(length=20)

    return jsonify({"password": pwd})


@app.route("/api/encrypt", methods=["POST"])
def encrypt():
    data = request.json
    message = data.get("message")
    passphrase = data.get("passphrase")

    if not message or not passphrase:
        return jsonify({"error": "Message and Passphrase required"}), 400

    secure_string = cipher_logic.encrypt_message(message, passphrase)
    return jsonify({"result": secure_string})


@app.route("/api/decrypt", methods=["POST"])
def decrypt():
    data = request.json
    ciphertext = data.get("ciphertext")
    passphrase = data.get("passphrase")

    if not ciphertext or not passphrase:
        return jsonify({"error": "Ciphertext and Passphrase required"}), 400

    try:
        plaintext = cipher_logic.decrypt_message(ciphertext, passphrase)
        return jsonify({"result": plaintext})
    except:
        return jsonify({"result": "Error: Could not decrypt"}), 400


if __name__ == "__main__":
    app.run(debug=True)
