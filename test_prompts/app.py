from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from transformers import LlavaForConditionalGeneration, LlavaProcessor, BitsAndBytesConfig
import torch
from PIL import Image
import io
import uvicorn
import random
from fastapi.responses import JSONResponse
from typing import List

app = FastAPI(title="LLaVA Place Recognition API")

# Enable CORS - allow all origins for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and processor
model = None
processor = None

# Define prompt variations
'''
    '<image>\nUSER: What city is located at the center of this map? Then tell me which country this city belongs to, and one fact about the city. \nGEOGENIE:',
    '<image>\nUSER: What city is located at the center of this map? Then tell me which country this city belongs to, and one fact about the city. Please tell me any geographical features you used to help you identify the city. \nGEOGENIE:',
    '<image>\nUSER: Looking at this map, what is the name of the city in the center? Which country is it part of? Tell me something notable about this city. \nGEOGENIE:',
    '<image>\nUSER: Please look at the map and analyze it. What city is located at the center of this map? Then tell me which country this city belongs to, and one fact about the city. \nGEOGENIE:',
    '<image>\nUSER: I am testing your ability to analyze maps. What is the name of the city displayed at the center of this map? In which country can this city be found? Give me one interesting fact about this city. \nGEOGENIE:'
'''

PROMPT_VARIATIONS = [
    '''<image>\nUSER: Where is this located? Can you tell me the city at the center of the map and its country? Tell me one fact about the city. \nGEOGENIE:''',
    ]

def load_model():
    global model, processor
    if model is None or processor is None:
        print("Loading LLaVA model...")
        model_id = "llava-hf/llava-1.5-7b-hf"
        try:
            processor = LlavaProcessor.from_pretrained(model_id)
            model = LlavaForConditionalGeneration.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                device_map="auto",
                quantization_config=BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16
                )
            )
            print("LLaVA model loaded successfully!")
        except Exception as e:
            print(f"Error loading LLaVA model: {str(e)}")
            raise

@app.on_event("startup")
async def startup_event():
    load_model()

@app.post("/analyze-map")
async def analyze_map(file: UploadFile = File(...)):
    try:
        print("Received map image for analysis")
        
        # Read the uploaded file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Save the image for debugging
        image.save("debug_map.png")
        print("Saved uploaded map image for debugging")
        
        responses = []
        
        for prompt in PROMPT_VARIATIONS:
            print(f"Processing prompt: {prompt}")
            
            # Prepare inputs
            inputs = processor(images=image, text=prompt, return_tensors="pt").to(model.device)
            
            print("Generating response from LLaVA...")
            # Generate response
            output = model.generate(**inputs, max_new_tokens=200, do_sample=True, temperature=0.7)
            response = processor.tokenizer.decode(output[0], skip_special_tokens=True)
            
            print(f"Raw LLaVA response: {response}")
            
            # Extract only the part after "GEOGENIE:"
            if "\nGEOGENIE:" in response:
                response = response.split("\nGEOGENIE:", 1)[1].strip()
            
            responses.append({
                "prompt": prompt,
                "response": response
            })
        
        return {
            "success": True, 
            "analyses": responses
        }
    
    except Exception as e:
        import traceback
        print(f"Error analyzing map: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 