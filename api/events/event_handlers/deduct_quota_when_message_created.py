import logging
from datetime import UTC, datetime

from configs import dify_config
from core.app.entities.app_invoke_entities import AgentChatAppGenerateEntity, ChatAppGenerateEntity
from core.entities.provider_entities import QuotaUnit
from core.plugin.entities.plugin import ModelProviderID
from events.message_event import message_was_created
from extensions.ext_database import db
from models.provider import Provider, ProviderType
from models import EndUser, Account

logger = logging.getLogger(__name__)

@message_was_created.connect
def handle(sender, **kwargs):
    message = sender
    application_generate_entity = kwargs.get("application_generate_entity")

    if not isinstance(application_generate_entity, ChatAppGenerateEntity | AgentChatAppGenerateEntity):
        return

    model_config = application_generate_entity.model_conf
    provider_model_bundle = model_config.provider_model_bundle
    provider_configuration = provider_model_bundle.configuration


    # TODO：扣费 # takin code: takin cost agent start
    # # 所有工具调用信息以及对话信息
    # agent_thoughts = message.agent_thoughts
    # # 基本的USD价格
    # total_price = message.total_price
    # # agent模式
    # mode = model_config.mode

    # try:
    #     # 获取end user信息和关联的email
    #     user_id = message.from_end_user_id
    #     end_user = db.session.query(EndUser).filter(EndUser.id == user_id).first()
    #     account = db.session.query(Account).filter(Account.id == end_user.session_id).first() if end_user else None
    #     user_email = account.email if account else None

    #     response = requests.post(
    #                     f"{os.getenv('TAKIN_API_URL')}/api/external/dify/pricing/agent",
    #                     json={
    #                         "email": user_email,
    #                         "usage": float(total_price),
    #                         "agent_thoughts": agent_thoughts,
    #                         "mode": mode,
    #                     },
    #                 )

    #     response.raise_for_status()
    # except Exception as e:
    #     logger.error(f"Failed to call pricing API for agent: {str(e)}")
    #     return
   
    if provider_configuration.using_provider_type != ProviderType.SYSTEM:
        return

    system_configuration = provider_configuration.system_configuration

    if not system_configuration.current_quota_type:
        return

    quota_unit = None
    for quota_configuration in system_configuration.quota_configurations:
        if quota_configuration.quota_type == system_configuration.current_quota_type:
            quota_unit = quota_configuration.quota_unit

            if quota_configuration.quota_limit == -1:
                return

            break

    used_quota = None
    if quota_unit:
        if quota_unit == QuotaUnit.TOKENS:
            used_quota = message.message_tokens + message.answer_tokens
        elif quota_unit == QuotaUnit.CREDITS:
            used_quota = dify_config.get_model_credits(model_config.model)
        else:
            used_quota = 1

    if used_quota is not None and system_configuration.current_quota_type is not None:
        db.session.query(Provider).filter(
            Provider.tenant_id == application_generate_entity.app_config.tenant_id,
            # TODO: Use provider name with prefix after the data migration.
            Provider.provider_name == ModelProviderID(model_config.provider).provider_name,
            Provider.provider_type == ProviderType.SYSTEM.value,
            Provider.quota_type == system_configuration.current_quota_type.value,
            Provider.quota_limit > Provider.quota_used,
        ).update(
            {
                "quota_used": Provider.quota_used + used_quota,
                "last_used": datetime.now(tz=UTC).replace(tzinfo=None),
            }
        )
        db.session.commit()
