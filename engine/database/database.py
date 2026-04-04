from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///./ditoo.db')
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Modelo de usuário para autenticação e gerenciamento
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

Base.metadata.create_all(bind=engine)
# Configurações específicas do usuário
class ConfigUser(Base):
    __tablename__ = 'config_users'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, foreign_key='users.id')
    config_key = Column(String)
    config_value = Column(String)
# Configurações administrativas para o sistema
class ConfigAdmin(Base):
    __tablename__ = 'system_config'
    id = Column(Integer, primary_key=True, index=True)
    parallelRequestNum = Column(Integer)
    loadedModels = Column(Integer)
    activatedModels = Column(String)
    folders = Column(String)
    confidentialFolders = Column(String)

# Insert de teste no SQLITE
"""
db = SessionLocal()
new_user = User(name="John Doe", email="john@example.com", password="password123")
db.add(new_user)
db.commit()
db.refresh(new_user)
print(f"User created: {new_user.name} with email {new_user.email}") 
"""

# Consulta de teste no SQLITE
"""
db = SessionLocal()
users = db.query(User).filter(User.email == "john@example.com").all()
print(f"Users in database: {[user.name for user in users]}")
"""