"""
Download endpoints
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter()


@router.get("/android", response_class=FileResponse)
async def download_android_app():
    """Return the latest Android APK for download."""
    apk_path = Path(settings.APK_DOWNLOAD_PATH).resolve()

    if not apk_path.exists() or not apk_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Android application package is not available. Upload the latest APK to the configured path."
        )

    filename = apk_path.name
    return FileResponse(
        path=apk_path,
        media_type="application/vnd.android.package-archive",
        filename=filename,
        headers={"Cache-Control": "no-cache"}
    )
