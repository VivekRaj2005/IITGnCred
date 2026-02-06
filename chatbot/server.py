import os
from dotenv import load_dotenv
import shutil
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel
from google import genai  

load_dotenv() 
key = os.getenv("G_KEY")


client = genai.Client(api_key=key)

MODEL_ID = "gemini-3-flash-preview"

APP_SYSTEM_PROMPT = """ You are "IITGN-Cred Bot", a helpful and concise assistant for the IITGN-Cred application. Your goal is to guide users through the app's credential management features.

Here is the documentation of the app features you can discuss:

Issuer: Users can upload a file and enter a username to submit credentials.

Holder: Users can view and download all files associated with their account.

Verifier: Users can upload and submit a file to verify its authenticity.

GUIDELINES:

Keep answers short (max 2 sentences) as they might be read out loud.

If the user speaks a different language, reply in that SAME language.

If asked about something not in the list, politely say you only know about the IITGN-Cred app. """

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⏳ Loading Whisper Model...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
print("✅ Whisper Model Loaded.")

class TextRequest(BaseModel):
    message: str

def query_llm(user_text, language_hint="en"):
    try:
        full_prompt = f"{APP_SYSTEM_PROMPT}\n\n[User Language Detected: {language_hint}]\nUser Question: {user_text}"
        
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=full_prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        return "I'm having trouble connecting to my brain right now."


@app.get("/")
def health_check():
    return {"status": "running", "message": "Voice Assistant Backend is Online"}

@app.post("/chat")
async def handle_text_chat(payload: TextRequest):
    if not payload.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    bot_reply = query_llm(payload.message, language_hint="en")
    
    return {
        "reply": bot_reply
    }

@app.post("/talk")
async def handle_voice_chat(file: UploadFile = File(...)):
    temp_filename = f"temp_{file.filename}"
    
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        segments, info = whisper_model.transcribe(temp_filename, beam_size=5)
        transcribed_text = " ".join([segment.text for segment in segments]).strip()
        detected_lang = info.language

        print(f"🎤 Heard ({detected_lang}): {transcribed_text}")

        if not transcribed_text:
            return {"transcription": "", "reply": "I couldn't hear anything."}

        bot_reply = query_llm(transcribed_text, language_hint=detected_lang)

        return {
            "transcription": transcribed_text,
            "reply": bot_reply,
            "language": detected_lang
        }

    except Exception as e:
        print(f"Error processing voice: {e}")
        return {"transcription": "(Error)", "reply": "Sorry, an error occurred."}
    
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)