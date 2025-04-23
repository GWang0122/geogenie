from transformers import LlavaForConditionalGeneration, LlavaProcessor, BitsAndBytesConfig
from PIL import Image
import torch
import os
from glob import glob

# Load processor and model
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

# Load image
image = Image.open("bay_area.png").convert("RGB")  # Replace with your image path

# Prompt asking about the city in the middle of the image
text = "<image>\nUSER: What is the name of the city at the center of this map? Can you guess which country it is in?\nASSISTANT:"

# Prepare inputs
inputs = processor(images=image, text=text, return_tensors="pt").to(model.device)


# Define the folder containing test maps
test_maps_folder = "test_maps"

# Get all image files in the folder
image_files = glob(os.path.join(test_maps_folder, "*.png")) + glob(os.path.join(test_maps_folder, "*.jpg")) + glob(os.path.join(test_maps_folder, "*.jpeg"))

# Process each image
for image_path in image_files:
    print(f"\nProcessing image: {image_path}")
    
    # Load image
    image = Image.open(image_path).convert("RGB")
    
    # Prepare inputs for each image
    inputs = processor(images=image, text=text, return_tensors="pt").to(model.device)
    
    # Generate response
    output = model.generate(**inputs, max_new_tokens=100)
    response = processor.tokenizer.decode(output[0], skip_special_tokens=True)
    
    print(f"For map {os.path.basename(image_path)}, LLaVA says: {response}")

# Skip the individual image processing below since we're now processing all images in the folder

