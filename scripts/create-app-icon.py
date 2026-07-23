import os
import sys
from PIL import Image, ImageDraw

def draw_smooth_curve(draw, points, color, radius):
    """Draws a smooth thick path by interpolating between keypoints."""
    for i in range(len(points) - 1):
        p1 = points[i]
        p2 = points[i+1]
        dist = ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5
        steps = max(1, int(dist / 2))
        for s in range(steps + 1):
            t = s / steps
            x = int(p1[0] + (p2[0] - p1[0]) * t)
            y = int(p1[1] + (p2[1] - p1[1]) * t)
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color)

def main():
    print("=== Generating Brand New Study Trail Icon from Scratch ===")
    
    # 4x Supersampling
    scale = 4
    size = 1024 * scale
    
    # Colors
    bg_color = (15, 23, 42, 255)       # Slate 900: #0f172a
    page_color = (241, 245, 249, 255)  # Slate 50: #f1f5f9
    trail_color = (20, 184, 166, 255)   # Teal 500: #14b8a6
    check_color = (16, 185, 129, 255)   # Emerald 500: #10b981
    shadow_color = (2, 6, 23, 100)      # Translucent dark shadow
    
    img = Image.new("RGBA", (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Coordinates for Book Pages (At 4096x4096 scale)
    # Left page shadow
    draw.polygon([
        (1000, 1450), (1900, 1700), (1900, 2800), (1000, 2550)
    ], fill=shadow_color)
    
    # Right page shadow
    draw.polygon([
        (2196, 1700), (3096, 1450), (3096, 2550), (2196, 2800)
    ], fill=shadow_color)
    
    # Left page actual
    draw.polygon([
        (960, 1400), (1860, 1650), (1860, 2750), (960, 2500)
    ], fill=page_color)
    
    # Right page actual
    draw.polygon([
        (2236, 1650), (3136, 1400), (3136, 2500), (2236, 2750)
    ], fill=page_color)
    
    # Draw a stylized "trail/path" winding across the pages
    trail_points = [
        (1200, 2400),
        (1500, 2200),
        (1860, 2100),
        (2236, 2000),
        (2600, 1800),
        (2900, 1500)
    ]
    draw_smooth_curve(draw, trail_points, trail_color, radius=120)
    
    # Draw a prominent emerald checkmark at the end of the trail to represent completion/success
    check_points = [
        (2650, 1450),
        (2800, 1600),
        (3150, 1150)
    ]
    draw_smooth_curve(draw, check_points, check_color, radius=80)
    
    # Downsample to 1024x1024 with high-quality LANCZOS filter for perfect anti-aliasing
    print("Downsampling to 1024x1024...")
    final_img = img.resize((1024, 1024), resample=Image.Resampling.LANCZOS)
    
    # Save the file
    out_dir = "src-tauri"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "app-icon.png")
    final_img.save(out_path, format="PNG")
    print(f"Successfully generated clean 1024x1024 PNG at: {out_path}")

if __name__ == "__main__":
    main()
