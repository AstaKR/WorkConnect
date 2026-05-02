from abc import ABC, abstractmethod


class BaseAIProvider(ABC):
    """Base class for all AI provider implementations.

    Subclasses must accept (api_key, model_name, base_url) in __init__
    and implement complete().
    """

    def __init__(self, api_key: str, model_name: str, base_url: str = ''):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url

    @abstractmethod
    def complete(self, prompt: str, max_tokens: int = 300) -> str:
        """Send prompt to the provider and return the text response."""
        ...
