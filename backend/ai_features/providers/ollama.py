from .base import BaseAIProvider


class OllamaProvider(BaseAIProvider):
    def __init__(self, api_key: str = '', model_name: str = 'llama3', base_url: str = 'http://localhost:11434'):
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url.rstrip('/'))

    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        import requests
        resp = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
