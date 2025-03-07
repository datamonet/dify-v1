from typing import Optional
import os

from flask_sqlalchemy.pagination import Pagination


from configs import dify_config
from models.model import Account, App, RecommendedApp, db
from services.recommend_app.recommend_app_factory import RecommendAppRetrievalFactory
import requests


class RecommendedAppService:
    @classmethod
    def get_paginate_recommended_apps(cls, language: str, args: dict) -> Pagination | None:
        """takin command:Get paginate recommended apps.

        Args:
            language (str): language
            args (dict): args

        Returns:
            Pagination | None: Pagination or None
        """
        filters = [
         RecommendedApp.is_listed == True, 
         App.is_public == True
        ]
        if args.get("name"):
            name = args["name"][:30]
            filters.append(App.name.ilike(f"%{name}%"))
            
        if args["mode"] == "recommended":
            filters.append(Account.email == "curator@takin.ai")
        else:
            filters.append(Account.email != "curator@takin.ai")  
            
        recommended_apps = db.paginate(
            db.select(RecommendedApp)
            .select_from(RecommendedApp)
            .join(App, RecommendedApp.app_id == App.id)
            .join(Account, Account.id == App.user_id)
            .where(*filters)
            .order_by(RecommendedApp.created_at.desc()),
            page=args["page"],
            per_page=args["limit"],
            error_out=False,
        )

        # 获取所有 app 对应的 user_id 和 email
        user_ids = [app.app.user_id for app in recommended_apps.items]
        accounts_cursor = db.session.query(Account.id, Account.email).filter(Account.id.in_(user_ids)).all()
        email_to_name = {
            account.email: account.email for account in accounts_cursor
        }

        # 获取用户信息
        emails = list(email_to_name.keys())  # 提取所有的 email
        
        try:
            print(emails)
            response = requests.post(
                f'{os.getenv("TAKIN_API_URL", "http://127.0.0.1:3000")}/api/external/user',
                json={"emails": emails}
            )
            print(response.json())
            users_data = response.json().get('data', [])
            
            print(users_data)
            # 更新用户名映射
            email_to_name.update({
                user['email']: user['name'] or user['email'].split('@')[0]
                for user in users_data
            })
            
        except Exception as e:
            print(f"Error fetching user data: {str(e)}")
            # 如果请求失败，使用email前缀作为用户名
            email_to_name.update({
                email: email.split('@')[0] for email in emails
            })

        # 将用户名称嵌入到推荐应用数据中
        for app in recommended_apps.items:
            # 获取 app 的 email 通过 user_id
            email = next((account.email for account in accounts_cursor if account.id == app.app.user_id), None)
            # 根据 email 获取对应的用户名
            app.app.username = email_to_name.get(email)


        # 返回带有分页和合并后的数据
        response_data = {
            "has_more": recommended_apps.page != recommended_apps.pages,
            "items": recommended_apps.items,
            "total": recommended_apps.total,
            "page": recommended_apps.page,
            "per_page": recommended_apps.per_page
        }
        return response_data
   

    @classmethod
    def get_recommended_apps_and_categories(cls, language: str) -> dict:
        """
        Get recommended apps and categories.
        :param language: language
        :return:
        """
        mode = dify_config.HOSTED_FETCH_APP_TEMPLATES_MODE
        retrieval_instance = RecommendAppRetrievalFactory.get_recommend_app_factory(mode)()
        result = retrieval_instance.get_recommended_apps_and_categories(language)
        if not result.get("recommended_apps") and language != "en-US":
            result = (
                RecommendAppRetrievalFactory.get_buildin_recommend_app_retrieval().fetch_recommended_apps_from_builtin(
                    "en-US"
                )
            )

        return result

    @classmethod
    def get_recommend_app_detail(cls, app_id: str) -> Optional[dict]:
        """
        Get recommend app detail.
        :param app_id: app id
        :return:
        """
        mode = dify_config.HOSTED_FETCH_APP_TEMPLATES_MODE
        retrieval_instance = RecommendAppRetrievalFactory.get_recommend_app_factory(mode)()
        result: dict = retrieval_instance.get_recommend_app_detail(app_id)
        return result


    # takin command:publish api,创建推荐应用
    def create_app(self, args: dict) -> dict:
        app = RecommendedApp(
            app_id=args["app_id"],
            category=args.get("category", ""),
            description=args.get("description", ""),
            copyright="Takin.AI",
            privacy_policy="https://Takin.ai",
        )

        # 将app添加到session并提交
        db.session.add(app)
        db.session.commit()

        app_to_update = db.session.query(App).filter_by(id=args["app_id"]).first()
        if app_to_update:
            app_to_update.is_public = True
            db.session.commit()

        return {"id": app.id}


    # takin command:publish api,删除推荐应用
    def delete_app(self, id: str) -> None:
        """
        Delete recommended app
        """
        try:
            app_to_delete = db.session.query(RecommendedApp).filter_by(app_id=id).one()

            db.session.delete(app_to_delete)
            db.session.commit()
        except Exception as e:
            logging.exception(f"An error occurred: {e}")
            db.session.rollback()