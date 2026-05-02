from .base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = 'gpt-4o-mini', base_url: str = ''):
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url)

    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        from openai import OpenAI
        kwargs: dict = {"api_key": self.api_key}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        client = OpenAI(**kwargs)
        response = client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
