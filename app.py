from flask import Flask, jsonify, render_template, request

import cipher_logic

app = Flask(__name__)

# --- ROUTES ---


@app.route("/")
def home():
    # Serves the frontend HTML (which we will build next)
    return render_template("index2.html")


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


# --- RSA ROUTES ---


@app.route("/api/generate-keys", methods=["POST"])
def generate_keys():
    private_key, public_key = cipher_logic.generate_keypair()
    return jsonify({"private": private_key, "public": public_key})


@app.route("/api/rsa-encrypt", methods=["POST"])
def rsa_encrypt():
    data = request.json
    message = data.get("message")
    public_key = data.get("public_key")

    if not message or not public_key:
        return jsonify({"error": "Message and Public Key required"}), 400

    result = cipher_logic.encrypt_with_public_key(message, public_key)
    return jsonify({"result": result})


@app.route("/api/rsa-decrypt", methods=["POST"])
def rsa_decrypt():
    data = request.json
    ciphertext = data.get("ciphertext")
    private_key = data.get("private_key")

    if not ciphertext or not private_key:
        return jsonify({"error": "Ciphertext and Private Key required"}), 400

    result = cipher_logic.decrypt_with_private_key(ciphertext, private_key)
    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(debug=True)
