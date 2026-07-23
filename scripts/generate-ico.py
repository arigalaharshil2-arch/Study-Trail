import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is not installed. Please run: pip install Pillow")
    sys.exit(1)

png_path = "src-tauri/app-icon.png"
ico_path = "src-tauri/icons/icon.ico"

if not os.path.exists(png_path):
    print(f"Error: Source image not found at {png_path}")
    sys.exit(1)

try:
    print(f"Loading {png_path}...")
    img = Image.open(png_path)
    
    if img.size[0] != img.size[1]:
        print("Warning: Source image is not perfectly square!")
        
    print("Generating compliant multi-resolution icon.ico...")
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
    img.save(ico_path, format="ICO", sizes=sizes)
    print(f"Successfully generated compliant {ico_path}!")
except Exception as e:
    print(f"Error generating ICO: {e}")
    sys.exit(1)
