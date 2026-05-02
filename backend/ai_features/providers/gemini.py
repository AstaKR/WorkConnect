from .base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = 'gemini-1.5-flash', base_url: str = ''):
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url)

    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self.api_key)
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=max_tokens,
            ),
        )
        return response.text.strip()
