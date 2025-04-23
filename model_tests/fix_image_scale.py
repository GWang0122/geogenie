from transformers import LlavaProcessor, LlavaForConditionalGeneration
from PIL import Image
import torch
import sys

def test_processor_with_size(image_path, width, height):
    """Test if a specific image size works with the processor."""
    try:
        # Resize image to specified dimensions
        image = Image.open(image_path).convert("RGB")
        resized = image.resize((width, height))
        
        # Load processor and try to process
        processor = LlavaProcessor.from_pretrained("llava-hf/llava-1.5-7b-hf")
        text = "<image>\nUSER: Test prompt\nASSISTANT:"
        
        # Try to process the image
        inputs = processor(images=resized, text=text, return_tensors="pt")
        print(f"SUCCESS: Size {width}x{height} works!")
        return True
    except ValueError as e:
        if "Image features and image tokens do not match" in str(e):
            print(f"FAILED: Size {width}x{height} - {str(e)}")
        else:
            print(f"ERROR: Size {width}x{height} - {str(e)}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python fix_image_scale.py <image_path>")
        return
        
    image_path = sys.argv[1]
    print(f"Testing with image: {image_path}")
    
    # Get original image size
    orig_img = Image.open(image_path)
    orig_width, orig_height = orig_img.size
    print(f"Original image size: {orig_width}x{orig_height}")
    
    # Try standard sizes first
    standard_sizes = [
        (224, 224),  # Standard vision model size
        (336, 336),  # 1.5x standard
        (448, 448),  # 2x standard
        (672, 672),  # 3x standard
        (1024, 1024),  # Large size
    ]
    
    for width, height in standard_sizes:
        if test_processor_with_size(image_path, width, height):
            break
    
    # If standard sizes don't work, try scaling the original image
    if orig_width > 0 and orig_height > 0:
        # Try doubling the dimensions
        if test_processor_with_size(image_path, orig_width*2, orig_height*2):
            print("KEY FINDING: The image needs to be exactly 2x the original size.")
            return
            
        # Try other scaling factors
        for scale in [1.5, 3, 4]:
            new_width = int(orig_width * scale)
            new_height = int(orig_height * scale)
            if test_processor_with_size(image_path, new_width, new_height):
                print(f"KEY FINDING: The image needs to be scaled by {scale}x.")
                return

if __name__ == "__main__":
    main() 