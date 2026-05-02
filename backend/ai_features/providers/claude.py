from .base import BaseAIProvider


class ClaudeProvider(BaseAIProvider):
    def __init__(self, api_key: str, model_name: str = 'claude-3-haiku-20240307', base_url: str = ''):
        super().__init__(api_key=api_key, model_name=model_name, base_url=base_url)

    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        import anthropic
        kwargs: dict = {"api_key": self.api_key}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        client = anthropic.Anthropic(**kwargs)
        message = client.messages.create(
            model=self.model_name,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        content_blocks = message.content
        if not content_blocks:
            return ""
        return content_blocks[0].text.strip()
