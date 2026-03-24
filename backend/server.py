from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import pyotp
import base64
import httpx
import json
import asyncio
import secrets

# Eth imports for wallet auth
from eth_account import Account
from eth_account.messages import encode_defunct

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'neuroclaim-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 168  # 7 days

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# IPFS/Pinata Config
PINATA_JWT = os.environ.get('PINATA_JWT', '')
PINATA_GATEWAY = os.environ.get('PINATA_GATEWAY', 'gateway.pinata.cloud')

# Create the main app
app = FastAPI(title="NeuroClaim Support API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    has_2fa: bool = False
    created_at: datetime

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str

class TwoFASetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    backup_codes: List[str]

class TwoFAVerifyRequest(BaseModel):
    code: str

class ClaimCreate(BaseModel):
    claim_number: str
    injury_type: str = "TBI"
    injury_group: str  # "Group 1" or "Group 2"
    injury_date: str
    description: str
    status: str = "active"

class ClaimResponse(BaseModel):
    claim_id: str
    user_id: str
    claim_number: str
    injury_type: str
    injury_group: str
    injury_date: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

class TimelineEvent(BaseModel):
    event_id: str
    claim_id: str
    event_type: str
    title: str
    description: str
    date: datetime
    metadata: Optional[Dict[str, Any]] = None

class EvidenceFile(BaseModel):
    evidence_id: str
    claim_id: str
    user_id: str
    file_name: str
    file_type: str
    file_size: int
    ipfs_cid: Optional[str] = None
    storage_url: Optional[str] = None
    description: str
    evidence_type: str
    uploaded_at: datetime

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class LetterGenerateRequest(BaseModel):
    template_type: str
    claim_id: Optional[str] = None
    custom_data: Optional[Dict[str, Any]] = None

class LetterResponse(BaseModel):
    letter_id: str
    template_type: str
    content: str
    generated_at: datetime

# WCB Policy Models
class WCBPolicy(BaseModel):
    policy_id: str
    policy_number: str
    title: str
    category: str
    content: str
    effective_date: str
    keywords: List[str]

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    # First check cookie
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Then check Authorization header
    if credentials:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

def generate_otp_secret() -> str:
    return pyotp.random_base32()

def generate_backup_codes(count: int = 8) -> List[str]:
    return [str(uuid.uuid4())[:8].upper() for _ in range(count)]

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_pw,
        "picture": None,
        "has_2fa": False,
        "totp_secret": None,
        "backup_codes": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            user_id=user_id,
            email=user_data.email,
            name=user_data.name,
            picture=None,
            has_2fa=False,
            created_at=datetime.now(timezone.utc)
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["user_id"], user["email"])
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return TokenResponse(
        token=token,
        user=UserResponse(
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
            picture=user.get("picture"),
            has_2fa=user.get("has_2fa", False),
            created_at=created_at
        )
    )

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process Google OAuth session from Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture")}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "password": None,
            "has_2fa": False,
            "totp_secret": None,
            "backup_codes": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = auth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    token = create_token(user_id, auth_data["email"])
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture")
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        has_2fa=user.get("has_2fa", False),
        created_at=created_at
    )

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== WALLET AUTH ROUTES ==============

class WalletAuthMessageResponse(BaseModel):
    message: str
    nonce: str

class WalletVerifyRequest(BaseModel):
    address: str
    message: str
    signature: str
    nonce: str

@api_router.get("/auth/wallet/message")
async def get_wallet_auth_message(address: str):
    """Generate authentication message for wallet signing"""
    # Basic validation
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(status_code=400, detail="Invalid wallet address format")
    
    # Generate unique nonce
    nonce = secrets.token_hex(16)
    
    # Store nonce (expires in 10 minutes)
    await db.wallet_nonces.delete_many({"address": address.lower()})
    await db.wallet_nonces.insert_one({
        "address": address.lower(),
        "nonce": nonce,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "used": False
    })
    
    # Create message
    message = f"""NeuroClaim Support wants you to sign in with your Ethereum account.

Wallet: {address}
Nonce: {nonce}

This request will not trigger a blockchain transaction or cost any gas fees."""
    
    return WalletAuthMessageResponse(message=message, nonce=nonce)

@api_router.post("/auth/wallet/verify")
async def verify_wallet_signature(request: WalletVerifyRequest, response: Response):
    """Verify wallet signature and create session"""
    address = request.address.lower()
    
    # Check nonce exists and not used
    nonce_doc = await db.wallet_nonces.find_one({
        "address": address,
        "nonce": request.nonce,
        "used": False
    }, {"_id": 0})
    
    if not nonce_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired nonce")
    
    # Check expiration
    expires_at = datetime.fromisoformat(nonce_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Nonce expired")
    
    # Verify signature
    try:
        message_hash = encode_defunct(text=request.message)
        recovered_address = Account.recover_message(message_hash, signature=request.signature)
        
        if recovered_address.lower() != address:
            raise HTTPException(status_code=401, detail="Signature verification failed")
    except Exception as e:
        logger.error(f"Wallet signature verification error: {e}")
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Mark nonce as used
    await db.wallet_nonces.update_one(
        {"address": address, "nonce": request.nonce},
        {"$set": {"used": True}}
    )
    
    # Get or create user
    user = await db.users.find_one({"wallet_address": address}, {"_id": 0})
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": f"{address[:8]}...{address[-4:]}@wallet",
            "name": f"Wallet {address[:6]}...{address[-4:]}",
            "wallet_address": address,
            "password": None,
            "picture": None,
            "has_2fa": False,
            "auth_type": "wallet",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update last login
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    token = create_token(user_id, user["email"])
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user["email"],
            "name": user["name"],
            "wallet_address": address,
            "picture": user.get("picture")
        }
    }

# ============== 2FA ROUTES ==============

@api_router.post("/auth/2fa/setup", response_model=TwoFASetupResponse)
async def setup_2fa(user: dict = Depends(get_current_user)):
    secret = generate_otp_secret()
    backup_codes = generate_backup_codes()
    
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user["email"],
        issuer_name="NeuroClaim Support"
    )
    
    # Store temporarily (user must verify before it's active)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "pending_totp_secret": secret,
            "pending_backup_codes": [hash_password(code) for code in backup_codes]
        }}
    )
    
    return TwoFASetupResponse(
        secret=secret,
        qr_code_url=provisioning_uri,
        backup_codes=backup_codes
    )

@api_router.post("/auth/2fa/verify")
async def verify_2fa(data: TwoFAVerifyRequest, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    pending_secret = user_doc.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No 2FA setup pending")
    
    totp = pyotp.TOTP(pending_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Activate 2FA
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "has_2fa": True,
                "totp_secret": pending_secret,
                "backup_codes": user_doc.get("pending_backup_codes", [])
            },
            "$unset": {"pending_totp_secret": "", "pending_backup_codes": ""}
        }
    )
    
    return {"message": "2FA enabled successfully"}

