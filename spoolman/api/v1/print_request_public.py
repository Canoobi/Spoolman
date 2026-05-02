import base64
import hashlib
import hmac
import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from spoolman import env
from spoolman.api.v1 import models as api_models
from spoolman.database import models
from spoolman.database import print_request as print_request_db
from spoolman.database.database import get_db_session

COOKIE_NAME = "spoolman_pr_session"

router = APIRouter(prefix="/print-request/public", tags=["print-request-public"])


def _b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _sign(secret: str, payload: str) -> str:
    return _b64u(hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest())


def _get_cookie_secret() -> str:
    secret = env.get_print_request_cookie_secret()
    if not secret:
        raise RuntimeError("SPOOLMAN_PRINT_REQUEST_COOKIE_SECRET is not configured.")
    return secret


def _make_cookie_token(requester_name: str | None = None) -> str:
    secret = _get_cookie_secret()
    payload_obj = {"nonce": _b64u(secrets.token_bytes(32))}
    if requester_name:
        payload_obj["requester_name"] = requester_name
    payload = _b64u(json.dumps(payload_obj, separators=(",", ":")).encode("utf-8"))
    signature = _sign(secret, payload)
    return f"{payload}.{signature}"


def _verify_cookie_token(token: str) -> bool:
    try:
        payload, signature = token.rsplit(".", 1)
    except ValueError:
        return False

    expected = _sign(_get_cookie_secret(), payload)
    return hmac.compare_digest(signature, expected)


def _get_public_session(request: Request) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token or not _verify_cookie_token(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    payload, _signature = token.rsplit(".", 1)
    try:
        payload_bytes = base64.urlsafe_b64decode(payload + "=" * ((4 - len(payload) % 4) % 4))
        data = json.loads(payload_bytes.decode("utf-8"))
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    if not isinstance(data, dict):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    return data


def require_public_session(request: Request) -> None:
    _get_public_session(request)


def _load_json_with_whitespace_escapes(raw_body: bytes):
    try:
        return json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        text_body = None

        for encoding in ("utf-8", "cp1252", "latin-1"):
            try:
                text_body = raw_body.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if text_body is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="There was an error parsing the body")

        normalized_body = text_body.replace("\\r", "\r").replace("\\n", "\n").replace("\\t", "\t")

        try:
            return json.loads(normalized_body)
        except json.JSONDecodeError as second_exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="There was an error parsing the body",
            ) from second_exc


def _to_filament_info(filament) -> api_models.PrintRequestFilamentInfo:
    vendor_name = None
    material_name = None
    filament_name = getattr(filament, "name", None)

    vendor = getattr(filament, "vendor", None)
    if vendor is not None:
        vendor_name = getattr(vendor, "name", None)

    material = getattr(filament, "material", None)
    if isinstance(material, str):
        material_name = material
    elif material is not None:
        material_name = getattr(material, "name", None)

    display_parts = [part for part in [vendor_name, material_name, filament_name] if part]
    display_name = " – ".join(display_parts) if display_parts else str(filament.id)

    return api_models.PrintRequestFilamentInfo(
        id=filament.id,
        display_name=display_name,
        color_hex=filament.color_hex,
    )


def _to_cost_calculation_response(cost_calculation: models.CostCalculation | None) -> api_models.CostCalculation | None:
    if cost_calculation is None:
        return None
    return api_models.CostCalculation.from_db(cost_calculation)


def _to_public_response(obj) -> api_models.PublicPrintRequestResponse:
    return api_models.PublicPrintRequestResponse(
        public_id=obj.public_id,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
        requester_name=obj.requester_name,
        requester_contact=obj.requester_contact,
        delivery_type=obj.delivery_type,
        delivery_details=obj.delivery_details,
        title=obj.title,
        description=obj.description,
        makerworld_url=obj.makerworld_url,
        additional_links_text=obj.additional_links_text,
        wanted_date=obj.wanted_date,
        priority=obj.priority,
        other_filament_requested=obj.other_filament_requested,
        other_filament_description=obj.other_filament_description,
        color_assignment=obj.color_assignment,
        comment=obj.comment,
        status=obj.status,
        accepted_at=obj.accepted_at,
        rejected_at=obj.rejected_at,
        completed_at=obj.completed_at,
        rejection_reason=obj.rejection_reason,
        filaments=[_to_filament_info(item.filament) for item in obj.filaments],
        cost_calculation=_to_cost_calculation_response(obj.cost_calculation),
    )


