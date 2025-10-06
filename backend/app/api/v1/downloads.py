"""Download endpoints"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter()


@router.get("/android", response_class=FileResponse)
async def download_android_app():
    """Return the latest Android APK for download."""
    apk_path = Path(settings.APK_DOWNLOAD_PATH).resolve()

    if not _apk_exists(apk_path):
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


@router.get("/android/metadata")
async def download_android_metadata() -> Dict[str, Any]:
    """Return metadata for the latest Android APK (size, checksum, timestamp, version)."""
    apk_path = Path(settings.APK_DOWNLOAD_PATH).resolve()

    if not _apk_exists(apk_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Android application package is not available. Upload the latest APK to the configured path."
        )

    metadata: Dict[str, Any] = {
        "filename": apk_path.name,
        "size_bytes": apk_path.stat().st_size,
        "updated_at": datetime.fromtimestamp(apk_path.stat().st_mtime, tz=timezone.utc).isoformat(),
        "sha256": _checksum_sha256(apk_path)
    }

    metadata_file = apk_path.parent / "android-metadata.json"
    if metadata_file.exists() and metadata_file.is_file():
        try:
            with metadata_file.open("r", encoding="utf-8") as fp:
                metadata.update(json.load(fp))
        except json.JSONDecodeError:
            # Ignore malformed metadata sidecar, serve computed basics instead.
            pass

    return metadata


def _apk_exists(apk_path: Path) -> bool:
    return apk_path.exists() and apk_path.is_file()


def _checksum_sha256(apk_path: Path) -> str:
    hasher = hashlib.sha256()
    with apk_path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()
