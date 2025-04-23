import os
import sys
import argparse
from PIL import Image
import torch
from transformers import AutoProcessor, LlavaForConditionalGeneration

def main():
    parser = argparse.ArgumentParser(description="Test LLaVA's text capabilities")
    parser.add_argument("--prompt", type=str, default="What is the capital of France?", 
                        help="Text prompt to test LLaVA with")
    parser.add_argument("--model", type=str, default="llava-hf/llava-1.5-7b-hf", 
                        help="LLaVA model to use")
    args = parser.parse_args()

    # Load model and processor
    processor = AutoProcessor.from_pretrained(args.model)
    model = LlavaForConditionalGeneration.from_pretrained(
        args.model, 
        torch_dtype=torch.float16, 
        device_map="auto"
    )

    # Process text-only input
    inputs = processor(text=args.prompt, return_tensors="pt").to(model.device)
    
    # Generate response
    with torch.no_grad():
        output = model.generate(**inputs, max_new_tokens=256)
    
    # Decode and print response
    response = processor.decode(output[0], skip_special_tokens=True)
    print(f"\nPrompt: {args.prompt}")
    print(f"\nResponse: {response}")

if __name__ == "__main__":
    main()
