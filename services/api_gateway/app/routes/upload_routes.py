from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload image to Cloudinary and return the URL
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
            )

        # Validate file size (max 5MB)
        file_content = await file.read()
        if len(file_content) > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 5MB."
            )

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder="cinema_app",  # Optional: organize images in a folder
            resource_type="image"
        )

        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "message": "Image uploaded successfully"
        }

    except cloudinary.exceptions.Error as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload-url")
async def upload_from_url(image_url: str):
    """
    Upload image from URL to Cloudinary and return the URL
    """
    try:
        if not image_url or not image_url.startswith(('http://', 'https://')):
            raise HTTPException(
                status_code=400,
                detail="Invalid URL. Must be a valid HTTP/HTTPS URL."
            )

        # Upload to Cloudinary from URL
        result = cloudinary.uploader.upload(
            image_url,
            folder="cinema_app",  # Optional: organize images in a folder
            resource_type="image"
        )

        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "message": "Image uploaded successfully from URL"
        }

    except cloudinary.exceptions.Error as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")