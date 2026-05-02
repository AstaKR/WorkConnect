from .base import BaseAIProvider


class GroqProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = 'llama-3.1-70b-versatile', base_url: str = ''):
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url)

    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        from groq import Groq
        kwargs: dict = {"api_key": self.api_key}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        client = Groq(**kwargs)
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model_name,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
