from .openai_provider import OpenAIProvider


class CustomProvider(OpenAIProvider):
    """Any OpenAI-compatible HTTP endpoint at a custom base_url.

    Requires base_url to be set — this provider has no default endpoint.
    """

    def __init__(self, api_key: str = '', model_name: str = 'default', base_url: str = ''):
        if not base_url:
            raise ValueError("CustomProvider requires a base_url (e.g. 'http://localhost:8080/v1')")
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url)
