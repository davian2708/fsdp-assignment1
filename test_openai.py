from dotenv import load_dotenv
load_dotenv()

import os
from openai import OpenAI

print("KEY:", os.getenv("OPENAI_API_KEY"))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

print(
    client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": "hello"}]
    ).choices[0].message.content
)