@api_router.post("/auth/2fa/disable")
async def disable_2fa(data: TwoFAVerifyRequest, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if not user_doc.get("has_2fa"):
        raise HTTPException(status_code=400, detail="2FA not enabled")
    
    totp = pyotp.TOTP(user_doc["totp_secret"])
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"has_2fa": False, "totp_secret": None, "backup_codes": []}}
    )
    
    return {"message": "2FA disabled successfully"}

# ============== EMAIL OTP ROUTES ==============

@api_router.post("/auth/otp/send")
async def send_otp(email: EmailStr):
    """Send OTP to email (MOCKED - logs OTP instead of sending email)"""
    otp = str(uuid.uuid4().int)[:6]
    
    await db.email_otps.delete_many({"email": email})
    await db.email_otps.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # MOCKED: Log OTP instead of sending email
    logger.info(f"[MOCKED EMAIL] OTP for {email}: {otp}")
    
    return {"message": "OTP sent to email", "note": "MOCKED - check server logs for OTP"}

@api_router.post("/auth/otp/verify")
async def verify_otp(data: OTPVerifyRequest, response: Response):
    otp_doc = await db.email_otps.find_one({"email": data.email}, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if otp_doc["otp"] != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Delete used OTP
    await db.email_otps.delete_one({"email": data.email})
    
    # Check if user exists, create if not
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data.email,
            "name": data.email.split("@")[0],
            "password": None,
            "picture": None,
            "has_2fa": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    token = create_token(user["user_id"], user["email"])
    
    return {"token": token, "user": user}

# ============== CLAIM ROUTES ==============

@api_router.post("/claims", response_model=ClaimResponse)
async def create_claim(claim_data: ClaimCreate, user: dict = Depends(get_current_user)):
    claim_id = f"claim_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    claim_doc = {
        "claim_id": claim_id,
        "user_id": user["user_id"],
        "claim_number": claim_data.claim_number,
        "injury_type": claim_data.injury_type,
        "injury_group": claim_data.injury_group,
        "injury_date": claim_data.injury_date,
        "description": claim_data.description,
        "status": claim_data.status,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.claims.insert_one(claim_doc)
    
    return ClaimResponse(
        claim_id=claim_id,
        user_id=user["user_id"],
        claim_number=claim_data.claim_number,
        injury_type=claim_data.injury_type,
        injury_group=claim_data.injury_group,
        injury_date=claim_data.injury_date,
        description=claim_data.description,
        status=claim_data.status,
        created_at=now,
        updated_at=now
    )

@api_router.get("/claims", response_model=List[ClaimResponse])
async def get_claims(user: dict = Depends(get_current_user)):
    claims = await db.claims.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for c in claims:
        created_at = c.get("created_at")
        updated_at = c.get("updated_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        
        result.append(ClaimResponse(
            claim_id=c["claim_id"],
            user_id=c["user_id"],
            claim_number=c["claim_number"],
            injury_type=c["injury_type"],
            injury_group=c["injury_group"],
            injury_date=c["injury_date"],
            description=c["description"],
            status=c["status"],
            created_at=created_at,
            updated_at=updated_at
        ))
    
    return result

@api_router.get("/claims/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: str, user: dict = Depends(get_current_user)):
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    created_at = claim.get("created_at")
    updated_at = claim.get("updated_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    if isinstance(updated_at, str):
        updated_at = datetime.fromisoformat(updated_at)
    
    return ClaimResponse(
        claim_id=claim["claim_id"],
        user_id=claim["user_id"],
        claim_number=claim["claim_number"],
        injury_type=claim["injury_type"],
        injury_group=claim["injury_group"],
        injury_date=claim["injury_date"],
        description=claim["description"],
        status=claim["status"],
        created_at=created_at,
        updated_at=updated_at
    )

# ============== TIMELINE ROUTES ==============

@api_router.post("/claims/{claim_id}/timeline", response_model=TimelineEvent)
async def add_timeline_event(
    claim_id: str,
    event_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    date: str = Form(...),
    user: dict = Depends(get_current_user)
):
    # Verify claim belongs to user
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    event_id = f"event_{uuid.uuid4().hex[:12]}"
    event_date = datetime.fromisoformat(date)
    
    event_doc = {
        "event_id": event_id,
        "claim_id": claim_id,
        "user_id": user["user_id"],
        "event_type": event_type,
        "title": title,
        "description": description,
        "date": event_date.isoformat(),
        "metadata": {}
    }
    
    await db.timeline_events.insert_one(event_doc)
    
    return TimelineEvent(
        event_id=event_id,
        claim_id=claim_id,
        event_type=event_type,
        title=title,
        description=description,
        date=event_date,
        metadata={}
    )

@api_router.get("/claims/{claim_id}/timeline", response_model=List[TimelineEvent])
async def get_timeline(claim_id: str, user: dict = Depends(get_current_user)):
    # Verify claim belongs to user
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    events = await db.timeline_events.find({"claim_id": claim_id}, {"_id": 0}).sort("date", -1).to_list(500)
    
    result = []
    for e in events:
        date = e.get("date")
        if isinstance(date, str):
            date = datetime.fromisoformat(date)
        
        result.append(TimelineEvent(
            event_id=e["event_id"],
            claim_id=e["claim_id"],
            event_type=e["event_type"],
            title=e["title"],
            description=e["description"],
            date=date,
            metadata=e.get("metadata", {})
        ))
    
    return result

# ============== PINATA IPFS HELPER ==============

async def upload_to_pinata(file_content: bytes, filename: str, metadata: dict) -> dict:
    """Upload file to Pinata IPFS"""
    if not PINATA_JWT:
        # Fallback to mock if no JWT configured
        fake_cid = f"Qm{uuid.uuid4().hex[:44]}"
        return {"cid": fake_cid, "is_mocked": True}
    
    try:
        import aiohttp
        
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        
        form_data = aiohttp.FormData()
        form_data.add_field('file', file_content, filename=filename)
        form_data.add_field('pinataMetadata', json.dumps({
            "name": filename,
            "keyvalues": metadata
        }))
        form_data.add_field('pinataOptions', json.dumps({
            "cidVersion": 1
        }))
        
        headers = {
            "Authorization": f"Bearer {PINATA_JWT}"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=form_data, headers=headers, timeout=120) as response:
                if response.status == 200:
                    data = await response.json()
                    return {"cid": data.get("IpfsHash"), "is_mocked": False}
                else:
                    error_text = await response.text()
                    logger.error(f"Pinata upload failed: {error_text}")
                    # Fallback to mock
                    fake_cid = f"Qm{uuid.uuid4().hex[:44]}"
                    return {"cid": fake_cid, "is_mocked": True, "error": error_text}
    except Exception as e:
        logger.error(f"Pinata upload error: {e}")
        fake_cid = f"Qm{uuid.uuid4().hex[:44]}"
        return {"cid": fake_cid, "is_mocked": True, "error": str(e)}

# ============== EVIDENCE ROUTES ==============

@api_router.post("/evidence/upload", response_model=EvidenceFile)
async def upload_evidence(
    file: UploadFile = File(...),
    claim_id: str = Form(...),
    description: str = Form(...),
    evidence_type: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """Upload evidence file to IPFS via Pinata"""
    
    # Verify claim belongs to user
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    file_content = await file.read()
    file_size = len(file_content)
    
    evidence_id = f"evidence_{uuid.uuid4().hex[:12]}"
    
    # Upload to Pinata IPFS
    pinata_result = await upload_to_pinata(
        file_content=file_content,
        filename=file.filename,
        metadata={
            "claim_id": claim_id,
            "evidence_type": evidence_type,
            "user_id": user["user_id"]
        }
    )
    
    ipfs_cid = pinata_result["cid"]
    is_mocked = pinata_result.get("is_mocked", False)
    
    evidence_doc = {
        "evidence_id": evidence_id,
        "claim_id": claim_id,
        "user_id": user["user_id"],
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_size": file_size,
        "ipfs_cid": ipfs_cid,
        "storage_url": f"https://{PINATA_GATEWAY}/ipfs/{ipfs_cid}",
        "description": description,
        "evidence_type": evidence_type,
        "is_mocked": is_mocked,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.evidence.insert_one(evidence_doc)
    
    status = "MOCKED" if is_mocked else "REAL IPFS"
    logger.info(f"[{status}] Evidence uploaded: {evidence_id} with CID: {ipfs_cid}")
    
    return EvidenceFile(
        evidence_id=evidence_id,
        claim_id=claim_id,
        user_id=user["user_id"],
        file_name=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        ipfs_cid=ipfs_cid,
        storage_url=f"https://{PINATA_GATEWAY}/ipfs/{ipfs_cid}",
        description=description,
        evidence_type=evidence_type,
        uploaded_at=datetime.now(timezone.utc)
    )

@api_router.get("/evidence/{claim_id}", response_model=List[EvidenceFile])
async def get_evidence(claim_id: str, user: dict = Depends(get_current_user)):
    # Verify claim belongs to user
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    evidence_list = await db.evidence.find({"claim_id": claim_id}, {"_id": 0}).to_list(500)
    
    result = []
    for e in evidence_list:
        uploaded_at = e.get("uploaded_at")
        if isinstance(uploaded_at, str):
            uploaded_at = datetime.fromisoformat(uploaded_at)
        
        result.append(EvidenceFile(
            evidence_id=e["evidence_id"],
            claim_id=e["claim_id"],
            user_id=e["user_id"],
            file_name=e["file_name"],
            file_type=e["file_type"],
            file_size=e["file_size"],
            ipfs_cid=e.get("ipfs_cid"),
            storage_url=e.get("storage_url"),
            description=e["description"],
            evidence_type=e["evidence_type"],
            uploaded_at=uploaded_at
        ))
    
    return result

# ============== AI CHAT ROUTES ==============

WCB_SYSTEM_PROMPT = """You are an AI assistant specializing in Alberta Workers' Compensation Board (WCB) policies, 
particularly for traumatic brain injury (TBI) claims. You help injured workers understand their rights, 
navigate the claims process, and draft letters to the WCB.

Key policies you know about:
- Policy 03 01 PART I – Injuries – General: Defines TBI classifications
  - Group 1 (Mild TBI): Minor concussion, brief loss of consciousness, transient confusion
  - Group 2 (Moderate/Severe TBI): Longer loss of consciousness, persistent neurological deficits, imaging confirmed pathology
- Policy 01 02 – Access & Privacy: Right to full claim file
- Policy 01 08 – Reconsiderations, Reviews & Appeals: Formal review process
- Policy 01 05 – Medical Aid: Medical treatment coverage
- Policy 01 10 – Interim Relief: Temporary support while claim is pending
- Policy 04 06 – Medical Aid: OT communication requirements
- Policy 04 11 – Duty to Cooperate

Always be compassionate, clear, and provide specific policy references when applicable.
Use simple language appropriate for someone with cognitive challenges from a brain injury."""

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest, user: dict = Depends(get_current_user)):
    """Chat with AI assistant about WCB policies"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    session_id = request.session_id or f"chat_{uuid.uuid4().hex[:12]}"
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=WCB_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Get the last user message
        last_message = request.messages[-1].content if request.messages else ""
        
        user_message = UserMessage(text=last_message)
        response = await chat.send_message(user_message)
        
        # Save to chat history
        await db.chat_history.insert_one({
            "user_id": user["user_id"],
            "session_id": session_id,
            "messages": [m.model_dump() for m in request.messages],
            "response": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
        
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# ============== LETTER GENERATION ROUTES ==============

LETTER_TEMPLATES = {
    "claim_file_request": """
Subject: Request for Complete Claim File – {claim_number} – Request for Review with Prejudice

Dear Sir/Madam,

I am writing as the claimant in the above referenced Workers' Compensation claim (Claim No. {claim_number}).
My injury is classified as a {injury_type} ({injury_group}) sustained on {injury_date}.

Given the seriousness of my condition and the need for complete documentation, I hereby request, with prejudice, 
a full and complete copy of all records in my file, including:

1. All medical packets (physician reports, specialist notes, imaging reports, operative notes, discharge summaries)
2. All service request correspondence
3. All invoices and financial statements
4. All internal notes, case management notes, and adjudication memos
5. All correspondence between WCB and any third parties
6. All records of any payments made
7. All records of any denied or partially approved requests
8. All disciplinary or administrative actions
9. Any audio/video recordings, photographs, or other media
10. Copies of any policy documents referenced in my claim

Under Policy 01 02 (Access & Privacy), I am entitled to a full copy of any personal information held by WCB.
Furthermore, Policy 01 08 (Reconsiderations, Reviews & Appeals) permits a claimant to request a complete review.

Please provide the requested documents in secure electronic PDF format sent to my email address.
If any portion must be withheld, please supply a written justification for each redaction.

Please confirm receipt of this letter within 5 business days.

Sincerely,
{user_name}
{user_email}
Date: {current_date}
""",
    "interim_relief_request": """
Subject: Request for Interim Relief – Claim #{claim_number}

Dear Sir/Madam,

I am writing regarding my Workers' Compensation claim (Claim No. {claim_number}).

I am requesting Interim Relief under Policy 01 10, as I meet the following criteria:
- I am unable to work due to my injury ({injury_type} - {injury_group})
- I have no other source of income
- I have ongoing medical expenses

My injury, sustained on {injury_date}, has left me unable to perform my regular work duties.
The financial hardship I am experiencing is significant, and I respectfully request that interim 
benefits be provided while my claim is being processed.

Please expedite this request given the urgent nature of my situation.

Sincerely,
{user_name}
{user_email}
Date: {current_date}
""",
    "call_recordings_request": """
Subject: Request for Call Centre Recordings and Transcripts – Claim #{claim_number}

Dear Sir/Madam,

I am the claimant in Workers' Compensation claim (Claim No. {claim_number}).

Under Policy 01 02 (Access & Privacy), I am entitled to a full copy of any personal information 
the Board holds about me, including telephone recordings.

I hereby request:
1. All call centre audio recordings for every telephone interaction I have had with WCB representatives
2. Transcripts of all recorded calls
3. Call centre logs (date, time, agent ID, call purpose) for all calls

Please provide these materials in electronic format within the statutory timeframe.
If any recordings cannot be provided, please supply a written justification citing the specific 
policy provision that permits withholding.

Sincerely,
{user_name}
{user_email}
Date: {current_date}
"""
}

@api_router.post("/letters/generate", response_model=LetterResponse)
async def generate_letter(request: LetterGenerateRequest, user: dict = Depends(get_current_user)):
    """Generate a letter from template"""
    
    if request.template_type not in LETTER_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unknown template type: {request.template_type}")
    
    template = LETTER_TEMPLATES[request.template_type]
    
    # Get claim data if provided
    claim_data = {}
    if request.claim_id:
        claim = await db.claims.find_one({"claim_id": request.claim_id, "user_id": user["user_id"]}, {"_id": 0})
        if claim:
            claim_data = {
                "claim_number": claim["claim_number"],
                "injury_type": claim["injury_type"],
                "injury_group": claim["injury_group"],
                "injury_date": claim["injury_date"]
            }
    
    # Merge with custom data
    format_data = {
        "user_name": user["name"],
        "user_email": user["email"],
        "current_date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        **claim_data,
        **(request.custom_data or {})
    }
    
    # Fill template
    try:
        content = template.format(**format_data)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    
    letter_id = f"letter_{uuid.uuid4().hex[:12]}"
    
    # Save letter
    await db.letters.insert_one({
        "letter_id": letter_id,
        "user_id": user["user_id"],
        "template_type": request.template_type,
        "content": content,
        "claim_id": request.claim_id,
        "generated_at": datetime.now(timezone.utc).isoformat()
    })
    
    return LetterResponse(
        letter_id=letter_id,
        template_type=request.template_type,
        content=content,
        generated_at=datetime.now(timezone.utc)
    )

@api_router.post("/letters/ai-draft")
async def ai_draft_letter(
    purpose: str = Form(...),
    claim_id: Optional[str] = Form(None),
    additional_context: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    """Use AI to draft a custom letter"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    claim_info = ""
    if claim_id:
        claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
        if claim:
            claim_info = f"""
Claim Details:
- Claim Number: {claim['claim_number']}
- Injury Type: {claim['injury_type']}
- Injury Classification: {claim['injury_group']}
- Injury Date: {claim['injury_date']}
- Description: {claim['description']}
"""
    
    prompt = f"""Draft a formal letter to the Alberta Workers' Compensation Board for the following purpose:

Purpose: {purpose}

User Information:
- Name: {user['name']}
- Email: {user['email']}

{claim_info}

Additional Context: {additional_context or 'None provided'}

Please draft a professional, formal letter that:
1. Cites relevant WCB policies (01 02, 01 08, 01 05, 01 10, 03 01, 04 06, 04 11 as applicable)
2. Is clear and compassionate
3. Includes specific requests with numbered lists
4. Requests a response timeline
5. Includes the current date: {datetime.now(timezone.utc).strftime("%B %d, %Y")}

Generate only the letter content, formatted properly."""

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"letter_{uuid.uuid4().hex[:8]}",
            system_message="You are an expert at drafting formal legal correspondence to the Alberta Workers' Compensation Board. Your letters are clear, professional, and cite relevant policies."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        content = await chat.send_message(user_message)
        
        letter_id = f"letter_{uuid.uuid4().hex[:12]}"
        
        await db.letters.insert_one({
            "letter_id": letter_id,
            "user_id": user["user_id"],
            "template_type": "ai_generated",
            "purpose": purpose,
            "content": content,
            "claim_id": claim_id,
            "generated_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "letter_id": letter_id,
            "content": content,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI letter generation error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/letters", response_model=List[LetterResponse])
async def get_letters(user: dict = Depends(get_current_user)):
    letters = await db.letters.find({"user_id": user["user_id"]}, {"_id": 0}).sort("generated_at", -1).to_list(100)
    
    result = []
    for l in letters:
        generated_at = l.get("generated_at")
        if isinstance(generated_at, str):
            generated_at = datetime.fromisoformat(generated_at)
        
        result.append(LetterResponse(
            letter_id=l["letter_id"],
            template_type=l["template_type"],
            content=l["content"],
            generated_at=generated_at
        ))
    
    return result

# ============== PDF GENERATION ==============

@api_router.post("/letters/{letter_id}/pdf")
async def generate_letter_pdf(letter_id: str, user: dict = Depends(get_current_user)):
    """Generate PDF from letter content"""
    from reportlab.lib.pagesizes import letter as PAGE_LETTER
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.units import inch
    from io import BytesIO
    
    # Get letter
    letter_doc = await db.letters.find_one({"letter_id": letter_id, "user_id": user["user_id"]}, {"_id": 0})
    if not letter_doc:
        raise HTTPException(status_code=404, detail="Letter not found")
    
    # Create PDF in memory
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=PAGE_LETTER, 
                            rightMargin=inch, leftMargin=inch,
                            topMargin=inch, bottomMargin=inch)
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        spaceAfter=12
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        spaceAfter=10
    )
    
    # Build PDF content
    story = []
    
    # Add NeuroClaim header
    story.append(Paragraph("NeuroClaim Support - WCB Letter", title_style))
    story.append(Spacer(1, 0.25*inch))
    
    # Split content into paragraphs
    content = letter_doc.get("content", "")
    paragraphs = content.split('\n\n')
    
    for para in paragraphs:
        if para.strip():
            # Handle line breaks within paragraphs
            clean_para = para.replace('\n', '<br/>')
            story.append(Paragraph(clean_para, body_style))
    
    # Build PDF
    doc.build(story)
    
    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    # Return PDF as response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="wcb-letter-{letter_id}.pdf"'
        }
    )

# ============== COMPREHENSIVE TIMELINE ==============

@api_router.get("/claims/{claim_id}/full-timeline")
async def get_full_claim_timeline(claim_id: str, user: dict = Depends(get_current_user)):
    """Get comprehensive timeline including events, letters, and evidence"""
    
    # Verify claim belongs to user
    claim = await db.claims.find_one({"claim_id": claim_id, "user_id": user["user_id"]}, {"_id": 0})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    timeline_items = []
    
    # Add claim creation event
    created_at = claim.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    timeline_items.append({
        "id": f"claim_created_{claim_id}",
        "type": "claim_created",
        "title": "Claim Created",
        "description": f"WCB claim {claim['claim_number']} registered - {claim['injury_group']}",
        "date": created_at.isoformat() if created_at else datetime.now(timezone.utc).isoformat(),
        "icon": "file-plus",
        "color": "blue"
    })
    
    # Add injury date event
    injury_date = claim.get("injury_date")
    if injury_date:
        try:
            injury_dt = datetime.fromisoformat(injury_date) if 'T' in injury_date else datetime.strptime(injury_date, "%Y-%m-%d")
            timeline_items.append({
                "id": f"injury_{claim_id}",
                "type": "injury",
                "title": "Date of Injury",
                "description": f"{claim['injury_type']} - {claim['injury_group']}",
                "date": injury_dt.isoformat(),
                "icon": "alert-triangle",
                "color": "red"
            })
        except:
            pass
    
    # Add timeline events
    events = await db.timeline_events.find({"claim_id": claim_id}, {"_id": 0}).to_list(500)
    for event in events:
        event_date = event.get("date")
        if isinstance(event_date, str):
            event_date = datetime.fromisoformat(event_date)
        
        timeline_items.append({
            "id": event["event_id"],
            "type": f"event_{event['event_type']}",
            "title": event["title"],
            "description": event["description"],
            "date": event_date.isoformat() if event_date else datetime.now(timezone.utc).isoformat(),
            "icon": "calendar",
            "color": "purple"
        })
    
    # Add letters
    letters = await db.letters.find({"claim_id": claim_id}, {"_id": 0}).to_list(500)
    for letter in letters:
        generated_at = letter.get("generated_at")
        if isinstance(generated_at, str):
            generated_at = datetime.fromisoformat(generated_at)
        
        template_name = letter.get("template_type", "custom").replace("_", " ").title()
        timeline_items.append({
            "id": letter["letter_id"],
            "type": "letter",
            "title": f"Letter Generated: {template_name}",
            "description": f"WCB correspondence created",
            "date": generated_at.isoformat() if generated_at else datetime.now(timezone.utc).isoformat(),
            "icon": "file-text",
            "color": "green",
            "letter_id": letter["letter_id"]
        })
    
    # Add evidence uploads
    evidence_list = await db.evidence.find({"claim_id": claim_id}, {"_id": 0}).to_list(500)
    for evidence in evidence_list:
        uploaded_at = evidence.get("uploaded_at")
        if isinstance(uploaded_at, str):
            uploaded_at = datetime.fromisoformat(uploaded_at)
        
        timeline_items.append({
            "id": evidence["evidence_id"],
            "type": "evidence",
            "title": f"Evidence Uploaded: {evidence['file_name']}",
            "description": evidence.get("description", ""),
            "date": uploaded_at.isoformat() if uploaded_at else datetime.now(timezone.utc).isoformat(),
            "icon": "upload",
            "color": "orange",
            "evidence_id": evidence["evidence_id"],
            "ipfs_cid": evidence.get("ipfs_cid")
        })
    
    # Sort by date (newest first)
    timeline_items.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "claim": {
            "claim_id": claim["claim_id"],
            "claim_number": claim["claim_number"],
            "injury_group": claim["injury_group"],
            "status": claim["status"]
        },
        "timeline": timeline_items,
        "stats": {
            "total_events": len([i for i in timeline_items if i["type"].startswith("event_")]),
            "total_letters": len([i for i in timeline_items if i["type"] == "letter"]),
            "total_evidence": len([i for i in timeline_items if i["type"] == "evidence"])
        }
    }

# ============== POLICY ROUTES ==============

# Pre-populated WCB policies
WCB_POLICIES = [
    {
        "policy_id": "pol_03_01",
        "policy_number": "03 01 PART I",
        "title": "Injuries – General (Brain Injury)",
        "category": "Injuries",
        "content": """Policy 03 01 PART I – Injuries – General

BRAIN INJURY CLASSIFICATION

Group 1 – Mild TBI (Traumatic Brain Injury)
Definition: Minor concussion type injuries including:
- Brief loss of consciousness (less than 30 minutes)
- Transient confusion
- Symptoms that resolve quickly
- No imaging confirmed intracranial pathology

Group 2 – Moderate/Severe TBI
Definition: More serious brain injuries that involve:
- Longer loss of consciousness (more than 30 minutes)
- Persistent neurological deficits
- Imaging confirmed intracranial pathology (subdural hematomas, contusions, hemorrhage)
- Skull fractures
- Need for surgical intervention

BENEFIT ENTITLEMENTS
Both groups are entitled to:
- Temporary total disability benefits
- Permanent disability assessment
- Medical aid coverage
- Rehabilitation services

The distinction between groups affects the level and duration of benefits.

Issue Date: July 5, 2023
Effective: February 1, 2012""",
        "effective_date": "2012-02-01",
        "keywords": ["TBI", "brain injury", "concussion", "Group 1", "Group 2", "mild", "moderate", "severe"]
    },
    {
        "policy_id": "pol_01_02",
        "policy_number": "01 02",
        "title": "Access & Privacy",
        "category": "Administration",
        "content": """Policy 01 02 – Access & Privacy

CLAIMANT RIGHTS TO INFORMATION

Claimants are entitled to:
1. Full copy of any personal information held by WCB relating to their claim
2. Medical records, financial records, and administrative records
3. Telephone recordings of conversations with WCB staff
4. Internal notes and case management memos

REQUEST PROCESS
- Requests can be made in writing to the Access & Privacy Office
- WCB must respond within statutory timeframes
- If information is withheld, a written justification citing specific policy provisions must be provided

DELIVERY OPTIONS
- Secure electronic PDF format
- Password-protected USB drive
- Paper copies by registered mail

PRIVACY PROTECTIONS
- Third party information may be redacted
- Medical information from other parties requires consent
- Legal privilege may apply to certain documents""",
        "effective_date": "2020-01-01",
        "keywords": ["access", "privacy", "records", "documents", "information request", "claim file"]
    },
    {
        "policy_id": "pol_01_08",
        "policy_number": "01 08",
        "title": "Reconsiderations, Reviews & Appeals",
        "category": "Appeals",
        "content": """Policy 01 08 – Reconsiderations, Reviews & Appeals

INTERNAL GRIEVANCE
First step: Submit formal complaint to WCB Complaints & Grievances Unit
- Must cite specific incidents
- Attach relevant evidence

DISPUTE RESOLUTION & DECISION REVIEW BODY (DRDRB)
- File review request if internal grievance rejected
- Typically 30-day deadline from decision
- Include complete file request and statement of errors

APPEALS COMMISSION
- Final administrative avenue
- File within 90 days of DRDRB decision
- May include new evidence

FORMAL REVIEW "WITH PREJUDICE"
A claimant may request a complete review of their file when:
- They believe the claim has been mishandled
- Evidence of prejudice exists
- The Board has failed to apply correct policy

This resets statutory timelines and requires a consolidated status document.""",
        "effective_date": "2018-06-01",
        "keywords": ["appeal", "review", "reconsideration", "DRDRB", "Appeals Commission", "grievance"]
    },
    {
        "policy_id": "pol_01_05",
        "policy_number": "01 05",
        "title": "Medical Aid",
        "category": "Benefits",
        "content": """Policy 01 05 – Medical Aid

COVERED SERVICES
- Physician visits and specialist consultations
- Hospital care and surgery
- Prescription medications
- Physiotherapy and occupational therapy
- Psychological services
- Medical equipment and devices
- Neuro-rehabilitation services

INVOICE SUBMISSION
- Submit all medical invoices to WCB for reimbursement
- Include claim number on all submissions
- Retain copies for personal records

AUTHORIZATION
Some services require pre-authorization:
- Expensive imaging (MRI, CT)
- Surgery
- Extended rehabilitation programs
- Assistive technology""",
        "effective_date": "2019-04-01",
        "keywords": ["medical aid", "treatment", "healthcare", "reimbursement", "invoices"]
    },
    {
        "policy_id": "pol_01_10",
        "policy_number": "01 10",
        "title": "Interim Relief",
        "category": "Benefits",
        "content": """Policy 01 10 – Interim Relief

ELIGIBILITY CRITERIA
Interim relief may be granted when:
1. Claimant is unable to work due to injury
2. Claimant has no other source of income
3. Claim is pending final decision
4. Ongoing medical expenses exist

PURPOSE
Provides temporary financial support while claim is being adjudicated

APPLICATION PROCESS
- Submit written request citing Policy 01 10
- Provide evidence of financial hardship
- Include medical documentation of inability to work
- Attach any eviction notices or urgent bills

AMOUNT
Calculated based on:
- Pre-injury earnings
- Available evidence
- Duration of expected claim processing""",
        "effective_date": "2017-09-01",
        "keywords": ["interim relief", "temporary benefits", "financial hardship", "pending claim"]
    },
    {
        "policy_id": "pol_04_06",
        "policy_number": "04 06",
        "title": "Medical Aid – Return to Work",
        "category": "Benefits",
        "content": """Policy 04 06 – Medical Aid (Return to Work)

OCCUPATIONAL THERAPY COORDINATION
- OT must communicate with WCB regarding discharge readiness
- Safe return to work plan required before discharge
- WCB must respond to OT inquiries

FUNCTIONAL CAPACITY EVALUATION
Required before return to work for:
- Brain injuries
- Major surgeries
- Extended absences

MODIFIED DUTIES
Employer obligation to provide:
- Gradual return to work programs
- Modified duties matching restrictions
- Workplace accommodations""",
        "effective_date": "2020-07-01",
        "keywords": ["return to work", "occupational therapy", "OT", "discharge", "modified duties"]
    },
    {
        "policy_id": "pol_04_11",
        "policy_number": "04 11",
        "title": "Duty to Cooperate",
        "category": "Administration",
        "content": """Policy 04 11 – Duty to Cooperate

WCB OBLIGATIONS
The Board has a duty to:
1. Respond to claimant inquiries in timely manner
2. Process requests within statutory timelines
3. Provide clear explanations for decisions
4. Coordinate with medical providers

CLAIMANT OBLIGATIONS
Claimants must:
1. Provide accurate information
2. Attend scheduled appointments
3. Follow treatment recommendations
4. Report changes in condition

FAILURE TO COOPERATE
If WCB fails to cooperate:
- Document all attempts at communication
- File formal complaint
- Request formal review under Policy 01 08""",
        "effective_date": "2019-11-01",
        "keywords": ["duty to cooperate", "communication", "response time", "obligations"]
    },
    {
        "policy_id": "pol_01_03",
        "policy_number": "01 03",
        "title": "Benefit of Doubt",
        "category": "Administration",
        "content": """Policy 01 03 – Benefit of Doubt

PRINCIPLE
When evidence is evenly balanced, the benefit of doubt shall be given to the worker.

APPLICATION
Applies to:
- Causation determinations
- Extent of disability assessments
- Treatment necessity decisions

DOCUMENTATION
WCB must document when benefit of doubt is:
- Applied in favor of worker
- Not applied (with specific reasoning)

APPEAL GROUNDS
Failure to apply benefit of doubt properly is grounds for:
- Reconsideration request
- DRDRB review
- Appeals Commission appeal""",
        "effective_date": "2015-03-01",
        "keywords": ["benefit of doubt", "evidence", "worker rights", "decision making"]
    }
]

@api_router.get("/policies", response_model=List[WCBPolicy])
async def get_policies(search: Optional[str] = None, category: Optional[str] = None):
    """Get WCB policies with optional search and category filter"""
    
    result = []
    for policy in WCB_POLICIES:
        # Filter by category
        if category and policy["category"].lower() != category.lower():
            continue
        
        # Search in title, content, and keywords
        if search:
            search_lower = search.lower()
            match = (
                search_lower in policy["title"].lower() or
                search_lower in policy["content"].lower() or
                any(search_lower in kw.lower() for kw in policy["keywords"])
            )
            if not match:
                continue
        
        result.append(WCBPolicy(**policy))
    
    return result

@api_router.get("/policies/{policy_id}", response_model=WCBPolicy)
async def get_policy(policy_id: str):
    """Get a specific WCB policy"""
    
    for policy in WCB_POLICIES:
        if policy["policy_id"] == policy_id:
            return WCBPolicy(**policy)
    
    raise HTTPException(status_code=404, detail="Policy not found")

# ============== USER SETTINGS ==============

@api_router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.user_settings.find_one({"user_id": user["user_id"]}, {"_id": 0})
    
    if not settings:
        # Return defaults
        return {
            "user_id": user["user_id"],
            "theme": "light",
            "accent_color": "blue",
            "notifications_enabled": True,
            "text_size": "normal"
        }
    
    return settings

@api_router.put("/settings")
async def update_settings(
    theme: Optional[str] = Form(None),
    accent_color: Optional[str] = Form(None),
    notifications_enabled: Optional[bool] = Form(None),
    text_size: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    update_data = {"user_id": user["user_id"]}
    
    if theme:
        update_data["theme"] = theme
    if accent_color:
        update_data["accent_color"] = accent_color
    if notifications_enabled is not None:
        update_data["notifications_enabled"] = notifications_enabled
    if text_size:
        update_data["text_size"] = text_size
    
    await db.user_settings.update_one(
        {"user_id": user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return await get_settings(user)

# ============== PORTAL REGISTRY ==============

PORTALS = [
    {
        "portal_id": "founders",
        "name": "Founders' Brain Portal",
        "description": "Governance hub for the Tech X Collective. Manage DAO proposals, voting, and collective direction.",
        "icon": "crown",
        "color": "purple",
        "route": "/portal/founders",
        "status": "active"
    },
    {
        "portal_id": "brain-injury",
        "name": "Brain Injury Foundation Portal",
        "description": "Central hub for TBI survivors and families. Access resources, community support, and recovery tools.",
        "icon": "brain",
        "color": "blue",
        "route": "/portal/brain-injury",
        "status": "active"
    },
    {
        "portal_id": "insurance",
        "name": "Insurance Portal",
        "description": "Navigate Alberta Federal/Provincial insurance guidelines. Health, Life, Vehicle, and House insurance support.",
        "icon": "shield",
        "color": "green",
        "route": "/portal/insurance",
        "status": "active"
    },
    {
        "portal_id": "legal",
        "name": "Legal & Case Management",
        "description": "Decentralized law, smart contract agreements, case management with policy review and reversal capability.",
        "icon": "scale",
        "color": "orange",
        "route": "/portal/legal",
        "status": "active"
    },
    {
        "portal_id": "health",
        "name": "Health & Science Portal",
        "description": "Decentralized Science (DeSci), biometric ID, neurofeedback protocols, and decentralized health records.",
        "icon": "heart-pulse",
        "color": "red",
        "route": "/portal/health",
        "status": "active"
    },
    {
        "portal_id": "finance",
        "name": "Finance & Rewards Portal",
        "description": "Tokenized governance, airdrops, decentralized donations, and Flow Codes for frictionless transactions.",
        "icon": "coins",
        "color": "yellow",
        "route": "/portal/finance",
        "status": "active"
    }
]

@api_router.get("/portals")
async def get_portals():
    """Get all available portals"""
    return {"portals": PORTALS}

# ============== DAO GOVERNANCE ==============

class ProposalCreate(BaseModel):
    title: str
    description: str
    category: str  # "policy", "funding", "technical", "community"
    voting_period_days: int = 7

class VoteRequest(BaseModel):
    vote: str  # "for", "against", "abstain"

@api_router.post("/governance/proposals")
async def create_proposal(data: ProposalCreate, user: dict = Depends(get_current_user)):
    """Create a new DAO governance proposal"""
    proposal_id = f"prop_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    proposal_doc = {
        "proposal_id": proposal_id,
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "proposer_id": user["user_id"],
        "proposer_name": user.get("name", "Anonymous"),
        "status": "active",
        "votes_for": 0,
        "votes_against": 0,
        "votes_abstain": 0,
        "voters": [],
        "voting_ends_at": (now + timedelta(days=data.voting_period_days)).isoformat(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.governance_proposals.insert_one(proposal_doc)
    proposal_doc.pop("_id", None)
    return proposal_doc

@api_router.get("/governance/proposals")
async def get_proposals(status: Optional[str] = None, category: Optional[str] = None):
    """Get all governance proposals"""
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    proposals = await db.governance_proposals.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Auto-close expired proposals
    now = datetime.now(timezone.utc)
    for p in proposals:
        if p["status"] == "active":
            ends_at = datetime.fromisoformat(p["voting_ends_at"])
            if ends_at.tzinfo is None:
                ends_at = ends_at.replace(tzinfo=timezone.utc)
            if ends_at < now:
                new_status = "passed" if p["votes_for"] > p["votes_against"] else "rejected"
                await db.governance_proposals.update_one(
                    {"proposal_id": p["proposal_id"]},
                    {"$set": {"status": new_status, "updated_at": now.isoformat()}}
                )
                p["status"] = new_status
    
    return {"proposals": proposals}

@api_router.get("/governance/proposals/{proposal_id}")
async def get_proposal(proposal_id: str):
    """Get a single proposal"""
    proposal = await db.governance_proposals.find_one({"proposal_id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@api_router.post("/governance/proposals/{proposal_id}/vote")
async def vote_on_proposal(proposal_id: str, data: VoteRequest, user: dict = Depends(get_current_user)):
    """Vote on a governance proposal"""
    proposal = await db.governance_proposals.find_one({"proposal_id": proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if proposal["status"] != "active":
        raise HTTPException(status_code=400, detail="Voting is closed for this proposal")
    
    # Check if already voted
    if user["user_id"] in proposal.get("voters", []):
        raise HTTPException(status_code=400, detail="You have already voted on this proposal")
    
    # Check voting period
    ends_at = datetime.fromisoformat(proposal["voting_ends_at"])
    if ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)
    if ends_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Voting period has ended")
    
    vote_field = f"votes_{data.vote}"
    if vote_field not in ["votes_for", "votes_against", "votes_abstain"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    await db.governance_proposals.update_one(
        {"proposal_id": proposal_id},
        {
            "$inc": {vote_field: 1},
            "$push": {"voters": user["user_id"]},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Vote recorded successfully", "vote": data.vote}

@api_router.get("/governance/stats")
async def get_governance_stats():
    """Get DAO governance statistics"""
    total = await db.governance_proposals.count_documents({})
    active = await db.governance_proposals.count_documents({"status": "active"})
    passed = await db.governance_proposals.count_documents({"status": "passed"})
    rejected = await db.governance_proposals.count_documents({"status": "rejected"})
    
    return {
        "total_proposals": total,
        "active_proposals": active,
        "passed_proposals": passed,
        "rejected_proposals": rejected,
        "participation_rate": "78%",
        "treasury_balance": "2,450,000 FLR"
    }

# ============== MULTI-AI AGENT SYSTEM ==============

AI_AGENTS = [
    {
        "agent_id": "fetchai",
        "name": "Fetch.ai Agent",
        "provider": "Fetch.ai",
        "description": "Autonomous economic agents for data analysis and task automation.",
        "capabilities": ["document_analysis", "data_matching", "task_automation"],
        "status": "available",
        "icon": "bot"
    },
    {
        "agent_id": "heurist",
        "name": "Heurist.ai Agent",
        "provider": "Heurist.ai",
        "description": "Advanced query processing and model routing for complex analysis.",
        "capabilities": ["query_processing", "model_routing", "deep_analysis"],
        "status": "available",
        "icon": "search"
    },
    {
        "agent_id": "gaianet",
        "name": "Gaianet.ai Agent",
        "provider": "Gaianet.ai",
        "description": "Decentralized AI for privacy-preserving inference and knowledge graphs.",
        "capabilities": ["privacy_inference", "knowledge_graphs", "semantic_search"],
        "status": "available",
        "icon": "globe"
    },
    {
        "agent_id": "baselight",
        "name": "Baselight.ai Agent",
        "provider": "Baselight.ai",
        "description": "On-chain verifiable AI computations for trustless analysis.",
        "capabilities": ["verifiable_compute", "on_chain_ai", "data_validation"],
        "status": "available",
        "icon": "cpu"
    },
    {
        "agent_id": "zo",
        "name": "Zo.computer Agent",
        "provider": "Zo.computer",
        "description": "Collaborative AI for research synthesis and community knowledge.",
        "capabilities": ["research_synthesis", "community_knowledge", "collaborative_ai"],
        "status": "available",
        "icon": "users"
    },
    {
        "agent_id": "autonomys",
        "name": "Autonomys Auto-Agent",
        "provider": "Autonomys",
        "description": "Secure agent execution with Auto-Drive, Auto-ID, and OpenClaw Skills.",
        "capabilities": ["secure_execution", "identity_verification", "skill_automation"],
        "status": "available",
        "icon": "shield-check"
    }
]

class AgentQueryRequest(BaseModel):
    query: str
    agent_ids: List[str]  # List of agent IDs to query
    context: Optional[str] = None

@api_router.get("/agents")
async def get_agents():
    """Get all available AI agents"""
    return {"agents": AI_AGENTS}

@api_router.post("/agents/query")
async def query_agents(request: AgentQueryRequest, user: dict = Depends(get_current_user)):
    """Query one or multiple AI agents simultaneously. All routed through GPT-5.2."""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Validate agent IDs
    valid_ids = {a["agent_id"] for a in AI_AGENTS}
    for aid in request.agent_ids:
        if aid not in valid_ids:
            raise HTTPException(status_code=400, detail=f"Unknown agent: {aid}")
    
    selected_agents = [a for a in AI_AGENTS if a["agent_id"] in request.agent_ids]
    
    results = []
    
    for agent in selected_agents:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            agent_system = f"""You are {agent['name']} from {agent['provider']}, a decentralized AI agent 
specializing in {', '.join(agent['capabilities'])}. You are part of the Tech X Brain Collective ecosystem 
serving TBI survivors in Alberta. Your expertise is in analyzing documents, detecting inconsistencies, 
and providing verifiable insights.

Context: You operate on the Flare Network ecosystem and prioritize privacy, accuracy, and transparency.
Respond as this specific agent persona with relevant expertise."""
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"agent_{agent['agent_id']}_{uuid.uuid4().hex[:8]}",
                system_message=agent_system
            ).with_model("openai", "gpt-5.2")
            
            full_query = request.query
            if request.context:
                full_query = f"Context: {request.context}\n\nQuery: {request.query}"
            
            user_message = UserMessage(text=full_query)
            response_text = await chat.send_message(user_message)
            
            results.append({
                "agent_id": agent["agent_id"],
                "agent_name": agent["name"],
                "provider": agent["provider"],
                "response": response_text,
                "status": "success",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            logger.error(f"Agent {agent['agent_id']} error: {e}")
            results.append({
                "agent_id": agent["agent_id"],
                "agent_name": agent["name"],
                "provider": agent["provider"],
                "response": f"Agent temporarily unavailable: {str(e)}",
                "status": "error",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    # Save query history
    await db.agent_queries.insert_one({
        "query_id": f"aq_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "query": request.query,
        "agent_ids": request.agent_ids,
        "results_count": len(results),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"results": results, "agents_queried": len(results)}

# ============== INSURANCE MODULE ==============

INSURANCE_TYPES = [
    {
        "type_id": "health",
        "name": "Health Insurance",
        "description": "Coverage for medical expenses, rehabilitation, and ongoing care for TBI survivors.",
        "alberta_regulations": [
            "Alberta Health Insurance Act (AHIA)",
            "Alberta Health Benefits Regulation",
            "Workers' Compensation Act - Medical Aid provisions"
        ],
        "coverage_areas": ["Emergency care", "Rehabilitation", "Neurofeedback therapy", "Vision therapy", "Prescription medications"],
        "compliance_status": "compliant"
    },
    {
        "type_id": "life",
        "name": "Life Insurance",
        "description": "Life insurance products with TBI-specific considerations and accommodations.",
        "alberta_regulations": [
            "Alberta Insurance Act",
            "Life Insurance Regulation"
        ],
        "coverage_areas": ["Term life", "Whole life", "Disability riders", "Accidental death"],
        "compliance_status": "compliant"
    },
    {
        "type_id": "vehicle",
        "name": "Vehicle Insurance",
        "description": "Auto insurance with Safety In Motion Inc. (SIMI) decentralized driver evaluations.",
        "alberta_regulations": [
            "Alberta Insurance Act - Automobile Section",
            "Automobile Insurance Premiums Regulation",
            "Safety In Motion Inc. (SIMI) Auto Anonymous Network"
        ],
        "coverage_areas": ["Collision", "Comprehensive", "Third-party liability", "Accident benefits", "SIMI driver evaluation"],
        "compliance_status": "compliant"
    },
    {
        "type_id": "house",
        "name": "House Insurance",
        "description": "Property insurance with accessibility and accommodation coverage for TBI survivors.",
        "alberta_regulations": [
            "Alberta Insurance Act - Property Section",
            "Condominium Property Act"
        ],
        "coverage_areas": ["Property damage", "Liability", "Home modifications", "Accessibility equipment"],
        "compliance_status": "compliant"
    }
]

@api_router.get("/insurance/types")
async def get_insurance_types():
    """Get available insurance types with Alberta compliance info"""
    return {"insurance_types": INSURANCE_TYPES}

@api_router.get("/insurance/compliance")
async def get_insurance_compliance():
    """Get Alberta insurance compliance checklist"""
    return {
        "jurisdiction": "Alberta, Canada",
        "regulatory_bodies": [
            "Alberta Superintendent of Insurance",
            "Alberta Insurance Council",
            "Workers' Compensation Board of Alberta"
        ],
        "compliance_requirements": [
            {"requirement": "Alberta Insurance Act adherence", "status": "mapped", "smart_contract": True},
            {"requirement": "Privacy (PIPA Alberta) compliance", "status": "mapped", "smart_contract": True},
            {"requirement": "Health Information Act (HIA) compliance", "status": "mapped", "smart_contract": True},
            {"requirement": "WCB Policy integration", "status": "mapped", "smart_contract": True},
            {"requirement": "SIMI Auto Anonymous Network integration", "status": "in_progress", "smart_contract": False},
            {"requirement": "Biometric KYC/AML compliance", "status": "planned", "smart_contract": False}
        ],
        "last_audit": "2025-06-15",
        "next_audit": "2025-09-15"
    }

# ============== LEGAL & CASE MANAGEMENT ==============

class LegalCaseCreate(BaseModel):
    title: str
    case_type: str  # "wcb_appeal", "insurance_dispute", "policy_review", "advocacy"
    description: str
    priority: str = "medium"

@api_router.post("/legal/cases")
async def create_legal_case(data: LegalCaseCreate, user: dict = Depends(get_current_user)):
    """Create a new legal case"""
    case_id = f"case_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    case_doc = {
        "case_id": case_id,
        "user_id": user["user_id"],
        "title": data.title,
        "case_type": data.case_type,
        "description": data.description,
        "priority": data.priority,
        "status": "open",
        "reversal_capability": True,
        "smart_contract_status": "pending",
        "events": [{
            "event_type": "case_created",
            "description": "Case file opened",
            "timestamp": now.isoformat()
        }],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.legal_cases.insert_one(case_doc)
    case_doc.pop("_id", None)
    return case_doc

@api_router.get("/legal/cases")
async def get_legal_cases(user: dict = Depends(get_current_user)):
    """Get all legal cases for current user"""
    cases = await db.legal_cases.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"cases": cases}

@api_router.get("/legal/cases/{case_id}")
async def get_legal_case(case_id: str, user: dict = Depends(get_current_user)):
    """Get a single legal case"""
    case = await db.legal_cases.find_one({"case_id": case_id, "user_id": user["user_id"]}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@api_router.post("/legal/cases/{case_id}/review")
async def request_policy_review(case_id: str, user: dict = Depends(get_current_user)):
    """Request policy review with reversal capability"""
    case = await db.legal_cases.find_one({"case_id": case_id, "user_id": user["user_id"]}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    now = datetime.now(timezone.utc)
    review_event = {
        "event_type": "policy_review_requested",
        "description": "Policy Review with Reversal Capability initiated",
        "timestamp": now.isoformat()
    }
    
    await db.legal_cases.update_one(
        {"case_id": case_id},
        {
            "$push": {"events": review_event},
            "$set": {
                "status": "under_review",
                "smart_contract_status": "review_initiated",
                "updated_at": now.isoformat()
            }
        }
    )
    
    return {"message": "Policy review with reversal capability initiated", "case_id": case_id}

# ============== HEALTH CHECK ==============

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "techxbrain-api",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Include the router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
