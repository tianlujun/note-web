from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api", tags=["auth"])

@router.get("/me")
def me(request: Request):
    from ..main import _auth_header_valid, verify_session, SESSION_COOKIE
    creds = request.headers.get("Authorization", "")
    session_id = request.cookies.get(SESSION_COOKIE)
    if _auth_header_valid(request) or verify_session(session_id):
        return {"authenticated": True}
    return {"authenticated": False}

@router.post("/login")
async def login(request: Request, response: Response):
    from ..main import create_session, SESSION_COOKIE, SESSION_TTL_DAYS, ACCESS_TOKEN
    body = await request.json()
    token = body.get("token", "").strip()

    if not ACCESS_TOKEN:
        session_id = create_session()
        response.set_cookie(key=SESSION_COOKIE, value=session_id, httponly=False, samesite="lax", max_age=SESSION_TTL_DAYS * 86400)
        return {"ok": True}

    if token != ACCESS_TOKEN:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    session_id = create_session()
    response.set_cookie(key=SESSION_COOKIE, value=session_id, httponly=False, samesite="lax", max_age=SESSION_TTL_DAYS * 86400)
    return {"ok": True}

@router.post("/logout")
def logout(response: Response):
    from ..main import SESSION_COOKIE
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}
