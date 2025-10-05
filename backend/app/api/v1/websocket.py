"""
WebSocket endpoint for real-time notifications
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from typing import Optional
import json
import asyncio
import logging

from app.services.websocket_service import manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time notifications
    
    Args:
        websocket: WebSocket connection
        user_id: User ID to connect for
        token: JWT token for authentication
    """
    # Authenticate user
    try:
        if not token:
            logger.error(f"WebSocket connection attempt without token for user {user_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Verify token (basic check - expand if needed)
        # For now, we'll accept the connection and log it
        logger.info(f"WebSocket connection attempt for user {user_id}")
        
    except Exception as e:
        logger.error(f"WebSocket authentication error for user {user_id}: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Accept connection
    await manager.connect(websocket, user_id)
    logger.info(f"WebSocket connected for user {user_id}")
    
    try:
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                logger.debug(f"Received WebSocket message from user {user_id}: {data}")
                
                # Parse message
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    # Handle different message types
                    if message_type == "ping":
                        # Respond to ping
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": message.get("timestamp")
                        })
                        logger.debug(f"Sent pong to user {user_id}")
                        
                    elif message_type == "subscribe":
                        # Handle subscription to specific topics
                        topics = message.get("topics", [])
                        logger.info(f"User {user_id} subscribed to topics: {topics}")
                        # TODO: Implement topic-based subscriptions
                        
                    else:
                        logger.warning(f"Unknown message type from user {user_id}: {message_type}")
                        
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from user {user_id}: {data}")
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id}")
                break
            except Exception as e:
                logger.error(f"Error processing WebSocket message for user {user_id}: {e}")
                break
                
    finally:
        # Disconnect
        manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket cleaned up for user {user_id}")


async def send_alert_to_user(user_id: str, alert_data: dict):
    """
    Send alert notification to specific user via WebSocket
    
    Args:
        user_id: User ID to send to
        alert_data: Alert data to send
    """
    try:
        message = {
            "type": "new_alert",
            "data": alert_data
        }
        logger.info(f"🚨 Attempting to send new_alert to user {user_id}: alert_id={alert_data.get('id')}")
        await manager.send_personal_message(json.dumps(message), user_id)
        logger.info(f"✅ Successfully sent new_alert to user {user_id}")
    except Exception as e:
        logger.error(f"❌ Error sending alert to user {user_id}: {e}", exc_info=True)


async def send_alert_update_to_user(user_id: str, alert_data: dict):
    """
    Send alert update notification to specific user via WebSocket
    
    Args:
        user_id: User ID to send to
        alert_data: Updated alert data
    """
    try:
        message = {
            "type": "alert_updated",
            "data": alert_data
        }
        await manager.send_personal_message(json.dumps(message), user_id)
        logger.info(f"Sent alert_updated to user {user_id}: alert_id={alert_data.get('id')}")
    except Exception as e:
        logger.error(f"Error sending alert update to user {user_id}: {e}")


async def broadcast_alert(alert_data: dict, exclude_user: Optional[str] = None):
    """
    Broadcast alert to all connected users
    
    Args:
        alert_data: Alert data to broadcast
        exclude_user: Optional user ID to exclude from broadcast
    """
    try:
        message = {
            "type": "new_alert",
            "data": alert_data
        }
        await manager.broadcast(json.dumps(message), exclude_user)
        logger.info(f"Broadcasted new_alert: alert_id={alert_data.get('id')}")
    except Exception as e:
        logger.error(f"Error broadcasting alert: {e}")
