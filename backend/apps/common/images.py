import io
import os

from PIL import Image
from django.core.files.base import ContentFile


def compress_image_to_webp(image_field, max_size=1920, quality=82):
    if not image_field or not image_field.name:
        return

    if image_field.name.lower().endswith(".webp"):
        return

    try:
        image_field.seek(0)
    except (AttributeError, ValueError):
        pass

    img = Image.open(image_field)

    if img.mode == "RGBA":
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=quality, method=4)
    buffer.seek(0)

    new_name = os.path.splitext(os.path.basename(image_field.name))[0] + ".webp"
    image_field.save(new_name, ContentFile(buffer.read()), save=False)
