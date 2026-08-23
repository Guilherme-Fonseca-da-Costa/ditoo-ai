import os
import uuid

from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import datetime

def utcnow() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


engine = create_engine('sqlite:///./ditoo.db')
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Modelo de usuário para autenticação e gerenciamento
class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True,default=lambda: str(uuid.uuid4()), index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    conversations = relationship("Conversation", back_populates="user", cascade="all")
    memories = relationship("UserMemory", back_populates="user", cascade="all, delete-orphan")


# Configurações específicas do usuário
class ConfigUser(Base):
    __tablename__ = 'config_users'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey('users.id'))
    config_key = Column(String)
    config_value = Column(String)
# Configurações administrativas para o sistema
class ConfigAdmin(Base):
    __tablename__ = 'system_config'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    parallelRequestNum = Column(Integer)
    memoryLimit = Column(Integer)
    loadedModels = Column(Integer)
    activatedModels = Column(String)
    folders = Column(String)
    confidentialFolders = Column(String)

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    title = Column(String, default="Nova Conversa")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    archived = Column(Boolean, default=False)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

class Message(Base):
    __tablename__ = 'messages'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey('conversations.id'), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class UserMemory(Base):
    __tablename__ = 'user_memory'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    category = Column(String, default="geral")
    content = Column(Text, nullable=False)
    source_conversation_id = Column(String, ForeignKey('conversations.id'), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    active = Column(Boolean, default=True)
    user = relationship("User", back_populates="memories")

Base.metadata.create_all(bind=engine)
# Insert de teste no SQLITE
"""
db = SessionLocal()
new_user = User(username="John Doe", email="john@example.com", password="password123")
db.add(new_user)
db.commit()
db.refresh(new_user)
print(f"User created: {new_user.username} with email {new_user.email}") 

"""

# Consulta de teste no SQLITE
"""
db = SessionLocal()
users = db.query(User).filter(User.email == "john@example.com").all()
print(f"Users in database: {[user.name for user in users]}")
"""

"""
Gerar usuário admin para teste:
curl -X POST http://localhost:8000/register   -H "Content-Type: application/json"   -d "{\"username\": \"Master\", \"email\": \"master@gmail.com\", \"password\": \"123\", \"role\": \"admin\"}"
"""