def _to_public_list_item(obj: models.PrintRequest) -> api_models.PublicPrintRequestListItem:
    return api_models.PublicPrintRequestListItem(
        public_id=obj.public_id,
        title=obj.title,
        status=obj.status,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
        wanted_date=obj.wanted_date,
        final_price=obj.cost_calculation.final_price if obj.cost_calculation else None,
        currency=obj.cost_calculation.currency if obj.cost_calculation else None,
    )


def _ensure_request_access(session_data: dict, obj: models.PrintRequest) -> None:
    requester_name = session_data.get("requester_name")
    if requester_name and obj.requester_name != requester_name:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/login")
async def login(request: Request, body: api_models.PublicPrintRequestLoginRequest):
    password_value = body.password.get_secret_value()
    named_passwords = env.get_print_request_user_passwords()

    requester_name = None
    for candidate_name, candidate_password in named_passwords.items():
        if password_value == candidate_password:
            requester_name = candidate_name
            break

    if requester_name is None:
        expected_password = env.get_print_request_public_password()
        if not expected_password:
            raise HTTPException(status_code=500, detail="Public print request password is not configured.")
        if password_value != expected_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    response = JSONResponse(content={"message": "OK"})
    is_https_request = request.url.scheme == "https"
    response.set_cookie(
        key=COOKIE_NAME,
        value=_make_cookie_token(requester_name=requester_name),
        httponly=True,
        secure=is_https_request,
        samesite="lax",
        path="/",
    )
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"message": "OK"})
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return response


@router.get("/form-data")
async def get_form_data(
        _session: None = Depends(require_public_session),
        request: Request = None,
        db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(models.Filament)
        .options(
            selectinload(models.Filament.vendor),
        )
        .order_by(models.Filament.id.asc())
    )
    filaments = list(result.unique().scalars().all())

    session_data = _get_public_session(request)
    requester_name = session_data.get("requester_name")
    active_requests = []
    if requester_name:
        active_requests = [
            _to_public_list_item(item)
            for item in await print_request_db.list_open_print_requests_for_requester(db, requester_name)
        ]

    return JSONResponse(
        content=jsonable_encoder(
            api_models.PublicPrintRequestFormDataResponse(
                delivery_types=api_models.PRINT_REQUEST_DELIVERY_VALUES,
                priorities=api_models.PRINT_REQUEST_PRIORITY_VALUES,
                filaments=[_to_filament_info(f) for f in filaments],
                session=api_models.PublicPrintRequestSessionInfo(
                    requester_name=requester_name,
                    requester_name_locked=bool(requester_name),
                ),
                active_requests=active_requests,
            )
        )
    )


@router.post("/")
async def create_print_request(
        request: Request,
        _session: None = Depends(require_public_session),
        db: AsyncSession = Depends(get_db_session),
):
    session_data = _get_public_session(request)
    payload = _load_json_with_whitespace_escapes(await request.body())
    try:
        body = api_models.PublicPrintRequestCreate.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()) from exc

    requester_name = session_data.get("requester_name")
    if requester_name:
        body = body.model_copy(update={"requester_name": requester_name})

    obj = await print_request_db.create_print_request(db, body)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=jsonable_encoder(_to_public_response(obj)),
    )


@router.get("/{public_id}")
async def get_print_request(
        public_id: str,
        request: Request,
        _session: None = Depends(require_public_session),
        db: AsyncSession = Depends(get_db_session),
):
    session_data = _get_public_session(request)
    obj = await print_request_db.get_print_request_by_public_id(db, public_id)
    _ensure_request_access(session_data, obj)
    return JSONResponse(content=jsonable_encoder(_to_public_response(obj)))


@router.patch("/{public_id}")
async def update_print_request(
        public_id: str,
        request: Request,
        _session: None = Depends(require_public_session),
        db: AsyncSession = Depends(get_db_session),
):
    session_data = _get_public_session(request)
    existing = await print_request_db.get_print_request_by_public_id(db, public_id)
    _ensure_request_access(session_data, existing)

    payload = _load_json_with_whitespace_escapes(await request.body())
    try:
        body = api_models.PublicPrintRequestUpdate.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()) from exc

    requester_name = session_data.get("requester_name")
    if requester_name:
        body = body.model_copy(update={"requester_name": requester_name})

    try:
        obj = await print_request_db.update_print_request_public(db, public_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return JSONResponse(content=jsonable_encoder(_to_public_response(obj)))
