from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import LlavaForConditionalGeneration, LlavaProcessor, BitsAndBytesConfig
import torch
from PIL import Image
import io
import uvicorn

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

def load_model():
    global model, processor
    if model is None or processor is None:
        model_id = "llava-hf/llava-1.5-7b-hf"
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

@app.on_event("startup")
async def startup_event():
    load_model()

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Read and validate the image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Prepare the prompt
        text = '''<image>\nUSER:
        What city is located at the center of this map? 
        Use any visible landmarks or text to help identify it. 
        Then tell me which country this city belongs to. 
        Tell me about the city and country. \nGEOGENIE:'''
        
        # Prepare inputs
        inputs = processor(images=image, text=text, return_tensors="pt").to(model.device)
        
        # Generate response
        output = model.generate(**inputs, max_new_tokens=200)
        response = processor.tokenizer.decode(output[0], skip_special_tokens=True)
        
        # Extract only the part after "GEOGENIE:"
        if "\nGEOGENIE:" in response:
            response = "GEOGENIE:" + response.split("\nGEOGENIE:", 1)[1]
        
        return {"success": True, "analysis": response}
    
    except Exception as e:
        # Print error details for debugging
        import traceback
        print(f"Error analyzing image: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Add a simple test endpoint
@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 