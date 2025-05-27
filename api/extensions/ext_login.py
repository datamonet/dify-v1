import json

import flask_login  # type: ignore
from flask import Response, request
from flask_login import user_loaded_from_request, user_logged_in
from werkzeug.exceptions import NotFound, Unauthorized

import contexts
from configs import dify_config
from dify_app import DifyApp
from extensions.ext_database import db
from libs.passport import PassportService
from models.account import Account, Tenant, TenantAccountJoin
from models.model import EndUser
from services.account_service import AccountService

login_manager = flask_login.LoginManager()


# Flask-Login configuration
@login_manager.request_loader
def load_user_from_request(request_from_flask_login):
    """Load user based on the request."""
    auth_header = request.headers.get("Authorization", "")
    auth_token: str | None = None
    if auth_header:
        if " " not in auth_header:
            raise Unauthorized("Invalid Authorization header format. Expected 'Bearer <api-key>' format.")
        auth_scheme, auth_token = auth_header.split(maxsplit=1)
        auth_scheme = auth_scheme.lower()
        if auth_scheme != "bearer":
            raise Unauthorized("Invalid Authorization header format. Expected 'Bearer <api-key>' format.")
    else:
        auth_token = request.args.get("_token")

    decoded = PassportService().verify(auth_token)
    # user_id = decoded.get("user_id")
    # logged_in_account = AccountService.load_logged_in_account(account_id=user_id)
    
    # 此处为适应takin的mongo数据库，只查询固定的邮件用户
    email = decoded.get("email")
    logged_in_account = AccountService.load_logged_in_account(email=email)
        
    return logged_in_account


@user_logged_in.connect
@user_loaded_from_request.connect
def on_user_logged_in(_sender, user):
    """Called when a user logged in.

    Note: AccountService.load_logged_in_account will populate user.current_tenant_id
    through the load_user method, which calls account.set_tenant_id().
    """
    if user and isinstance(user, Account) and user.current_tenant_id:
        contexts.tenant_id.set(user.current_tenant_id)


@login_manager.unauthorized_handler
def unauthorized_handler():
    """Handle unauthorized requests."""
    return Response(
        json.dumps({"code": "unauthorized", "message": "Unauthorized."}),
        status=401,
        content_type="application/json",
    )


def init_app(app: DifyApp):
    login_manager.init_app(app)
