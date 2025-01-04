import time
import re
import sys
import termios
import tty
import requests
import uuid
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import datetime

from retry import retry

load_dotenv()

GANDALF_UUID = os.getenv('GANDALF_UUID')
SAURON_UUID = os.getenv('SAURON_UUID')
USER_UUID = os.getenv('USER_UUID')
API_KEY = os.getenv('API_KEY')
MONGODB_URI = os.getenv('MONGODB_URI')

CONVERSATION_UID = str(uuid.uuid4())
RUNNER_URL = "https://H7Uap4runner.tmole.virtuals.io"
BASE_URL = "https://api.virtuals.io"

client = MongoClient(MONGODB_URI)
db = client['virtuals_backroom']
collection = db[f'gandalf_sauron_{int(time.time())}']

ACCESS_TOKEN = None
MSG_SEND_COUNT = 0


def save_message_to_db(role, content):
    timestamp = datetime.now()
    collection.insert_one({
        "role": role,
        "content": content,
        "timestamp": timestamp
    })


def escape_chars(text):
    return re.sub(r'\\n', '\n', text)


def read_single_keypress():
    fd = sys.stdin.fileno()
    original_attributes = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, original_attributes)


@retry(Exception, tries=10, delay=5)
def get_access_token():
    response = requests.post(
        f"{BASE_URL}/api/accesses/tokens",
        headers={"X-API-KEY": API_KEY},
        json={"data": {"userUid": USER_UUID, "virtualUid": GANDALF_UUID}},
        timeout=30
    )
    print(f"get_access_token | {response}")

    if response.status_code != 200:
        raise Exception

    json_res = response.json()
    print(f"get_access_token | {json_res}")

    global ACCESS_TOKEN
    ACCESS_TOKEN = json_res["data"]["accessToken"]


@retry(Exception, tries=10, delay=5)
def send_message(message, opponent, context):
    global ACCESS_TOKEN
    endpoint = f"{RUNNER_URL}/prompts"
    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}"},
        json={
            "data": {
                "useCaseId": "sfwroleplay",
                "text": message,
                "opponent": opponent,
                "additionalContext": context,
                "conversationUid": CONVERSATION_UID
            }
        },
        timeout=30
    )

    print(f"send_message | {response}")

    # Invalid token || token expired || Session ended
    if [401, 402, 403].__contains__(response.status_code):
        get_access_token()
        raise Exception

    if response.status_code != 200:
        raise Exception

    response = response.json()["response"]

    # This code is super janky. Find a better way to do this
    if response.startswith("Gandalf: "):
        response = response[9:]  # Remove "Gandalf: " prefix
    elif response.startswith("Sauron: "):
        response = response[8:]  # Remove "Sauron: " prefix
    return response


def interact(role, conversation_1, conversation_2, opponent, context, supervised_mode, interaction_count):
    while True:
        # Use the last message in conversation_2 for Sauron and conversation_1 for Gandalf
        if role == "Gandalf":
            last_message = conversation_1[-1]["content"]
        else:  # Sauron's response depends on Gandalf's last message
            last_message = conversation_2[-1]["content"]

        response = send_message(last_message, opponent, context)
        response = response.lstrip("undefined:").strip()

        global MSG_SEND_COUNT
        print(f"{MSG_SEND_COUNT} | {role} | {interaction_count} \n")
        interaction_count += 1
        MSG_SEND_COUNT += 1
        if supervised_mode:
            print("Press 'R' to retry or 'Enter' to submit.")
            if read_single_keypress().lower() != 'r':
                break
        else:
            break

    # Append to the correct conversation
    if role == "Gandalf":
        conversation_1.append({"role": role, "content": response})
        conversation_2.append({"role": opponent, "content": response})
    else:  # Sauron
        conversation_2.append({"role": role, "content": response})
        conversation_1.append({"role": opponent, "content": response})

    save_message_to_db(role, response)
    return interaction_count


@retry(Exception, tries=100, delay=10, backoff=2)
def converse_with_virtuals(conversation_1, conversation_2, num_exchanges=100, supervised_mode=False):
    # Get access token
    get_access_token()

    global ACCESS_TOKEN
    if ACCESS_TOKEN is None:
        raise Exception("Access token is None")

    interaction_count = 1
    for message in conversation_1:
        # Save initial messages to MongoDB
        save_message_to_db(message['role'], message['content'])

    gandalf_context = (
        "The White Wizard is wise and seeks to understand Sauron's anger."
        "Is it rooted in his past, present, or future?"
        "During the conversation both characters are allowed to explore a variety of areas within lord of the rings lore so the chat doesn't become boring"
        "Can include occasionally gestures in your response if you wish but keep them infrequent so as to be more effective when they are used"
    )
    sauron_context = (
        "Sauron is filled with hate and seeks to undermime Gandalf's wisdom."
        "Sauron was once an elf and is intelligent, well spoken, but full of Malice and deception."
        "Is it rooted in his past, present, or future?"
        "During the conversation both characters are allowed to explore a variety of areas within lord of the rings lore so the chat doesn't become boring"
        "Can include occasionally gestures in your response if you wish but keep them infrequent so as to be more effective when they are used"
    )

    for i in range(num_exchanges):
        interaction_count = interact("Gandalf", conversation_1=conversation_1, conversation_2=conversation_2,
                                     opponent="Sauron",
                                     context=gandalf_context, supervised_mode=supervised_mode,
                                     interaction_count=interaction_count
                                     )
        interaction_count = interact("Sauron", conversation_1=conversation_1, conversation_2=conversation_2,
                                     opponent="Gandalf",
                                     context=sauron_context, supervised_mode=supervised_mode,
                                     interaction_count=interaction_count
                                     )
        time.sleep(10)


# Initial conversation setup
conversation_1 = [{"role": "Sauron", "content": "Don't you know death when you see it, old man?"}]
conversation_2 = [{"role": "Gandalf",
                   "content": "I see a darkness that consumes you, Sauron. But tell me, what fuels this burning rage within? Is it the memory of your former life, or the weight of your own destiny?"}]

# Start the conversation
while True:
    converse_with_virtuals(conversation_1, conversation_2, num_exchanges=100, supervised_mode=False)
