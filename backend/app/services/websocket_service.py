"""
WebSocket Service for real-time updates
"""
from fastapi import WebSocket
from typing import Dict, List, Optional
import json


class ConnectionManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept new WebSocket connection"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: str, user_id: str):
        """Send message to specific user"""
        print(f"📨 Sending message to user {user_id}")
        print(f"📋 Active connections: {list(self.active_connections.keys())}")
        
        if user_id in self.active_connections:
            print(f"✅ User {user_id} has {len(self.active_connections[user_id])} active connections")
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                    print(f"✅ Message sent successfully to user {user_id}")
                except Exception as e:
                    print(f"❌ Error sending to connection: {e}")
        else:
            print(f"⚠️ User {user_id} not found in active connections!")
    
    async def broadcast(self, message: str, exclude_user: Optional[str] = None):
        """Broadcast message to all connected users"""
        for user_id, user_connections in list(self.active_connections.items()):
            if exclude_user and user_id == exclude_user:
                continue

            for connection in list(user_connections):
                try:
                    await connection.send_text(message)
                except Exception:
                    try:
                        connection.close()
                    except Exception:
                        pass
    
    async def broadcast_to_role(self, message: dict, role: str):
        """Broadcast message to users with specific role"""
        await self.broadcast(json.dumps(message))


manager = ConnectionManager()
