from flask import request
from flask_restful import Resource, reqparse  # type: ignore

from configs import dify_config
from constants.languages import languages
from libs.helper import StrLen, email, extract_remote_ip
from libs.password import valid_password
from models.model import DifySetup, Account, Tenant, db
from services.account_service import RegisterService, TenantService
from . import api
from .error import AlreadySetupError, NotInitValidateError
from .init_validate import get_init_validate_status
from .wraps import only_edition_self_hosted


class SetupApi(Resource):
    def get(self):
        if dify_config.EDITION == "SELF_HOSTED":
            setup_status = get_setup_status()
            if setup_status:
                return {"step": "finished", "setup_at": setup_status.setup_at.isoformat()}
            return {"step": "not_started"}
        return {"step": "finished"}

    @only_edition_self_hosted
    def post(self):
        # is set up
        if get_setup_status():
            raise AlreadySetupError()

        # is tenant created
        tenant_count = TenantService.get_tenant_count()
        if tenant_count > 0:
            raise AlreadySetupError()

        if not get_init_validate_status():
            raise NotInitValidateError()

        parser = reqparse.RequestParser()
        parser.add_argument("email", type=email, required=True, location="json")
        parser.add_argument("name", type=StrLen(30), required=True, location="json")
        parser.add_argument("password", type=valid_password, required=True, location="json")
        args = parser.parse_args()

        # setup
        RegisterService.setup(
            email=args["email"], name=args["name"], password=args["password"], ip_address=extract_remote_ip(request)
        )

        return {"result": "success"}, 201

class InsertApi(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("email", type=email, required=True, location="json")
        parser.add_argument("name", type=StrLen(30), required=True, location="json")
        parser.add_argument("password", type=valid_password, required=True, location="json")
        args = parser.parse_args()

        # Check if account already exists
        account = Account.query.filter_by(email=args["email"]).first()
        if account:
            return {"error": "Account already exists"}, 400

        # Check if there is at least one tenant
        first_tenant = Tenant.query.first()
        if not first_tenant:
            return {"error": "No workspace available. Please contact administrator."}, 400

        # Create new account
        account = RegisterService.register(
            email=args["email"],
            name=args["name"],
            password=args["password"],
            is_setup=True
        )

        # Add user to the first tenant
        TenantService.create_tenant_member(first_tenant, account, role="admin")
        account.current_tenant = first_tenant

        # Set default interface language to first language in constants
        account.interface_language = languages[0]
        
        db.session.commit()

        return {
            "result": "success",
            "data": {
                "email": account.email,
                "name": account.name,
                "workspace": first_tenant.name
            }
        }, 201



def get_setup_status():
    if dify_config.EDITION == "SELF_HOSTED":
        return db.session.query(DifySetup).first()
    else:
        return True


api.add_resource(SetupApi, "/setup")
api.add_resource(InsertApi, "/insert") #takin command:暴露一个api用于同步数据